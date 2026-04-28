"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { BarChart3, Users, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import AppShell from '@/components/AppShell';

export default function TokenDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [dailyStats, setDailyStats] = useState([]);

  useEffect(() => {
    fetchTokenData();
  }, []);

  async function fetchTokenData() {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Starting token data fetch...');
      
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      
      const today = new Date().toISOString().split('T')[0];
      console.log('📊 Fetching for:', today);
      
      const dailyRef = collection(db, 'tokenUsage', 'daily', today);
      const snapshot = await getDocs(dailyRef);
      
      console.log(`📅 ${today}: ${snapshot.size} documents`);
      
      let dayTotal = 0;
      const userIds = new Set();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        dayTotal += data.total || 0;
        userIds.add(doc.id);
      });
      
      setTotalTokens(dayTotal);
      setTotalUsers(userIds.size);
      setDailyStats([{ date: today, total: dayTotal, users: userIds.size }]);
      
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

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Token Usage Dashboard</h1>
          <p className="text-gray-600">Monitor API token consumption and user analytics</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{dailyStats.length}</div>
              <div className="text-sm text-gray-600">Days Tracked</div>
            </div>
          </div>
        )}

        {!loading && !error && totalUsers === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">No Token Data Available</h3>
            <p className="text-sm text-gray-600 mb-4">Token tracking is enabled but no data has been collected yet.</p>
            <button onClick={fetchTokenData} className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700">
              <RefreshCw className="w-4 h-4 inline mr-2" />Refresh
            </button>
          </div>
        )}

        {!loading && !error && dailyStats.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Daily Usage</h3>
            {dailyStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{stat.date}</div>
                  <div className="text-sm text-gray-600">{stat.users} users</div>
                </div>
                <div className="text-lg font-bold text-[#0D9488]">{formatNumber(stat.total)} tokens</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
