import { Search } from "lucide-react";
import { COUNTRIES } from "../utils/countries";
import { CATEGORY_LABELS, NATIVE_CATEGORIES, NativeCategory } from "../utils/categories";
import { NewsProviderName } from "../../lib/types";

interface SearchFilterBarProps {
  country: string;
  category: NativeCategory;
  keyword: string;
  provider: NewsProviderName;
  onCountryChange: (country: string) => void;
  onCategoryChange: (category: NativeCategory) => void;
  onKeywordChange: (keyword: string) => void;
  onProviderChange: (provider: NewsProviderName) => void;
}

const selectClassName =
  "bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 outline-none focus:border-emerald-400/50 transition-colors";

export default function SearchFilterBar({
  country,
  category,
  keyword,
  provider,
  onCountryChange,
  onCategoryChange,
  onKeywordChange,
  onProviderChange,
}: SearchFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-[#0c0f17] border border-white/10 rounded-2xl">
      <div className="flex items-center gap-2.5 flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-lg px-3 py-2">
        <Search className="w-4 h-4 text-white/40 shrink-0" />
        <input
          type="text"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          placeholder="Search keyword..."
          className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-white/40"
        />
      </div>

      <select
        value={country}
        onChange={(e) => onCountryChange(e.target.value)}
        className={selectClassName}
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code} className="bg-[#0c0f17]">
            {c.name}
          </option>
        ))}
      </select>

      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value as NativeCategory)}
        className={selectClassName}
      >
        {NATIVE_CATEGORIES.map((c) => (
          <option key={c} value={c} className="bg-[#0c0f17]">
            {CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1">
        {(["newsapi", "gnews"] as NewsProviderName[]).map((p) => (
          <button
            key={p}
            onClick={() => onProviderChange(p)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer ${
              provider === p ? "bg-white text-black" : "text-white/60 hover:text-white"
            }`}
          >
            {p === "newsapi" ? "NewsAPI.org" : "GNews"}
          </button>
        ))}
      </div>
    </div>
  );
}
