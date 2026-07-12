import { AlertCircle } from "lucide-react";
import { ProviderResult } from "../../lib/types";
import MultiSourceArticleCard from "./MultiSourceArticleCard";
import { STATUS_COLORS } from "../utils/providerColors";

// Renders one provider's own (pre-dedup) results -- status banner always
// shown, article grid only when there's something to show. Never renders
// "nothing" for a provider: SUCCESS/EMPTY/ERROR/SKIPPED all get a visible,
// distinct state here.
export default function ProviderPanel({ result }: { result: ProviderResult }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between p-4 rounded-xl bg-[#0c0f17] border border-white/10">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-white/40 font-mono">key: {result.provider}</span>
          {result.error && (
            <span className="flex items-center gap-1.5 text-xs text-red-400/80">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {result.error}
            </span>
          )}
          {result.skipReason && (
            <span className="flex items-center gap-1.5 text-xs text-amber-400/80">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {result.skipReason}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40 font-mono">
            {result.articleCount} article{result.articleCount === 1 ? "" : "s"}
            {result.cached ? " (cached)" : ""}
          </span>
          <span
            className={`px-2.5 py-1 rounded text-[10px] font-semibold tracking-wider uppercase ${STATUS_COLORS[result.status]}`}
          >
            {result.status}
          </span>
        </div>
      </div>

      {result.articles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {result.articles.map((article) => (
            <MultiSourceArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

      {result.status === "empty" && (
        <p className="text-sm text-white/40 text-center py-8">This provider returned zero articles.</p>
      )}
      {result.status === "error" && (
        <p className="text-sm text-white/40 text-center py-8">This provider's call failed -- see the error above.</p>
      )}
      {result.status === "skipped" && (
        <p className="text-sm text-white/40 text-center py-8">This provider was not called -- see the reason above.</p>
      )}
    </div>
  );
}
