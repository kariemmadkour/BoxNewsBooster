import { createHash } from "crypto";

// Strips common tracking params and normalizes host casing so the same
// article reached via different query strings still hashes identically.
const TRACKING_PARAM_PREFIXES = ["utm_", "ref", "fbclid", "gclid", "icid"];

export function canonicalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    url.hostname = url.hostname.toLowerCase();
    const paramsToDelete: string[] = [];
    url.searchParams.forEach((_, key) => {
      const lowerKey = key.toLowerCase();
      if (TRACKING_PARAM_PREFIXES.some((p) => lowerKey.startsWith(p))) {
        paramsToDelete.push(key);
      }
    });
    paramsToDelete.forEach((key) => url.searchParams.delete(key));
    url.hash = "";
    return url.toString();
  } catch {
    return rawUrl;
  }
}

export function hashUrl(rawUrl: string): string {
  return createHash("sha256").update(canonicalizeUrl(rawUrl)).digest("hex");
}

export function hashText(text: string): string {
  return createHash("sha256").update(text.trim().toLowerCase()).digest("hex");
}

export function hashQuery(params: Record<string, string | number | undefined>): string {
  const sorted = Object.keys(params)
    .sort()
    .reduce<Record<string, string | number>>((acc, key) => {
      const value = params[key];
      if (value !== undefined) acc[key] = value;
      return acc;
    }, {});
  return createHash("sha256").update(JSON.stringify(sorted)).digest("hex");
}
