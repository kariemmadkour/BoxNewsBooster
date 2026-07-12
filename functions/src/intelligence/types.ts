import { NormalizedItem } from "../shared/connector";

export interface TrendScoreFactors {
  velocity: number;
  freshness: number;
  sourceAuthority: number;
  searchInterest: number;
  socialSignals: number;
  publisherDiversity: number;
  aiConfidence: number;
}

export type ArticleStatus = "ingested" | "enriched" | "scored" | "complete" | "failed";

export interface Entity {
  name: string;
  type: string;
}

// Firestore doc shape for articles/{id}. Collapses what docs/database-schema.md
// originally sketched as separate scores/ai_summaries/embeddings collections
// into one doc -- see the Phase 3 plan for why (1:1 cardinality, always
// read together, no write-isolation benefit from splitting).
export interface ArticleDoc extends Omit<NormalizedItem, "entities"> {
  ingestedAt: string; // ISO8601
  dedupHashKey: string;
  clusterId: string | null;
  extractedTags: string[];
  // Richer than NormalizedItem.entities (string[], connector-level tagging
  // rarely populated) -- this is Gemini NER output: {name, type} pairs.
  entities: Entity[];
  embedding: number[];
  embeddingModel: string;
  trendScore: number;
  trendScoreFactors: TrendScoreFactors;
  aiSummary: string;
  aiSentiment: string;
  status: ArticleStatus;
}

export interface ClusterDoc {
  id: string;
  representativeTitle: string;
  memberCount: number;
  firstSeenAt: string; // ISO8601
  lastUpdatedAt: string; // ISO8601
  topArticleId: string;
}
