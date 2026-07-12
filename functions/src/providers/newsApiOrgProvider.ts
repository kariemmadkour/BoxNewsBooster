import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { RawProviderArticle } from "../types/article";
import { FetchParams, NewsProvider } from "./newsProvider";

// NewsAPI.org's free "Developer" plan disallows production/commercial use --
// fine for building/demoing, confirm a paid plan before real client traffic.
const BASE_URL = "https://newsapi.org/v2";

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

export const newsApiOrgProvider: NewsProvider = {
  name: "newsapi",

  async fetch({ country, category, keyword, page, pageSize, apiKey }: FetchParams): Promise<RawProviderArticle[]> {
    const endpoint = keyword ? "everything" : "top-headlines";
    const url = new URL(`${BASE_URL}/${endpoint}`);

    if (keyword) {
      url.searchParams.set("q", keyword);
      url.searchParams.set("language", "en");
    } else {
      url.searchParams.set("country", country);
      url.searchParams.set("category", category);
    }
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", String(pageSize));

    const response = await fetch(url.toString(), {
      headers: { "X-Api-Key": apiKey },
    });

    const data = (await response.json()) as NewsApiOrgResponse;
    if (!response.ok || data.status !== "ok") {
      throw new HttpsError("unavailable", data.message ?? "NewsAPI.org request failed");
    }

    logger.info("newsApiOrgProvider response", {
      httpStatus: response.status,
      apiStatus: data.status,
      totalResults: data.totalResults,
      articlesReturned: data.articles?.length ?? 0,
      requestUrl: url.toString(),
      country,
      category,
      endpoint,
    });

    return (data.articles ?? []).map((a) => ({
      title: a.title,
      description: a.description,
      url: a.url,
      urlToImage: a.urlToImage,
      sourceName: a.source?.name ?? "Unknown",
      publishedAt: a.publishedAt,
    }));
  },
};
