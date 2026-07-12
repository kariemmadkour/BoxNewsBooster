import { logger } from "firebase-functions/v2";
import { HttpsError } from "firebase-functions/v2/https";
import { NEWS_API_KEY } from "../config/secrets";
import { getEnabledSourcesByConnector } from "../lib/sourceRegistry";
import { ConnectorHealth, IConnector, NormalizedItem } from "../shared/connector";
import { isMinimallyValid } from "../shared/normalize";
import { hashUrl } from "../utils/hash";
import { mapWithConcurrency } from "../utils/concurrency";

const BASE_URL = "https://newsapi.org/v2";
const FETCH_CONCURRENCY = 4;

interface NewsApiOrgArticle {
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: { name: string };
}

interface NewsApiOrgResponse {
  status: string;
  articles?: NewsApiOrgArticle[];
  message?: string;
  totalResults?: number;
}

interface RawNewsApiItem {
  article: NewsApiOrgArticle;
  country: string;
  category: string;
}

export const newsapiConnector: IConnector = {
  id: "newsapi",

  async fetch(): Promise<unknown[]> {
    const sources = await getEnabledSourcesByConnector("newsapi");
    const apiKey = NEWS_API_KEY.value();

    const perSourceResults = await mapWithConcurrency(sources, FETCH_CONCURRENCY, async (source) => {
      const country = source.country ?? "us";
      const category = source.category ?? "general";
      const url = new URL(`${BASE_URL}/top-headlines`);
      url.searchParams.set("country", country);
      url.searchParams.set("category", category);
      url.searchParams.set("pageSize", "10");

      const response = await fetch(url.toString(), { headers: { "X-Api-Key": apiKey } });
      const data = (await response.json()) as NewsApiOrgResponse;

      if (!response.ok || data.status !== "ok") {
        logger.warn("newsapiConnector fetch failed", { sourceId: source.id, country, category, errorDetail: data.message });
        return [];
      }

      return (data.articles ?? []).map((article): RawNewsApiItem => ({ article, country, category }));
    });

    return perSourceResults.flat();
  },

  normalize(raw: unknown[]): NormalizedItem[] {
    return (raw as RawNewsApiItem[]).map(({ article, country, category }) => ({
      id: hashUrl(article.url),
      title: article.title,
      summary: article.description ?? undefined,
      url: article.url,
      publishedAt: article.publishedAt,
      publisher: article.source?.name ?? "Unknown",
      country,
      language: "en",
      category,
      image: article.urlToImage ?? undefined,
      sourceType: "news",
    }));
  },

  validate(item: NormalizedItem): boolean {
    return isMinimallyValid(item);
  },

  async healthCheck(): Promise<ConnectorHealth> {
    try {
      const url = new URL(`${BASE_URL}/top-headlines`);
      url.searchParams.set("country", "us");
      url.searchParams.set("category", "general");
      url.searchParams.set("pageSize", "1");
      const response = await fetch(url.toString(), { headers: { "X-Api-Key": NEWS_API_KEY.value() } });
      const data = (await response.json()) as NewsApiOrgResponse;
      if (!response.ok || data.status !== "ok") {
        return { healthy: false, message: data.message ?? `HTTP ${response.status}` };
      }
      return { healthy: true };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      return { healthy: false, message: error instanceof Error ? error.message : String(error) };
    }
  },
};
