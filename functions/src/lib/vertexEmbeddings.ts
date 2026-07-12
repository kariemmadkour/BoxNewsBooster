import { logger } from "firebase-functions/v2";
import { EMBEDDING_DIMENSIONS, GEMINI_EMBEDDING_MODEL } from "../config/genai";
import { genai } from "./genaiClient";

export interface EmbeddingResult {
  embedding: number[];
  model: string;
}

// Never throws -- a failed embedding call degrades clustering (article
// falls back to "single article, un-clustered" scoring) rather than
// breaking the pipeline. Same pattern as classify.ts.
export async function getEmbedding(text: string): Promise<EmbeddingResult | null> {
  try {
    const response = await genai().models.embedContent({
      model: GEMINI_EMBEDDING_MODEL,
      contents: text,
      config: {
        outputDimensionality: EMBEDDING_DIMENSIONS,
        taskType: "RETRIEVAL_DOCUMENT",
      },
    });

    const values = response.embeddings?.[0]?.values;
    if (!values || values.length === 0) {
      logger.warn("getEmbedding: empty response", { textLength: text.length });
      return null;
    }

    return { embedding: values, model: GEMINI_EMBEDDING_MODEL };
  } catch (error) {
    logger.warn("getEmbedding failed", {
      errorDetail: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
