import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { NormalizedArticle } from "../../lib/types";
import ArticleCard from "./ArticleCard";

interface ResultsFeedProps {
  articles: NormalizedArticle[];
  loading: boolean;
  error: string | null;
  page: number;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export default function ResultsFeed({ articles, loading, error, page, onPrevPage, onNextPage }: ResultsFeedProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-white/40 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading articles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-1">
        <p className="text-sm text-white/70">{error}</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-1">
        <p className="text-sm text-white/60">No articles found</p>
        <p className="text-xs text-white/30">Try a different keyword, country, or category.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onPrevPage}
          disabled={page <= 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Prev
        </button>
        <span className="text-xs text-white/40 font-mono">Page {page}</span>
        <button
          onClick={onNextPage}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white/80 transition-all cursor-pointer"
        >
          Next
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
