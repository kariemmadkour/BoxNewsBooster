import { httpsCallable, FunctionsError } from "firebase/functions";
import { functions } from "../firebase";
import {
  FetchNewsParams,
  FetchNewsResult,
  SearchTrendsResult,
  GetTrendingParams,
  GetTrendingResult,
  GetClusterDetailResult,
  FetchAllNewsParams,
  FetchAllNewsResult,
} from "./types";

export class ClientApiError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

const FRIENDLY_MESSAGES: Record<string, string> = {
  "resource-exhausted": "This service is temporarily at capacity. Please try again in a moment.",
  unavailable: "The news provider is temporarily unavailable. Please try again shortly.",
  "invalid-argument": "That search couldn't be processed. Try a different keyword or filter.",
  internal: "Something went wrong loading this data. Please try again shortly.",
  unauthenticated: "Something went wrong loading this data. Please try again shortly.",
};

function normalizeError(error: unknown): ClientApiError {
  if (error instanceof FunctionsError) {
    return new ClientApiError(error.code, FRIENDLY_MESSAGES[error.code] ?? "Something went wrong. Please try again.");
  }
  return new ClientApiError("unknown", "Something went wrong. Please try again.");
}

const fetchNewsCallable = httpsCallable<FetchNewsParams, FetchNewsResult>(functions, "fetchNews");
const getSearchTrendsCallable = httpsCallable<{ country: string }, SearchTrendsResult>(
  functions,
  "getSearchTrends"
);

export async function callFetchNews(params: FetchNewsParams): Promise<FetchNewsResult> {
  try {
    const result = await fetchNewsCallable(params);
    return result.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function callGetSearchTrends(country: string): Promise<SearchTrendsResult> {
  try {
    const result = await getSearchTrendsCallable({ country });
    return result.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

const getTrendingCallable = httpsCallable<GetTrendingParams, GetTrendingResult>(functions, "getTrending");
const getClusterDetailCallable = httpsCallable<{ clusterId: string }, GetClusterDetailResult>(
  functions,
  "getClusterDetail"
);

export async function callGetTrending(params: GetTrendingParams = {}): Promise<GetTrendingResult> {
  try {
    const result = await getTrendingCallable(params);
    return result.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function callGetClusterDetail(clusterId: string): Promise<GetClusterDetailResult> {
  try {
    const result = await getClusterDetailCallable({ clusterId });
    return result.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

const fetchAllNewsCallable = httpsCallable<FetchAllNewsParams, FetchAllNewsResult>(functions, "fetchAllNews");

export async function callFetchAllNews(params: FetchAllNewsParams = {}): Promise<FetchAllNewsResult> {
  try {
    const result = await fetchAllNewsCallable(params);
    return result.data;
  } catch (error) {
    throw normalizeError(error);
  }
}
