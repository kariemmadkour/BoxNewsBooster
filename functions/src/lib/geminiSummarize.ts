import { Type } from "@google/genai";
import { logger } from "firebase-functions/v2";
import { GEMINI_SUMMARIZATION_MODEL } from "../config/genai";
import { genai } from "./genaiClient";

export interface SummarizationResult {
  summary: string;
  sentiment: string;
  succeeded: boolean;
}

const SUMMARIZATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "A concise 2-3 sentence summary of the article." },
    sentiment: { type: Type.STRING, enum: ["positive", "neutral", "negative"], format: "enum" },
  },
  required: ["summary", "sentiment"],
};

// Never throws -- falls back to the connector-provided summary and
// "neutral" sentiment rather than breaking the pipeline.
export async function summarizeArticle(title: string, summary: string): Promise<SummarizationResult> {
  const fallbackSummary = summary || title;

  try {
    const response = await genai().models.generateContent({
      model: GEMINI_SUMMARIZATION_MODEL,
      contents: `Summarize this news article in 2-3 sentences and assess its overall sentiment.\n\nTitle: ${title}\nContent: ${summary || "(no content available, summarize from the title alone)"}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: SUMMARIZATION_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) {
      logger.warn("summarizeArticle: empty response");
      return { summary: fallbackSummary, sentiment: "neutral", succeeded: false };
    }

    const parsed = JSON.parse(text) as { summary?: string; sentiment?: string };
    return {
      summary: parsed.summary ?? fallbackSummary,
      sentiment: parsed.sentiment ?? "neutral",
      succeeded: true,
    };
  } catch (error) {
    logger.warn("summarizeArticle failed", {
      title,
      errorDetail: error instanceof Error ? error.message : String(error),
    });
    return { summary: fallbackSummary, sentiment: "neutral", succeeded: false };
  }
}
