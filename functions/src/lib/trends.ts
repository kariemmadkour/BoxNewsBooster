// @ts-expect-error -- google-trends-api ships no type declarations
import googleTrends from "google-trends-api";
import { logger } from "firebase-functions/v2";
import { TrendItem } from "../types/article";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Unofficial wrapper around Google Trends' internal endpoint (the Node
// equivalent of Python's pytrends) -- no auth, no official ToS coverage,
// prone to transient blocks. Retries briefly, then surfaces the error so
// the caller can fall back to serving stale cache rather than crash.
export async function fetchSearchTrends(countryCode: string): Promise<TrendItem[]> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const raw = await googleTrends.dailyTrends({ geo: countryCode.toUpperCase() });
      const parsed = JSON.parse(raw);
      const days = parsed?.default?.trendingSearchesDays ?? [];
      const searches = days[0]?.trendingSearches ?? [];

      return searches.map(
        (item: {
          title?: { query?: string };
          formattedTraffic?: string;
          relatedQueries?: { query?: string }[];
        }): TrendItem => ({
          query: item.title?.query ?? "",
          formattedTraffic: item.formattedTraffic,
          relatedQueries: item.relatedQueries?.map((q) => q.query ?? "").filter(Boolean),
        })
      );
    } catch (error) {
      lastError = error;
      // errorDetail/errorStack, not message/stack -- Firebase's structured
      // logger has its own top-level "message" field (the first arg here),
      // and a same-named field on the metadata object gets silently
      // shadowed in the printed JSON instead of showing the real error.
      const errorDetail = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.warn(`Google Trends fetch failed (attempt ${attempt + 1})`, { countryCode, errorDetail, errorStack });
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * (attempt + 1));
    }
  }

  throw lastError;
}
