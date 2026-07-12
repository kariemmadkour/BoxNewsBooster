# Caching strategy

## What's cached where, and why

| Data | Store | TTL / freshness | Why this store |
|---|---|---|---|
| Individual article + classification | Firestore `articles`/`scores`/`ai_summaries` | Classify-once-reuse-forever (no freshness check — an article's category/sentiment doesn't change after publication) | Durable, queryable, needs to survive across ingestion runs and be joinable with clusters/entities — this is the source of truth, not a "cache" in the ephemeral sense |
| Per-query result ID list | Firestore `queryResultCache` (replaces today's `newsQueryCache`) | 15min freshness, 7d cleanup | Same reasoning as Phase 0's cache: search queries repeat (same country+category combo hit by many users), and provider APIs cost money/quota per call |
| Trends | Firestore `trends` | 60min freshness, 24h cleanup | Trend data is inherently a rolling window, not permanent — matches the existing `trendsCache` model conceptually, just normalized by keyword+country instead of one blob per country |
| Per-connector rate-limit/budget counters | Firestore `sources/{id}.dailyRequestCount` (see `scheduling-strategy.md`) | Resets daily | Needs to persist across independent function invocations (no shared memory between Cloud Function instances) — a lightweight doc, not a cache in the traditional sense, but Firestore is the only durable shared state available without adding new infra |
| Static frontend assets (JS/CSS bundles) | Vercel Edge Network (CDN) | Vercel's default immutable-asset caching (content-hashed filenames) | Already happens automatically — no action needed, just documenting that it exists |

## Do we need Memorystore (Redis)? Not yet.

Memorystore would help with:
- **Sub-second dedup lookups** during high-throughput ingestion (checking
  "have we seen this canonical URL hash before" against an in-memory set
  instead of a Firestore `get()` per item).
- **Distributed rate-limit counters** with atomic increment/expire, cleaner
  than Firestore transactions for high-contention counters.

At current and near-term projected volume (5 sources, hourly-to-6-hourly
ingestion cadence, not a firehose), Firestore reads for dedup checks are
cheap enough in both latency and cost that adding a second stateful
datastore isn't justified. **Trigger to revisit**: if ingestion volume grows
to the point where dedup-check Firestore reads become a meaningful cost line
item, or if `services/dedup.ts`'s per-item Firestore round-trip becomes the
ingestion pipeline's bottleneck (measure before optimizing — don't
pre-emptively add Redis on a hunch).

## TTL enforcement mechanics (unchanged from Phase 0, extended to new collections)

Two layers, same as today:
1. **Application-level freshness check** — every read of a cached
   collection compares `fetchedAt`/`classifiedAt` against the freshness
   window *before* deciding whether to serve cached data or refetch. This is
   the layer that actually controls behavior.
2. **Firestore TTL policy** (`ttlAt` field, enabled via
   `gcloud firestore fields ttls update --collection-group={name}
   --field-path=ttlAt --enable-ttl`) — purely a storage-cost janitor that
   deletes expired docs in the background. It does **not** control
   freshness logic (a doc can be past its application-level freshness
   window for hours before Firestore's TTL sweep actually deletes it) — this
   distinction tripped nothing up in Phase 0 but is worth restating since
   it's easy to conflate "TTL policy" with "cache invalidation."

New collections needing TTL policies enabled once created: `queryResultCache`
(replaces `newsQueryCache`'s existing policy), `trends` (replaces
`trendsCache`'s). `articles`/`scores`/`ai_summaries`/`clusters`/`entities`
get **no** TTL — they're permanent data, not cache.

## The Google Trends caching lesson (why this matters concretely)

Phase 0's `trendsCache` is a fully-built, correctly-designed cache sitting in
front of a data source that turned out to be dead (Google retired the
underlying endpoint — see the runbook's 2026-07-12 entry). The caching layer
was never the problem; the connector was. This is the reason
`connector-interface.md`'s `healthCheck()` exists as a first-class part of
the contract this time — a cache can't tell you its upstream source stopped
existing, only a health check that's actually invoked on a schedule can.
