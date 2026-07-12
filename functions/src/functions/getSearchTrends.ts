import { onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { getCachedTrends, getStaleTrends, setCachedTrends } from "../lib/cache";
import { fetchSearchTrends } from "../lib/trends";
import { validateTrendsInput } from "../utils/validation";

// "Search Trends by Country" -- Google Trends is the one legitimate
// cross-platform-adjacent signal available without a licensed
// social-listening vendor (no official TikTok/Instagram/Facebook trending
// API exists at any accessible tier). The frontend must label this as
// Google Search trend data, never as native TikTok/IG/FB trending.
export const getSearchTrends = onCall(
  {
    region: "us-central1",
    maxInstances: 10,
    enforceAppCheck: true,
  },
  async (request) => {
    const { country } = validateTrendsInput(request.data);

    const cached = await getCachedTrends(country);
    if (cached) {
      return { country, trends: cached, cached: true };
    }

    try {
      const trends = await fetchSearchTrends(country);
      await setCachedTrends(country, trends);
      return { country, trends, cached: false };
    } catch (error) {
      logger.error("getSearchTrends: live fetch failed, trying stale cache", { country, error });
      const stale = await getStaleTrends(country);
      if (stale) {
        return { country, trends: stale, cached: true, stale: true };
      }
      throw error;
    }
  }
);
