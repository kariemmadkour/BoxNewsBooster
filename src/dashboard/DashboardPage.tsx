import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BrainCircuit, Loader2, Bug } from "lucide-react";
import MultiSourceArticleCard from "./components/MultiSourceArticleCard";
import MultiSourceFilters, { ALL_FILTER_VALUE } from "./components/MultiSourceFilters";
import { callFetchAllNews, ClientApiError } from "../lib/functionsClient";
import { MergedArticle, ProviderResult } from "../lib/types";

export default function DashboardPage() {
  const navigate = useNavigate();

  const [articles, setArticles] = useState<MergedArticle[]>([]);
  const [providerResults, setProviderResults] = useState<ProviderResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState(ALL_FILTER_VALUE);
  const [selectedCategory, setSelectedCategory] = useState(ALL_FILTER_VALUE);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    callFetchAllNews({})
      .then((result) => {
        if (cancelled) return;
        setArticles(result.articles);
        setProviderResults(result.providerResults);
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

  // Filter option lists are derived from the articles actually returned --
  // not a hardcoded ISO country list or the native-category constant used
  // elsewhere in the app.
  const availableCountries = useMemo(
    () => [...new Set(articles.map((a) => a.country))].sort(),
    [articles]
  );
  const availableCategories = useMemo(
    () => [...new Set(articles.map((a) => a.category))].sort(),
    [articles]
  );

  const filteredArticles = articles.filter((article) => {
    if (selectedCountry !== ALL_FILTER_VALUE && article.country !== selectedCountry) return false;
    if (selectedCategory !== ALL_FILTER_VALUE && article.category !== selectedCategory) return false;
    return true;
  });

  const failedProviders = providerResults.filter((p) => p.status === "error");

  return (
    <div className="min-h-screen w-full bg-[#07111F] text-white font-sans">
      <header className="w-full bg-gradient-to-b from-[#020408]/90 to-transparent border-b border-white/5 px-6 py-4 md:px-12 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
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
        </div>
        <button
          onClick={() => navigate("/dashboard/debug")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white/60 hover:text-white transition-all cursor-pointer"
        >
          <Bug className="w-3.5 h-3.5" />
          Provider debug
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 md:px-12 py-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-display font-semibold text-white/90">All sources</h2>
          <p className="text-xs text-white/40 font-mono">
            Live merged results from every registered news provider, deduped by URL
          </p>
        </div>

        {!loading && !error && articles.length > 0 && (
          <MultiSourceFilters
            countries={availableCountries}
            categories={availableCategories}
            selectedCountry={selectedCountry}
            selectedCategory={selectedCategory}
            onCountryChange={setSelectedCountry}
            onCategoryChange={setSelectedCategory}
          />
        )}

        {!loading && !error && failedProviders.length > 0 && (
          <p className="text-xs text-amber-400/80 font-mono">
            {failedProviders.map((p) => p.provider).join(", ")} failed to return results this load —
            see Provider debug for details.
          </p>
        )}

        {loading && (
          <div className="flex items-center justify-center py-24 text-white/40 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Fetching from every provider...</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-1">
            <p className="text-sm text-white/70">{error}</p>
          </div>
        )}

        {!loading && !error && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-1">
            <p className="text-sm text-white/60">No articles returned by any provider</p>
            <p className="text-xs text-white/30">Check Provider debug to see what each one reported.</p>
          </div>
        )}

        {!loading && !error && articles.length > 0 && filteredArticles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-1">
            <p className="text-sm text-white/60">No articles match these filters</p>
          </div>
        )}

        {!loading && !error && filteredArticles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredArticles.map((article) => (
              <MultiSourceArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
