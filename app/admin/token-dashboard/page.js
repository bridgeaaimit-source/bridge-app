"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { 
  BarChart3, 
  Users, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  TrendingUp,
  DollarSign,
  Download,
  Calendar,
  Filter
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import toast from 'react-hot-toast';

export default function TokenDashboard() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  // Admin-only guard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace('/login'); return; }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists() && snap.data().role === 'admin') {
          setAuthorized(true);
        } else {
          toast.error('Access denied — admin only');
          router.replace('/dashboard');
        }
      } catch { router.replace('/dashboard'); }
    });
    return () => unsub();
  }, [router]);
  const [error, setError] = useState(null);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [dailyStats, setDailyStats] = useState([]);
  const [userStats, setUserStats] = useState([]);
  const [featureStats, setFeatureStats] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState('7days');

  useEffect(() => {
    fetchTokenData();
  }, [selectedPeriod]);

  async function fetchTokenData() {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Starting token data fetch...');
      
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      
      const days = selectedPeriod === '7days' ? 7 : selectedPeriod === '30days' ? 30 : 90;
      const dailyData = [];
      const userMap = new Map();
      const featureMap = new Map();
      
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dailyRef = collection(db, 'tokenUsage', 'daily', dateStr);
        const snapshot = await getDocs(dailyRef);
        
        let dayTotal = 0;
        const userIds = new Set();
        
        snapshot.forEach(doc => {
          const data = doc.data();
          dayTotal += data.total || 0;
          userIds.add(doc.id);
          
          if (!userMap.has(doc.id)) {
            userMap.set(doc.id, { userId: doc.id, total: 0, features: {} });
          }
          const user = userMap.get(doc.id);
          user.total += data.total || 0;
          
          Object.entries(data).forEach(([key, value]) => {
            if (key !== 'userId' && key !== 'date' && key !== 'total' && key !== 'lastUsed') {
              user.features[key] = (user.features[key] || 0) + (value || 0);
              featureMap.set(key, (featureMap.get(key) || 0) + (value || 0));
            }
          });
        });
        
        dailyData.push({ date: dateStr, total: dayTotal, users: userIds.size });
      }
      
      setDailyStats(dailyData.reverse());
      setTotalTokens(dailyData.reduce((sum, d) => sum + d.total, 0));
      setTotalUsers(userMap.size);
      setUserStats(Array.from(userMap.values()).sort((a, b) => b.total - a.total));
      setFeatureStats(Object.fromEntries(featureMap));
      
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const calculateCost = (tokens) => {
    return (tokens * 0.000008).toFixed(2);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const exportCSV = () => {
    const headers = ['Date', 'Total Tokens', 'Users', 'Estimated Cost (USD)'];
    const rows = dailyStats.map(d => [
      d.date,
      d.total,
      d.users,
      calculateCost(d.total)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `token-usage-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!authorized) {
    return <div className="flex items-center justify-center h-screen text-gray-400">Checking access...</div>;
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Token Usage Dashboard</h1>
            <p className="text-gray-600">Comprehensive cost analysis and insights</p>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
            <button 
              onClick={fetchTokenData}
              className="flex items-center gap-2 px-4 py-2 bg-[#0D9488] text-white rounded-lg hover:bg-[#0F766E]"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button 
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 animate-spin rounded-full border-2 border-[#0D9488]/30 border-t-[#0D9488] mx-auto mb-4"></div>
              <div className="text-gray-600">Loading...</div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{formatNumber(totalTokens)}</div>
                <div className="text-sm text-gray-600">Total Tokens Used</div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{totalUsers}</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">${calculateCost(totalTokens)}</div>
                <div className="text-sm text-gray-600">Estimated Cost (USD)</div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{dailyStats.length}</div>
                <div className="text-sm text-gray-600">Days Tracked</div>
              </div>
            </div>

            {totalUsers === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center mb-8">
                <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">No Token Data Available</h3>
                <p className="text-sm text-gray-600 mb-4">Token tracking is enabled but no data has been collected yet.</p>
                <button onClick={fetchTokenData} className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700">
                  <RefreshCw className="w-4 h-4 inline mr-2" />Refresh
                </button>
              </div>
            )}

            {dailyStats.length > 0 && (
              <>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Daily Token Usage Trend
                  </h3>
                  <div className="h-64 flex items-end gap-2">
                    {dailyStats.map((day, index) => {
                      const maxValue = Math.max(...dailyStats.map(d => d.total), 1);
                      const height = maxValue > 0 ? (day.total / maxValue) * 100 : 0;
                      return (
                        <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                          <div 
                            className="w-full bg-[#0D9488] rounded-t-lg transition-all hover:bg-[#0F766E] relative group"
                            style={{ height: `${height}%`, minHeight: '4px' }}
                          >
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                              {day.total.toLocaleString()} tokens<br/>${calculateCost(day.total)}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">{formatDate(day.date)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {Object.keys(featureStats).length > 0 && (
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Filter className="w-5 h-5" />
                      Feature Breakdown
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(featureStats)
                        .sort((a, b) => b[1] - a[1])
                        .map(([feature, tokens]) => (
                          <div key={feature} className="bg-gray-50 rounded-lg p-4">
                            <div className="text-sm font-medium text-gray-900 capitalize mb-1">
                              {feature.replace(/-/g, ' ')}
                            </div>
                            <div className="text-2xl font-bold text-[#0D9488]">{formatNumber(tokens)}</div>
                            <div className="text-xs text-gray-600">${calculateCost(tokens)}</div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div 
                                className="bg-[#0D9488] h-2 rounded-full"
                                style={{ width: `${(tokens / totalTokens) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {userStats.length > 0 && (
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Top Token Consumers
                    </h3>
                    <div className="space-y-3">
                      {userStats.slice(0, 10).map((user, index) => (
                        <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#0D9488] text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.userId.substring(0, 20)}...</div>
                              <div className="text-xs text-gray-600">{Object.keys(user.features).length} features used</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-[#0D9488]">{formatNumber(user.total)}</div>
                            <div className="text-xs text-gray-600">${calculateCost(user.total)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Daily Usage Details
                  </h3>
                  <div className="space-y-3">
                    {dailyStats.map((stat, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{stat.date}</div>
                          <div className="text-sm text-gray-600">{stat.users} users active</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-[#0D9488]">{formatNumber(stat.total)} tokens</div>
                          <div className="text-xs text-gray-600">${calculateCost(stat.total)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
