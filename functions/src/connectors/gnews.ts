import { logger } from "firebase-functions/v2";
import { GNEWS_API_KEY } from "../config/secrets";
import { getEnabledSourcesByConnector } from "../lib/sourceRegistry";
import { ConnectorHealth, IConnector, NormalizedItem } from "../shared/connector";
import { isMinimallyValid } from "../shared/normalize";
import { hashUrl } from "../utils/hash";
import { mapWithConcurrency } from "../utils/concurrency";

const BASE_URL = "https://gnews.io/api/v4";
const FETCH_CONCURRENCY = 4;

interface GNewsArticle {
  title: string;
  description: string | null;
  url: string;
  image: string | null;
  publishedAt: string;
  source: { name: string };
}

interface GNewsResponse {
  articles?: GNewsArticle[];
  errors?: string[];
}

interface RawGNewsItem {
  article: GNewsArticle;
  country: string;
  category: string;
}

export const gnewsConnector: IConnector = {
  id: "gnews",

  async fetch(): Promise<unknown[]> {
    const sources = await getEnabledSourcesByConnector("gnews");
    const apiKey = GNEWS_API_KEY.value();

    const perSourceResults = await mapWithConcurrency(sources, FETCH_CONCURRENCY, async (source) => {
      const country = source.country ?? "us";
      const category = source.category ?? "general";
      const url = new URL(`${BASE_URL}/top-headlines`);
      url.searchParams.set("category", category);
      url.searchParams.set("country", country);
      url.searchParams.set("lang", "en");
      url.searchParams.set("max", "10");
      url.searchParams.set("apikey", apiKey);

      const response = await fetch(url.toString());
      const data = (await response.json()) as GNewsResponse;

      if (!response.ok) {
        logger.warn("gnewsConnector fetch failed", { sourceId: source.id, country, category, errors: data.errors });
        return [];
      }

      return (data.articles ?? []).map((article): RawGNewsItem => ({ article, country, category }));
    });

    return perSourceResults.flat();
  },

  normalize(raw: unknown[]): NormalizedItem[] {
    return (raw as RawGNewsItem[]).map(({ article, country, category }) => ({
      id: hashUrl(article.url),
      title: article.title,
      summary: article.description ?? undefined,
      url: article.url,
      publishedAt: article.publishedAt,
      publisher: article.source?.name ?? "Unknown",
      country,
      language: "en",
      category,
      image: article.image ?? undefined,
      sourceType: "news",
    }));
  },

  validate(item: NormalizedItem): boolean {
    return isMinimallyValid(item);
  },

  async healthCheck(): Promise<ConnectorHealth> {
    try {
      const url = new URL(`${BASE_URL}/top-headlines`);
      url.searchParams.set("category", "general");
      url.searchParams.set("country", "us");
      url.searchParams.set("max", "1");
      url.searchParams.set("apikey", GNEWS_API_KEY.value());
      const response = await fetch(url.toString());
      const data = (await response.json()) as GNewsResponse;
      if (!response.ok) {
        return { healthy: false, message: data.errors?.join("; ") ?? `HTTP ${response.status}` };
      }
      return { healthy: true };
    } catch (error) {
      return { healthy: false, message: error instanceof Error ? error.message : String(error) };
    }
  },
};
