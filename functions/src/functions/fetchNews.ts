import { onCall } from "firebase-functions/v2/https";
import { ANTHROPIC_API_KEY, GNEWS_API_KEY, NEWS_API_KEY } from "../config/secrets";
import { fetchAndClassifyForProvider } from "../lib/newsFetchOrchestrator";
import { validateFetchNewsInput } from "../utils/validation";

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
    const apiKey = input.provider === "gnews" ? GNEWS_API_KEY.value() : NEWS_API_KEY.value();

    const { articles, cached } = await fetchAndClassifyForProvider({
      provider: input.provider,
      country: input.country,
      category: input.category,
      keyword: input.keyword,
      page: input.page,
      pageSize: input.pageSize,
      apiKey,
    });

    return { articles, provider: input.provider, cached };
  }
);
