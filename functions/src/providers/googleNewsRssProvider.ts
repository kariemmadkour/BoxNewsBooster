import { HttpsError } from "firebase-functions/v2/https";
import { RawProviderArticle } from "../types/article";
import { FetchParams, NewsProvider } from "./newsProvider";

// Placeholder only -- real implementation lands in Phase 2 as
// connectors/googleNewsRssConnector.ts (see docs/connector-interface.md
// and docs/folder-structure.md). This stub exists solely so the
// NewsProviderName union (which already includes "googlenewsrss") and the
// existing fetchNews callable stay type-safe and deployable in the meantime.
export const googleNewsRssProvider: NewsProvider = {
  name: "googlenewsrss",

  async fetch(_params: FetchParams): Promise<RawProviderArticle[]> {
    throw new HttpsError(
      "unimplemented",
      "Google News RSS is not wired up yet -- see docs/connector-interface.md."
    );
  },
};
