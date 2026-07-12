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
