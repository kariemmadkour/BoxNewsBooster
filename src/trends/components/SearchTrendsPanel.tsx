import { useState } from "react";
import { AlertCircle, TrendingUp } from "lucide-react";
import { COUNTRIES } from "../utils/countries";

// Google retired the internal endpoints ("dailytrends"/"realtimetrends")
// this feature depended on in favor of a new, undocumented "Trending Now"
// backend -- there's no quick fix, only a rebuild against the new endpoint
// or a paid provider. Disabled for now rather than showing a generic error.
export default function SearchTrendsPanel() {
  const [country, setCountry] = useState("us");

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
          disabled
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/40 outline-none cursor-not-allowed"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code} className="bg-[#0c0f17]">
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-200/80 leading-relaxed">
          Reflects Google Search interest only. Not TikTok, Instagram, or Facebook trending data — no
          official API exists for those platforms at any accessible tier.
        </p>
      </div>

      <p className="text-xs text-white/40 py-6 text-center">
        Trending data is temporarily unavailable while we rebuild this against Google's current Trends
        endpoint. Check back soon.
      </p>
    </div>
  );
}
