import { ANTHROPIC_API_KEY } from "../config/secrets";
import { NativeCategory } from "../config/categories";
import { classifyArticleInternal } from "./classify";
import { getCachedClassification, getCachedQuery, setCachedClassification, setCachedQuery } from "./cache";
import { getProvider } from "../providers";
import { NewsProviderName, NormalizedArticle } from "../types/article";
import { mapWithConcurrency } from "../utils/concurrency";
import { hashQuery, hashUrl } from "../utils/hash";

const CLASSIFY_CONCURRENCY = 4;

export interface FetchAndClassifyParams {
  provider: NewsProviderName;
  country: string;
  category: NativeCategory;
  keyword: string | null;
  page: number;
  pageSize: number;
  apiKey: string;
}

export interface FetchAndClassifyResult {
  articles: NormalizedArticle[];
  cached: boolean;
}

// Cache-check -> provider fetch -> per-article classify-or-reuse -> cache
// write. Extracted from fetchNews.ts so fetchNews.ts (single provider) and
// fetchAllNews.ts (every provider in parallel) share this logic instead of
// each reimplementing it -- this is the literal "reuse existing caching,
// same as fetchNews already does" requirement.
export async function fetchAndClassifyForProvider(params: FetchAndClassifyParams): Promise<FetchAndClassifyResult> {
  const { provider, country, category, keyword, page, pageSize, apiKey } = params;

  const queryHash = hashQuery({ provider, country, category, keyword: keyword ?? "", page });

  const cached = await getCachedQuery(queryHash);
  if (cached) {
    return { articles: cached, cached: true };
  }

  const providerImpl = getProvider(provider);
  const rawArticles = await providerImpl.fetch({ country, category, keyword, page, pageSize, apiKey });

  const articles: NormalizedArticle[] = await mapWithConcurrency(
    rawArticles,
    CLASSIFY_CONCURRENCY,
    async (raw) => {
      const articleHash = hashUrl(raw.url);
      const existing = await getCachedClassification(articleHash);
      if (existing) {
        return { ...raw, id: articleHash, provider, customCategory: existing.customCategory };
      }

      const { category: label, model } = await classifyArticleInternal(
        raw.title,
        raw.description ?? "",
        ANTHROPIC_API_KEY.value()
      );
      await setCachedClassification(articleHash, {
        url: raw.url,
        title: raw.title,
        summary: raw.description ?? "",
        customCategory: label,
        model,
      });

      return { ...raw, id: articleHash, provider, customCategory: label };
    }
  );

  await setCachedQuery(queryHash, articles);

  return { articles, cached: false };
}
