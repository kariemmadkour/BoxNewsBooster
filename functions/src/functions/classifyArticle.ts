import { onCall } from "firebase-functions/v2/https";
import { ANTHROPIC_API_KEY } from "../config/secrets";
import { classifyArticleInternal } from "../lib/classify";
import { getCachedClassification, setCachedClassification } from "../lib/cache";
import { hashText } from "../utils/hash";
import { validateClassifyInput } from "../utils/validation";

// Standalone callable for direct/admin/backfill use -- shares the same
// classify helper and cache as fetchNews's internal enrichment step, so an
// article classified via either path is never classified twice.
export const classifyArticle = onCall(
  {
    region: "us-central1",
    secrets: [ANTHROPIC_API_KEY],
    maxInstances: 10,
  },
  async (request) => {
    const { title, summary } = validateClassifyInput(request.data);
    const articleHash = hashText(`${title}|${summary}`);

    const existing = await getCachedClassification(articleHash);
    if (existing) {
      return { customCategory: existing.customCategory, model: existing.model, cached: true };
    }

    const { category, model } = await classifyArticleInternal(title, summary, ANTHROPIC_API_KEY.value());
    await setCachedClassification(articleHash, { title, summary, customCategory: category, model });

    return { customCategory: category, model, cached: false };
  }
);
