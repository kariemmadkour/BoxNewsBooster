import { TrendScoreFactors } from "./types";

// Static per-sourceType authority weights -- a coarse heuristic, not
// researched publisher reputation. Revisit if real usage data ever exists.
const SOURCE_AUTHORITY_WEIGHTS: Record<string, number> = {
  news: 1.0,
  government: 1.0,
  financial: 0.9,
  sports: 0.7,
  video: 0.6,
  rss: 0.6,
  social: 0.5,
  trends: 0.5,
};

export interface TrendScoreInput {
  sourceType: string;
  publishedAtISO: string;
  nowISO: string;
  clusterMemberCountLast6h: number; // 0 or 1 if not clustered
  distinctPublishersInCluster: number; // 1 if not clustered
  clusterMemberCount: number; // 1 if not clustered
  /** Google Trends search-interest value, 0-1 normalized. undefined = no live data (currently: always, Trends is broken). */
  searchInterestValue?: number;
  /** Aggregated social engagement, 0-1 normalized. undefined = no live data (currently: always, Twitter disabled). */
  socialSignalValue?: number;
  /** Did Gemini extraction/classification succeed without falling back? */
  extractionSucceeded: boolean;
}

export interface TrendScoreResult {
  compositeScore: number;
  factors: TrendScoreFactors;
}

// Pure function, no Firestore/network access -- the pipeline handler
// gathers cluster stats and passes them in as plain data. See the Phase 3
// plan for the rationale behind each factor and the neutral-multiplier
// handling of currently-dead signals (SearchInterest, SocialSignals).
export function computeTrendScore(input: TrendScoreInput): TrendScoreResult {
  const hoursSincePublished = Math.max(
    0,
    (Date.parse(input.nowISO) - Date.parse(input.publishedAtISO)) / (1000 * 60 * 60)
  );

  const velocity =
    input.clusterMemberCountLast6h > 0 ? Math.min(1, input.clusterMemberCountLast6h / 5) : 0.2;

  const freshness = Math.max(0, 1 - hoursSincePublished / 48);

  const sourceAuthority = SOURCE_AUTHORITY_WEIGHTS[input.sourceType] ?? 0.5;

  // Neutral multiplier (1.0) when there's no live data -- never zeroes out
  // or crashes the score just because Trends/Twitter are currently down.
  const searchInterest = input.searchInterestValue ?? 1.0;
  const socialSignals = input.socialSignalValue ?? 1.0;

  const publisherDiversity =
    input.clusterMemberCount > 1
      ? input.distinctPublishersInCluster / input.clusterMemberCount
      : 0.3;

  const aiConfidence = input.extractionSucceeded ? 1.0 : 0.5;

  const factors: TrendScoreFactors = {
    velocity,
    freshness,
    sourceAuthority,
    searchInterest,
    socialSignals,
    publisherDiversity,
    aiConfidence,
  };

  const weightedBase =
    velocity * 0.25 +
    freshness * 0.2 +
    sourceAuthority * 0.15 +
    publisherDiversity * 0.15 +
    aiConfidence * 0.1;

  const compositeScore = weightedBase * searchInterest * socialSignals;

  return { compositeScore, factors };
}
