import { ArrowUpRight, Image as ImageIcon } from "lucide-react";
import { NormalizedArticle } from "../../lib/types";
import { formatRelativeTime } from "../utils/formatRelativeTime";
import { getCategoryColor } from "../utils/categoryColors";

export default function ArticleCard({ article }: { article: NormalizedArticle }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col bg-[#0c0f17] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all"
    >
      <div className="relative aspect-video bg-white/5 flex items-center justify-center overflow-hidden">
        {article.urlToImage ? (
          <img
            src={article.urlToImage}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <ImageIcon className="w-8 h-8 text-white/20" />
        )}
        <span
          className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[9px] font-semibold tracking-wider uppercase ${getCategoryColor(
            article.customCategory
          )}`}
        >
          {article.customCategory}
        </span>
      </div>

      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="text-sm font-semibold text-white/90 group-hover:text-white leading-snug line-clamp-3">
          {article.title}
        </h3>
        {article.description && (
          <p className="text-xs text-white/50 leading-relaxed line-clamp-2">{article.description}</p>
        )}
        <div className="flex items-center justify-between mt-auto pt-2 text-[11px] text-white/40 font-mono">
          <span className="truncate">{article.sourceName}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span>{formatRelativeTime(article.publishedAt)}</span>
            <ArrowUpRight className="w-3 h-3 text-white/30 group-hover:text-emerald-400 transition-colors" />
          </div>
        </div>
      </div>
    </a>
  );
}
