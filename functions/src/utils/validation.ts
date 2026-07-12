import { HttpsError } from "firebase-functions/v2/https";
import { isNativeCategory, NativeCategory } from "../config/categories";
import { ISO_COUNTRY_CODES } from "./countries";

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE = 10;
export const MAX_KEYWORD_LENGTH = 200;
export const MAX_CLASSIFY_TITLE_LENGTH = 300;
export const MAX_CLASSIFY_SUMMARY_LENGTH = 1000;

export interface ValidatedFetchNewsInput {
  country: string;
  category: NativeCategory;
  keyword: string | null;
  page: number;
  pageSize: number;
  provider: "newsapi" | "gnews";
}

export function validateFetchNewsInput(input: unknown): ValidatedFetchNewsInput {
  const data = (input ?? {}) as Record<string, unknown>;

  const country =
    typeof data.country === "string" && ISO_COUNTRY_CODES.includes(data.country.toLowerCase())
      ? data.country.toLowerCase()
      : "us";

  const category =
    typeof data.category === "string" && isNativeCategory(data.category)
      ? data.category
      : "general";

  let keyword: string | null = null;
  if (typeof data.keyword === "string") {
    const trimmed = data.keyword.trim();
    if (trimmed.length > 0) {
      if (trimmed.length > MAX_KEYWORD_LENGTH) {
        throw new HttpsError("invalid-argument", `keyword must be <= ${MAX_KEYWORD_LENGTH} chars`);
      }
      keyword = trimmed;
    }
  }

  const rawPage = typeof data.page === "number" ? Math.trunc(data.page) : 1;
  const page = Math.min(Math.max(rawPage, 1), MAX_PAGE);

  const provider = data.provider === "gnews" ? "gnews" : "newsapi";

  return { country, category, keyword, page, pageSize: DEFAULT_PAGE_SIZE, provider };
}

export interface ValidatedClassifyInput {
  title: string;
  summary: string;
}

export function validateClassifyInput(input: unknown): ValidatedClassifyInput {
  const data = (input ?? {}) as Record<string, unknown>;

  if (typeof data.title !== "string" || data.title.trim().length === 0) {
    throw new HttpsError("invalid-argument", "title is required");
  }

  const title = data.title.trim().slice(0, MAX_CLASSIFY_TITLE_LENGTH);
  const summary =
    typeof data.summary === "string" ? data.summary.trim().slice(0, MAX_CLASSIFY_SUMMARY_LENGTH) : "";

  return { title, summary };
}

export interface ValidatedTrendsInput {
  country: string;
}

export function validateTrendsInput(input: unknown): ValidatedTrendsInput {
  const data = (input ?? {}) as Record<string, unknown>;
  const country =
    typeof data.country === "string" && ISO_COUNTRY_CODES.includes(data.country.toLowerCase())
      ? data.country.toLowerCase()
      : "us";
  return { country };
}
