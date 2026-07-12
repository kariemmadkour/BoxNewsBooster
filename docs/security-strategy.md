# Security strategy

## Current state (as of 2026-07-12, before this expansion)

| Control | Status |
|---|---|
| Firebase Auth | Not used — all callables are public, no user accounts |
| App Check | **Not enabled** — flagged as recommended hardening when the module first shipped, not yet acted on |
| Firestore Security Rules | Deny-all (`allow read, write: if false`) — correct, since all access is server-mediated through `onCall` functions using the Admin SDK, which bypasses rules entirely |
| Secret Manager | 3 secrets (`NEWS_API_KEY`, `GNEWS_API_KEY`, `ANTHROPIC_API_KEY`), each bound via `defineSecret` + `firebase functions:secrets:set`, granted to functions via the `secrets: [...]` option — never in code or committed files |
| Service accounts | Default compute service account (`{project-number}-compute@developer.gserviceaccount.com`) for all functions — not yet split per-function |
| Hosting | Frontend on **Vercel**, not Firebase Hosting — deliberate (see below) |

## Why App Check moves from "recommended" to "prioritize before shipping new connectors"

Phase 0 had two connectors with free-tier keys — worst-case abuse of the
public `fetchNews`/`classifyArticle` callables was bounded by NewsAPI/GNews's
own free-tier daily caps and the cost of a handful of Claude calls. This
expansion adds:
- **YouTube**: quota-based (10,000 units/day) — a scripted abuse loop
  hitting `search()` repeatedly could exhaust the daily quota in minutes,
  breaking the feature for legitimate use for the rest of the day.
- **Twitter**: a **paid** tier — unbounded public access to a callable that
  triggers Twitter API calls is a direct line from "someone found the URL"
  to "unexpected invoice."

**Action item, before Twitter/YouTube connectors go live**: enable Firebase
App Check (reCAPTCHA v3 provider) on every callable, enforced
(`enforceAppCheck: true`), not just recommended. This was optional when the
worst case was "NewsAPI free tier gets rate-limited for a day"; it is not
optional when the worst case is "YouTube quota exhausted" or "surprise
Twitter API bill."

## Auth roles

Still no end-user accounts needed for the public search/feed experience.
Two roles are introduced for Phase 2+ admin surfaces:

| Role | Grants | Enforced via |
|---|---|---|
| Public (unauthenticated) | `search`, `getFeed`, `getInsights`, `getTrending` | App Check only (no user identity needed) |
| Admin | `healthCheck`, manual re-classification/backfill triggers, viewing `deadLetters` | Firebase Auth custom claim (`admin: true`) checked inside the callable via `request.auth?.token?.admin`, **in addition to** App Check |

Admin callables are the first place actual Firebase Auth enters this
project — a small, deliberate scope (internal tooling), not user-facing
accounts.

## Firestore Security Rules (unchanged principle, expanded scope)

Every new collection in `database-schema.md` (`sources`, `articles`,
`clusters`, `entities`, `topics`, `keywords`, `trends`, `countries`,
`languages`, `publishers`, `signals`, `scores`, `categories`, `tags`,
`embeddings`, `ai_summaries`, `queryResultCache`, `deadLetters`) gets the
**same deny-all default** — nothing here is meant to be read directly by the
client. If a future admin dashboard needs direct Firestore reads (e.g. a
live-updating health status view), that's an explicit, narrow rule addition
scoped to the `admin: true` custom claim, added when that feature is
actually built — not a blanket "authenticated users can read" rule.

## Secret Manager — two new secrets

`TWITTER_BEARER_TOKEN` (or full OAuth1.0a credentials, depending on which
`twitter-api-v2` auth mode is used) and `YOUTUBE_API_KEY`, both via
`firebase functions:secrets:set`, both granted only to the specific
functions that need them (`ingestSource`, `search`) via the `secrets: [...]`
option — not blanket-granted to every function in the codebase. See the
runbook for exact setup commands.

## Least-privilege service accounts (gap, action item)

Today every function runs as the default compute service account, which has
broad project-level permissions by default. **Recommended before this
expansion ships**: create a dedicated service account per function group
(e.g. one for ingestion functions, one for the public search API) with only
the IAM roles each actually needs (Secret Manager accessor for its specific
secrets, Firestore read/write, Cloud Tasks enqueuer for ingestion functions
only). This is a real gap carried over from Phase 0, not something this
expansion introduces — but adding externally-billed APIs (Twitter, YouTube)
raises the stakes of an over-privileged function being compromised or
misconfigured.

## Why the frontend stays on Vercel, not Firebase Hosting

Restated from `architecture.md` because it's a security-relevant boundary,
not just a deployment preference: keeping the frontend's deploy pipeline
(Vercel, Git-connected) entirely separate from the backend's deploy pipeline
(Firebase CLI, manual, requires `firebase login` with project access) means
a compromised Vercel/GitHub integration can only ever affect static asset
serving — it has no path to Cloud Functions, Firestore, or Secret Manager.
