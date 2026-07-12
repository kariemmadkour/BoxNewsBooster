import Anthropic from "@anthropic-ai/sdk";
import { logger } from "firebase-functions/v2";
import { CUSTOM_TAXONOMY, CustomCategory, isCustomCategory } from "../config/taxonomy";
import { getAnthropicModelId } from "./runtimeConfig";

const CLASSIFY_TOOL_NAME = "classify_article";

export interface ClassifyResult {
  category: CustomCategory;
  model: string;
}

// Shared by the classifyArticle callable and fetchNews's per-article
// enrichment step -- classification must never throw, since a bad/slow
// Anthropic call shouldn't break the news feed. Falls back to "Other".
export async function classifyArticleInternal(
  title: string,
  summary: string,
  apiKey: string
): Promise<ClassifyResult> {
  const model = await getAnthropicModelId();

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model,
      max_tokens: 64,
      tools: [
        {
          name: CLASSIFY_TOOL_NAME,
          description: "Classify a news article into exactly one category.",
          input_schema: {
            type: "object",
            properties: {
              category: {
                type: "string",
                enum: [...CUSTOM_TAXONOMY],
                description: "The single best-fitting category for this article.",
              },
            },
            required: ["category"],
          },
        },
      ],
      tool_choice: { type: "tool", name: CLASSIFY_TOOL_NAME },
      messages: [
        {
          role: "user",
          content: `Classify this news article into exactly one category.\n\nTitle: ${title}\nSummary: ${summary || "(no summary available)"}`,
        },
      ],
    });

    const toolUse = response.content.find((block) => block.type === "tool_use");
    const rawCategory =
      toolUse && toolUse.type === "tool_use" ? (toolUse.input as { category?: string }).category : undefined;

    const category = rawCategory && isCustomCategory(rawCategory) ? rawCategory : "Other";
    return { category, model };
  } catch (error) {
    logger.error("classifyArticleInternal failed, defaulting to Other", { error, title });
    return { category: "Other", model };
  }
}
