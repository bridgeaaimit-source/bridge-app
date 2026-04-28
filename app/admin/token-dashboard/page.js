"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { 
  BarChart3, 
  Users, 
  Clock, 
  TrendingUp, 
  DollarSign,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  User,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import AppShell from '@/components/AppShell';

export default function TokenDashboard() {
  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState([]);
  const [userStats, setUserStats] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [expandedUser, setExpandedUser] = useState(null);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [topConsumer, setTopConsumer] = useState(null);

  useEffect(() => {
    fetchTokenData();
  }, [selectedPeriod]);

  async function fetchTokenData() {
    setLoading(true);
    try {
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch daily token usage for the last N days
      const days = selectedPeriod === '7days' ? 7 : selectedPeriod === '30days' ? 30 : 90;
      const dailyData = [];
      const userMap = new Map(); // To aggregate user data across days
      
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dailyRef = collection(db, 'tokenUsage', 'daily', dateStr);
        const snapshot = await getDocs(dailyRef);
        
        let dayTotal = 0;
        snapshot.forEach(doc => {
          const data = doc.data();
          dayTotal += data.total || 0;
          
          // Aggregate user data
          if (!userMap.has(doc.id)) {
            userMap.set(doc.id, {
              userId: doc.id,
              total: 0,
              smartInterviewInit: 0,
              smartInterviewContinue: 0,
              smartInterviewEvaluate: 0,
              lastUpdated: data.lastUsed?.toDate?.() || new Date()
            });
          }
          
          const user = userMap.get(doc.id);
          user.total += data.total || 0;
          user.smartInterviewInit += data['smart-interview-init'] || 0;
          user.smartInterviewContinue += data['smart-interview-continue'] || 0;
          user.smartInterviewEvaluate += data['smart-interview-evaluate'] || 0;
          
          // Update last used if newer
          if (data.lastUsed?.toDate?.() > user.lastUpdated) {
            user.lastUpdated = data.lastUsed.toDate();
          }
        });
        
        dailyData.push({
          date: dateStr,
          total: dayTotal,
          users: snapshot.size
        });
      }
      
      setDailyStats(dailyData.reverse());

      // Convert user map to array
      const users = Array.from(userMap.values());
      
      // Sort by total usage (descending)
      users.sort((a, b) => b.total - a.total);
      
      // Calculate grand total
      const grandTotal = users.reduce((sum, u) => sum + u.total, 0);
      
      setUserStats(users);
      setTotalTokens(grandTotal);
      setTotalUsers(users.length);
      setTopConsumer(users[0] || null);
      
    } catch (error) {
      console.error('Error fetching token data:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const exportData = () => {
    const csvContent = [
      ['User ID', 'Total Tokens', 'Smart Interview Init', 'Smart Interview Continue', 'Smart Interview Evaluate', 'Last Updated'].join(','),
      ...userStats.map(u => [
        u.userId,
        u.total,
        u.smartInterviewInit,
        u.smartInterviewContinue,
        u.smartInterviewEvaluate,
        u.lastUpdated.toISOString()
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `token-usage-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Token Usage Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor API token consumption and user analytics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {formatNumber(totalTokens)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Tokens Used</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {totalUsers}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {topConsumer ? formatNumber(topConsumer.total) : '0'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Top Consumer</div>
            {topConsumer && (
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">
                {topConsumer.userId.substring(0, 20)}...
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              ${(totalTokens * 0.000008).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Est. Cost (USD)</div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-sm"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
          </div>

          <button 
            onClick={fetchTokenData}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

          <button 
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Daily Usage Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Daily Token Usage
          </h2>
          <div className="h-64 flex items-end gap-2">
            {dailyStats.map((day, index) => {
              const maxValue = Math.max(...dailyStats.map(d => d.total), 1);
              const height = maxValue > 0 ? (day.total / maxValue) * 100 : 0;
              
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-purple-500 dark:bg-purple-600 rounded-t-lg transition-all hover:bg-purple-600 dark:hover:bg-purple-500 relative group"
                    style={{ height: `${height}%`, minHeight: '4px' }}
                  >
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                      {day.total.toLocaleString()} tokens
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 rotate-45 origin-left">
                    {formatDate(day.date)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Details Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              User Token Consumption
            </h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent mx-auto mb-4"></div>
              <div className="text-gray-600 dark:text-gray-400">Loading data...</div>
            </div>
          ) : userStats.length === 0 ? (
            <div className="p-8 text-center text-gray-600 dark:text-gray-400">
              No token usage data available yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">User ID</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Total Tokens</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Interview Init</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Continue</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Evaluate</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Last Active</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {userStats.map((user) => (
                    <motion.tr 
                      key={user.userId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                            {user.userId.substring(0, 12)}...
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                          {user.total.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {user.smartInterviewInit.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {user.smartInterviewContinue.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {user.smartInterviewEvaluate.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {user.lastUpdated.toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => setExpandedUser(expandedUser === user.userId ? null : user.userId)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          {expandedUser === user.userId ? (
                            <ChevronUp className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
