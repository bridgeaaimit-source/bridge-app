"use client";

import { useMemo, useState, useEffect } from "react";
import { Home, Mic, Zap, Trophy, User, Plus, Filter, TrendingUp, X, RefreshCw, ExternalLink, Users, Calendar, Search, Clock, MessageSquare, Lightbulb, Target, ArrowUpRight, Bookmark, Share2, Eye, Flame, Star, Sparkles, Brain, Rocket, Award, BarChart3, Globe, Building2, Briefcase, GraduationCap, Code, DollarSign, MapPin, ChevronRight, Bell, Settings, Menu, TrendingUpIcon, UsersIcon, CalendarIcon, Heart } from "lucide-react";
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
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [savedArticles, setSavedArticles] = useState([]);

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
      setError('Failed to load news. Please try again.');
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

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    fetchNews(category);
    fetchGDInsights(category);
  };

  const handleGDPractice = async () => {
    setGdPracticeLoading(true);
    
    try {
      sessionStorage.setItem('gd_topic', JSON.stringify(gdInsights));
      window.location.href = '/gd';
    } catch (err) {
      console.error('GD generation error:', err);
    } finally {
      setGdPracticeLoading(false);
    }
  };

  const toggleSaveArticle = (article) => {
    setSavedArticles(prev => 
      prev.some(a => a.title === article.title) 
        ? prev.filter(a => a.title !== article.title)
        : [...prev, article]
    );
  };

  const isArticleSaved = (article) => {
    return savedArticles.some(a => a.title === article.title);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600 mx-auto mb-6"></div>
                <div className="absolute inset-0 w-16 h-16 animate-ping rounded-full bg-purple-200 opacity-20 mx-auto"></div>
              </div>
              <div className="text-2xl font-bold text-gray-800 mb-2">Loading Amazing Content</div>
              <div className="text-gray-600">Preparing your personalized feed...</div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 opacity-90"></div>
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-300 rounded-full filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-400 rounded-full filter blur-3xl opacity-10 animate-pulse delay-500"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-6 py-16">
            <div className="text-center text-white">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Zap className="w-8 h-8 text-yellow-300" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
              
              <h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-100">
                PULSE Feed
              </h1>
              <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                Your gateway to real-time placement insights, company news, and career opportunities that shape your future
              </p>
              
              <div className="flex items-center justify-center gap-6 mb-8">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Live Feed</span>
                </div>
                <div className="text-purple-200 text-sm">
                  {newsData?.articles?.length || 0} Articles Available
                </div>
                <div className="text-purple-200 text-sm">
                  Updated {new Date().toLocaleTimeString()}
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => {
                    fetchNews(activeCategory);
                    fetchGDInsights(activeCategory);
                  }}
                  className="bg-white text-purple-700 px-8 py-4 rounded-2xl font-bold hover:bg-purple-50 transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center gap-3"
                >
                  <RefreshCw className="w-5 h-5" />
                  Refresh Feed
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* GD Booster Hero Banner */}
        {!gdLoading && gdInsights && (
          <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-10">
            <div 
              className="relative overflow-hidden rounded-3xl shadow-2xl transform hover:scale-[1.02] transition-all duration-500"
              style={{
                background: 'linear-gradient(135deg, #6C3FE8 0%, #9B6DFF 50%, #C084FC 100%)'
              }}
            >
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full filter blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full filter blur-3xl"></div>
              
              <div className="relative p-8 text-white">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
                  {/* Label column */}
                  <div className="lg:col-span-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <Brain className="w-6 h-6" />
                      </div>
                      <div className="text-xs uppercase tracking-wider font-bold" style={{ color: 'rgba(255,255,255,0.8)' }}>
                        Today's GD Topic
                      </div>
                    </div>
                    <div className="text-2xl font-bold leading-tight mb-4">
                      {gdInsights.gd_topic}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-purple-200">Hot Topic</span>
                    </div>
                  </div>

                  {/* Key points column */}
                  <div className="lg:col-span-1">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-green-400/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold mb-1 text-green-100">FOR</div>
                          <div className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.9)' }}>
                            {gdInsights.pros}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-red-400/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold mb-1 text-red-100">AGAINST</div>
                          <div className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.9)' }}>
                            {gdInsights.cons}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Power phrase column */}
                  <div className="lg:col-span-1">
                    <div 
                      className="relative p-4 rounded-2xl backdrop-blur-sm"
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        borderLeft: '3px solid rgba(255,255,255,0.4)'
                      }}
                    >
                      <div className="absolute top-2 left-2">
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                      </div>
                      <div className="text-sm italic leading-relaxed pl-6" style={{ color: 'rgba(255,255,255,0.9)' }}>
                        "{gdInsights.power_phrase}"
                      </div>
                    </div>
                  </div>

                  {/* CTA column */}
                  <div className="lg:col-span-1">
                    <button
                      onClick={handleGDPractice}
                      disabled={gdPracticeLoading}
                      className="w-full bg-white text-purple-700 px-8 py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {gdPracticeLoading ? (
                        <>
                          <div className="w-5 h-5 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          <Rocket className="w-5 h-5" />
                          Practice Now
                          <ChevronRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                    <div className="mt-3 text-center text-sm text-purple-200">
                      Join 2,847 students practicing today
                </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Sidebar - Categories */}
            <div className="lg:col-span-3">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20 sticky top-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Filter className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">Categories</h3>
                </div>
                
                <div className="space-y-3">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                      className={`w-full text-left px-4 py-3 rounded-2xl transition-all duration-300 flex items-center justify-between group ${
                        activeCategory === category
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform scale-105'
                          : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                      }`}
                    >
                      <span className="font-semibold">{category}</span>
                      {activeCategory === category && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Trending Tags */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <h3 className="font-bold text-gray-900">Trending</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['AI', 'Remote', 'Startups', 'Campus'].map((tag) => (
                      <span key={tag} className="px-3 py-1 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 rounded-full text-xs font-semibold">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Center Column - News Feed */}
            <div className="lg:col-span-6">
              {/* Search Bar */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-4 shadow-xl border border-white/20 mb-8">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search for companies, topics, or insights..."
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Live Feed Indicator */}
              <div className="flex items-center gap-4 mb-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                <div className="relative">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
                </div>
                <div>
                  <div className="font-bold text-green-800">Live Feed Active</div>
                  <div className="text-sm text-green-600">{newsData?.articles?.length || 0} new articles</div>
                </div>
              </div>

              {/* News Cards */}
              <div className="space-y-6">
                {newsLoading ? (
                  <div className="space-y-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
                        <div className="animate-pulse space-y-4">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-full"></div>
                          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="bg-red-50 rounded-3xl p-8 border border-red-200 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <X className="w-8 h-8 text-red-600" />
                    </div>
                    <div className="text-red-600 font-semibold mb-4">{error}</div>
                    <button
                      onClick={() => fetchNews(activeCategory)}
                      className="bg-red-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-red-700 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                ) : newsData && newsData.articles && newsData.articles.length > 0 ? (
                  newsData.articles.map((article, index) => (
                    <div key={index} className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
                      {/* Article Image */}
                      {article.image && (
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={article.image}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                          <div className="absolute top-4 left-4">
                            <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                              {article.source || 'Unknown'}
                            </span>
                          </div>
                          <div className="absolute top-4 right-4">
                            <button
                              onClick={() => toggleSaveArticle(article)}
                              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                            >
                              <Bookmark className={`w-5 h-5 ${isArticleSaved(article) ? 'text-yellow-400 fill-current' : 'text-white'}`} />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Article Content */}
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
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

                        <h3 className="text-2xl font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-purple-700 transition-colors">
                          {article.title}
                        </h3>
                        
                        <p className="text-gray-600 mb-6 line-clamp-3 text-lg leading-relaxed">
                          {article.description}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-6">
                          {article.placement_insight && (
                            <div className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 text-sm font-semibold rounded-full">
                              <Target className="w-4 h-4" />
                              Placement Insight
                            </div>
                          )}
                          {article.gd_topic && (
                            <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-sm font-semibold rounded-full">
                              <MessageSquare className="w-4 h-4" />
                              GD Topic
                            </div>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {Math.floor(Math.random() * 1000) + 100}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              {Math.floor(Math.random() * 50) + 5}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              {Math.floor(Math.random() * 100) + 10}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <button className="p-2 text-gray-400 hover:text-purple-600 transition-colors">
                              <Share2 className="w-5 h-5" />
                            </button>
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105"
                            >
                              Read More
                              <ArrowUpRight className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-gray-50 rounded-3xl p-12 text-center border border-gray-200">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Search className="w-10 h-10 text-gray-400" />
                    </div>
                    <div className="text-gray-500 text-xl font-semibold mb-2">No articles found</div>
                    <div className="text-gray-400">Try selecting a different category</div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-3 space-y-6">
              {/* Top Companies */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">Top Companies</h3>
                </div>
                
                <div className="space-y-4">
                  {[
                    { name: 'Google', jobs: 245, trend: 'up', logo: '🔍' },
                    { name: 'Microsoft', jobs: 189, trend: 'up', logo: '🪟' },
                    { name: 'Amazon', jobs: 167, trend: 'down', logo: '📦' },
                    { name: 'TCS', jobs: 423, trend: 'up', logo: '💼' },
                    { name: 'Infosys', jobs: 378, trend: 'stable', logo: '🏢' }
                  ].map((company, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-purple-50 transition-all duration-300 group cursor-pointer transform hover:scale-105">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl">
                          {company.logo}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 group-hover:text-purple-700">{company.name}</div>
                          <div className="text-sm text-gray-500">{company.jobs} positions</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {company.trend === 'up' && <TrendingUp className="w-5 h-5 text-green-500" />}
                        {company.trend === 'down' && <TrendingUp className="w-5 h-5 text-red-500 rotate-180" />}
                        {company.trend === 'stable' && <div className="w-5 h-5 bg-gray-300 rounded-full"></div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro Tip */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-6 shadow-xl border border-yellow-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">Pro Tip</h3>
                </div>
                
                <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Lightbulb className="w-4 h-4 text-yellow-600" />
                    </div>
                    <p className="text-gray-800 leading-relaxed">
                      "Research the company's recent achievements and challenges before your interview. This shows genuine interest and helps you ask insightful questions that impress recruiters."
                    </p>
                  </div>
                </div>
              </div>

              {/* Activity Stats */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">Today's Activity</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Zap className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="font-semibold text-purple-900">Articles</span>
                    </div>
                    <span className="text-2xl font-bold text-purple-700">{newsData?.articles?.length || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="font-semibold text-green-900">Active Users</span>
                    </div>
                    <span className="text-2xl font-bold text-green-700">2.8K</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="font-semibold text-blue-900">Last Update</span>
                    </div>
                    <span className="text-lg font-bold text-blue-700">{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
