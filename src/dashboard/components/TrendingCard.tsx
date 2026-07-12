import { ArrowUpRight, Image as ImageIcon, TrendingUp, Layers } from "lucide-react";
import { IntelligenceArticle } from "../../lib/types";
import { formatRelativeTime } from "../../trends/utils/formatRelativeTime";

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  neutral: "bg-white/10 text-white/60 border border-white/20",
  negative: "bg-red-500/10 text-red-400 border border-red-500/20",
};

interface TrendingCardProps {
  article: IntelligenceArticle;
  onClusterClick?: (clusterId: string) => void;
}

export default function TrendingCard({ article, onClusterClick }: TrendingCardProps) {
  return (
    <div className="group flex flex-col bg-[#0c0f17] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all">
      <div className="relative aspect-video bg-white/5 flex items-center justify-center overflow-hidden">
        {article.image ? (
          <img
            src={article.image}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <ImageIcon className="w-8 h-8 text-white/20" />
        )}
        <span className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-mono text-emerald-400">
          <TrendingUp className="w-3 h-3" />
          {article.trendScore.toFixed(2)}
        </span>
        <span
          className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[9px] font-semibold tracking-wider uppercase ${
            SENTIMENT_COLORS[article.aiSentiment] ?? SENTIMENT_COLORS.neutral
          }`}
        >
          {article.aiSentiment}
        </span>
      </div>

      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="text-sm font-semibold text-white/90 leading-snug line-clamp-3">{article.title}</h3>
        {article.aiSummary && (
          <p className="text-xs text-white/50 leading-relaxed line-clamp-3">{article.aiSummary}</p>
        )}

        {article.extractedTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {article.extractedTags.slice(0, 4).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-white/50">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 text-[11px] text-white/40 font-mono">
          <span className="truncate">{article.publisher}</span>
          <div className="flex items-center gap-2 shrink-0">
            <span>{formatRelativeTime(article.publishedAt)}</span>
            {article.clusterId && (
              <button
                onClick={() => onClusterClick?.(article.clusterId as string)}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                title="View story cluster"
              >
                <Layers className="w-3 h-3" />
              </button>
            )}
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              <ArrowUpRight className="w-3 h-3 text-white/30 hover:text-emerald-400 transition-colors" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
