// The 7 native categories shared by NewsAPI.org and GNews top-headlines.
// Keep in sync with src/trends/utils/categories.ts on the frontend.
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

export function isNativeCategory(value: string): value is NativeCategory {
  return (NATIVE_CATEGORIES as readonly string[]).includes(value);
}
