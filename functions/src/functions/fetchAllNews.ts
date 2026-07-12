import { onCall } from "firebase-functions/v2/https";
import { ANTHROPIC_API_KEY, GNEWS_API_KEY, NEWS_API_KEY } from "../config/secrets";
import { fetchAndClassifyForProvider } from "../lib/newsFetchOrchestrator";
import { validateFetchAllNewsInput } from "../utils/validation";
import { NewsProviderName } from "../types/article";

// Literal, exhaustive mirror of the keys in providers/index.ts's PROVIDERS
// map (newsapi, gnews, googlenewsrss). Kept as an explicit list rather than
// derived at runtime so this file and providers/index.ts can be diffed
// against each other directly. The dashboard's per-provider tabs are
// generated from providerResults below (not a separate hardcoded list), so
// adding a key here is the *only* place that needs to change for a new
// provider to automatically get a tab.
const ALL_PROVIDER_NAMES: NewsProviderName[] = ["newsapi", "gnews", "googlenewsrss"];

// Providers whose real implementation only makes sense against a
// caller-supplied keyword (googlenewsrss's provider entry is a stub that
// throws "not implemented yet" regardless -- see providers/googleNewsRssProvider.ts
// -- but the skip-without-keyword rule is independent of that and would
// apply the moment a real implementation lands there too).
const KEYWORD_REQUIRED_PROVIDERS: NewsProviderName[] = ["googlenewsrss"];

export type ProviderCallStatus = "success" | "empty" | "error" | "skipped";

export interface MergedArticle {
  id: string;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  sourceName: string;
  publishedAt: string;
  provider: NewsProviderName;
  customCategory: string;
  country: string;
  category: string;
}

export interface ProviderResult {
  provider: NewsProviderName;
  status: ProviderCallStatus;
  articleCount: number;
  cached: boolean;
  error?: string;
  skipReason?: string;
  // This provider's own articles, before cross-provider dedup -- NOT the
  // same list as the top-level `articles` field (which is merged and
  // deduped across all providers). Per-provider consumers (e.g. dashboard
  // tabs) must read from here to see what this provider actually
  // returned, unaffected by another provider having returned the same URL.
  articles: MergedArticle[];
}

function apiKeyFor(provider: NewsProviderName): string {
  switch (provider) {
    case "gnews":
      return GNEWS_API_KEY.value();
    case "newsapi":
      return NEWS_API_KEY.value();
    case "googlenewsrss":
      // No key needed -- and the current stub doesn't use one anyway.
      return "";
  }
}

export const fetchAllNews = onCall(
  {
    region: "us-central1",
    secrets: [NEWS_API_KEY, GNEWS_API_KEY, ANTHROPIC_API_KEY],
    maxInstances: 10,
  },
  async (request) => {
    const input = validateFetchAllNewsInput(request.data);

    // Every provider in ALL_PROVIDER_NAMES gets an entry in the output --
    // called, skipped, empty, or errored -- never silently omitted.
    const providerResults: ProviderResult[] = await Promise.all(
      ALL_PROVIDER_NAMES.map(async (provider): Promise<ProviderResult> => {
        if (KEYWORD_REQUIRED_PROVIDERS.includes(provider) && !input.keyword) {
          return {
            provider,
            status: "skipped",
            articleCount: 0,
            cached: false,
            skipReason: "requires a keyword, none was supplied",
            articles: [],
          };
        }

        try {
          const { articles, cached } = await fetchAndClassifyForProvider({
            provider,
            country: input.country,
            category: input.category,
            keyword: input.keyword,
            page: 1,
            pageSize: 10,
            apiKey: apiKeyFor(provider),
          });

          const tagged: MergedArticle[] = articles.map((article) => ({
            ...article,
            country: input.country,
            category: input.category,
          }));

          return {
            provider,
            status: tagged.length > 0 ? "success" : "empty",
            articleCount: tagged.length,
            cached,
            articles: tagged,
          };
        } catch (error) {
          return {
            provider,
            status: "error",
            articleCount: 0,
            cached: false,
            error: error instanceof Error ? error.message : String(error),
            articles: [],
          };
        }
      })
    );

    // Dedupe by article.id (== hashUrl(url)) across all providers' results,
    // keeping the first occurrence, for the merged "All sources" view.
    const merged = new Map<string, MergedArticle>();
    for (const { articles } of providerResults) {
      for (const article of articles) {
        if (!merged.has(article.id)) {
          merged.set(article.id, article);
        }
      }
    }

    return {
      articles: [...merged.values()],
      providerResults,
    };
  }
);
