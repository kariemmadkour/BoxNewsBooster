// Manual connector test -- requires FIRESTORE_EMULATOR_HOST (run via
// firebase emulators:exec) and a real YOUTUBE_API_KEY (this makes real,
// quota-consuming calls to the YouTube Data API -- run sparingly).
//
// Usage (from functions/):
//   npm run build
//   YOUTUBE_API_KEY=<real key> firebase emulators:exec --only functions,firestore \
//     "node lib/connectors/__tests__/youtube.manual.js"
import { initializeApp } from "firebase-admin/app";

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error("FIRESTORE_EMULATOR_HOST is not set -- this script must run under firebase emulators:exec.");
  process.exit(1);
}

initializeApp({ projectId: "boxnewsbooster" });

/* eslint-disable @typescript-eslint/no-var-requires */
const { youtubeConnector } = require("../youtube");

async function main() {
  console.log("Fetching YouTube videos for all enabled youtube sources...");
  const raw = await youtubeConnector.fetch();
  console.log(`Raw items fetched: ${raw.length}`);

  const normalized = youtubeConnector.normalize(raw);
  const valid = normalized.filter((item: unknown) => youtubeConnector.validate(item));
  console.log(`Normalized: ${normalized.length}, valid: ${valid.length}`);

  if (valid.length > 0) {
    console.log("\nSample item:", JSON.stringify(valid[0], null, 2));
  }

  process.exit(valid.length > 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("Manual test failed:", error);
  process.exit(1);
});
