import { onCall } from "firebase-functions/v2/https";
import { ANTHROPIC_API_KEY, GNEWS_API_KEY, NEWS_API_KEY } from "../config/secrets";
import { fetchAndClassifyForProvider } from "../lib/newsFetchOrchestrator";
import { validateFetchAllNewsInput } from "../utils/validation";
import { NewsProviderName, NormalizedArticle } from "../types/article";

// Literal, exhaustive mirror of the keys in providers/index.ts's PROVIDERS
// map (newsapi, gnews, googlenewsrss). Kept as an explicit list rather than
// derived at runtime so this file, the debug panel, and providers/index.ts
// can all be diffed against each other directly. If a provider is ever
// added to or removed from providers/index.ts, update this list too.
const ALL_PROVIDER_NAMES: NewsProviderName[] = ["newsapi", "gnews", "googlenewsrss"];

// Providers whose real implementation only makes sense against a
// caller-supplied keyword (googlenewsrss's provider entry is a stub that
// throws "not implemented yet" regardless -- see providers/googleNewsRssProvider.ts
// -- but the skip-without-keyword rule is independent of that and would
// apply the moment a real implementation lands there too).
const KEYWORD_REQUIRED_PROVIDERS: NewsProviderName[] = ["googlenewsrss"];

export type ProviderCallStatus = "success" | "empty" | "error" | "skipped";

export interface ProviderResult {
  provider: NewsProviderName;
  status: ProviderCallStatus;
  articleCount: number;
  cached: boolean;
  error?: string;
  skipReason?: string;
}

export interface MergedArticle extends NormalizedArticle {
  country: string;
  category: string;
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
    const perProvider = await Promise.all(
      ALL_PROVIDER_NAMES.map(async (provider) => {
        if (KEYWORD_REQUIRED_PROVIDERS.includes(provider) && !input.keyword) {
          const result: ProviderResult = {
            provider,
            status: "skipped",
            articleCount: 0,
            cached: false,
            skipReason: "requires a keyword, none was supplied",
          };
          return { result, articles: [] as NormalizedArticle[] };
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

          const result: ProviderResult = {
            provider,
            status: articles.length > 0 ? "success" : "empty",
            articleCount: articles.length,
            cached,
          };
          return { result, articles };
        } catch (error) {
          const result: ProviderResult = {
            provider,
            status: "error",
            articleCount: 0,
            cached: false,
            error: error instanceof Error ? error.message : String(error),
          };
          return { result, articles: [] as NormalizedArticle[] };
        }
      })
    );

    const providerResults: ProviderResult[] = perProvider.map((p) => p.result);

    // Dedupe by article.id (== hashUrl(url)) across all providers' results,
    // keeping the first occurrence.
    const merged = new Map<string, MergedArticle>();
    for (const { articles } of perProvider) {
      for (const article of articles) {
        if (!merged.has(article.id)) {
          merged.set(article.id, { ...article, country: input.country, category: input.category });
        }
      }
    }

    return {
      articles: [...merged.values()],
      providerResults,
    };
  }
);
