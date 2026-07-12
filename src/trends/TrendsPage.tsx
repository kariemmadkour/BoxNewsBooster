import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Globe2 } from "lucide-react";
import SearchFilterBar from "./components/SearchFilterBar";
import ResultsFeed from "./components/ResultsFeed";
import SearchTrendsPanel from "./components/SearchTrendsPanel";
import { callFetchNews, ClientApiError } from "../lib/functionsClient";
import { NormalizedArticle, NewsProviderName } from "../lib/types";
import { NativeCategory } from "./utils/categories";

export default function TrendsPage() {
  const navigate = useNavigate();

  const [country, setCountry] = useState("us");
  const [category, setCategory] = useState<NativeCategory>("general");
  const [keyword, setKeyword] = useState("");
  const [provider, setProvider] = useState<NewsProviderName>("newsapi");
  const [page, setPage] = useState(1);

  const [articles, setArticles] = useState<NormalizedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    callFetchNews({ country, category, keyword, page, provider })
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
  }, [country, category, keyword, page, provider]);

  const resetToFirstPage = () => setPage(1);

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
          <Globe2 className="w-4 h-4 text-emerald-400" />
          <h1 className="text-sm font-display font-bold tracking-wider uppercase text-white/95">
            Trend &amp; News Intelligence
          </h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 md:px-12 py-8 flex flex-col gap-8">
        <section className="flex flex-col gap-4">
          <SearchFilterBar
            country={country}
            category={category}
            keyword={keyword}
            provider={provider}
            onCountryChange={(c) => {
              setCountry(c);
              resetToFirstPage();
            }}
            onCategoryChange={(c) => {
              setCategory(c);
              resetToFirstPage();
            }}
            onKeywordChange={(k) => {
              setKeyword(k);
              resetToFirstPage();
            }}
            onProviderChange={(p) => {
              setProvider(p);
              resetToFirstPage();
            }}
          />
          <ResultsFeed
            articles={articles}
            loading={loading}
            error={error}
            page={page}
            onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
            onNextPage={() => setPage((p) => p + 1)}
          />
        </section>

        <section>
          <SearchTrendsPanel />
        </section>
      </main>
    </div>
  );
}
