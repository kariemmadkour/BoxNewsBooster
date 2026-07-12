# `functions/src` folder structure

Annotated target layout. Existing files/dirs are marked **(existing)**; new
ones for the multi-source expansion are marked **(new)**. Nothing marked
(new) is implemented yet — Phase 1 only adds `shared/connector.ts`.

```
functions/src/
├── index.ts                        (existing) entry point — re-exports every callable + scheduled fn
│
├── config/
│   ├── secrets.ts                  (existing) defineSecret() for all provider API keys
│   ├── taxonomy.ts                 (existing) CUSTOM_TAXONOMY (Crime, Music, Art, ...)
│   ├── categories.ts               (existing) NATIVE_CATEGORIES (the 7 shared by NewsAPI/GNews)
│   └── sources.ts                  (new) registry: which connectors are enabled, per-source config
│                                    (rate limit budget, default poll interval, cost tier)
│
├── types/
│   └── article.ts                  (existing) NormalizedArticle, RawProviderArticle, NewsProviderName
│                                    -- superseded by shared/connector.ts's NormalizedItem in Phase 2,
│                                       kept during migration for backward compat
│
├── shared/                         (new) cross-cutting contracts, no business logic
│   ├── connector.ts                (new, THIS PHASE) IConnector, NormalizedItem
│   ├── errors.ts                   (new) typed error classes (ConnectorError, RateLimitError, ...)
│   └── normalize.ts                (new) shared normalization helpers (canonical URL, text cleanup)
│
├── connectors/                     (new) one file per external source, each implements IConnector
│   ├── index.ts                    (new) connector registry / factory (successor to providers/index.ts)
│   ├── newsApiConnector.ts         (new) migrated from providers/newsApiOrgProvider.ts
│   ├── gnewsConnector.ts           (new) migrated from providers/gnewsProvider.ts
│   ├── googleNewsRssConnector.ts   (new) no API key — parses Google News RSS/Atom feeds
│   ├── twitterConnector.ts         (new) X API v2 recent-search — requires a paid access tier
│   └── youtubeConnector.ts         (new) YouTube Data API v3 search.list + videos.list
│
├── services/                       (new) business logic, source-agnostic
│   ├── searchOrchestrator.ts       (new) fan-out to N connectors, merge results, apply filters
│   ├── dedup.ts                    (new) canonical-URL hash + near-duplicate (simhash) detection
│   ├── clustering.ts               (new) groups NormalizedItems about the same story across sources
│   ├── insights.ts                 (new) category/country/source roll-ups for the analytics panel
│   └── ingestion.ts                (new) scheduled full-pull logic invoked by Pub/Sub-triggered fns
│
├── lib/                            (existing) low-level infra helpers, kept as-is
│   ├── cache.ts                    (existing) Firestore cache get/set (query cache, classification cache, trends)
│   ├── classify.ts                 (existing) Anthropic Claude classification -- extended in Phase 3
│   │                                with entity/keyword/sentiment extraction in the same call
│   ├── runtimeConfig.ts            (existing) reads config/anthropic.modelId
│   └── trends.ts                   (existing, BROKEN — see database-schema.md) Google Trends wrapper
│
├── providers/                      (existing, DEPRECATED in Phase 2) current NewsAPI/GNews implementations
│   ├── newsProvider.ts             -- superseded by shared/connector.ts's IConnector
│   ├── newsApiOrgProvider.ts       -- logic moves to connectors/newsApiConnector.ts
│   ├── gnewsProvider.ts            -- logic moves to connectors/gnewsConnector.ts
│   └── index.ts                    -- superseded by connectors/index.ts
│
├── functions/                      (existing) the actual `onCall`/event-triggered exports
│   ├── fetchNews.ts                (existing) kept for backward compat during migration
│   ├── classifyArticle.ts          (existing)
│   ├── getSearchTrends.ts          (existing, currently disabled client-side — see caching-strategy.md)
│   ├── search.ts                   (new) unified multi-source keyword search callable
│   ├── getInsights.ts              (new) category/country/source breakdown callable
│   ├── getTrending.ts              (new) cross-source "what's hot right now" callable
│   ├── ingestSource.ts             (new) Pub/Sub-triggered, calls services/ingestion.ts
│   └── healthCheck.ts              (new) admin-only callable, runs every connector's healthCheck()
│
└── utils/                          (existing) generic helpers, unchanged
    ├── hash.ts                     (existing) canonicalizeUrl, hashUrl, hashText, hashQuery
    ├── countries.ts                (existing) ISO_COUNTRY_CODES
    ├── validation.ts               (existing) input whitelisting for callable args
    └── concurrency.ts              (existing) mapWithConcurrency bounded-parallel helper
```

## Migration notes (for Phase 2, not this phase)

- `providers/` is not deleted in one shot. `connectors/newsApiConnector.ts` and
  `connectors/gnewsConnector.ts` are new files that reuse the exact request-building
  logic already proven in `providers/newsApiOrgProvider.ts` / `gnewsProvider.ts`,
  just reshaped to return `NormalizedItem` instead of `RawProviderArticle`.
  Once `search.ts` replaces `fetchNews.ts` as the primary client-facing
  callable, `providers/` and the old `types/article.ts` shapes are deleted.
- `fetchNews`/`classifyArticle`/`getSearchTrends` stay deployed and working
  throughout the migration — nothing in Phase 1 or 2 breaks the currently
  shipped `/trends` page.
