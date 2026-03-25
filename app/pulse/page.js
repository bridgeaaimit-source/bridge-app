"use client";

import { useMemo, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Home, Mic, Zap, Trophy, User, Plus, Filter, TrendingUp, X, RefreshCw, ExternalLink, Users, Calendar } from "lucide-react";

const categories = ["All", "Marketing", "Finance", "HR", "Analytics", "Tech", "MBA"];

export default function PulsePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newsData, setNewsData] = useState(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (activeCategory) {
      fetchNews(activeCategory);
    }
  }, [activeCategory]);

  const fetchNews = async (category) => {
    console.log('Fetching category:', category);
    setNewsLoading(true);
    setError(null);
    setNewsData(null); // Clear previous articles
    
    try {
      console.log('=== FETCHING NEWS ===');
      console.log('Category:', category);
      console.log('NewsAPI key exists:', !!process.env.NEWS_API_KEY);
      
      const response = await fetch(`/api/news?category=${encodeURIComponent(category)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch news');
      }
      
      setNewsData(data);
      console.log(`Loaded ${data.articles?.length || 0} articles for ${category}`);
    } catch (err) {
      console.error('News fetch error:', err);
      setError(err.message);
    } finally {
      setNewsLoading(false);
    }
  };

  const refreshNews = () => {
    fetchNews(activeCategory);
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const currentData = newsData;
  const gdTopics = currentData?.articles?.filter(a => a.gd_topic) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading BRIDGE PULSE...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">BRIDGE PULSE</h1>
          <p className="text-gray-400 mb-8">Please sign in to access placement insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-purple-400" />
              <span className="text-xl font-bold text-white">BRIDGE PULSE</span>
            </div>
            <div className="flex items-center gap-6">
              <button className="text-gray-400 hover:text-white transition-colors">
                <Filter className="w-5 h-5" />
              </button>
              <button className="text-gray-400 hover:text-white transition-colors">
                <TrendingUp className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI Trend Banner */}
        {currentData?.category_trend && (
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-6 mb-6" style={{ boxShadow: '0 20px 40px rgba(108, 99, 255, 0.3)' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-purple-200 mb-1">📈 This week in {activeCategory}</div>
                <div className="text-xl font-semibold text-white">{currentData.category_trend}</div>
              </div>
              <button 
                onClick={refreshNews}
                className="text-white/70 hover:text-white transition-colors"
                disabled={newsLoading}
              >
                <RefreshCw className={`w-5 h-5 ${newsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {/* Interview Tip Card */}
        {currentData?.interview_tip && (
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 mb-6" style={{ boxShadow: '0 20px 40px rgba(251, 146, 60, 0.3)' }}>
            <div className="flex items-center gap-3">
              <div className="text-2xl">💡</div>
              <div>
                <div className="text-sm text-orange-100 mb-1">Interview Tip</div>
                <div className="text-lg font-semibold text-white">{currentData.interview_tip}</div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${
                activeCategory === category
                  ? "bg-purple-500 text-white"
                  : "bg-white/10 text-gray-400 hover:bg-white/20"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Loading Skeleton */}
        {newsLoading && (
          <div className="space-y-4 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-700 rounded-xl"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !newsLoading && (
          <div className="bg-red-500/20 backdrop-blur-sm rounded-2xl p-6 border border-red-500/30 mb-6">
            <div className="text-red-300 text-center">
              <p className="mb-2">📰 Showing curated content</p>
              <p className="text-sm">Could not load latest news: {error}</p>
            </div>
          </div>
        )}

        {/* News Articles */}
        {currentData?.articles && !newsLoading && (
          <div className="space-y-4 mb-8">
            {currentData.articles.map((article, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all cursor-pointer">
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="w-24 h-24 flex-shrink-0">
                    {article.urlToImage ? (
                      <img 
                        src={article.urlToImage} 
                        alt={article.title}
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.style.background = 
                            'linear-gradient(135deg, #6C63FF, #FF6B6B)';
                        }}
                      />
                    ) : null}
                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center" style={{ display: article.urlToImage ? 'none' : 'flex' }}>
                      <TrendingUp className="w-8 h-8 text-purple-300" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    {/* Source and Time */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-400">{article.source}</div>
                      <div className="text-sm text-gray-400">{formatTimeAgo(article.publishedAt)}</div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">{article.title}</h3>

                    {/* Description */}
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{article.description}</p>

                    {/* Placement Insight */}
                    <div className="bg-purple-500/20 backdrop-blur-sm rounded-xl p-3 border border-purple-500/30 mb-3">
                      <div className="text-sm text-purple-300">
                        🎯 {article.placement_insight}
                      </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {article.gd_topic && (
                          <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-lg text-xs font-semibold">
                            🗣️ GD Topic
                          </span>
                        )}
                        <span className="text-yellow-400 text-sm">
                          ⭐ {article.relevance_score}/10
                        </span>
                      </div>
                      {article.url && article.url !== "#" && (
                        <button 
                          onClick={() => window.open(article.url, '_blank')}
                          className="text-purple-400 hover:text-purple-300 text-sm font-semibold flex items-center gap-1 transition-colors"
                        >
                          Read Article <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* GD Booster Section */}
        {gdTopics.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">🗣️ GD Booster</h3>
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-gray-300 mb-3">Practice these Group Discussion topics from current news:</div>
            <div className="space-y-2">
              {gdTopics.slice(0, 3).map((topic, index) => (
                <div key={index} className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="text-sm font-medium text-white">{topic.title}</div>
                  <div className="text-xs text-gray-400 mt-1">{topic.why_relevant}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        {currentData?.cached_at && (
          <div className="text-center text-gray-500 text-sm mt-6">
            Updated {formatTimeAgo(currentData.cached_at)} ago
          </div>
        )}
      </div>
    </div>
  );
}
