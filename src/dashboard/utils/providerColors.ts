// Keep in sync with the literal provider list in
// functions/src/functions/fetchAllNews.ts's ALL_PROVIDER_NAMES.
export const PROVIDER_LABELS: Record<string, string> = {
  newsapi: "NewsAPI.org",
  gnews: "GNews",
  googlenewsrss: "Google News RSS",
};

export const PROVIDER_COLORS: Record<string, string> = {
  newsapi: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  gnews: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  googlenewsrss: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
};

export function getProviderLabel(provider: string): string {
  return PROVIDER_LABELS[provider] ?? provider;
}

export function getProviderColor(provider: string): string {
  return PROVIDER_COLORS[provider] ?? "bg-white/10 text-white/60 border border-white/20";
}

export const STATUS_COLORS: Record<string, string> = {
  success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  empty: "bg-white/10 text-white/50 border border-white/20",
  error: "bg-red-500/10 text-red-400 border border-red-500/20",
  skipped: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
};
