# Queue strategy

## Why Cloud Tasks, not just "retry in the Pub/Sub handler"

Pub/Sub itself will redeliver a message if the subscriber fails, but that
retry is **all-or-nothing per topic** — it doesn't give per-item rate
limiting or per-connector backoff tuning. Cloud Tasks gives us:

- A named queue **per connector**, each with its own dispatch rate — a
  Twitter 429 backing off for 15 minutes must not slow down NewsAPI
  classification work sitting in a different queue.
- Per-task retry config (max attempts, min/max backoff) instead of one
  global Pub/Sub redelivery policy.
- A dead-letter path for tasks that exhaust retries, so a permanently-broken
  item (e.g. a malformed RSS entry) doesn't retry forever.

## Queue layout

| Queue name | Fed by | Consumes | Rate limit |
|---|---|---|---|
| `classify-queue` | `services/ingestion.ts` (all connectors funnel here) | `functions/classifyArticleTask.ts` — one Claude tool-use call per queued item | Shared across all sources (Anthropic is the bottleneck resource, not the originating connector) — dispatch rate tuned to Anthropic's rate limit, not any single news API's |
| `dedup-retry-queue` | `services/dedup.ts` on transient Firestore contention | re-run the dedup check | High retry rate, short backoff — this is intra-GCP, not an external API |
| `ingest-retry-{connectorId}` | `ingestSource` on a failed `.fetch()` | re-run that connector's fetch | **Per-connector**, tuned to that source's own rate-limit semantics (see table below) |

## Retry/backoff config per ingest-retry queue

| Queue | Max attempts | Min backoff | Max backoff | Why |
|---|---|---|---|---|
| `ingest-retry-googlenewsrss` | 5 | 30s | 10min | No published rate limit; safe to retry fairly aggressively on transient failures |
| `ingest-retry-newsapi` | 3 | 5min | 1hr | Free tier is 100 req/day — a naive fast retry loop can burn the entire daily budget on a single stuck item |
| `ingest-retry-gnews` | 3 | 5min | 1hr | Same reasoning as NewsAPI.org |
| `ingest-retry-youtube` | 2 | 15min | 2hr | Quota-based (100 units/search) — retries are expensive, keep them rare |
| `ingest-retry-twitter` | 3 | 10min | 1hr | Paid-tier rate limits are stricter and cost real money per overage on some plans — conservative by default, tune once actual tier is known |

## Dead-letter handling

Every queue gets a dead-letter queue (`{queue-name}-dlq`) via Cloud Tasks'
built-in DLQ support. Items that exhaust retries land there with their last
error attached; a lightweight admin view (or just a Firestore collection
`deadLetters/{id}: {queue, payload, lastError, failedAt}`) makes these
inspectable without needing to dig through Cloud Logging. Nothing auto-
retries from the DLQ — that's a manual "investigate, then requeue" action,
since repeated automatic requeueing of a genuinely broken item is how you
accidentally re-trigger the exact rate-limit exhaustion this whole queue
design exists to prevent.

## What does NOT go through Cloud Tasks

The on-demand `search` callable (a user typing a keyword and hitting enter)
calls connectors **synchronously**, same as today's `fetchNews` — a user
waiting for search results needs a response in seconds, not "queued, check
back later." Cloud Tasks is exclusively for the *background* ingestion and
classification pipeline that pre-populates Firestore so on-demand search
mostly reads pre-fetched, pre-classified data instead of hitting external
APIs live on every keystroke.
