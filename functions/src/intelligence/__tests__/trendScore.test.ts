// Plain-Node unit test, no Firestore/emulator needed -- computeTrendScore
// is a pure function. Run: npm run build && node lib/intelligence/__tests__/trendScore.test.js
import assert from "assert";
import { computeTrendScore } from "../trendScore";

const NOW = "2026-07-12T12:00:00.000Z";

function assertInRange(value: number, min: number, max: number, label: string) {
  assert.ok(value >= min && value <= max, `${label}: expected ${value} in [${min}, ${max}]`);
}

// 1. Missing signals (SearchInterest/SocialSignals) must default to a
//    neutral 1.0 multiplier, never zero out or crash the score.
{
  const result = computeTrendScore({
    sourceType: "news",
    publishedAtISO: NOW,
    nowISO: NOW,
    clusterMemberCountLast6h: 3,
    distinctPublishersInCluster: 2,
    clusterMemberCount: 3,
    extractionSucceeded: true,
    // searchInterestValue and socialSignalValue intentionally omitted
  });
  assert.strictEqual(result.factors.searchInterest, 1.0, "searchInterest should default to neutral 1.0");
  assert.strictEqual(result.factors.socialSignals, 1.0, "socialSignals should default to neutral 1.0");
  assert.ok(result.compositeScore > 0, "score must not be zeroed by missing signals");
  console.log("PASS: missing-signal neutral defaults", result);
}

// 2. A fresh, well-corroborated, successfully-extracted news article should
//    score meaningfully higher than a stale, single-source, failed-extraction one.
{
  const strong = computeTrendScore({
    sourceType: "news",
    publishedAtISO: NOW,
    nowISO: NOW,
    clusterMemberCountLast6h: 5,
    distinctPublishersInCluster: 4,
    clusterMemberCount: 5,
    extractionSucceeded: true,
  });
  const weak = computeTrendScore({
    sourceType: "social",
    publishedAtISO: "2026-07-08T12:00:00.000Z", // 4 days stale
    nowISO: NOW,
    clusterMemberCountLast6h: 0,
    distinctPublishersInCluster: 1,
    clusterMemberCount: 1,
    extractionSucceeded: false,
  });
  assert.ok(strong.compositeScore > weak.compositeScore, "strong signal article should outscore a weak one");
  console.log("PASS: relative ordering", { strong: strong.compositeScore, weak: weak.compositeScore });
}

// 3. Every factor must stay within [0, 1] across a range of inputs.
{
  const result = computeTrendScore({
    sourceType: "unknown-type",
    publishedAtISO: "2020-01-01T00:00:00.000Z", // very stale
    nowISO: NOW,
    clusterMemberCountLast6h: 100, // extreme
    distinctPublishersInCluster: 50,
    clusterMemberCount: 50,
    extractionSucceeded: true,
  });
  for (const [key, value] of Object.entries(result.factors)) {
    assertInRange(value, 0, 1, key);
  }
  console.log("PASS: factor bounds under extreme inputs", result.factors);
}

console.log("\nAll trendScore tests passed.");
