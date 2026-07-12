// Emulator-only seed script. Run via `npm run seed:keywords` (functions/package.json)
// with the Firestore emulator already running -- refuses to run against a
// real project to avoid ever accidentally seeding production Firestore.
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error("FIRESTORE_EMULATOR_HOST is not set -- refusing to run against a real project.");
  console.error("Start the emulator first: firebase emulators:start --only firestore");
  process.exit(1);
}

initializeApp({ projectId: "boxnewsbooster" });
const db = getFirestore();

const SEED_KEYWORDS: { term: string; editions: { country: string; lang: string }[] }[] = [
  {
    term: "الانتخابات",
    editions: [
      { country: "EG", lang: "ar" },
      { country: "SA", lang: "ar" },
      { country: "AE", lang: "ar" },
    ],
  },
  {
    term: "أسعار الذهب",
    editions: [
      { country: "EG", lang: "ar" },
      { country: "KW", lang: "ar" },
      { country: "QA", lang: "ar" },
    ],
  },
  {
    term: "World Cup",
    editions: [
      { country: "AE", lang: "en" },
      { country: "BH", lang: "en" },
      { country: "OM", lang: "en" },
    ],
  },
];

async function seedSources() {
  const sources = [
    { id: "newsapi-us-general", connectorId: "newsapi", type: "news", country: "us", category: "general", enabled: true },
    { id: "gnews-us-general", connectorId: "gnews", type: "news", country: "us", category: "general", enabled: true },
    { id: "googlenewsrss-global", connectorId: "googlenewsrss", type: "rss", country: null, category: null, enabled: true },
    { id: "youtube-news", connectorId: "youtube", type: "video", country: null, category: null, query: "news", enabled: true },
    { id: "twitterx-news", connectorId: "twitterx", type: "social", country: null, category: null, query: "news", enabled: false },
  ];

  for (const source of sources) {
    await db
      .collection("sources")
      .doc(source.id)
      .set({
        ...source,
        name: source.id,
        language: null,
        priority: 50,
        rss: null,
        lastHealthCheck: null,
        consecutiveFailures: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    console.log(`Seeded source: ${source.id} (enabled: ${source.enabled})`);
  }
}

async function seedKeywords() {
  for (const { term, editions } of SEED_KEYWORDS) {
    await db.collection("keywords").add({
      term,
      active: true,
      editions,
      createdBy: "system",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log(`Seeded keyword: ${term} (${editions.length} editions)`);
  }
}

async function main() {
  await seedSources();
  await seedKeywords();
  console.log(`Done: ${SEED_KEYWORDS.length} keywords, 5 sources seeded.`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
