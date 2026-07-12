// Mirrors the color-coded badge pattern already used in BroadcastOverlay's
// search modal (News/Live/Sport pills), extended to the full taxonomy.
export const CATEGORY_COLORS: Record<string, string> = {
  Crime: "bg-red-500/10 text-red-400 border border-red-500/20",
  Music: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  Art: "bg-pink-500/10 text-pink-400 border border-pink-500/20",
  Blogging: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  Politics: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  Technology: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  Sports: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  Business: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
  Health: "bg-teal-500/10 text-teal-400 border border-teal-500/20",
  Science: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
  Entertainment: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  Other: "bg-white/10 text-white/60 border border-white/20",
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other;
}
