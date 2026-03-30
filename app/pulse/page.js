"use client";

import { useMemo, useState, useEffect } from "react";
import { Home, Mic, Zap, Trophy, User, Plus, Filter, TrendingUp, X, RefreshCw, ExternalLink, Users, Calendar, Search, Clock, MessageSquare, Lightbulb, Target } from "lucide-react";
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
    setNewsData(null); // Clear previous articles
    
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

  const handleGDPractice = async (article) => {
    setGdPracticeLoading(true);
    setLoadingArticle(article.title);
    
    try {
      const res = await fetch('/api/gd-from-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_title: article.title,
          article_description: article.description,
          placement_insight: article.placement_insight
        })
      });
      
      const gdData = await res.json();
      
      // Store in sessionStorage and redirect
      sessionStorage.setItem('gd_topic', 
        JSON.stringify(gdData));
      window.location.href = '/gd';
      
    } catch (err) {
      console.error('GD generation error:', err);
      // Fallback - just go to GD with article title
      sessionStorage.setItem('gd_topic', JSON.stringify({
        gd_topic: article.title,
        why_relevant: article.placement_insight
      }));
      window.location.href = '/gd';
    } finally {
      setGdPracticeLoading(false);
      setLoadingArticle('');
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

  const currentData = newsData;
  const gdTopics = currentData?.articles?.filter(a => a.gd_topic === true) || [];

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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">PULSE Feed</h1>
            <p className="text-gray-600 mt-1">Stay updated with latest company insights and placement news</p>
          </div>
          <button
            onClick={() => {
              fetchNews(activeCategory);
              fetchGDInsights(activeCategory);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar - Category Filters */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Browse by Domain</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setActiveCategory(category);
                      fetchNews(category);
                      fetchGDInsights(category);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      activeCategory === category
                        ? 'bg-purple-100 text-purple-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {category}
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search news, companies, topics..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Live Feed Badge */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-green-700">Live Feed</span>
              <span className="text-sm text-gray-500">Updated {new Date().toLocaleTimeString()}</span>
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
                </div>
              ) : newsData && newsData.articles && newsData.articles.length > 0 ? (
                newsData.articles.map((article, index) => (
                  <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex gap-4">
                      {article.image && (
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-purple-700 bg-purple-100 rounded-full px-2 py-1">
                            {article.source || 'Unknown'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {article.time || 'Just now'}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{article.title}</h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{article.description}</p>
                        
                        {/* Placement Insight Badge */}
                        {article.placement_insight && (
                          <div className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full mb-3">
                            <Target className="w-3 h-3" />
                            Placement Insight
                          </div>
                        )}
                        
                        {/* GD Topic Badge */}
                        {article.gd_topic && (
                          <button
                            onClick={() => {
                              // Handle GD topic click
                              toast.success('GD topic saved for practice!');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full mb-3 hover:bg-green-100 transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" />
                            GD Topic
                          </button>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 text-sm font-medium"
                          >
                            Read Article
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-200">
                  <div className="text-gray-500">No news articles found for {activeCategory}</div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - GD Booster + Tips */}
          <div className="lg:col-span-3 space-y-6">
            {/* Today's GD Booster */}
            {gdLoading ? (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            ) : gdInsights ? (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Today's GD Booster
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Topic</div>
                    <div className="font-semibold text-gray-900">{gdInsights.gd_topic}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Key Points</div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span className="text-sm text-gray-700">{gdInsights.pros}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span className="text-sm text-gray-700">{gdInsights.cons}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Power Phrase</div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-sm font-medium text-purple-900 italic">"{gdInsights.power_phrase}"</div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      // Handle practice this topic
                      toast.success('GD topic saved for practice!');
                    }}
                    disabled={gdPracticeLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                  >
                    {gdPracticeLoading ? 'Saving...' : 'Practice This Topic'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="text-gray-500 text-center">No GD insights available</div>
              </div>
            )}

            {/* Interview Tip of the Day */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Interview Tip
              </h3>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-900">
                  "Always research the company's recent achievements and challenges before your interview. This shows genuine interest and helps you ask insightful questions."
                </p>
              </div>
            </div>

            {/* Trending Companies */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-purple-500" />
                Trending Companies
              </h3>
              <div className="space-y-3">
                {['TCS', 'Infosys', 'Wipro', 'HCL', 'Accenture'].map((company, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-700">
                        {company.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{company}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-600 font-medium">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Today's Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">News Articles</span>
                  <span className="text-sm font-semibold text-gray-900">{newsData?.articles?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">GD Topics</span>
                  <span className="text-sm font-semibold text-gray-900">1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm font-semibold text-gray-900">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
