// Frontend-local mirror of functions/src/types/article.ts -- duplicated
// intentionally, no shared package for 2 small files at this repo size.
// Keep in sync.

export type NewsProviderName = "newsapi" | "gnews";

export interface NormalizedArticle {
  id: string;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  sourceName: string;
  publishedAt: string;
  provider: NewsProviderName;
  customCategory: string;
}

export interface TrendItem {
  query: string;
  formattedTraffic?: string;
  relatedQueries?: string[];
}

export interface FetchNewsParams {
  country: string;
  category: string;
  keyword: string;
  page: number;
  provider: NewsProviderName;
}

export interface FetchNewsResult {
  articles: NormalizedArticle[];
  provider: NewsProviderName;
  cached: boolean;
}

export interface SearchTrendsResult {
  country: string;
  trends: TrendItem[];
  cached: boolean;
  stale?: boolean;
}

// Phase 3: AI intelligence engine -- mirrors functions/src/intelligence/types.ts.
export interface TrendScoreFactors {
  velocity: number;
  freshness: number;
  sourceAuthority: number;
  searchInterest: number;
  socialSignals: number;
  publisherDiversity: number;
  aiConfidence: number;
}

export interface Entity {
  name: string;
  type: string;
}

export interface IntelligenceArticle {
  id: string;
  title: string;
  summary?: string;
  url: string;
  publishedAt: string;
  author?: string;
  publisher: string;
  country: string;
  language: string;
  category?: string;
  image?: string;
  sourceType: string;
  clusterId: string | null;
  extractedTags: string[];
  entities: Entity[];
  trendScore: number;
  trendScoreFactors: TrendScoreFactors;
  aiSummary: string;
  aiSentiment: string;
}

export interface ClusterInfo {
  id: string;
  representativeTitle: string;
  memberCount: number;
  firstSeenAt: string;
  lastUpdatedAt: string;
  topArticleId: string;
}

export interface GetTrendingParams {
  windowHours?: number;
  limit?: number;
}

export interface GetTrendingResult {
  articles: IntelligenceArticle[];
  windowHours: number;
}

export interface GetClusterDetailResult {
  cluster: ClusterInfo;
  articles: IntelligenceArticle[];
}

// Mirrors functions/src/functions/fetchAllNews.ts. AllProviderName is the
// literal, exhaustive list of keys in functions/src/providers/index.ts's
// PROVIDERS map (newsapi, gnews, googlenewsrss) -- keep in sync with that
// file, not just with NewsProviderName above (which only covers the two
// providers usable without a keyword from /trends's UI).
export type AllProviderName = "newsapi" | "gnews" | "googlenewsrss";

export type ProviderCallStatus = "success" | "empty" | "error" | "skipped";

export interface MergedArticle {
  id: string;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  sourceName: string;
  publishedAt: string;
  provider: AllProviderName;
  customCategory: string;
  country: string;
  category: string;
}

export interface ProviderResult {
  provider: AllProviderName;
  status: ProviderCallStatus;
  articleCount: number;
  cached: boolean;
  error?: string;
  skipReason?: string;
  // This provider's own articles, before cross-provider dedup -- see
  // functions/src/functions/fetchAllNews.ts for why this must be separate
  // from the top-level merged `articles` list.
  articles: MergedArticle[];
}

export interface FetchAllNewsParams {
  country?: string;
  category?: string;
  keyword?: string;
}

export interface FetchAllNewsResult {
  articles: MergedArticle[];
  providerResults: ProviderResult[];
}
