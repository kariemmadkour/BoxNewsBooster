# Connector interface

Every external source — NewsAPI.org, GNews, Google News RSS, Twitter/X,
YouTube, and any future addition — implements the same contract, defined in
`functions/src/shared/connector.ts`:

```typescript
export interface NormalizedItem {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  url: string;
  publishedAt: string; // ISO8601
  author?: string;
  publisher: string;
  country: string;
  language: string;
  category?: string;
  image?: string;
  tags?: string[];
  entities?: string[];
  sourceType: 'news' | 'rss' | 'government' | 'trends' | 'social' | 'financial' | 'sports' | 'video';
}

export interface IConnector {
  id: string;
  fetch(): Promise<unknown[]>;
  normalize(raw: unknown[]): NormalizedItem[];
  validate(item: NormalizedItem): boolean;
  healthCheck(): Promise<{ healthy: boolean; message?: string }>;
}
```

One deviation from the original spec: `sourceType` gained a `'video'` member.
YouTube content isn't really `'social'` (no author-follows-author graph,
no retweet-style virality signal) and doesn't fit any of the other six
buckets — forcing it into `'social'` would make every downstream filter
("show me social sources") silently include video results users didn't ask
for.

## Why one shared contract, not five bespoke fetchers

`services/searchOrchestrator.ts` and `services/ingestion.ts` never know or
care which connector they're calling — they iterate `connectors: IConnector[]`,
call `.fetch()` + `.normalize()`, and merge. Adding a 6th source later (a
government open-data feed, a financial ticker API) means writing one new file
that implements this interface; zero changes anywhere else.

## Per-connector notes

### `newsApiConnector` (NewsAPI.org) — migrating from `providers/newsApiOrgProvider.ts`

- `fetch()`: same `/v2/top-headlines` (no keyword) / `/v2/everything`
  (keyword present) split already implemented.
- `sourceType`: `'news'`.
- **Known limitation** (confirmed 2026-07-12, see the runbook): free-tier
  `/top-headlines` returns `totalResults: 0` for many non-US/UK countries —
  not an error, just sparse source coverage. `validate()` should NOT treat
  an empty result as unhealthy; `healthCheck()` should ping with a
  known-good query (`country=us`) to distinguish "this specific
  country/category has no coverage" from "the API key/service is actually broken."

### `gnewsConnector` (GNews) — migrating from `providers/gnewsProvider.ts`

- `fetch()`: same `top-headlines`/`search` split already implemented.
- `sourceType`: `'news'`.
- Broader non-US country coverage than NewsAPI.org in our own testing
  (confirmed: GNews returned results for Japan where NewsAPI.org returned
  zero for the identical query shape) — the orchestrator should prefer
  GNews as a fallback when NewsAPI.org returns empty for a non-US/UK country,
  not just present both as equal peer options.

### `googleNewsRssConnector` (Google News RSS) — **new, no API key required**

- Endpoint shape: `https://news.google.com/rss/search?q={query}&hl={lang}&gl={country}&ceid={country}:{lang}`
  (topic-only feeds also exist: `https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en`).
- `fetch()`: HTTP GET, parse XML (RSS 2.0) with `rss-parser` or
  `fast-xml-parser` — no auth header at all.
- `sourceType`: `'rss'`.
- Caveat to document prominently: this is a **public, unauthenticated
  endpoint with no published SLA or rate-limit documentation** — same
  "unofficial but stable in practice" risk class as the (now-broken) Google
  Trends scraper, except this endpoint has been stable far longer and is
  widely used in production by other tools. Still: implement `healthCheck()`
  defensively and don't make it a single point of failure for the whole
  aggregation (if it 404s/changes shape, degrade gracefully, don't crash
  `search()`).
- Genuinely the best cost/coverage tradeoff of the five: zero marginal cost,
  broad country/language coverage via `gl`/`hl`/`ceid` params, real
  publisher diversity (aggregates from thousands of outlets, not a curated
  shortlist like NewsAPI.org's free tier).

### `twitterConnector` (X/Twitter API v2) — **requires a paid Developer tier**

- ⚠️ **This is a budget decision, not just an engineering task.** As of this
  writing, X's API v2 free tier does not support search (`recent search`,
  `full-archive search`) at all — it's write-only (posting). Read/search
  access starts at the **Basic** tier (paid, monthly), with **Pro** required
  for higher volume or full-archive search. Confirm current pricing at
  `developer.x.com/en/portal/products` before committing — X has changed
  this pricing structure multiple times and this document will go stale.
- `fetch()`: `GET /2/tweets/search/recent` with a `query` param
  (keyword + optional `lang:`/`place_country:` operators), using the
  `twitter-api-v2` npm package.
- `sourceType`: `'social'`.
- `signals` subcollection (see `database-schema.md`) is *made* for this
  connector: like/retweet/reply counts sampled over time are exactly the
  "unbounded 1:many scoped to one article" case.
- Rate limits are tier-dependent and must live in `config/sources.ts`
  per-connector, not hardcoded — a Basic-tier account and a Pro-tier account
  have very different request budgets.

### `youtubeConnector` (YouTube Data API v3) — **free, quota-based**

- `fetch()`: `search.list` (keyword → video IDs) then `videos.list`
  (IDs → full metadata: title, description, channel, publishedAt,
  thumbnail, viewCount/likeCount for `signals`) — two calls, because
  `search.list` alone doesn't return statistics.
- `sourceType`: `'video'`.
- Free tier: 10,000 quota units/day by default. `search.list` costs
  **100 units per call** — that's only ~100 searches/day before hitting the
  quota wall, far more constraining than NewsAPI.org or GNews's request
  counts. This must be reflected in `config/sources.ts`'s per-source budget
  and in the ingestion scheduler's cadence (see `scheduling-strategy.md`) —
  do not poll YouTube as aggressively as the RSS connector.
- Consider using `videos.list` with `chart=mostPopular` +
  `videoCategoryId` for a cheaper (1 unit) "what's trending" signal
  alongside the more expensive keyword `search.list`.

## `validate()` — shared minimum bar, per-connector specifics allowed

Every `NormalizedItem` must have a non-empty `title`, a parseable `url`, and
a valid ISO8601 `publishedAt` before it's allowed past normalization — that
much is enforced centrally (`shared/normalize.ts`), not re-implemented per
connector. Each connector's `validate()` only adds source-specific checks
(e.g. the YouTube connector rejecting videos under some duration threshold
if "shorts" should be excluded).

## `healthCheck()` — used by the `healthCheck` admin callable (Phase 2)

Cheap, low-quota-cost pings: NewsAPI/GNews/YouTube use minimal-result
queries against a known-good country; Google News RSS fetches one small
topic feed; Twitter uses the cheapest available read endpoint. Results feed
`sources/{sourceId}.status` (`active | degraded | disabled`) so the
dashboard can show "GoogleNewsRSS: 🟢, Twitter: 🔴 rate-limited" instead of
silently returning fewer results with no explanation.
