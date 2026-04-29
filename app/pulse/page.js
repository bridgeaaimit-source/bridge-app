"use client";

import { useState, useEffect } from "react";
import {
  Search, ArrowUpRight, Bookmark, Star, Newspaper, ArrowRight,
  CheckCircle, AlertCircle, TrendingUp, Zap, Sparkles, Building2,
  Lightbulb, MessageSquare, Quote, Target, BarChart2, Eye, Clock
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { useAuthBypass } from "@/hooks/useAuthBypass";

const CATEGORIES = ["All", "Marketing", "Finance", "HR", "Analytics", "Tech", "MBA"];

// Get IST date string — resets at 6 AM IST (00:30 UTC)
function getISTDateKey() {
  const now = new Date();
  // IST = UTC+5:30. Reset at 6AM IST = 0:30 UTC
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const istMs = utcMs + 5.5 * 60 * 60 * 1000;
  const ist = new Date(istMs);
  // Subtract 6 hours so "today" resets at 6 AM IST
  const adjusted = new Date(istMs - 6 * 60 * 60 * 1000);
  const y = adjusted.getFullYear();
  const m = String(adjusted.getMonth() + 1).padStart(2, '0');
  const d = String(adjusted.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function loadCache(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function saveCache(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

const FALLBACK_GD = {
  gd_topic: "Is AI replacing human creativity?",
  why_trending: "AI tools are disrupting creative industries globally in 2025",
  pros: ["AI enables faster content creation at scale — a 3-minute video ad now takes hours, not weeks", "Reduces production costs by up to 70%, making creativity accessible to small businesses", "Democratises design tools — anyone with a prompt can create professional visuals"],
  cons: ["Loss of emotional depth — AI lacks lived human experience that drives truly resonant storytelling", "Copyright & ownership issues remain legally unresolved across global markets", "Threatens livelihoods of creative professionals — illustrators, copywriters, video editors"],
  example_argument: "While AI optimises reach and speed, it cannot replicate the emotional resonance of human storytelling. The most powerful campaigns — like Amul's or Apple's — come from human insight about culture, not pattern matching. AI should augment, not replace, human creativity.",
  key_facts: ["AI art market grew 300% in 2024 (Forbes)", "60% of designers use AI tools daily (Adobe State of Creativity 2024)", "India's creative economy employs 8 million people directly"],
  how_to_start: "I'd like to begin by drawing a distinction — AI doesn't replace creativity, it changes who can be creative. The real question is whether we're ready to redefine what we value in creative work.",
  power_phrase: "The question isn't whether AI can create — it's whether creation without human intent has meaning.",
  interview_connection: "Interviewers in marketing, media, or tech often ask your stance on AI in your domain. Frame it as: tool + human = unstoppable.",
  difficulty: "Medium",
};

export default function PulsePage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [gdInsights, setGdInsights] = useState(null);
  const [gdLoading, setGdLoading] = useState(true);
  const [newsData, setNewsData] = useState(null);
  const [newsLoading, setNewsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedArticles, setSavedArticles] = useState([]);
  const [gdPracticeLoading, setGdPracticeLoading] = useState(false);

  const { isBypassed } = useAuthBypass();

  // Fetch GD insights — client-side daily cache, no repeated AI calls
  const fetchGDInsights = async (category) => {
    const dateKey = getISTDateKey();
    const cacheKey = `pulse_gd_${category}_${dateKey}`;
    const cached = loadCache(cacheKey);
    if (cached && cached.gd_topic) {
      setGdInsights(cached);
      setGdLoading(false);
      return;
    }
    setGdLoading(true);
    try {
      const res = await fetch(`/api/gd-insights?category=${encodeURIComponent(category)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data?.gd_topic) throw new Error('Bad response');
      saveCache(cacheKey, data);
      setGdInsights(data);
    } catch {
      setGdInsights(FALLBACK_GD);
    } finally {
      setGdLoading(false);
    }
  };

  // Fetch news — client-side daily cache
  const fetchNews = async (category) => {
    const dateKey = getISTDateKey();
    const cacheKey = `pulse_news_${category}_${dateKey}`;
    const cached = loadCache(cacheKey);
    if (cached?.articles?.length) {
      setNewsData(cached);
      setNewsLoading(false);
      return;
    }
    setNewsLoading(true);
    try {
      const res = await fetch(`/api/news?category=${encodeURIComponent(category)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data?.articles) throw new Error('Bad response');
      saveCache(cacheKey, data);
      setNewsData(data);
    } catch {
      setNewsData({ articles: [
        { title: "TCS Announces 40,000 New Hires for FY2025", description: "Tata Consultancy Services plans to hire 40,000 fresh graduates focused on AI and cloud technologies.", url: "#", source: "TCS", time: "Today" },
        { title: "Top Skills Employers Want in 2025", description: "AI literacy, communication, and adaptability top the list of most sought-after skills by Indian recruiters.", url: "#", source: "LinkedIn India", time: "Today" },
        { title: "India Startup Ecosystem Hits $150B Valuation", description: "Indian startups raised record funding in 2024 with fintech and edtech leading growth.", url: "#", source: "Inc42", time: "Today" },
      ]});
    } finally {
      setNewsLoading(false);
    }
  };

  useEffect(() => {
    if (isBypassed) {
      setGdInsights(FALLBACK_GD);
      setNewsData({ articles: [
        { title: "AI Revolution: What Students Must Know", description: "Major companies are investing in AI, creating massive opportunities for graduates.", url: "#", source: "Tech News", time: "2h ago" },
        { title: "Top 10 Skills Employers Want in 2025", description: "Communication, problem-solving, and AI literacy top recruiter wishlists.", url: "#", source: "Career Insights", time: "5h ago" },
      ]});
      setGdLoading(false);
      setNewsLoading(false);
      return;
    }
    fetchGDInsights("All");
    fetchNews("All");
  }, [isBypassed]);

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    fetchGDInsights(cat);
    fetchNews(cat);
  };

  const handleGDPractice = () => {
    setGdPracticeLoading(true);
    try {
      sessionStorage.setItem('gd_topic', JSON.stringify(gdInsights));
      window.location.href = '/gd';
    } catch { setGdPracticeLoading(false); }
  };

  const toggleSave = (article) => setSavedArticles(prev =>
    prev.some(a => a.title === article.title) ? prev.filter(a => a.title !== article.title) : [...prev, article]
  );

  const filteredArticles = newsData?.articles?.filter(a =>
    a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const difficultyColor = { Easy: 'text-green-700 bg-green-100', Medium: 'text-yellow-700 bg-yellow-100', Hard: 'text-red-700 bg-red-100' };

  return (
    <AppShell>
      <div className="min-h-screen bg-[#F0FDFA]">

        {/* ── Page Header ── */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F0FDFA] rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#0D9488]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">PULSE Feed</h1>
                <p className="text-xs text-gray-500">Updates daily at 6 AM · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live today
            </div>
          </div>
        </div>

        {/* ── Category Pills ── */}
        <div className="bg-white border-b border-gray-100 px-4 sm:px-8 py-3">
          <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-[#0D9488] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-[#F0FDFA] hover:text-[#0D9488]'
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8">

          {/* ══════════════════════════════════════════
              GD DEEP-DIVE SECTION
          ══════════════════════════════════════════ */}
          {gdLoading ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 animate-pulse space-y-4">
              <div className="h-5 bg-gray-200 rounded w-1/3"></div>
              <div className="h-8 bg-gray-200 rounded w-2/3"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-24 bg-gray-100 rounded-xl"></div>
                <div className="h-24 bg-gray-100 rounded-xl"></div>
              </div>
            </div>
          ) : gdInsights && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

              {/* Topic Header */}
              <div className="bg-gradient-to-r from-[#0D9488] to-[#0891B2] px-6 py-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-teal-100 uppercase tracking-widest">Today's GD Topic</span>
                      {gdInsights.difficulty && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white`}>
                          {gdInsights.difficulty}
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-white leading-snug">{gdInsights.gd_topic}</h2>
                    {gdInsights.why_trending && (
                      <p className="text-teal-100 text-sm mt-1.5 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                        {gdInsights.why_trending}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleGDPractice}
                    disabled={gdPracticeLoading}
                    className="shrink-0 bg-white text-[#0D9488] font-bold px-6 py-3 rounded-xl hover:bg-teal-50 transition-colors flex items-center gap-2 shadow-md disabled:opacity-60"
                  >
                    {gdPracticeLoading ? <><div className="w-4 h-4 border-2 border-[#0D9488]/40 border-t-[#0D9488] rounded-full animate-spin" /> Starting...</> : <><MessageSquare className="w-4 h-4" /> Practice GD Now</>}
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">

                {/* Pros & Cons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pros */}
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <h3 className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Arguments FOR
                    </h3>
                    <ul className="space-y-2">
                      {(Array.isArray(gdInsights.pros) ? gdInsights.pros : [gdInsights.pros]).map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-green-900">
                          <span className="mt-1 w-4 h-4 rounded-full bg-green-200 text-green-800 text-xs flex items-center justify-center font-bold shrink-0">{i+1}</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Cons */}
                  <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                    <h3 className="text-sm font-bold text-red-800 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Arguments AGAINST
                    </h3>
                    <ul className="space-y-2">
                      {(Array.isArray(gdInsights.cons) ? gdInsights.cons : [gdInsights.cons]).map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-red-900">
                          <span className="mt-1 w-4 h-4 rounded-full bg-red-200 text-red-800 text-xs flex items-center justify-center font-bold shrink-0">{i+1}</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Key Facts + How to Start */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gdInsights.key_facts?.length > 0 && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                        <BarChart2 className="w-4 h-4" /> Key Facts & Data
                      </h3>
                      <ul className="space-y-2">
                        {gdInsights.key_facts.map((f, i) => (
                          <li key={i} className="text-sm text-blue-900 flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">•</span>{f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {gdInsights.how_to_start && (
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                      <h3 className="text-sm font-bold text-purple-800 mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4" /> How to Start Speaking
                      </h3>
                      <p className="text-sm text-purple-900 italic leading-relaxed">"{gdInsights.how_to_start}"</p>
                    </div>
                  )}
                </div>

                {/* Example Argument */}
                {gdInsights.example_argument && (
                  <div className="bg-[#F0FDFA] rounded-xl p-4 border border-teal-200">
                    <h3 className="text-sm font-bold text-teal-800 mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" /> Winning Argument (use this in GD)
                    </h3>
                    <p className="text-sm text-teal-900 leading-relaxed">{gdInsights.example_argument}</p>
                  </div>
                )}

                {/* Power Phrase + Interview connection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gdInsights.power_phrase && (
                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 flex items-start gap-3">
                      <Star className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-yellow-800 mb-1">Power Phrase</div>
                        <p className="text-sm text-yellow-900 font-medium italic">"{gdInsights.power_phrase}"</p>
                      </div>
                    </div>
                  )}
                  {gdInsights.interview_connection && (
                    <div className="bg-orange-50 rounded-xl p-4 border border-orange-200 flex items-start gap-3">
                      <Sparkles className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-orange-800 mb-1">Interview Link</div>
                        <p className="text-sm text-orange-900">{gdInsights.interview_connection}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Practice CTA bottom */}
                <div className="border-t border-gray-100 pt-4 flex items-center justify-between flex-wrap gap-3">
                  <p className="text-sm text-gray-500">Ready? Jump into the live GD arena with AI participants.</p>
                  <button
                    onClick={handleGDPractice}
                    disabled={gdPracticeLoading}
                    className="bg-[#0D9488] text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0F766E] transition-colors flex items-center gap-2 text-sm"
                  >
                    {gdPracticeLoading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Starting...</> : <>Start GD Practice <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════
              NEWS FEED
          ══════════════════════════════════════════ */}
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-[#0D9488]" /> Placement News
              </h2>
              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 bg-white text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            {newsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-100 rounded w-full"></div>
                      <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredArticles.map((article, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-[#0D9488]/30 transition-all group">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold text-[#0D9488] bg-[#F0FDFA] px-2 py-0.5 rounded-full border border-teal-100">
                        {typeof article.source === 'object' ? article.source?.name : article.source || 'News'}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.time || (article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Today')}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 leading-snug group-hover:text-[#0D9488] transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mb-3">
                      {article.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <button onClick={() => toggleSave(article)} className="p-1.5 text-gray-400 hover:text-yellow-500 transition-colors rounded-lg hover:bg-yellow-50">
                        <Bookmark className={`w-4 h-4 ${savedArticles.some(a => a.title === article.title) ? 'fill-yellow-400 text-yellow-500' : ''}`} />
                      </button>
                      {article.url && article.url !== '#' ? (
                        <a href={article.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-semibold text-[#0D9488] hover:text-[#0F766E] flex items-center gap-1">
                          Read More <ArrowUpRight className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-300">Source unavailable</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Newspaper className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">{searchQuery ? 'No articles match your search' : 'No articles available'}</p>
                <p className="text-gray-400 text-sm mt-1">{searchQuery ? 'Try a different keyword' : 'Check back after 6 AM IST'}</p>
              </div>
            )}
          </div>

          {/* ── Top Companies sidebar-style row ── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0D9488]" /> Top Hiring Companies
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {[
                { name: 'Google', jobs: 245, trend: 'up' },
                { name: 'Microsoft', jobs: 189, trend: 'up' },
                { name: 'Amazon', jobs: 167, trend: 'down' },
                { name: 'TCS', jobs: 423, trend: 'up' },
                { name: 'Infosys', jobs: 378, trend: 'stable' },
              ].map((c, i) => (
                <div key={i} className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-xl border border-gray-100 text-center hover:border-[#0D9488]/30 transition-all">
                  <div className="font-semibold text-gray-900 text-sm">{c.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{c.jobs} positions</div>
                  <div className="mt-1.5">
                    {c.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-green-500 mx-auto" />}
                    {c.trend === 'down' && <TrendingUp className="w-3.5 h-3.5 text-red-400 rotate-180 mx-auto" />}
                    {c.trend === 'stable' && <div className="w-3 h-0.5 bg-gray-300 mx-auto mt-1"></div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
