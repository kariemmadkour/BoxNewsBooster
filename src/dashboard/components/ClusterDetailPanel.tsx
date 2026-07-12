import { useEffect, useState } from "react";
import { X, Loader2, Layers } from "lucide-react";
import { callGetClusterDetail } from "../../lib/functionsClient";
import { GetClusterDetailResult } from "../../lib/types";
import { formatRelativeTime } from "../../trends/utils/formatRelativeTime";

interface ClusterDetailPanelProps {
  clusterId: string;
  onClose: () => void;
}

export default function ClusterDetailPanel({ clusterId, onClose }: ClusterDetailPanelProps) {
  const [data, setData] = useState<GetClusterDetailResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    callGetClusterDetail(clusterId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Failed to load cluster.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clusterId]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0c0f17] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-display font-semibold text-white/90">
              {data?.cluster.representativeTitle ?? "Story cluster"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="flex items-center justify-center py-16 text-white/40 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Loading cluster...</span>
            </div>
          )}
          {!loading && error && <p className="text-sm text-white/60 py-8 text-center">{error}</p>}
          {!loading && data && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-white/40 font-mono">
                {data.cluster.memberCount} source{data.cluster.memberCount === 1 ? "" : "s"} covering this story
              </p>
              {data.articles.map((article) => (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 flex flex-col gap-1 transition-all"
                >
                  <h4 className="text-xs font-semibold text-white/90 group-hover:text-white">{article.title}</h4>
                  <div className="flex items-center justify-between text-[11px] text-white/40 font-mono">
                    <span>{article.publisher}</span>
                    <span>{formatRelativeTime(article.publishedAt)}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
