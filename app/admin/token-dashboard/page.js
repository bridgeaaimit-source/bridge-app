"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  BarChart3, Users, Clock, AlertCircle, RefreshCw,
  TrendingUp, DollarSign, Download, Calendar, Zap,
  Mic, MessageSquare, Brain, BookOpen, FileText, Search, Star
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import toast from 'react-hot-toast';

// Anthropic Claude pricing per token (approx)
// Haiku input: $0.25/1M, output: $1.25/1M → avg ~$0.75/1M = $0.00000075
// Sonnet input: $3/1M, output: $15/1M → avg ~$9/1M = $0.000009
const COST_PER_TOKEN = 0.000009;

const FEATURE_META = {
  interview:        { label: 'Mock Interview',      icon: Mic,          color: 'bg-purple-500',  light: 'bg-purple-50 text-purple-700' },
  'smart-interview':{ label: 'Smart Interview',     icon: Brain,        color: 'bg-blue-500',    light: 'bg-blue-50 text-blue-700' },
  gd:               { label: 'GD Practice',         icon: MessageSquare,color: 'bg-green-500',   light: 'bg-green-50 text-green-700' },
  coach:            { label: 'Answer Coach',         icon: Star,         color: 'bg-yellow-500',  light: 'bg-yellow-50 text-yellow-700' },
  'pdf-chat':       { label: 'PDF Reader',           icon: BookOpen,     color: 'bg-pink-500',    light: 'bg-pink-50 text-pink-700' },
  'career-intel':   { label: 'Career Intelligence',  icon: Search,       color: 'bg-cyan-500',    light: 'bg-cyan-50 text-cyan-700' },
  news:             { label: 'News / PULSE',         icon: FileText,     color: 'bg-orange-500',  light: 'bg-orange-50 text-orange-700' },
  recruiter:        { label: 'Recruiter Match',      icon: Users,        color: 'bg-indigo-500',  light: 'bg-indigo-50 text-indigo-700' },
};

export default function TokenDashboard() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [activeTab, setActiveTab] = useState('overview');

  // Stats state
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [avgPerUser, setAvgPerUser] = useState(0);
  const [todayTokens, setTodayTokens] = useState(0);
  const [dailyStats, setDailyStats] = useState([]);
  const [userStats, setUserStats] = useState([]);
  const [featureStats, setFeatureStats] = useState({});

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

  useEffect(() => {
    if (authorized) fetchTokenData();
  }, [authorized, selectedPeriod]);

  async function fetchTokenData() {
    setLoading(true);
    setError(null);
    try {
      const days = selectedPeriod === '7days' ? 7 : selectedPeriod === '30days' ? 30 : 90;
      const dailyData = [];
      const userMap = new Map();
      const featureMap = new Map();
      const today = new Date().toISOString().split('T')[0];

      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const snapshot = await getDocs(collection(db, 'tokenUsage', 'daily', dateStr));

        let dayTotal = 0;
        const dayUsers = new Set();

        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          const uid = docSnap.id;
          dayTotal += data.total || 0;
          dayUsers.add(uid);

          if (!userMap.has(uid)) userMap.set(uid, { userId: uid, name: uid, email: '', total: 0, features: {}, days: new Set() });
          const u = userMap.get(uid);
          u.total += data.total || 0;
          u.days.add(dateStr);

          Object.entries(data).forEach(([key, val]) => {
            if (!['userId', 'date', 'total', 'lastUsed'].includes(key) && typeof val === 'number') {
              u.features[key] = (u.features[key] || 0) + val;
              featureMap.set(key, (featureMap.get(key) || 0) + val);
            }
          });
        });

        dailyData.push({ date: dateStr, total: dayTotal, users: dayUsers.size, isToday: dateStr === today });
      }

      // Fetch real names from Firestore users collection
      const uids = Array.from(userMap.keys());
      await Promise.all(uids.map(async (uid) => {
        try {
          const snap = await getDoc(doc(db, 'users', uid));
          if (snap.exists()) {
            const d = snap.data();
            userMap.get(uid).name = d.name || d.email || uid;
            userMap.get(uid).email = d.email || '';
          }
        } catch {}
      }));

      const sortedUsers = Array.from(userMap.values())
        .map(u => ({ ...u, days: u.days.size }))
        .sort((a, b) => b.total - a.total);

      const reversedDaily = dailyData.reverse();
      const tot = reversedDaily.reduce((s, d) => s + d.total, 0);
      const todayEntry = reversedDaily.find(d => d.isToday);

      setDailyStats(reversedDaily);
      setTotalTokens(tot);
      setTotalUsers(sortedUsers.length);
      setAvgPerUser(sortedUsers.length > 0 ? Math.round(tot / sortedUsers.length) : 0);
      setTodayTokens(todayEntry?.total || 0);
      setUserStats(sortedUsers);
      setFeatureStats(Object.fromEntries(featureMap));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const fmt = (n) => n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1_000 ? (n / 1_000).toFixed(1) + 'K' : String(n);
  const cost = (n) => '$' + (n * COST_PER_TOKEN).toFixed(3);
  const pct = (n, total) => total > 0 ? ((n / total) * 100).toFixed(1) : '0.0';
  const fmtDate = (s) => new Date(s).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

  const exportCSV = () => {
    const rows = [
      ['User', 'Email', 'Total Tokens', 'Cost (USD)', 'Active Days', ...Object.keys(featureStats)],
      ...userStats.map(u => [
        u.name, u.email, u.total, (u.total * COST_PER_TOKEN).toFixed(4), u.days,
        ...Object.keys(featureStats).map(f => u.features[f] || 0)
      ])
    ];
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bridge-tokens-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const topFeature = Object.entries(featureStats).sort((a, b) => b[1] - a[1])[0];

  if (!authorized) return <div className="flex items-center justify-center h-screen text-gray-400">Checking access...</div>;

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Token Usage Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Track AI usage, cost, and feature breakdown across all students</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
            <button onClick={fetchTokenData} className="flex items-center gap-2 px-4 py-2 bg-[#0D9488] text-white rounded-lg hover:bg-[#0F766E] text-sm">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 animate-spin rounded-full border-2 border-[#0D9488]/30 border-t-[#0D9488]" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Tokens', value: fmt(totalTokens), sub: cost(totalTokens) + ' est. cost', icon: BarChart3, color: 'bg-purple-100 text-purple-600' },
                { label: 'Active Users', value: totalUsers, sub: 'in period', icon: Users, color: 'bg-blue-100 text-blue-600' },
                { label: 'Avg per User', value: fmt(avgPerUser), sub: cost(avgPerUser) + ' / user', icon: TrendingUp, color: 'bg-green-100 text-green-600' },
                { label: "Today's Tokens", value: fmt(todayTokens), sub: cost(todayTokens) + ' today', icon: Zap, color: 'bg-orange-100 text-orange-600' },
              ].map(({ label, value, sub, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                  <div className="text-xs text-[#0D9488] font-medium mt-1">{sub}</div>
                </div>
              ))}
            </div>

            {/* Top Feature Banner */}
            {topFeature && (
              <div className="bg-gradient-to-r from-[#0D9488] to-[#0891b2] rounded-xl p-5 mb-6 text-white flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wide opacity-80 mb-1">Biggest Token Consumer</div>
                  <div className="text-xl font-bold">
                    {FEATURE_META[topFeature[0]]?.label || topFeature[0].replace(/-/g, ' ')}
                  </div>
                  <div className="text-sm opacity-80 mt-1">{pct(topFeature[1], totalTokens)}% of all usage</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{fmt(topFeature[1])}</div>
                  <div className="text-sm opacity-80">tokens · {cost(topFeature[1])}</div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
              {['overview', 'features', 'users', 'daily'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {tab}
                </button>
              ))}
            </div>

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <>
                {/* Daily chart */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#0D9488]" /> Daily Token Usage
                  </h3>
                  {dailyStats.every(d => d.total === 0) ? (
                    <div className="text-center py-10 text-gray-400 text-sm">No token data for this period yet</div>
                  ) : (
                    <div className="h-48 flex items-end gap-1.5">
                      {dailyStats.map((day) => {
                        const max = Math.max(...dailyStats.map(d => d.total), 1);
                        const h = Math.max((day.total / max) * 100, day.total > 0 ? 3 : 0);
                        return (
                          <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                            <div className="relative w-full" style={{ height: '160px', display: 'flex', alignItems: 'flex-end' }}>
                              <div
                                className={`w-full rounded-t-md transition-all cursor-pointer ${day.isToday ? 'bg-[#0D9488]' : 'bg-[#0D9488]/40 group-hover:bg-[#0D9488]/70'}`}
                                style={{ height: `${h}%`, minHeight: day.total > 0 ? '4px' : '0' }}
                              >
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                                  <div className="font-semibold">{day.total.toLocaleString()} tokens</div>
                                  <div className="opacity-70">{cost(day.total)} · {day.users} users</div>
                                </div>
                              </div>
                            </div>
                            <div className="text-[10px] text-gray-400">{fmtDate(day.date)}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Feature mini cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(featureStats).sort((a, b) => b[1] - a[1]).map(([key, tokens]) => {
                    const meta = FEATURE_META[key] || { label: key.replace(/-/g, ' '), color: 'bg-gray-400', light: 'bg-gray-50 text-gray-700' };
                    return (
                      <div key={key} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit mb-2 ${meta.light}`}>
                          {meta.label}
                        </div>
                        <div className="text-xl font-bold text-gray-900">{fmt(tokens)}</div>
                        <div className="text-xs text-gray-500">{pct(tokens, totalTokens)}% · {cost(tokens)}</div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                          <div className={`h-1.5 rounded-full ${meta.color}`} style={{ width: `${pct(tokens, totalTokens)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* FEATURES TAB */}
            {activeTab === 'features' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Feature-by-Feature Breakdown</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Which AI features are consuming the most tokens</p>
                </div>
                {Object.keys(featureStats).length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">No feature data yet</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {Object.entries(featureStats).sort((a, b) => b[1] - a[1]).map(([key, tokens], i) => {
                      const meta = FEATURE_META[key] || { label: key.replace(/-/g, ' '), color: 'bg-gray-400', light: 'bg-gray-50 text-gray-700', icon: Zap };
                      const Icon = meta.icon;
                      return (
                        <div key={key} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50">
                          <div className="w-7 text-center text-sm font-bold text-gray-400">#{i + 1}</div>
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.light}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-sm capitalize">{meta.label}</div>
                            <div className="w-full bg-gray-100 rounded-full h-2 mt-1.5">
                              <div className={`h-2 rounded-full ${meta.color}`} style={{ width: `${pct(tokens, totalTokens)}%` }} />
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-base font-bold text-gray-900">{fmt(tokens)}</div>
                            <div className="text-xs text-gray-400">{pct(tokens, totalTokens)}%</div>
                          </div>
                          <div className="text-right shrink-0 w-20">
                            <div className="text-sm font-semibold text-[#0D9488]">{cost(tokens)}</div>
                            <div className="text-xs text-gray-400">cost</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Per-Student Token Usage</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Who is using what — sorted by total consumption</p>
                </div>
                {userStats.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">No user data yet</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                        <tr>
                          <th className="px-5 py-3 text-left">#</th>
                          <th className="px-5 py-3 text-left">Student</th>
                          <th className="px-5 py-3 text-right">Tokens</th>
                          <th className="px-5 py-3 text-right">Cost</th>
                          <th className="px-5 py-3 text-right">Active Days</th>
                          <th className="px-5 py-3 text-left">Features Used</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {userStats.map((user, i) => (
                          <tr key={user.userId} className="hover:bg-gray-50/50">
                            <td className="px-5 py-3 text-gray-400 font-medium">{i + 1}</td>
                            <td className="px-5 py-3">
                              <div className="font-medium text-gray-900">{user.name}</div>
                              {user.email && <div className="text-xs text-gray-400">{user.email}</div>}
                            </td>
                            <td className="px-5 py-3 text-right font-bold text-gray-900">{fmt(user.total)}</td>
                            <td className="px-5 py-3 text-right text-[#0D9488] font-semibold">{cost(user.total)}</td>
                            <td className="px-5 py-3 text-right text-gray-500">{user.days}</td>
                            <td className="px-5 py-3">
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(user.features)
                                  .sort((a, b) => b[1] - a[1])
                                  .slice(0, 4)
                                  .map(([f, t]) => {
                                    const meta = FEATURE_META[f];
                                    return (
                                      <span key={f} className={`text-xs px-2 py-0.5 rounded-full ${meta?.light || 'bg-gray-100 text-gray-600'}`}>
                                        {meta?.label || f} · {fmt(t)}
                                      </span>
                                    );
                                  })}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* DAILY TAB */}
            {activeTab === 'daily' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Daily Usage Log</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {dailyStats.slice().reverse().map((stat) => (
                    <div key={stat.date} className={`flex items-center justify-between px-5 py-4 ${stat.isToday ? 'bg-teal-50' : 'hover:bg-gray-50/50'}`}>
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {stat.date}
                          {stat.isToday && <span className="text-xs bg-[#0D9488] text-white px-2 py-0.5 rounded-full">Today</span>}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{stat.users} active users</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{fmt(stat.total)} tokens</div>
                        <div className="text-xs text-[#0D9488] font-medium">{cost(stat.total)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
