import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { ArticleDoc, ClusterDoc } from "../intelligence/types";

function db() {
  return getFirestore();
}

export async function getArticleByDedupKey(dedupHashKey: string): Promise<ArticleDoc | null> {
  const snap = await db().collection("articles").where("dedupHashKey", "==", dedupHashKey).limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0].data() as ArticleDoc;
}

export async function getArticle(id: string): Promise<ArticleDoc | null> {
  const snap = await db().collection("articles").doc(id).get();
  return snap.exists ? (snap.data() as ArticleDoc) : null;
}

export async function upsertArticle(id: string, data: ArticleDoc): Promise<void> {
  await db().collection("articles").doc(id).set(data, { merge: true });
}

// Candidate window for near-duplicate detection: same category, recent
// publishedAt range. See docs/database-schema.md's composite index note.
export async function getDedupCandidates(category: string | undefined, sinceISO: string): Promise<ArticleDoc[]> {
  if (!category) return [];
  const snap = await db()
    .collection("articles")
    .where("category", "==", category)
    .where("publishedAt", ">=", sinceISO)
    .get();
  return snap.docs.map((d) => d.data() as ArticleDoc);
}

export async function getClusterMembers(clusterId: string): Promise<ArticleDoc[]> {
  const snap = await db()
    .collection("articles")
    .where("clusterId", "==", clusterId)
    .orderBy("publishedAt", "desc")
    .get();
  return snap.docs.map((d) => d.data() as ArticleDoc);
}

export async function getCluster(clusterId: string): Promise<ClusterDoc | null> {
  const snap = await db().collection("clusters").doc(clusterId).get();
  return snap.exists ? (snap.data() as ClusterDoc) : null;
}

export async function upsertCluster(clusterId: string, data: Partial<ClusterDoc>): Promise<void> {
  await db()
    .collection("clusters")
    .doc(clusterId)
    .set({ ...data, id: clusterId }, { merge: true });
}

// Top-N by trendScore in a recency window. Deliberately fetch-and-sort in
// application code rather than an orderBy query -- Firestore requires any
// orderBy to start with the same field as a range filter, and at our
// volume (a day's worth of articles), this is simpler and correct. See
// the Phase 3 plan's schema section.
export async function getRecentArticlesForTrending(sinceISO: string, limit: number): Promise<ArticleDoc[]> {
  const snap = await db().collection("articles").where("publishedAt", ">=", sinceISO).get();
  const articles = snap.docs.map((d) => d.data() as ArticleDoc);
  return articles.sort((a, b) => b.trendScore - a.trendScore).slice(0, limit);
}

export function nowISO(): string {
  return Timestamp.now().toDate().toISOString();
}
