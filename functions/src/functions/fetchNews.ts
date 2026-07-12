import { onCall } from "firebase-functions/v2/https";
import { ANTHROPIC_API_KEY, GNEWS_API_KEY, NEWS_API_KEY } from "../config/secrets";
import { classifyArticleInternal } from "../lib/classify";
import { getCachedClassification, getCachedQuery, setCachedClassification, setCachedQuery } from "../lib/cache";
import { getProvider } from "../providers";
import { NormalizedArticle } from "../types/article";
import { mapWithConcurrency } from "../utils/concurrency";
import { hashQuery, hashUrl } from "../utils/hash";
import { validateFetchNewsInput } from "../utils/validation";

const CLASSIFY_CONCURRENCY = 4;

export const fetchNews = onCall(
  {
    region: "us-central1",
    secrets: [NEWS_API_KEY, GNEWS_API_KEY, ANTHROPIC_API_KEY],
    maxInstances: 10,
    // TEMP: enforceAppCheck disabled -- App Check isn't reliably issuing
    // valid tokens yet (reCAPTCHA site key/domain setup needs debugging),
    // and enforcing it broke this previously-working callable. Re-enable
    // once App Check is verified working end-to-end.
  },
  async (request) => {
    const input = validateFetchNewsInput(request.data);
    const queryHash = hashQuery({
      provider: input.provider,
      country: input.country,
      category: input.category,
      keyword: input.keyword ?? "",
      page: input.page,
    });

    const cached = await getCachedQuery(queryHash);
    if (cached) {
      return { articles: cached, provider: input.provider, cached: true };
    }

    const provider = getProvider(input.provider);
    const apiKey = input.provider === "gnews" ? GNEWS_API_KEY.value() : NEWS_API_KEY.value();

    const rawArticles = await provider.fetch({
      country: input.country,
      category: input.category,
      keyword: input.keyword,
      page: input.page,
      pageSize: input.pageSize,
      apiKey,
    });

    const articles: NormalizedArticle[] = await mapWithConcurrency(
      rawArticles,
      CLASSIFY_CONCURRENCY,
      async (raw) => {
        const articleHash = hashUrl(raw.url);
        const existing = await getCachedClassification(articleHash);
        if (existing) {
          return {
            ...raw,
            id: articleHash,
            provider: input.provider,
            customCategory: existing.customCategory,
          };
        }

        const { category, model } = await classifyArticleInternal(
          raw.title,
          raw.description ?? "",
          ANTHROPIC_API_KEY.value()
        );
        await setCachedClassification(articleHash, {
          url: raw.url,
          title: raw.title,
          summary: raw.description ?? "",
          customCategory: category,
          model,
        });

        return { ...raw, id: articleHash, provider: input.provider, customCategory: category };
      }
    );

    await setCachedQuery(queryHash, articles);

    return { articles, provider: input.provider, cached: false };
  }
);
