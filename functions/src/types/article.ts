import type { CustomCategory } from "../config/taxonomy";

export type NewsProviderName = "newsapi" | "gnews";

export interface RawProviderArticle {
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  sourceName: string;
  publishedAt: string; // ISO 8601
}

export interface NormalizedArticle extends RawProviderArticle {
  id: string; // sha256(canonicalUrl)
  provider: NewsProviderName;
  customCategory: CustomCategory;
}

export interface TrendItem {
  query: string;
  formattedTraffic?: string;
  relatedQueries?: string[];
}
