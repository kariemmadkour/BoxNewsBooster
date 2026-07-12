import { onRequest } from "firebase-functions/v2/https";
import { extractEntitiesAndKeywords } from "../lib/geminiExtract";
import { summarizeArticle } from "../lib/geminiSummarize";
import { getEmbedding } from "../lib/vertexEmbeddings";
import { requireRole } from "../lib/authz";

// Admin diagnostic endpoint -- runs a title/summary through all three
// Gemini/Vertex AI calls (extraction, summarization, embedding) and
// returns the raw results. Useful for manually validating the Tier 3
// integrations against real input (and for ongoing debugging), same
// rationale as healthCheckHttp. Gated since these calls cost real money.
export const testGenaiHttp = onRequest({ region: "us-central1" }, async (req, res) => {
  const authz = await requireRole(req, res, ["admin", "editor"]);
  if (!authz) return;

  const title = (req.query.title as string) || "Apple sues OpenAI, alleging the AI company stole trade secrets";
  const summary =
    (req.query.summary as string) ||
    "The blockbuster allegations set up a major legal battle between two tech heavyweights, with Apple claiming former employees took proprietary AI research to OpenAI.";

  try {
    const [extraction, summarization, embeddingResult] = await Promise.all([
      extractEntitiesAndKeywords(title, summary),
      summarizeArticle(title, summary),
      getEmbedding(`${title}\n${summary}`),
    ]);

    res.status(200).json({
      input: { title, summary },
      extraction,
      summarization,
      embedding: embeddingResult
        ? { model: embeddingResult.model, dimensions: embeddingResult.embedding.length, sample: embeddingResult.embedding.slice(0, 5) }
        : null,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});
