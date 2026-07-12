# Scalability roadmap

This is a set of **trigger conditions**, not a commitment to build any of
this now. Building sharding/BigQuery/multi-region support before there's
evidence it's needed is exactly the kind of premature complexity this
project should avoid — everything below states *what signal* justifies the
work, not just the work itself.

## Firestore hot collections — when to shard

| Collection | Hot-write pattern | Trigger to shard |
|---|---|---|
| `articles` | Write-heavy during ingestion bursts (5 connectors' worth of results landing within the same scheduled window) | If ingestion write throughput starts hitting Firestore's ~1 write/sec per-document limit *on a shared aggregate* (this applies to counters, not `articles` itself — `articles` writes are naturally distributed across many document IDs, so this is unlikely to be the actual bottleneck) |
| `sources/{id}.dailyRequestCount` | Every ingestion run + every on-demand search increments the same handful of documents (one per connector) | **This is the real hot-write risk**, not `articles`. If request volume grows enough that concurrent increments to the same `sources/newsapi` doc start contending, shard the counter (`sources/newsapi/shards/{0-9}`, sum on read) — the classic Firestore distributed-counter pattern |
| `trends` | Moderate write rate (one write per keyword per country per window) | Unlikely to need sharding at any realistic keyword-tracking volume; revisit only if trend-window granularity increases dramatically (e.g. per-minute instead of per-hour windows) |

## When to move aggregation to BigQuery

Firestore is good at "get this document" and "query this collection with a
few equality/range filters." It is not good at:
- Multi-collection joins for analytics (e.g. "category breakdown of articles
  from social sources, in the last 7 days, grouped by country")
- Ad-hoc exploratory queries an analyst wants to run once
- Aggregations over millions of documents

**Trigger**: once `articles` crosses roughly **100k+ documents** *and* the
`getInsights` callable's Firestore aggregation queries start taking
multiple seconds or requiring client-side post-processing of large result
sets, that's the signal to add a Firestore → BigQuery export (via the
official Firestore-BigQuery extension, which streams document changes into
BigQuery automatically) and move `getInsights`' heavy aggregation queries to
run against BigQuery instead of Firestore directly. Firestore stays the
system of record and the low-latency per-document store; BigQuery becomes
the analytics-query backend feeding the "refined analyzed data by category,
country, ..." dashboard views specifically.

## Multi-region

Everything is currently single-region (`us-central1` for both Firestore and
Cloud Functions, matched deliberately to avoid cross-region latency). This
is fine while the target audience is not latency-sensitive and request
volume is moderate.

**Trigger to reconsider**: sustained traffic from a specific non-US region
where p95 latency measurably matters for the product experience (e.g. a
significant EU or APAC user base for the dashboard). At that point:
- Firestore supports multi-region database configs, but changing an
  existing single-region database's location is **not possible in-place** —
  it would require a new database + data migration, which is exactly why
  Phase 0 flagged the initial region choice as irreversible and worth
  getting right up front.
- Cloud Functions can deploy the same function to multiple regions behind a
  load balancer, at added deploy/ops complexity — only worth it once
  latency is a measured problem, not a hypothetical one.

## Ingestion fan-out — when a dedicated Cloud Run worker beats Cloud Functions

Referenced in `architecture.md`: today, 5 connectors on hourly-to-6-hourly
schedules is comfortably within Cloud Functions v2's execution model (each
invocation is short-lived: fetch, normalize, enqueue for classification,
done). **Trigger to reconsider**: if a future iteration adds dozens-to-
hundreds of individual RSS feeds (as opposed to today's single Google News
RSS connector querying broadly), fanning that out from a single scheduled
function invocation becomes a long-running, high-concurrency job that fits
a dedicated Cloud Run service (with its own concurrency/autoscaling tuning)
better than a Cloud Function's request-per-invocation model.

## The honest summary

None of the above is needed today. This roadmap exists so that when one of
these trigger conditions is actually hit, the response is "we already knew
this was coming and have a plan," not "everything is on fire, now we
architect under pressure."
