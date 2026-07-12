import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { logger } from "firebase-functions/v2";
import { RAW_ARTICLES_TOPIC } from "../lib/pubsubPublisher";
import { NormalizedItem } from "../shared/connector";
import { computeDedupHashKey, findExactDuplicate, findOrCreateCluster } from "../services/dedup";
import { extractEntitiesAndKeywords } from "../lib/geminiExtract";
import { summarizeArticle } from "../lib/geminiSummarize";
import { getEmbedding } from "../lib/vertexEmbeddings";
import { computeTrendScore } from "../intelligence/trendScore";
import { getCluster, getClusterMembers, nowISO, upsertArticle, upsertCluster } from "../lib/articleStore";
import { ArticleDoc } from "../intelligence/types";

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

// Consumes raw-articles (published by every connector's Cloud Task, see
// lib/pubsubPublisher.ts). One handler, all stages sequential -- see the
// Phase 3 plan for why this isn't a per-stage Pub/Sub chain at current
// volume. retry: true since there's no Cloud Tasks queue in front of this
// (Pub/Sub's own bounded redelivery is the retry mechanism here).
export const onRawArticlePublished = onMessagePublished(
  { topic: RAW_ARTICLES_TOPIC, region: "us-central1", retry: true, maxInstances: 10 },
  async (event) => {
    const item = event.data.message.json as NormalizedItem;

    // 1. Exact-dup check -- cheap, no LLM cost, short-circuits early.
    const existing = await findExactDuplicate(item);
    if (existing) {
      logger.info("onRawArticlePublished: exact duplicate, skipping", { id: item.id, existingId: existing.id });
      return;
    }

    // 2. Gemini extraction + Vertex embedding in parallel.
    const [extraction, embeddingResult] = await Promise.all([
      extractEntitiesAndKeywords(item.title, item.summary ?? ""),
      getEmbedding(`${item.title}\n${item.summary ?? ""}`),
    ]);

    // 3. Near-dup / clustering check -- only possible once we have an embedding.
    let clusterId: string | null = null;
    if (embeddingResult) {
      const assignment = await findOrCreateCluster(item, embeddingResult.embedding);
      clusterId = assignment.clusterId;
    }

    // 4. Gather cluster stats for TrendScore.
    let clusterMemberCountLast6h = 0;
    let distinctPublishersInCluster = 1;
    let clusterMemberCount = 1;
    if (clusterId) {
      const members = await getClusterMembers(clusterId);
      const now = Date.now();
      clusterMemberCountLast6h = members.filter((m) => now - Date.parse(m.ingestedAt) <= SIX_HOURS_MS).length;
      distinctPublishersInCluster = new Set(members.map((m) => m.publisher)).size;
      clusterMemberCount = members.length;
    }

    // 5. TrendScore -- pure function, no I/O. SearchInterest/SocialSignals
    // are omitted (undefined) since Google Trends is broken and Twitter is
    // disabled -- computeTrendScore defaults both to a neutral 1.0.
    const { compositeScore, factors } = computeTrendScore({
      sourceType: item.sourceType,
      publishedAtISO: item.publishedAt,
      nowISO: nowISO(),
      clusterMemberCountLast6h,
      distinctPublishersInCluster,
      clusterMemberCount,
      extractionSucceeded: extraction.succeeded,
    });

    // 6. Summarization.
    const summarization = await summarizeArticle(item.title, item.summary ?? "");

    // 7. Single Firestore write.
    const doc: ArticleDoc = {
      ...item,
      ingestedAt: nowISO(),
      dedupHashKey: computeDedupHashKey(item),
      clusterId,
      extractedTags: extraction.keywords,
      entities: extraction.entities,
      embedding: embeddingResult?.embedding ?? [],
      embeddingModel: embeddingResult?.model ?? "",
      trendScore: compositeScore,
      trendScoreFactors: factors,
      aiSummary: summarization.summary,
      aiSentiment: summarization.sentiment,
      status: "complete",
    };
    await upsertArticle(item.id, doc);

    // 8. Update cluster aggregates now that this article is included.
    if (clusterId) {
      const cluster = await getCluster(clusterId);
      const members = await getClusterMembers(clusterId);
      const topArticle = members.reduce((top, m) => (m.trendScore > (top?.trendScore ?? -1) ? m : top), doc);
      await upsertCluster(clusterId, {
        representativeTitle: cluster?.representativeTitle ?? doc.title,
        memberCount: members.length,
        firstSeenAt: cluster?.firstSeenAt ?? doc.publishedAt,
        lastUpdatedAt: nowISO(),
        topArticleId: topArticle.id,
      });
    }

    logger.info("onRawArticlePublished: processed", { id: item.id, clusterId, trendScore: compositeScore });
  }
);
