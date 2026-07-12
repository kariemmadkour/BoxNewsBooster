import { NormalizedItem } from "./connector";

// Shared minimum bar enforced centrally, before any connector-specific
// validate() runs -- an empty title/url/date is never acceptable from any
// source, regardless of that source's own quirks.
export function isMinimallyValid(item: Partial<NormalizedItem>): item is NormalizedItem {
  if (!item.title || item.title.trim().length === 0) return false;
  if (!item.url) return false;
  try {
    new URL(item.url);
  } catch {
    return false;
  }
  if (!item.publishedAt || Number.isNaN(Date.parse(item.publishedAt))) return false;
  return true;
}

export function truncate(text: string, maxLen: number): string {
  const trimmed = text.trim();
  return trimmed.length > maxLen ? `${trimmed.slice(0, maxLen - 1).trimEnd()}…` : trimmed;
}

export function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "").trim();
}
