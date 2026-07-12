// Manual connector test -- run against the Firestore emulator (with
// keywords/sources already seeded via seedKeywords.ts) to confirm the
// Google News RSS connector's fetch() -> normalize() -> validate() chain
// produces valid NormalizedItems, without going through Pub/Sub or Cloud
// Scheduler at all.
//
// Usage (from functions/):
//   npm run build
//   firebase emulators:exec --only functions,firestore,pubsub \
//     "node lib/connectors/__tests__/googleNewsRss.manual.js"
import { initializeApp } from "firebase-admin/app";

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error("FIRESTORE_EMULATOR_HOST is not set -- this script must run under firebase emulators:exec.");
  process.exit(1);
}

initializeApp({ projectId: "boxnewsbooster" });

// Imported after initializeApp() so the connector's Firestore calls target the emulator.
/* eslint-disable @typescript-eslint/no-var-requires */
const { googleNewsRssConnector } = require("../googleNewsRss");

async function main() {
  console.log("Fetching Google News RSS feeds for all active keyword x edition combinations...");
  const raw = await googleNewsRssConnector.fetch();
  console.log(`Raw items fetched: ${raw.length}`);

  const normalized = googleNewsRssConnector.normalize(raw);
  console.log(`Normalized items: ${normalized.length}`);

  const valid = normalized.filter((item: unknown) => googleNewsRssConnector.validate(item));
  console.log(`Valid items: ${valid.length} / ${normalized.length}`);

  const byTerm = new Map<string, number>();
  for (const item of valid) {
    for (const tag of item.tags ?? []) {
      byTerm.set(tag, (byTerm.get(tag) ?? 0) + 1);
    }
  }
  console.log("Valid item count per keyword:");
  for (const [term, count] of byTerm) {
    console.log(`  ${term}: ${count}`);
  }

  if (valid.length > 0) {
    console.log("\nSample item:", JSON.stringify(valid[0], null, 2));
  }

  process.exit(valid.length > 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("Manual test failed:", error);
  process.exit(1);
});
