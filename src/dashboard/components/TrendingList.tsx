import { Loader2 } from "lucide-react";
import { IntelligenceArticle } from "../../lib/types";
import TrendingCard from "./TrendingCard";

interface TrendingListProps {
  articles: IntelligenceArticle[];
  loading: boolean;
  error: string | null;
  onClusterClick: (clusterId: string) => void;
}

export default function TrendingList({ articles, loading, error, onClusterClick }: TrendingListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-white/40 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading trending stories...</span>
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
        <p className="text-sm text-white/60">No scored articles yet</p>
        <p className="text-xs text-white/30">The intelligence pipeline hasn't processed anything in this window.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {articles.map((article) => (
        <TrendingCard key={article.id} article={article} onClusterClick={onClusterClick} />
      ))}
    </div>
  );
}
