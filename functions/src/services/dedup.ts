import { logger } from "firebase-functions/v2";
import { getDedupCandidates, getArticleByDedupKey, upsertArticle, upsertCluster, nowISO } from "../lib/articleStore";
import { cosineSimilarity } from "../lib/vertexEmbeddings";
import { hashText } from "../utils/hash";
import { NormalizedItem } from "../shared/connector";
import { ArticleDoc } from "../intelligence/types";

const NEAR_DUP_WINDOW_HOURS = 72;
// Starting threshold, flagged as needing empirical tuning once real
// cross-connector duplicate examples are observed -- see the Phase 3 plan.
const NEAR_DUP_THRESHOLD = 0.9;

export function computeDedupHashKey(item: Pick<NormalizedItem, "title" | "publisher" | "publishedAt">): string {
  const day = item.publishedAt.slice(0, 10);
  return hashText(`${item.title}|${item.publisher}|${day}`);
}

export async function findExactDuplicate(item: NormalizedItem): Promise<ArticleDoc | null> {
  const key = computeDedupHashKey(item);
  return getArticleByDedupKey(key);
}

export interface ClusterAssignment {
  clusterId: string | null;
  matchedArticle: ArticleDoc | null;
}

// Finds a near-duplicate within the category+time-window candidate set via
// cosine similarity over embeddings, and assigns/creates a cluster
// accordingly. If the matched candidate isn't clustered yet, this promotes
// it into a brand-new cluster (retroactively updating its own doc) rather
// than leaving it stranded. Returns {clusterId: null} if no match is found
// (the caller treats the article as un-clustered, single-article scoring).
export async function findOrCreateCluster(item: NormalizedItem, embedding: number[]): Promise<ClusterAssignment> {
  const sinceISO = new Date(Date.now() - NEAR_DUP_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  const candidates = await getDedupCandidates(item.category, sinceISO);

  let bestMatch: ArticleDoc | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    if (!candidate.embedding || candidate.embedding.length === 0) continue;
    const score = cosineSimilarity(embedding, candidate.embedding);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  if (!bestMatch || bestScore < NEAR_DUP_THRESHOLD) {
    return { clusterId: null, matchedArticle: null };
  }

  logger.info("findOrCreateCluster: near-duplicate found", {
    matchedArticleId: bestMatch.id,
    similarity: bestScore,
  });

  if (bestMatch.clusterId) {
    await upsertCluster(bestMatch.clusterId, { lastUpdatedAt: nowISO() });
    return { clusterId: bestMatch.clusterId, matchedArticle: bestMatch };
  }

  // Promote the matched candidate into a brand-new cluster.
  const clusterId = bestMatch.id;
  await upsertCluster(clusterId, {
    representativeTitle: bestMatch.title,
    memberCount: 2,
    firstSeenAt: bestMatch.publishedAt,
    lastUpdatedAt: nowISO(),
    topArticleId: bestMatch.id,
  });
  await upsertArticle(bestMatch.id, { ...bestMatch, clusterId });

  return { clusterId, matchedArticle: bestMatch };
}
