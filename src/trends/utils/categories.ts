// Keep in sync with functions/src/config/categories.ts.
export const NATIVE_CATEGORIES = [
  "business",
  "entertainment",
  "general",
  "health",
  "science",
  "sports",
  "technology",
] as const;

export type NativeCategory = (typeof NATIVE_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<NativeCategory, string> = {
  business: "Business",
  entertainment: "Entertainment",
  general: "General",
  health: "Health",
  science: "Science",
  sports: "Sports",
  technology: "Technology",
};
