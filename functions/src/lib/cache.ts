import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { CustomCategory } from "../config/taxonomy";
import { NormalizedArticle, TrendItem } from "../types/article";

const QUERY_FRESHNESS_MS = 15 * 60 * 1000; // 15 min, per brief's cost-control TTL
const QUERY_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days, storage cleanup only
const CLASSIFICATION_TTL_MS = 180 * 24 * 60 * 60 * 1000; // 180 days, storage cleanup only
const TRENDS_FRESHNESS_MS = 60 * 60 * 1000; // 60 min
const TRENDS_TTL_MS = 24 * 60 * 60 * 1000; // 24h, storage cleanup only

function db() {
  return getFirestore();
}

// --- Per-query news result cache ---------------------------------------

interface QueryCacheDoc {
  articles: NormalizedArticle[];
  fetchedAt: Timestamp;
}

export async function getCachedQuery(queryHash: string): Promise<NormalizedArticle[] | null> {
  const snap = await db().collection("newsQueryCache").doc(queryHash).get();
  if (!snap.exists) return null;
  const data = snap.data() as QueryCacheDoc;
  const age = Date.now() - data.fetchedAt.toMillis();
  if (age > QUERY_FRESHNESS_MS) return null;
  return data.articles;
}

export async function setCachedQuery(queryHash: string, articles: NormalizedArticle[]): Promise<void> {
  const now = Timestamp.now();
  await db()
    .collection("newsQueryCache")
    .doc(queryHash)
    .set({
      articles,
      fetchedAt: now,
      ttlAt: Timestamp.fromMillis(now.toMillis() + QUERY_TTL_MS),
    });
}

// --- Per-article classification cache (classify once, reuse forever) ---

interface ClassificationCacheDoc {
  customCategory: CustomCategory;
  model: string;
}

export async function getCachedClassification(articleHash: string): Promise<ClassificationCacheDoc | null> {
  const snap = await db().collection("articleClassifications").doc(articleHash).get();
  if (!snap.exists) return null;
  return snap.data() as ClassificationCacheDoc;
}

export async function setCachedClassification(
  articleHash: string,
  data: { url?: string; title: string; summary: string; customCategory: CustomCategory; model: string }
): Promise<void> {
  const now = Timestamp.now();
  await db()
    .collection("articleClassifications")
    .doc(articleHash)
    .set({
      ...data,
      classifiedAt: now,
      ttlAt: Timestamp.fromMillis(now.toMillis() + CLASSIFICATION_TTL_MS),
    });
}

// --- Trends cache --------------------------------------------------------

interface TrendsCacheDoc {
  trends: TrendItem[];
  fetchedAt: Timestamp;
}

export async function getCachedTrends(country: string): Promise<TrendItem[] | null> {
  const snap = await db().collection("trendsCache").doc(country).get();
  if (!snap.exists) return null;
  const data = snap.data() as TrendsCacheDoc;
  const age = Date.now() - data.fetchedAt.toMillis();
  if (age > TRENDS_FRESHNESS_MS) return null;
  return data.trends;
}

export async function getStaleTrends(country: string): Promise<TrendItem[] | null> {
  const snap = await db().collection("trendsCache").doc(country).get();
  if (!snap.exists) return null;
  return (snap.data() as TrendsCacheDoc).trends;
}

export async function setCachedTrends(country: string, trends: TrendItem[]): Promise<void> {
  const now = Timestamp.now();
  await db()
    .collection("trendsCache")
    .doc(country)
    .set({
      country,
      trends,
      fetchedAt: now,
      ttlAt: Timestamp.fromMillis(now.toMillis() + TRENDS_TTL_MS),
    });
}
