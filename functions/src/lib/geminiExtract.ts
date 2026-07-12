import { Type } from "@google/genai";
import { logger } from "firebase-functions/v2";
import { GEMINI_EXTRACTION_MODEL } from "../config/genai";
import { Entity } from "../intelligence/types";
import { genai } from "./genaiClient";

export interface ExtractionResult {
  entities: Entity[];
  keywords: string[];
  succeeded: boolean;
}

const EXTRACTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    entities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          type: { type: Type.STRING, enum: ["person", "organization", "location", "event"], format: "enum" },
        },
        required: ["name", "type"],
      },
    },
    keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ["entities", "keywords"],
};

// Never throws -- a failed extraction leaves entities/keywords empty and
// drags AIConfidence down (see intelligence/trendScore.ts), it doesn't
// break the pipeline. Same "never throw, fall back" pattern as classify.ts.
export async function extractEntitiesAndKeywords(title: string, summary: string): Promise<ExtractionResult> {
  try {
    const response = await genai().models.generateContent({
      model: GEMINI_EXTRACTION_MODEL,
      contents: `Extract named entities (people, organizations, locations, events) and up to 8 topical keywords from this news article.\n\nTitle: ${title}\nSummary: ${summary || "(no summary available)"}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: EXTRACTION_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) {
      logger.warn("extractEntitiesAndKeywords: empty response");
      return { entities: [], keywords: [], succeeded: false };
    }

    const parsed = JSON.parse(text) as { entities?: Entity[]; keywords?: string[] };
    return {
      entities: parsed.entities ?? [],
      keywords: parsed.keywords ?? [],
      succeeded: true,
    };
  } catch (error) {
    logger.warn("extractEntitiesAndKeywords failed", {
      title,
      errorDetail: error instanceof Error ? error.message : String(error),
    });
    return { entities: [], keywords: [], succeeded: false };
  }
}
