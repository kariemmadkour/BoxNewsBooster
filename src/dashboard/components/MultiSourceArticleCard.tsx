import { ArrowUpRight } from "lucide-react";
import { MergedArticle } from "../../lib/types";
import { formatRelativeTime } from "../../trends/utils/formatRelativeTime";
import { getProviderColor, getProviderLabel } from "../utils/providerColors";

export default function MultiSourceArticleCard({ article }: { article: MergedArticle }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col bg-[#0c0f17] border border-white/10 rounded-2xl p-4 gap-2 hover:border-white/20 transition-all"
    >
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`px-2 py-0.5 rounded text-[9px] font-semibold tracking-wider uppercase ${getProviderColor(article.provider)}`}>
          {getProviderLabel(article.provider)}
        </span>
        <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] font-semibold tracking-wider uppercase text-white/50">
          {article.category}
        </span>
        <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] font-mono uppercase text-white/40">
          {article.country}
        </span>
      </div>

      <h3 className="text-sm font-semibold text-white/90 group-hover:text-white leading-snug line-clamp-3">
        {article.title}
      </h3>
      {article.description && (
        <p className="text-xs text-white/50 leading-relaxed line-clamp-3">{article.description}</p>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 text-[11px] text-white/40 font-mono">
        <span className="truncate">{article.sourceName}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span>{formatRelativeTime(article.publishedAt)}</span>
          <ArrowUpRight className="w-3 h-3 text-white/30 group-hover:text-emerald-400 transition-colors" />
        </div>
      </div>
    </a>
  );
}
