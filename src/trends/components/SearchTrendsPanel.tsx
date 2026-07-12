import { useEffect, useState } from "react";
import { AlertCircle, Loader2, TrendingUp } from "lucide-react";
import { COUNTRIES } from "../utils/countries";
import { callGetSearchTrends } from "../../lib/functionsClient";
import { TrendItem } from "../../lib/types";

export default function SearchTrendsPanel() {
  const [country, setCountry] = useState("us");
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    callGetSearchTrends(country)
      .then((result) => {
        if (!cancelled) setTrends(result.trends);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Failed to load trends.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [country]);

  return (
    <div className="flex flex-col gap-4 p-5 bg-[#0c0f17] border border-white/10 rounded-2xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-display font-semibold text-white/90">Search Trends by Country</h2>
        </div>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/90 outline-none focus:border-emerald-400/50 transition-colors"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code} className="bg-[#0c0f17]">
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Mandatory disclaimer -- this is Google Search trend data only, never
          imply it's TikTok/Instagram/Facebook-native trending. */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-200/80 leading-relaxed">
          Reflects Google Search interest only. Not TikTok, Instagram, or Facebook trending data — no
          official API exists for those platforms at any accessible tier.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10 text-white/40 gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Loading trends...</span>
        </div>
      )}

      {!loading && error && <p className="text-xs text-white/60 py-6 text-center">{error}</p>}

      {!loading && !error && trends.length === 0 && (
        <p className="text-xs text-white/40 py-6 text-center">No trend data available for this country.</p>
      )}

      {!loading && !error && trends.length > 0 && (
        <ol className="flex flex-col gap-1.5">
          {trends.map((trend, i) => (
            <li
              key={`${trend.query}-${i}`}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-mono text-white/30 w-4 text-right">{i + 1}</span>
                <span className="text-sm text-white/85">{trend.query}</span>
              </div>
              {trend.formattedTraffic && (
                <span className="text-[10px] font-mono text-emerald-400/80">{trend.formattedTraffic}</span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
