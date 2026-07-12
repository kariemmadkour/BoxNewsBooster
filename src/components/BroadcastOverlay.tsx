import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Search, RotateCcw, Globe2, Sparkles, Newspaper, Video, Trophy, TrendingUp, BrainCircuit, X, ArrowUpRight, Play, Volume2, VolumeX } from "lucide-react";

// Curated list of mock broadcast items for premium search filtering
const SEARCH_ITEMS = [
  {
    title: "International News Center",
    category: "News",
    description: "24/7 global coverage, correspondent reports, and breaking updates.",
    panelIndex: 0,
    tags: ["world", "current affairs", "headlines", "crisis", "live feed"]
  },
  {
    title: "Global Headline Bulletins",
    category: "News",
    description: "Hourly summaries from major international broadcasting hubs.",
    panelIndex: 0,
    tags: ["summary", "breaking", "press", "bulletin"]
  },
  {
    title: "Real-time Live Video Stream",
    category: "Live",
    description: "Uninterrupted satellite feed from remote wilderness and deep sea outposts.",
    panelIndex: 1,
    tags: ["satellite", "feed", "wilderness", "ocean", "cameras"]
  },
  {
    title: "Community Event Webcasts",
    category: "Live",
    description: "Broadcasting local cultural festivals, live discussions, and forums.",
    panelIndex: 1,
    tags: ["community", "culture", "forum", "interactive"]
  },
  {
    title: "World Athletic Championships",
    category: "Sport",
    description: "Live track and field coverage, records, and expert athlete analysis.",
    panelIndex: 2,
    tags: ["track", "field", "records", "championship", "running"]
  },
  {
    title: "Championship Football Finals",
    category: "Sport",
    description: "Unbiased tournament coverage, tactical reviews, and post-game interviews.",
    panelIndex: 2,
    tags: ["football", "soccer", "tournament", "cup", "stadium"]
  }
];

// Curated marquee ticker statements
const TICKER_STATEMENTS = [
  "BREAKING: Heavy rainfall eases across Central Europe as relief operations gain momentum.",
  "LIVE BROADCAST: Oceanographic vessel begins research expedition across the Mariana Trench.",
  "SPORTS UPDATES: Elite athletes gather in Tokyo for the upcoming annual Track & Field Grand Prix.",
  "TECHNOLOGY EXPO: Global green energy forum details new sustainable power grids in Scandinavia.",
  "BROADCAST NETWORK: Orbital telemetry establishes robust connections across Antarctic relays."
];

export default function BroadcastOverlay() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Sync state with 3D scene changes
  useEffect(() => {
    const handlePanelChanged = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && "activeIndex" in customEvent.detail) {
        setActiveIndex(customEvent.detail.activeIndex);
      }
    };
    window.addEventListener("app-active-panel-changed", handlePanelChanged);
    return () => {
      window.removeEventListener("app-active-panel-changed", handlePanelChanged);
    };
  }, []);

  const handlePanelZoom = (index: number) => {
    window.dispatchEvent(
      new CustomEvent("app-zoom-in", { detail: { index } })
    );
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const handleReset = () => {
    window.dispatchEvent(new CustomEvent("app-zoom-out"));
  };

  // Filter search matches
  const filteredItems = SEARCH_ITEMS.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.tags.some((t) => t.includes(query))
    );
  });

  return (
    <div id="broadcast-overlay" className="absolute inset-0 pointer-events-none z-10 font-sans flex flex-col justify-between text-white select-none">
      
      {/* 1. TOP NAVIGATION HEADER */}
      <header className="w-full pointer-events-auto bg-gradient-to-b from-[#020408]/90 to-transparent border-b border-white/5 px-6 py-4 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={handleReset}>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Globe2 className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-sm font-display font-bold tracking-wider uppercase text-white/95">
              Box<span className="text-emerald-400 font-normal">NewsBooster</span>
            </h1>
            <p className="text-[10px] text-white/40 tracking-widest uppercase font-mono">
              Comic Broadcast Universe
            </p>
          </div>
        </div>

        {/* Navigation Tabs Linked to 3D Panels */}
        <nav className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1 backdrop-blur-md">
          <button
            onClick={() => handlePanelZoom(0)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
              activeIndex === 0
                ? "bg-white text-black shadow-md"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            News
          </button>
          <button
            onClick={() => handlePanelZoom(1)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
              activeIndex === 1
                ? "bg-white text-black shadow-md"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            Live Streams
          </button>
          <button
            onClick={() => handlePanelZoom(2)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
              activeIndex === 2
                ? "bg-white text-black shadow-md"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Sports
          </button>
          <button
            onClick={() => navigate("/trends")}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 text-white/60 hover:text-white hover:bg-white/5"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Trends
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 text-white/60 hover:text-white hover:bg-white/5"
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            Intelligence
          </button>
        </nav>

        {/* Right Menu actions */}
        <div className="flex items-center gap-2">
          {/* Zoom Out / Reset Button if zoomed in */}
          {activeIndex !== null && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-[#020408]/60 hover:bg-[#020408]/90 text-xs text-white/80 hover:text-white transition-all cursor-pointer backdrop-blur-md"
              title="Reset view"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Exit Channel</span>
            </button>
          )}

          {/* Audio interface placeholder strictly literal */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer backdrop-blur-md"
            title={isMuted ? "Enable ambient sound" : "Mute audio"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Search trigger button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.8 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search Channels</span>
          </button>
        </div>
      </header>

      {/* 2. HERO TITLE AND DESCRIPTIONS (Fades out dynamically when a panel is zoomed) */}
      <main className="flex-1 flex flex-col justify-center px-6 md:px-24 max-w-3xl relative">
        <AnimatePresence>
          {activeIndex === null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -25 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-300">
                  Interactive Earth Broadcast Network
                </span>
              </div>

              <div className="space-y-3">
                <h2 className="text-4xl md:text-6xl font-display font-black tracking-tight leading-[1.1] text-white">
                  Global Signals, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
                    Orbiting Seamlessly.
                  </span>
                </h2>
                <p className="text-sm md:text-base text-white/60 font-sans leading-relaxed">
                  Navigate real-time global channels positioned across orbital space. Drag or scroll to orbit the globe, explore news archives, live coverage streams, and international athletics.
                </p>
              </div>

              {/* 3. CTA BUTTONS */}
              <div className="flex flex-wrap gap-3 pointer-events-auto">
                <button
                  onClick={() => handlePanelZoom(0)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-semibold shadow-xl transition-all hover:scale-105 cursor-pointer"
                >
                  <Newspaper className="w-4 h-4" />
                  Explore News Station
                </button>
                <button
                  onClick={() => handlePanelZoom(1)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Watch Live Feed
                </button>
                <button
                  onClick={() => handlePanelZoom(2)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
                >
                  <Trophy className="w-4 h-4" />
                  Sports Central
                </button>
              </div>

              {/* Quick instructions hint */}
              <div className="flex items-center gap-2.5 text-xs text-white/40 font-mono pt-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Scroll wheel or touch drag to rotate the orbital carousel.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3D Active Panel HUD Info Panel (Displays in the corner only when focused!) */}
        <AnimatePresence>
          {activeIndex !== null && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute left-6 md:left-12 bottom-20 md:bottom-28 bg-[#020408]/85 border border-white/15 p-5 md:p-6 rounded-2xl max-w-md pointer-events-auto backdrop-blur-xl shadow-2xl"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500 text-black uppercase tracking-wider">
                  Active Feed
                </span>
                <span className="text-[11px] text-white/50 font-mono">
                  Channel 0{activeIndex + 1}
                </span>
              </div>

              <h3 className="text-lg md:text-xl font-display font-bold text-white mb-1.5">
                {activeIndex === 0 && "Global News Network"}
                {activeIndex === 1 && "Live Satellite Broadcast"}
                {activeIndex === 2 && "World Sports Hub"}
              </h3>

              <p className="text-xs md:text-sm text-white/70 leading-relaxed mb-4">
                {activeIndex === 0 &&
                  "Review global headlines, diplomatic logs, and breaking bulletin logs with our comprehensive news station."}
                {activeIndex === 1 &&
                  "Access dynamic video feeds directly from remote international satellite feeds around the globe."}
                {activeIndex === 2 &&
                  "Get high-stakes athletic updates, match analysis, tournament results, and live event broadcasts."}
              </p>

              <div className="flex items-center justify-between border-t border-white/5 pt-3.5">
                <button
                  onClick={handleReset}
                  className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Camera View
                </button>
                <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono">
                  <span>Connection Stable</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 4. HORIZONTAL BREAKING NEWS TICKER */}
      <footer className="w-full pointer-events-auto bg-[#020408]/90 border-t border-white/5 py-3 overflow-hidden backdrop-blur-lg flex items-center">
        <div className="px-6 border-r border-white/10 z-10 bg-[#020408] font-mono text-[11px] font-bold tracking-widest text-emerald-400 uppercase flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
          Live Ticker
        </div>
        <div className="flex-1 overflow-hidden relative flex items-center">
          <div className="animate-ticker flex gap-20 py-0.5">
            {/* Double the array for seamless endless looping */}
            {[...TICKER_STATEMENTS, ...TICKER_STATEMENTS].map((st, i) => (
              <span key={i} className="text-[12px] font-sans text-white/80 font-medium tracking-wide flex items-center gap-3">
                <span className="text-emerald-500/60">•</span> {st}
              </span>
            ))}
          </div>
        </div>
      </footer>

      {/* 5. SEARCH SEARCH MODAL / COMMAND PALETTE */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 pointer-events-auto flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-[#0c0f17] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              {/* Search Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-2.5 flex-1">
                  <Search className="w-4.5 h-4.5 text-emerald-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search news, live streams, or sport topics..."
                    className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-white/40 focus:ring-0"
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Suggestions / Results list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handlePanelZoom(item.panelIndex)}
                      className="group p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 flex items-start justify-between cursor-pointer transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-semibold tracking-wider uppercase ${
                            item.category === "News" && "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          } ${
                            item.category === "Live" && "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          } ${
                            item.category === "Sport" && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}>
                            {item.category}
                          </span>
                          <h4 className="text-xs font-semibold text-white/90 group-hover:text-white transition-colors">
                            {item.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-white/50 leading-normal max-w-sm">
                          {item.description}
                        </p>
                      </div>

                      <div className="w-7 h-7 rounded-lg border border-white/5 bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white group-hover:bg-emerald-500 group-hover:text-black transition-all">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center space-y-1.5">
                    <p className="text-sm text-white/60">No stations found</p>
                    <p className="text-xs text-white/30">
                      Try searching for "news", "live", or "championship".
                    </p>
                  </div>
                )}
              </div>

              {/* Search Footer */}
              <div className="p-3 bg-black/40 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40 font-mono">
                <span>Select a result to focus the orbital transmitter.</span>
                <span>ESC to close</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
