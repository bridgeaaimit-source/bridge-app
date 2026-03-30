"use client";

import { useMemo, useState, useEffect } from "react";
import { 
  Home, Mic, Zap, Trophy, User, Plus, Filter, TrendingUp, X, RefreshCw, 
  ExternalLink, Users, Calendar, Search, Clock, MessageSquare, Lightbulb, 
  Target, ArrowUpRight, Bookmark, Share2, Eye, Flame, Star, Sparkles, 
  Brain, Rocket, Award, BarChart3, Globe, Building2, Briefcase, 
  GraduationCap, Code, DollarSign, MapPin, ChevronRight, Bell, Settings, 
  Menu, TrendingUpIcon, UsersIcon, CalendarIcon, Heart, Newspaper, 
  Hash, ArrowRight, CheckCircle, AlertCircle 
} from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchNews("All");
    fetchGDInsights("All");
  }, []);

  const fetchGDInsights = async (category) => {
    setGdLoading(true);
    try {
      const res = await fetch(`/api/gd-insights?category=${category}`);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (!data || !data.gd_topic) {
        throw new Error('Invalid response format');
      }
      
      setGdInsights(data);
    } catch (err) {
      console.error('GD insights error:', err);
      // Fallback GD content
      setGdInsights({
        gd_topic: "The Impact of Artificial Intelligence on Job Markets",
        pros: "New opportunities, increased productivity",
        cons: "Job displacement, skill requirements",
        power_phrase: "AI is changing how we work, not replacing human potential"
      });
    } finally {
      setGdLoading(false);
    }
  };

  const fetchNews = async (category) => {
    setNewsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/news?category=${encodeURIComponent(category)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (!data || !data.articles) {
        throw new Error('Invalid response format');
      }
      
      setNewsData(data);
    } catch (err) {
      console.error('News fetch error:', err);
      const errorMessage = err.message || 'Unknown error occurred';
      setError(`Failed to load news: ${errorMessage}. Please check your API keys.`);
      
      // Fallback content
      setNewsData({
        articles: [
          {
            title: "TCS Announces 10,000 New Hiring for 2024",
            description: "Tata Consultancy Services plans to hire 10,000 fresh graduates in FY2024 with focus on AI and digital skills.",
            url: "https://example.com/tcs-hiring",
            source: "TCS",
            time: "2 hours ago"
          },
          {
            title: "Infosys Expands Campus Recruitment Program",
            description: "Infosys launches enhanced campus recruitment program with competitive packages for engineering graduates.",
            url: "https://example.com/infosys-campus",
            source: "Infosys",
            time: "5 hours ago"
          },
          {
            title: "Wipro Partners with Colleges for Skill Development",
            description: "Wipro announces partnership with 50 engineering colleges for skill development and placement training.",
            url: "https://example.com/wipro-partners",
            source: "Wipro",
            time: "1 day ago"
          }
        ]
      });
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

  const filteredArticles = newsData?.articles?.filter(article => 
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-screen bg-[#F5FAFA]">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-12 h-12 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600 mx-auto mb-4"></div>
              <div className="text-lg font-semibold text-gray-700">Loading PULSE Feed...</div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-[#F5FAFA]">
        {/* Header */}
        <div className="bg-white border-b border-cyan-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                    <Newspaper className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">PULSE Feed</h1>
                    <p className="text-sm text-gray-500">Real-time placement insights</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                  <span>Live</span>
                </div>
                <button
                  onClick={refreshNews}
                  className="p-2 text-gray-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* GD Booster Banner */}
        {!gdLoading && gdInsights && (
          <div className="bg-gradient-to-r from-[#0891B2] to-[#0D9488]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
                {/* Topic */}
                <div className="lg:col-span-1">
                  <div className="text-cyan-100 text-xs font-semibold uppercase tracking-wider mb-2">
                    Today's GD Topic
                  </div>
                  <div className="text-white text-xl font-bold leading-tight">
                    {gdInsights.gd_topic}
                  </div>
                </div>

                {/* Points */}
                <div className="lg:col-span-1">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0" />
                      <span className="text-white text-sm truncate">{gdInsights.pros}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0" />
                      <span className="text-white text-sm truncate">{gdInsights.cons}</span>
                    </div>
                  </div>
                </div>

                {/* Quote */}
                <div className="lg:col-span-1">
                  <div className="text-cyan-100 text-sm italic border-l-2 border-cyan-300 pl-4">
                    "{gdInsights.power_phrase}"
                  </div>
                </div>

                {/* CTA */}
                <div className="lg:col-span-1">
                  <button
                    onClick={handleGDPractice}
                    disabled={gdPracticeLoading}
                    className="w-full bg-white text-cyan-600 px-6 py-3 rounded-lg font-semibold hover:bg-cyan-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {gdPracticeLoading ? (
                      <>
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        Practice Now
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Sidebar */}
            <div className="lg:col-span-3">
              {/* Categories */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        activeCategory === category
                          ? 'bg-cyan-100 text-cyan-700 font-medium'
                          : 'text-gray-700 hover:bg-cyan-50'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Today's Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Articles</span>
                    <span className="font-semibold text-gray-900">{newsData?.articles?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">GD Topics</span>
                    <span className="font-semibold text-gray-900">1</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Updated</span>
                    <span className="font-semibold text-gray-900">{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Content */}
            <div className="lg:col-span-6">
              {/* Search */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Articles */}
              <div className="space-y-4">
                {newsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="animate-pulse space-y-3">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-full"></div>
                          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="bg-red-50 rounded-xl border border-red-200 p-6 text-center">
                    <div className="text-red-600 mb-4">{error}</div>
                    <button
                      onClick={() => fetchNews(activeCategory)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                ) : filteredArticles.length > 0 ? (
                  filteredArticles.map((article, index) => (
                    <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium text-cyan-600 bg-cyan-50 px-2 py-1 rounded">
                                {article.source || 'Unknown'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {article.time || 'Just now'}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {article.title}
                            </h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                              {article.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {Math.floor(Math.random() * 1000) + 100}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {Math.floor(Math.random() * 50) + 5}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleSaveArticle(article)}
                              className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                            >
                              <Bookmark className={`w-4 h-4 ${isArticleSaved(article) ? 'fill-current text-yellow-500' : ''}`} />
                            </button>
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-600 hover:text-cyan-700 font-medium text-sm flex items-center gap-1"
                            >
                              Read More
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-12 text-center">
                    <div className="text-gray-500 font-medium mb-2">
                      {searchQuery ? 'No articles found for your search' : 'No articles found'}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {searchQuery ? 'Try a different search term' : 'Try selecting a different category'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-3">
              {/* Top Companies */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Top Companies</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Google', jobs: 245, trend: 'up' },
                    { name: 'Microsoft', jobs: 189, trend: 'up' },
                    { name: 'Amazon', jobs: 167, trend: 'down' },
                    { name: 'TCS', jobs: 423, trend: 'up' },
                    { name: 'Infosys', jobs: 378, trend: 'stable' }
                  ].map((company, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{company.name}</div>
                        <div className="text-xs text-gray-500">{company.jobs} positions</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {company.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                        {company.trend === 'down' && <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />}
                        {company.trend === 'stable' && <div className="w-4 h-4 bg-gray-300 rounded-full"></div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro Tip */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Pro Tip
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Research the company's recent achievements and challenges before your interview. This shows genuine interest and helps you ask insightful questions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
