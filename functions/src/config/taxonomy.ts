// Fixed custom classification taxonomy. News providers don't offer these
// categories natively -- classifyArticle assigns exactly one of these.
// Keep in sync with src/trends/utils/taxonomy.ts on the frontend.
export const CUSTOM_TAXONOMY = [
  "Crime",
  "Music",
  "Art",
  "Blogging",
  "Politics",
  "Technology",
  "Sports",
  "Business",
  "Health",
  "Science",
  "Entertainment",
  "Other",
] as const;

export type CustomCategory = (typeof CUSTOM_TAXONOMY)[number];

export function isCustomCategory(value: string): value is CustomCategory {
  return (CUSTOM_TAXONOMY as readonly string[]).includes(value);
}
