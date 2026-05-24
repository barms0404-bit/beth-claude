/*
 * CNBC News Feed — Armstrong Arikat Research Terminal
 * Pulls latest CNBC articles via RSS, refreshes every hour
 * Links open directly on cnbc.com for Pro subscriber access
 */

import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, RefreshCw, Clock, Newspaper } from "lucide-react";

const LOGO_URL = "/manus-storage/aa-logo_4d0e4c30.png";

// CNBC RSS feeds parsed via a public RSS-to-JSON service
const CNBC_FEEDS = [
  { name: "Top News", url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114" },
  { name: "Markets", url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258" },
  { name: "Technology", url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=19854910" },
  { name: "Finance", url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664" },
];

interface Article {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  category: string;
}

export default function CnbcNews() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [activeCategory, setActiveCategory] = useState("All");

  const fetchNews = async () => {
    setLoading(true);
    const allArticles: Article[] = [];

    for (const feed of CNBC_FEEDS) {
      try {
        // Use a public RSS-to-JSON proxy
        const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
        const resp = await fetch(proxyUrl);
        if (resp.ok) {
          const data = await resp.json();
          if (data.items) {
            for (const item of data.items) {
              allArticles.push({
                title: item.title || "",
                link: item.link || "",
                pubDate: item.pubDate || "",
                description: (item.description || "").replace(/<[^>]*>/g, "").slice(0, 200),
                category: feed.name,
              });
            }
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch ${feed.name}:`, e);
      }
    }

    // Sort by date, newest first
    allArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    setArticles(allArticles);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();
    // Refresh every hour
    const interval = setInterval(fetchNews, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredArticles = activeCategory === "All"
    ? articles
    : articles.filter(a => a.category === activeCategory);

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] relative">
      {/* Watermark */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center" style={{ opacity: 0.04 }}>
        <img src={LOGO_URL} alt="" className="w-[60vw] max-w-[800px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b-4 border-[#C9A961] bg-[#000000]/97 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="bg-transparent border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/10 text-xs">
                <ArrowLeft className="w-3 h-3 mr-1" /> Terminal
              </Button>
            </Link>
            <div>
              <h1 className="text-[#C9A961] text-xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>CNBC News Feed</h1>
              <p className="text-[#8A7548] text-xs">Pro Subscriber Access — Auto-refreshes hourly</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchNews} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A0A0A] rounded border border-[#1F1A0F] hover:border-[#C9A961]/50 transition-colors">
              <RefreshCw className={`w-3 h-3 text-[#C9A961] ${loading ? "animate-spin" : ""}`} />
              <span className="text-[#C9A961] text-[10px] uppercase tracking-[1px]">Refresh</span>
            </button>
            <div className="text-right">
              <p className="text-[#8A7548] text-[10px] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last: {lastRefresh.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-t border-[#1F1A0F] overflow-x-auto">
          {["All", ...CNBC_FEEDS.map(f => f.name)].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded text-[10px] uppercase tracking-[1px] font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? "bg-[#C9A961]/20 text-[#C9A961] border border-[#C9A961]/50"
                  : "text-[#8A7548] hover:text-[#C9A961] hover:bg-[#C9A961]/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <main className="relative z-10 px-4 py-6 max-w-[1200px] mx-auto">
        {loading && articles.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-[#C9A961] mx-auto animate-spin mb-3" />
            <p className="text-[#8A7548] text-sm">Loading CNBC articles...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredArticles.map((article, i) => (
              <a
                key={i}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-4 hover:border-[#C9A961]/40 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[#C9A961] text-[9px] uppercase tracking-[1px] px-1.5 py-0.5 bg-[#C9A961]/10 rounded">{article.category}</span>
                      <span className="text-[#8A7548] text-[10px]">{formatTime(article.pubDate)}</span>
                    </div>
                    <h3 className="text-[#F5E6C8] text-sm font-medium leading-snug group-hover:text-[#C9A961] transition-colors">
                      {article.title}
                    </h3>
                    {article.description && (
                      <p className="text-[#8A7548] text-xs mt-1.5 line-clamp-2 leading-relaxed">{article.description}</p>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#8A7548] group-hover:text-[#C9A961] transition-colors flex-shrink-0 mt-1" />
                </div>
              </a>
            ))}

            {filteredArticles.length === 0 && !loading && (
              <div className="text-center py-12">
                <Newspaper className="w-8 h-8 text-[#8A7548] mx-auto mb-3" />
                <p className="text-[#8A7548] text-sm">No articles found. Try refreshing or selecting a different category.</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-[#1F1A0F] mt-8 pt-6 pb-8 text-center">
          <p className="text-[#8A7548] text-[10px]">
            Articles sourced from CNBC RSS feeds. Click any article to read on cnbc.com with your Pro subscription.
            Auto-refreshes every 60 minutes. {articles.length} articles loaded.
          </p>
        </footer>
      </main>
    </div>
  );
}
