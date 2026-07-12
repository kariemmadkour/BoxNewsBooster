import { HttpsError } from "firebase-functions/v2/https";
import { RawProviderArticle } from "../types/article";
import { FetchParams, NewsProvider } from "./newsProvider";

// GNews's category set is a superset of the 7 shared NATIVE_CATEGORIES
// (it also has e.g. "world", "nation") -- only the shared 7 are exposed in
// the unified UI selector; this is an intentional simplification.
const BASE_URL = "https://gnews.io/api/v4";

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

export const gnewsProvider: NewsProvider = {
  name: "gnews",

  async fetch({ country, category, keyword, page, pageSize, apiKey }: FetchParams): Promise<RawProviderArticle[]> {
    const endpoint = keyword ? "search" : "top-headlines";
    const url = new URL(`${BASE_URL}/${endpoint}`);

    if (keyword) {
      url.searchParams.set("q", keyword);
    } else {
      url.searchParams.set("category", category);
    }
    url.searchParams.set("country", country);
    url.searchParams.set("lang", "en");
    url.searchParams.set("page", String(page));
    url.searchParams.set("max", String(pageSize));
    url.searchParams.set("apikey", apiKey);

    const response = await fetch(url.toString());
    const data = (await response.json()) as GNewsResponse;

    if (!response.ok) {
      throw new HttpsError("unavailable", data.errors?.join("; ") ?? "GNews request failed");
    }

    return (data.articles ?? []).map((a) => ({
      title: a.title,
      description: a.description,
      url: a.url,
      urlToImage: a.image,
      sourceName: a.source?.name ?? "Unknown",
      publishedAt: a.publishedAt,
    }));
  },
};
