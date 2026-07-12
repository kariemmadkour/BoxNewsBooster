// Manual connector test -- confirms the disabled-by-default safety path
// only. Does NOT call healthCheck() or exercise a live search, since X's
// pay-per-use billing mode on the existing token is unconfirmed -- see
// docs/connector-interface.md. Requires FIRESTORE_EMULATOR_HOST.
import { initializeApp } from "firebase-admin/app";

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error("FIRESTORE_EMULATOR_HOST is not set -- this script must run under firebase emulators:exec.");
  process.exit(1);
}

initializeApp({ projectId: "boxnewsbooster" });

/* eslint-disable @typescript-eslint/no-var-requires */
const { twitterXConnector } = require("../twitterX");

async function main() {
  console.log("Fetching Twitter (expect 0 sources, since twitterx-news is seeded enabled:false)...");
  const raw = await twitterXConnector.fetch();
  console.log(`Raw items fetched: ${raw.length} (expected: 0, no live API call should have been made)`);
  process.exit(raw.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("Manual test failed:", error);
  process.exit(1);
});
