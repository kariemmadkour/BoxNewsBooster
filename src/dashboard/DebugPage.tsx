import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bug, Loader2, RefreshCw } from "lucide-react";
import { callFetchAllNews, ClientApiError } from "../lib/functionsClient";
import { ProviderResult } from "../lib/types";
import { STATUS_COLORS, getProviderLabel } from "./utils/providerColors";

// Renders exactly one panel per entry in providerResults -- which the
// backend (functions/src/functions/fetchAllNews.ts) guarantees contains
// one entry per key in providers/index.ts's PROVIDERS map, regardless of
// whether that provider succeeded, returned nothing, errored, or was
// skipped. This page never filters or omits an entry from that array --
// if a panel is missing, that means providerResults itself is missing an
// entry, which would be a backend bug, not a frontend rendering choice.
export default function DebugPage() {
  const navigate = useNavigate();

  const [providerResults, setProviderResults] = useState<ProviderResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    callFetchAllNews({})
      .then((result) => setProviderResults(result.providerResults))
      .catch((err: ClientApiError) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#07111F] text-white font-sans">
      <header className="w-full bg-gradient-to-b from-[#020408]/90 to-transparent border-b border-white/5 px-6 py-4 md:px-12 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white/80 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-emerald-400" />
            <h1 className="text-sm font-display font-bold tracking-wider uppercase text-white/95">
              Provider Debug
            </h1>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white/60 hover:text-white transition-all cursor-pointer disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 md:px-12 py-8 flex flex-col gap-4">
        <p className="text-xs text-white/40 font-mono">
          One panel per provider registered in functions/src/providers/index.ts. A provider that
          errors, returns nothing, or is skipped still gets a panel here — it is never left out.
        </p>

        {loading && (
          <div className="flex items-center justify-center py-16 text-white/40 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Calling every provider...</span>
          </div>
        )}

        {!loading && error && <p className="text-sm text-white/70 py-8 text-center">{error}</p>}

        {!loading && !error && (
          <div className="flex flex-col gap-3">
            {providerResults.map((result) => (
              <div
                key={result.provider}
                className="flex items-center justify-between p-4 rounded-xl bg-[#0c0f17] border border-white/10"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-white/90">{getProviderLabel(result.provider)}</span>
                  <span className="text-[11px] text-white/40 font-mono">key: {result.provider}</span>
                  {result.error && (
                    <span className="text-[11px] text-red-400/80 font-mono max-w-md truncate" title={result.error}>
                      {result.error}
                    </span>
                  )}
                  {result.skipReason && (
                    <span className="text-[11px] text-amber-400/80 font-mono">{result.skipReason}</span>
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
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
