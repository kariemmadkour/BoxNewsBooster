import { onCall } from "firebase-functions/v2/https";
import { getRecentArticlesForTrending } from "../lib/articleStore";

const DEFAULT_WINDOW_HOURS = 48;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

interface GetTrendingInput {
  windowHours?: number;
  limit?: number;
}

// Top-N articles by trendScore within a recency window. Fetch-and-sort in
// application code rather than an orderBy query -- see docs/database-schema.md
// and lib/articleStore.ts#getRecentArticlesForTrending for why.
export const getTrending = onCall(
  // TEMP: enforceAppCheck disabled -- see fetchNews.ts for why.
  { region: "us-central1", maxInstances: 10 },
  async (request) => {
    const input = (request.data ?? {}) as GetTrendingInput;
    const windowHours = Math.min(Math.max(input.windowHours ?? DEFAULT_WINDOW_HOURS, 1), 24 * 7);
    const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);

    const sinceISO = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();
    const articles = await getRecentArticlesForTrending(sinceISO, limit);

    return { articles, windowHours };
  }
);
