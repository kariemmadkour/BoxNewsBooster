import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BrainCircuit, Loader2 } from "lucide-react";
import MultiSourceArticleCard from "./components/MultiSourceArticleCard";
import MultiSourceFilters, { ALL_FILTER_VALUE } from "./components/MultiSourceFilters";
import ProviderPanel from "./components/ProviderPanel";
import { callFetchAllNews, ClientApiError } from "../lib/functionsClient";
import { MergedArticle, ProviderResult } from "../lib/types";
import { getProviderLabel } from "./utils/providerColors";

const ALL_SOURCES_TAB = "__all_sources__";

export default function DashboardPage() {
  const navigate = useNavigate();

  const [articles, setArticles] = useState<MergedArticle[]>([]);
  const [providerResults, setProviderResults] = useState<ProviderResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState(ALL_FILTER_VALUE);
  const [selectedCategory, setSelectedCategory] = useState(ALL_FILTER_VALUE);
  // Defaults to the merged view; switches to a provider key when that tab is clicked.
  const [activeTab, setActiveTab] = useState<string>(ALL_SOURCES_TAB);

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

  const activeProviderResult = providerResults.find((p) => p.provider === activeTab) ?? null;

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
        {/* Tab bar: "All sources" first/default, then exactly one tab per
            entry in providerResults -- which the backend guarantees has
            one entry per key in ALL_PROVIDER_NAMES, regardless of status.
            No separate hardcoded tab list exists anywhere in this file. */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1 w-fit flex-wrap">
          <button
            onClick={() => setActiveTab(ALL_SOURCES_TAB)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer ${
              activeTab === ALL_SOURCES_TAB ? "bg-white text-black" : "text-white/60 hover:text-white"
            }`}
          >
            All sources
          </button>
          {providerResults.map((result) => (
            <button
              key={result.provider}
              onClick={() => setActiveTab(result.provider)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer ${
                activeTab === result.provider ? "bg-white text-black" : "text-white/60 hover:text-white"
              }`}
            >
              {getProviderLabel(result.provider)}
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  result.status === "success"
                    ? "bg-emerald-400"
                    : result.status === "error"
                      ? "bg-red-400"
                      : "bg-amber-400"
                }`}
              />
            </button>
          ))}
        </div>

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

        {!loading && !error && activeTab === ALL_SOURCES_TAB && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-display font-semibold text-white/90">All sources</h2>
              <p className="text-xs text-white/40 font-mono mt-1">
                Live merged results from every registered news provider, deduped by URL
              </p>
            </div>

            {articles.length > 0 && (
              <MultiSourceFilters
                countries={availableCountries}
                categories={availableCategories}
                selectedCountry={selectedCountry}
                selectedCategory={selectedCategory}
                onCountryChange={setSelectedCountry}
                onCategoryChange={setSelectedCategory}
              />
            )}

            {articles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-1">
                <p className="text-sm text-white/60">No articles returned by any provider</p>
                <p className="text-xs text-white/30">Check each provider's tab above for details.</p>
              </div>
            )}

            {articles.length > 0 && filteredArticles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-1">
                <p className="text-sm text-white/60">No articles match these filters</p>
              </div>
            )}

            {filteredArticles.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredArticles.map((article) => (
                  <MultiSourceArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && !error && activeProviderResult && <ProviderPanel result={activeProviderResult} />}
      </main>
    </div>
  );
}
