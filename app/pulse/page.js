"use client";

import { useMemo, useState, useEffect } from "react";
import { Home, Mic, Zap, Trophy, User, Plus, Filter, TrendingUp, X, RefreshCw, ExternalLink, Users, Calendar, Search, Clock, MessageSquare, Lightbulb, Target, ArrowUpRight, Bookmark, Share2, Eye, Flame, Star } from "lucide-react";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";

const categories = ["All", "Marketing", "Finance", "HR", "Analytics", "Tech", "MBA"];

export default function PulsePage() {
  const [loading, setLoading] = useState(true);
  const [newsData, setNewsData] = useState(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [gdInsights, setGdInsights] = useState(null);
  const [gdLoading, setGdLoading] = useState(true);
  const [gdPracticeLoading, setGdPracticeLoading] = useState(false);
  const [loadingArticle, setLoadingArticle] = useState('');

  useEffect(() => {
    // Load initial data
    fetchNews("All");
    fetchGDInsights("All");
  }, []);

  const fetchGDInsights = async (category) => {
    setGdLoading(true);
    try {
      console.log('Fetching GD insights for:', category);
      const res = await fetch(`/api/gd-insights?category=${category}`);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('GD Insights API error:', errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      console.log('GD Insights response:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (!data || !data.gd_topic) {
        throw new Error('Invalid GD insights response format');
      }
      
      setGdInsights(data);
    } catch (err) {
      console.error('GD insights error:', err);
      let errorMessage = 'Failed to load GD insights';
      
      if (err.message.includes('JSON')) {
        errorMessage = 'Server returned invalid GD data format';
      } else if (err.message.includes('529') || err.message.includes('overloaded')) {
        errorMessage = 'AI service is temporarily busy. Please try again.';
      } else if (err.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      console.error('GD insights fetch error:', errorMessage);
    } finally {
      setGdLoading(false);
    }
  };

  const fetchNews = async (category) => {
    console.log('Fetching news for:', category);
    setNewsLoading(true);
    setError(null);
    
    try {
      console.log('Making API call to /api/news...');
      const response = await fetch(`/api/news?category=${encodeURIComponent(category)}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API response:', data);
      console.log('Articles received:', data.articles?.length);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (!data || !data.articles) {
        throw new Error('Invalid response format from server');
      }
      
      setNewsData(data);
      console.log(`Successfully loaded ${data.articles?.length || 0} articles for ${category}`);
    } catch (err) {
      console.error('News fetch error:', err);
      let errorMessage = 'Failed to load news';
      
      if (err.message.includes('JSON')) {
        errorMessage = 'Server returned invalid data format';
      } else if (err.message.includes('529') || err.message.includes('overloaded')) {
        errorMessage = 'AI service is temporarily busy. Please try again.';
      } else if (err.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setError(errorMessage);
      // Set empty data to prevent infinite loading
      setNewsData({ articles: [] });
    } finally {
      setNewsLoading(false);
      setLoading(false);
    }
  };

  const refreshNews = () => {
    toast("Refreshing news...");
    fetchNews(activeCategory);
  };

  const handlePullToRefresh = () => {
    refreshNews();
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    fetchNews(category);
    fetchGDInsights(category);
  };

  const handleGDPractice = async () => {
    setGdPracticeLoading(true);
    
    try {
      // Store in sessionStorage and redirect
      sessionStorage.setItem('gd_topic', JSON.stringify(gdInsights));
      window.location.href = '/gd';
      
    } catch (err) {
      console.error('GD generation error:', err);
    } finally {
      setGdPracticeLoading(false);
    }
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

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-500 mx-auto mb-4"></div>
              <div className="text-gray-600">Loading PULSE Feed...</div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 rounded-3xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">PULSE Feed</h1>
                  <p className="text-purple-100 text-lg">Real-time placement news & company insights</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">Live Feed</span>
                </div>
                <span className="text-purple-200 text-sm">Updated {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
            <button
              onClick={() => {
                fetchNews(activeCategory);
                fetchGDInsights(activeCategory);
              }}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-xl flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* GD Booster Hero Banner */}
        {!gdLoading && gdInsights && (
          <div 
            className="mb-8 rounded-2xl p-6 text-white"
            style={{
              background: 'linear-gradient(135deg, #6C3FE8 0%, #9B6DFF 100%)',
              borderRadius: '16px',
              padding: '24px 36px',
              marginBottom: '24px',
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto auto',
              alignItems: 'center',
              gap: '32px'
            }}
          >
            {/* Label column */}
            <div>
              <div className="text-xs uppercase tracking-wide mb-2" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>
                Today's GD Topic
              </div>
              <div className="text-xl font-bold leading-tight" style={{ maxWidth: '240px', fontSize: '20px', fontWeight: '700' }}>
                {gdInsights.gd_topic}
              </div>
            </div>

            {/* Key points column */}
            <div>
              <div className="text-sm" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}>
                <span className="inline-block">• {gdInsights.pros}</span>
                <span className="mx-2">·</span>
                <span className="inline-block">• {gdInsights.cons}</span>
              </div>
            </div>

            {/* Power phrase column */}
            <div>
              <div 
                className="text-sm italic"
                style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '13px',
                  borderLeft: '2px solid rgba(255,255,255,0.4)',
                  paddingLeft: '14px',
                  maxWidth: '260px'
                }}
              >
                "{gdInsights.power_phrase}"
              </div>
            </div>

            {/* CTA column */}
            <div>
              <button
                onClick={handleGDPractice}
                disabled={gdPracticeLoading}
                className="px-6 py-3 rounded-lg font-bold transition-all duration-300 hover:transform hover:-translate-y-0.5"
                style={{
                  background: 'white',
                  color: '#6C3FE8',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '14px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = 'none';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                {gdPracticeLoading ? 'Loading...' : 'Practice Now →'}
              </button>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar - Category Filters */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Categories</h3>
              </div>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setActiveCategory(category);
                      fetchNews(category);
                      fetchGDInsights(category);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-between group ${
                      activeCategory === category
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg transform scale-105'
                        : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                    }`}
                  >
                    <span className="font-medium">{category}</span>
                    {activeCategory === category && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center Column - News Feed */}
          <div className="lg:col-span-6">
            {/* Search Bar */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search news, companies, topics..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Live Feed Indicator */}
            <div className="flex items-center gap-3 mb-6 p-4 bg-green-50 rounded-2xl border border-green-200">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-green-800">Live Feed Active</span>
              <span className="text-sm text-green-600">• {newsData?.articles?.length || 0} new articles</span>
            </div>

            {/* News Cards */}
            <div className="space-y-6">
              {newsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                      <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
                  <div className="text-red-600 text-center">{error}</div>
                  <button
                    onClick={() => fetchNews(activeCategory)}
                    className="mt-4 mx-auto block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Retry
                  </button>
                </div>
              ) : newsData && newsData.articles && newsData.articles.length > 0 ? (
                newsData.articles.map((article, index) => (
                  <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden group">
                    {/* Article Header */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-semibold text-purple-700 bg-purple-100 rounded-full px-3 py-1">
                              {article.source || 'Unknown'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {article.time || 'Just now'}
                            </span>
                            {article.trending && (
                              <span className="flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-100 rounded-full px-2 py-1">
                                <Flame className="w-3 h-3" />
                                Trending
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-purple-700 transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-gray-600 mb-4 line-clamp-3">{article.description}</p>
                        </div>
                        {article.image && (
                          <img
                            src={article.image}
                            alt={article.title}
                            className="w-32 h-32 object-cover rounded-xl flex-shrink-0 ml-4"
                          />
                        )}
                      </div>

                      {/* Tags and Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {article.placement_insight && (
                            <div className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full">
                              <Target className="w-3 h-3" />
                              Placement Insight
                            </div>
                          )}
                          {article.gd_topic && (
                            <button
                              onClick={() => {
                                toast.success('GD topic saved for practice!');
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full hover:bg-green-100 transition-colors cursor-pointer"
                            >
                              <MessageSquare className="w-3 h-3" />
                              GD Topic
                            </button>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button className="p-2 text-gray-400 hover:text-purple-600 transition-colors">
                            <Bookmark className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-purple-600 transition-colors">
                            <Share2 className="w-4 h-4" />
                          </button>
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                          >
                            Read More
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Engagement Bar */}
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {Math.floor(Math.random() * 1000) + 100} views
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {Math.floor(Math.random() * 50) + 5} comments
                        </span>
                      </div>
                      <span>Relevance: {Math.floor(Math.random() * 30) + 70}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-gray-50 rounded-2xl p-12 text-center border border-gray-200">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="text-gray-500 text-lg font-medium mb-2">No articles found</div>
                  <div className="text-gray-400 text-sm">Try selecting a different category</div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Only Top Companies, Pro Tip, Today's Activity */}
          <div className="lg:col-span-3 space-y-6">
            {/* Top Companies */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900">Top Companies</h3>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Google', jobs: 245, trend: 'up' },
                  { name: 'Microsoft', jobs: 189, trend: 'up' },
                  { name: 'Amazon', jobs: 167, trend: 'down' },
                  { name: 'TCS', jobs: 423, trend: 'up' },
                  { name: 'Infosys', jobs: 378, trend: 'stable' }
                ].map((company, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-purple-50 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {company.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 group-hover:text-purple-700">{company.name}</div>
                        <div className="text-xs text-gray-500">{company.jobs} open positions</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {company.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                      {company.trend === 'down' && <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />}
                      {company.trend === 'stable' && <div className="w-4 h-4 bg-gray-300 rounded-full" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interview Tip of the Day */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold text-gray-900">Pro Tip</h3>
              </div>
              <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                <p className="text-sm text-gray-800 leading-relaxed">
                  "Always research the company's recent achievements and challenges before your interview. This shows genuine interest and helps you ask insightful questions."
                </p>
              </div>
            </div>

            {/* Today's Activity */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Today's Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                  <span className="text-sm font-medium text-purple-900">News Articles</span>
                  <span className="text-lg font-bold text-purple-700">{newsData?.articles?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <span className="text-sm font-medium text-green-900">GD Topics</span>
                  <span className="text-lg font-bold text-green-700">1</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <span className="text-sm font-medium text-blue-900">Active Users</span>
                  <span className="text-lg font-bold text-blue-700">2.8K</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                  <span className="text-sm font-medium text-orange-900">Last Updated</span>
                  <span className="text-lg font-bold text-orange-700">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
