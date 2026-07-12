# Tech stack

Versions reflect what's actually pinned in this repo today
(`package.json` / `functions/package.json`), not aspirational choices.

## Frontend

| Piece | Version | Notes |
|---|---|---|
| React | 19.0.1 | |
| Vite | 6.2.3 | |
| TypeScript | 5.8.x | `tsconfig.json` excludes `functions/` — two separate TS projects |
| react-router-dom | 7.18.1 | Client-side routing; `/` (3D scene) and `/trends` (this module) |
| Tailwind CSS | v4 (`@tailwindcss/vite`) | |
| firebase (client SDK) | 12.16.0 | `httpsCallable` only — no client-side Firestore reads |
| Hosting | Vercel (`nexomate/boxnewsbooster`) | Deliberately not Firebase Hosting — see `security-strategy.md` |

## Backend (`functions/`)

| Piece | Version | Notes |
|---|---|---|
| Node.js | 20 (Cloud Functions runtime) | ⚠️ Node 20 is deprecated as of 2026-04-30, decommissioned 2026-10-30 per the deploy-time warning we've already seen. **Action item**: bump to Node 22 once `firebase-functions` officially supports it as the pinned runtime — track before Oct 2026. |
| TypeScript | 5.8.x | `strict: true`, compiles to `lib/` (gitignored — see the `functions/.gitignore` bug fixed 2026-07-12) |
| firebase-functions | ^6.1.0 (v2 / 2nd gen) | All callables use `onCall`; event-triggered ingestion functions (Phase 2) use the same package's Pub/Sub trigger helpers |
| firebase-admin | ^13.0.0 | Firestore + (later) any Auth/App Check admin verification |
| @anthropic-ai/sdk | ^0.70.0 | Direct Messages API calls, not Genkit — see decision below |
| google-trends-api | ^4.9.2 | **Confirmed broken** 2026-07-12: depends on `/trends/api/dailytrends` and `/trends/api/realtimetrends`, both now 404 on Google's side. Kept in the tree only until replaced (see `connector-interface.md` — Trends is not one of the 5 launch sources, but the existing panel depends on this package). |

## New dependencies this expansion will add

| Piece | Purpose | Notes |
|---|---|---|
| `rss-parser` (or `fast-xml-parser`) | Google News RSS connector | RSS/Atom XML → JS objects; no API key required for this source at all |
| `twitter-api-v2` (npm) | Twitter/X connector | Well-maintained community SDK for API v2; still requires a **paid** Developer Portal tier — see `connector-interface.md` |
| `googleapis` (or a slim `youtube` REST wrapper) | YouTube connector | Official Google API client; only the `youtube.v3` surface is needed, consider a hand-rolled `fetch()` wrapper instead of the full `googleapis` package to avoid bundle bloat |
| `@google-cloud/tasks` | Queue strategy | Enqueue/manage Cloud Tasks for ingestion retries |
| `@google-cloud/scheduler` (or Firebase's `onSchedule`) | Scheduling strategy | `firebase-functions/v2/scheduler`'s `onSchedule` is sufficient — no need for the raw `@google-cloud/scheduler` client |

## Decision: direct Anthropic SDK, not Genkit

Google's **Genkit** is an orchestration framework built primarily around
Gemini/Vertex AI, with first-class tracing, eval, and flow-composition
tooling. We considered it for the classification/entity-extraction layer and
are **not** adopting it for now:

- Our only LLM provider is Anthropic (Claude), not Gemini — Genkit's Gemini
  integration is its strongest feature, which we wouldn't use.
- Genkit's Anthropic plugin support exists but is not as mature/first-party
  as its Gemini path, adding an abstraction layer over the already-simple
  `@anthropic-ai/sdk` calls in `lib/classify.ts` for little benefit.
- Our classification is a single tool-use call with a fixed schema — Genkit's
  flow/tracing value shows up more in multi-step agentic pipelines, which
  this isn't (yet).

**Revisit this decision if**: we add a second LLM provider (e.g. Gemini for
cost reasons on high-volume entity extraction), or we build a genuinely
multi-step agent pipeline where Genkit's flow tracing/observability would
pay for itself.

## CI/CD (current gap)

There is currently **no CI pipeline** for `functions/` — deploys are manual
(`firebase deploy`) from a developer machine. The frontend has implicit CI
via Vercel's Git integration (push to `main` → auto-deploy). **Action item**
for Phase 2+: add a GitHub Actions workflow that runs `tsc --noEmit` on
`functions/` on every PR, and optionally a `firebase deploy --only functions`
step gated on manual approval (functions deploys are not free and touch
production Cloud Run services, so auto-deploy-on-merge is not recommended
without a staging Firebase project first).
