// Keep in sync with functions/src/config/taxonomy.ts.
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
