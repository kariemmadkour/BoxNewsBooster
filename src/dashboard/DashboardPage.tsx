import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BrainCircuit } from "lucide-react";
import TrendingList from "./components/TrendingList";
import ClusterDetailPanel from "./components/ClusterDetailPanel";
import { callGetTrending, ClientApiError } from "../lib/functionsClient";
import { IntelligenceArticle } from "../lib/types";

export default function DashboardPage() {
  const navigate = useNavigate();

  const [articles, setArticles] = useState<IntelligenceArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    callGetTrending({ windowHours: 48, limit: 20 })
      .then((result) => {
        if (!cancelled) setArticles(result.articles);
      })
      .catch((err: ClientApiError) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#07111F] text-white font-sans">
      <header className="w-full bg-gradient-to-b from-[#020408]/90 to-transparent border-b border-white/5 px-6 py-4 md:px-12 flex items-center gap-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white/80 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-emerald-400" />
          <h1 className="text-sm font-display font-bold tracking-wider uppercase text-white/95">
            Intelligence Dashboard
          </h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 md:px-12 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-display font-semibold text-white/90">Trending now</h2>
            <p className="text-xs text-white/40 font-mono mt-1">
              Scored, clustered, and summarized across all connected sources — last 48 hours
            </p>
          </div>
        </div>

        <TrendingList
          articles={articles}
          loading={loading}
          error={error}
          onClusterClick={(clusterId) => setSelectedClusterId(clusterId)}
        />
      </main>

      {selectedClusterId && (
        <ClusterDetailPanel clusterId={selectedClusterId} onClose={() => setSelectedClusterId(null)} />
      )}
    </div>
  );
}
