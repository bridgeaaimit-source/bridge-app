"use client";

import { Fragment, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  BarChart3, Users, Clock, AlertCircle, RefreshCw,
  TrendingUp, DollarSign, Download, Calendar, Zap,
  Mic, MessageSquare, Brain, BookOpen, FileText, Search, Star,
  ShieldCheck, Activity, PieChart, ArrowUpRight, ArrowDownRight,
  ChevronDown, Filter, Eye, AlertTriangle
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import toast from 'react-hot-toast';
import Script from 'next/script';

const FEATURE_META = {
  interview:         { label: 'Mock Interview',      icon: Mic,           gradient: 'from-rose-500 to-pink-600',    bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200' },
  'smart-interview': { label: 'Smart Interview',     icon: Brain,         gradient: 'from-blue-500 to-indigo-600',  bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
  gd:                { label: 'GD Pulse Practice',   icon: MessageSquare, gradient: 'from-emerald-500 to-green-600',bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  gd_ai:             { label: '1vs4 GD Session',     icon: MessageSquare, gradient: 'from-emerald-500 to-green-600',bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  gd_eval:           { label: 'GD Pulse Evaluation', icon: ShieldCheck,   gradient: 'from-teal-500 to-cyan-600',    bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200' },
  gd_ai_eval:        { label: '1vs4 GD Evaluation',  icon: ShieldCheck,   gradient: 'from-teal-500 to-cyan-600',    bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200' },
  coach:             { label: 'Answer Coach',        icon: Star,          gradient: 'from-amber-500 to-yellow-600', bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  'pdf-chat':        { label: 'PDF Reader',          icon: BookOpen,      gradient: 'from-pink-500 to-fuchsia-600', bg: 'bg-pink-50',    text: 'text-pink-700',    border: 'border-pink-200' },
  personalize:       { label: 'Personalize',         icon: Search,        gradient: 'from-cyan-500 to-teal-600',    bg: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-cyan-200' },
  'career-intelligence': { label: 'Career Intel',    icon: Search,        gradient: 'from-cyan-500 to-teal-600',    bg: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-cyan-200' },
  news:              { label: 'PULSE / News',        icon: FileText,      gradient: 'from-orange-500 to-red-500',   bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },
  recruiter:         { label: 'Recruiter Match',     icon: Users,         gradient: 'from-violet-500 to-purple-600',bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200' },
  resume:            { label: 'Resume Parse',        icon: FileText,      gradient: 'from-slate-500 to-gray-600',   bg: 'bg-slate-50',   text: 'text-slate-700',   border: 'border-slate-200' },
  jobs:              { label: 'Jobs / Internships',  icon: Search,        gradient: 'from-lime-500 to-green-600',   bg: 'bg-lime-50',    text: 'text-lime-700',    border: 'border-lime-200' },
  aptitude:          { label: 'Aptitude Insight',    icon: Brain,         gradient: 'from-sky-500 to-blue-600',     bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200' },
  tpo:               { label: 'TPO Weekly Report',   icon: ShieldCheck,   gradient: 'from-violet-500 to-purple-600',bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200' },
  cron:              { label: 'Cron Refresh',        icon: Activity,      gradient: 'from-slate-500 to-gray-600',   bg: 'bg-slate-50',   text: 'text-slate-700',   border: 'border-slate-200' },
};

const CHART_PALETTE = [
  '#0D9488', '#0891B2', '#2563EB', '#7C3AED', '#DB2777',
  '#EA580C', '#CA8A04', '#059669', '#4F46E5', '#DC2626',
  '#8B5CF6', '#06B6D4'
];

export default function TokenDashboard() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [chartReady, setChartReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [needsKey, setNeedsKey] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [dailySortKey, setDailySortKey] = useState('date');
  const [dailySortDir, setDailySortDir] = useState('desc');
  const [expandedUser, setExpandedUser] = useState(null);
  const [callSearch, setCallSearch] = useState('');

  // Data state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Chart refs
  const dailyChartRef = useRef(null);
  const featurePieRef = useRef(null);
  const featureBarRef = useRef(null);
  const userBarRef = useRef(null);
  const trendLineRef = useRef(null);
  const dailyChartInstance = useRef(null);
  const featurePieInstance = useRef(null);
  const featureBarInstance = useRef(null);
  const userBarInstance = useRef(null);
  const trendLineInstance = useRef(null);

  // Admin-only guard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace('/login'); return; }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists() && snap.data().role === 'admin') {
          setAuthorized(true);
          // Check if secret key is stored
          if (!localStorage.getItem('adminSecretKey')) {
            setNeedsKey(true);
          }
        } else {
          toast.error('Access denied — admin only');
          router.replace('/dashboard');
        }
      } catch { router.replace('/dashboard'); }
    });
    return () => unsub();
  }, [router]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const days = selectedPeriod === '7days' ? 7 : selectedPeriod === '30days' ? 30 : selectedPeriod === '90days' ? 90 : 30;
      const secretKey = localStorage.getItem('adminSecretKey') || '';

      const payload = { secretKey, days };
      // Custom date range overrides the preset days
      if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
        payload.startDate = customStartDate;
        payload.endDate = customEndDate;
      }

      const res = await fetch('/api/admin/token-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setAnalyticsData(data);
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error('Analytics fetch failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, customStartDate, customEndDate]);

  useEffect(() => {
    if (authorized && !needsKey) fetchAnalytics();
  }, [authorized, needsKey, fetchAnalytics]);

  // ── Chart rendering ──
  useEffect(() => {
    if (!chartReady || !analyticsData) return;
    renderCharts();
    return () => destroyCharts();
  }, [chartReady, analyticsData, activeTab]);

  function destroyCharts() {
    [dailyChartInstance, featurePieInstance, featureBarInstance, userBarInstance, trendLineInstance].forEach(ref => {
      if (ref.current) { ref.current.destroy(); ref.current = null; }
    });
  }

  function renderCharts() {
    if (typeof window === 'undefined' || !window.Chart) return;
    const Chart = window.Chart;
    destroyCharts();

    const { daily = [], features = [], users = [], summary = {} } = analyticsData;
    const rate = summary.usdToInr || 95;

    // Overview tab — Daily usage bar chart
    if (activeTab === 'overview' && dailyChartRef.current) {
      const ctx = dailyChartRef.current.getContext('2d');
      dailyChartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: daily.map(d => {
            const dt = new Date(d.date);
            return dt.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
          }),
          datasets: [{
            label: 'Cost (₹)',
            data: daily.map(d => Number((d.totalCostINR || 0).toFixed(2))),
            backgroundColor: daily.map(d => d.isToday ? '#0D9488' : 'rgba(13,148,136,0.45)'),
            borderColor: daily.map(d => d.isToday ? '#0D9488' : 'rgba(13,148,136,0.7)'),
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1f2937',
              titleFont: { size: 13, weight: '600' },
              bodyFont: { size: 12 },
              padding: 12,
              cornerRadius: 8,
              callbacks: {
                label: (ctx) => {
                  const val = ctx.raw;
                  const dayStat = daily[ctx.dataIndex];
                  return [
                    `₹${Number(val).toFixed(2)} ($${(Number(val) / rate).toFixed(2)})`,
                    `${(dayStat?.total || 0).toLocaleString()} tokens · ${dayStat?.calls || 0} calls`,
                    `${dayStat?.users || 0} users`
                  ];
                }
              }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45 } },
            y: {
              grid: { color: 'rgba(0,0,0,0.04)' },
              ticks: { font: { size: 10 }, callback: v => '₹' + v }
            }
          }
        }
      });
    }

    // Overview tab — Trend line (cumulative)
    if (activeTab === 'overview' && trendLineRef.current) {
      const ctx = trendLineRef.current.getContext('2d');
      let cumulative = 0;
      let cumulativeCost = 0;
      const cumulativeData = daily.map(d => { cumulative += d.total; return cumulative; });
      const cumulativeCostData = daily.map(d => { cumulativeCost += d.totalCostINR; return cumulativeCost; });
      trendLineInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: daily.map(d => new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })),
          datasets: [{
            label: 'Cumulative Tokens',
            data: cumulativeData,
            borderColor: '#0D9488',
            backgroundColor: 'rgba(13,148,136,0.08)',
            fill: true,
            tension: 0.4,
            pointRadius: 2,
            pointHoverRadius: 6,
            borderWidth: 2.5,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1f2937',
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: (ctx) => {
                  const val = ctx.raw;
                  const costVal = cumulativeCostData[ctx.dataIndex];
                  return `${val.toLocaleString()} total tokens (₹${(costVal || 0).toFixed(2)})`;
                }
              }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45 } },
            y: {
              grid: { color: 'rgba(0,0,0,0.04)' },
              ticks: { font: { size: 10 }, callback: v => v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : v }
            }
          }
        }
      });
    }

    // Features tab — Pie chart
    if (activeTab === 'features' && featurePieRef.current) {
      const ctx = featurePieRef.current.getContext('2d');
      featurePieInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: features.map(f => FEATURE_META[f.feature]?.label || f.feature),
          datasets: [{
            data: features.map(f => f.tokens),
            backgroundColor: CHART_PALETTE.slice(0, features.length),
            borderWidth: 2,
            borderColor: '#fff',
            hoverOffset: 8,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '55%',
          plugins: {
            legend: {
              position: 'right',
              labels: { font: { size: 11 }, padding: 14, usePointStyle: true, pointStyleWidth: 12 }
            },
            tooltip: {
              backgroundColor: '#1f2937',
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: (ctx) => {
                  const val = ctx.raw;
                  const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                  const feat = features[ctx.dataIndex];
                  return ` ${val.toLocaleString()} tokens (${((val / total) * 100).toFixed(1)}%) · ₹${feat?.costINR || '0.00'}`;
                }
              }
            }
          }
        }
      });
    }

    // Features tab — Horizontal bar
    if (activeTab === 'features' && featureBarRef.current) {
      const ctx = featureBarRef.current.getContext('2d');
      const sortedFeatures = [...features].sort((a, b) => b.tokens - a.tokens);
      featureBarInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: sortedFeatures.map(f => FEATURE_META[f.feature]?.label || f.feature),
          datasets: [{
            label: 'Tokens',
            data: sortedFeatures.map(f => f.tokens),
            backgroundColor: sortedFeatures.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]),
            borderRadius: 6,
            borderSkipped: false,
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1f2937',
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: (ctx) => {
                  const feat = sortedFeatures[ctx.dataIndex];
                  return ` ${ctx.raw.toLocaleString()} tokens · ₹${feat?.costINR || '0.00'}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(0,0,0,0.04)' },
              ticks: { font: { size: 10 }, callback: v => v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : v }
            },
            y: { grid: { display: false }, ticks: { font: { size: 11 } } }
          }
        }
      });
    }

    // Users tab — Top 10 bar chart
    if (activeTab === 'users' && userBarRef.current) {
      const ctx = userBarRef.current.getContext('2d');
      const top10 = users.slice(0, 10);
      userBarInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: top10.map(u => (u.name || u.userId).substring(0, 20)),
          datasets: [{
            label: 'Cost (₹)',
            data: top10.map(u => parseFloat(u.totalCostINR) || 0),
            backgroundColor: CHART_PALETTE.slice(0, top10.length),
            borderRadius: 6,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1f2937',
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: (ctx) => {
                  const u = top10[ctx.dataIndex];
                  return [
                    ` ₹${parseFloat(u.totalCostINR).toFixed(2)} ($${(parseFloat(u.totalCostINR) / rate).toFixed(2)})`,
                    ` ${u.calls || 0} calls · ${u.total.toLocaleString()} tokens`,
                    ` ${u.days} active days`
                  ];
                }
              }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45 } },
            y: {
              grid: { color: 'rgba(0,0,0,0.04)' },
              ticks: { font: { size: 10 }, callback: v => '₹' + v }
            }
          }
        }
      });
    }
  }

  // ── Helpers ──
  const fmt = (n) => n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1_000 ? (n / 1_000).toFixed(1) + 'K' : String(n);
  const cost = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const usdRate = analyticsData?.summary?.usdToInr || 95;
  const usd = (inr) => '$' + (Number(inr || 0) / usdRate).toFixed(Number(inr || 0) / usdRate < 1 ? 3 : 2);
  const csvCell = (v) => {
    const t = String(v ?? '');
    return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const downloadCSV = (rows, name) => {
    const blob = new Blob([rows.map(r => r.map(csvCell).join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${name}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };
  const pct = (n, total) => total > 0 ? ((n / total) * 100).toFixed(1) : '0.0';

  const exportCSV = () => {
    if (!analyticsData) return;
    const { users = [], features = [] } = analyticsData;
    const featureKeys = features.map(f => f.feature);
    downloadCSV([
      ['#', 'Name', 'Email', 'College', 'API Calls', 'Total Tokens', 'AI Cost (INR)', 'Voice Cost (INR)', 'Total Cost (INR)', 'Total Cost (USD)', 'Active Days', 'Last Active',
        ...featureKeys.map(f => `${FEATURE_META[f]?.label || f} (INR)`)],
      ...users.map((u, i) => [
        i + 1, u.name, u.email, u.college || '', u.calls || 0, u.total,
        u.llmCostINR ?? '', u.voiceCostINR ?? '', u.totalCostINR, u.totalCostUSD ?? '', u.days, u.lastSeen,
        ...featureKeys.map(f => u.featureDetail?.[f]?.costINR ?? 0),
      ]),
    ], 'bridge-api-usage-by-student');
  };

  const exportCallsCSV = () => {
    const calls = analyticsData?.recentCalls || [];
    downloadCSV([
      ['Time (IST)', 'Name', 'Email', 'Feature', 'Model', 'Input tokens', 'Output tokens', 'Characters (voice)', 'Cost (INR)', 'Cost (USD)'],
      ...calls.map(c => [
        c.time ? new Date(c.time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
        c.name, c.email, FEATURE_META[c.feature]?.label || c.feature, c.model,
        c.inputTokens, c.outputTokens, c.chars, c.costINR, c.costUSD,
      ]),
    ], 'bridge-api-calls');
  };

  // Computed values from analyticsData
  const summary = analyticsData?.summary || {};
  const daily = analyticsData?.daily || [];
  const users = analyticsData?.users || [];
  const features = analyticsData?.features || [];
  const topFeature = features[0] || null;
  const avgPerStudentINR = Math.max(parseFloat(summary.totalCostINR || 0) - parseFloat(summary.anonymousCostINR || 0), 0) / Math.max(summary.totalUsers || 1, 1);

  // Filtered users for search
  const filteredUsers = users.filter(u =>
    !searchQuery ||
    (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Trend calculation (compare first vs second half of period)
  const halfLen = Math.floor(daily.length / 2);
  const firstHalf = daily.slice(0, halfLen).reduce((s, d) => s + d.total, 0);
  const secondHalf = daily.slice(halfLen).reduce((s, d) => s + d.total, 0);
  const trendPct = firstHalf > 0 ? (((secondHalf - firstHalf) / firstHalf) * 100).toFixed(0) : 0;
  const isUpTrend = secondHalf >= firstHalf;

  if (!authorized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 animate-spin rounded-full border-2 border-[#0D9488]/30 border-t-[#0D9488] mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (needsKey) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 w-full max-w-sm">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0D9488] to-[#0891B2] flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 text-center mb-1">Analytics Access</h2>
            <p className="text-sm text-gray-500 text-center mb-6">Enter the admin secret key to view token analytics</p>
            <form onSubmit={(e) => {
              e.preventDefault();
              localStorage.setItem('adminSecretKey', keyInput);
              setNeedsKey(false);
              toast.success('Key saved');
            }}>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Secret Key"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] outline-none mb-4"
                autoFocus
              />
              <button
                type="submit"
                disabled={!keyInput}
                className="w-full py-3 bg-[#0D9488] text-white rounded-xl font-medium hover:bg-[#0F766E] transition-colors disabled:opacity-50"
              >
                Unlock Dashboard
              </button>
            </form>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Chart.js CDN */}
      <Script
        src="https://cdn.jsdelivr.net/npm/chart.js@4.4.6/dist/chart.umd.min.js"
        strategy="afterInteractive"
        onLoad={() => setChartReady(true)}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">

        {/* ─── Header ─── */}
        <div className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0D9488] to-[#0891B2] flex items-center justify-center shadow-lg shadow-teal-500/20">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">API Usage &amp; Cost</h1>
                  <p className="text-sm text-gray-500">Every AI call by student and feature · vendor list prices · $1 = ₹{usdRate}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:border-gray-300 focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] outline-none transition-all cursor-pointer"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="custom">Custom Range</option>
              </select>
              {selectedPeriod === 'custom' && (
                <>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 shadow-sm focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] outline-none transition-all"
                  />
                  <span className="text-gray-400 text-sm">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 shadow-sm focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] outline-none transition-all"
                  />
                </>
              )}
              <button
                onClick={fetchAnalytics}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#0D9488] text-white rounded-xl hover:bg-[#0F766E] text-sm font-medium shadow-sm shadow-teal-500/20 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
            </div>
          </div>
        </div>

        {/* ─── Alerts ─── */}
        {alerts.length > 0 && (
          <div className="space-y-2 mb-6">
            {alerts.map((alert, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
                alert.type === 'caution'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}>
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-10 h-10 animate-spin rounded-full border-2 border-[#0D9488]/30 border-t-[#0D9488] mx-auto mb-4" />
              <p className="text-sm text-gray-400">Loading analytics...</p>
            </div>
          </div>
        ) : analyticsData ? (
          <>
            {/* ─── KPI Cards ─── */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
              {[
                { label: 'Total API Cost', value: cost(summary.totalCostINR || 0), sub: `${usd(summary.totalCostINR)} · ${summary.exactDaysCount || 0}d exact / ${summary.estimatedDaysCount || 0}d est.`, icon: DollarSign, iconBg: 'bg-teal-100 text-teal-600' },
                { label: 'AI (Claude) Cost', value: cost(summary.totalLLMCostINR || 0), sub: `${usd(summary.totalLLMCostINR)} · ${fmt(summary.totalTokens || 0)} tokens`, icon: BarChart3, iconBg: 'bg-blue-100 text-blue-600' },
                { label: 'Voice Cost', value: cost(summary.totalTTSCostINR || 0), sub: `${usd(summary.totalTTSCostINR)} · ${fmt(analyticsData.voiceSummary?.ttsChars || 0)} chars`, icon: Mic, iconBg: 'bg-emerald-100 text-emerald-600' },
                { label: 'API Calls', value: (summary.totalCalls || 0).toLocaleString('en-IN'), sub: `today ${cost(summary.todayCostINR || 0)}`, icon: Zap, iconBg: 'bg-amber-100 text-amber-600' },
                { label: 'Active Students', value: summary.totalUsers || 0, sub: `in ${summary.period || 7}d`, icon: Users, iconBg: 'bg-orange-100 text-orange-600' },
                { label: 'Avg / Student', value: cost(avgPerStudentINR.toFixed(2)), sub: `${usd(avgPerStudentINR)} · named students only`, icon: TrendingUp, iconBg: 'bg-indigo-100 text-indigo-600' },
              ].map(({ label, value, sub, icon: Icon, iconBg }) => (
                <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${iconBg}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                  <div className="text-xs text-[#0D9488] font-semibold mt-1">{sub}</div>
                </div>
              ))}
            </div>

            {/* ─── Top Feature Banner ─── */}
            {topFeature && (
              <div className="bg-gradient-to-r from-[#0D9488] to-[#0891B2] rounded-2xl p-6 mb-6 text-white flex items-center justify-between flex-wrap gap-4 shadow-lg shadow-teal-500/15">
                <div>
                  <div className="text-xs uppercase tracking-widest opacity-70 mb-1 font-medium">🏆 Biggest Cost</div>
                  <div className="text-xl font-bold">
                    {FEATURE_META[topFeature.feature]?.label || topFeature.feature}
                  </div>
                  <div className="text-sm opacity-80 mt-1">{topFeature.calls ? `${topFeature.calls} calls · ` : ''}{topFeature.percentage}% of tokens</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">₹{topFeature.costINR}</div>
                  <div className="text-sm opacity-80">{usd(topFeature.costINR)} · {fmt(topFeature.tokens)} tokens</div>
                </div>
              </div>
            )}

            {/* ─── Tabs ─── */}
            <div className="flex flex-wrap gap-1 bg-gray-100 rounded-2xl p-1.5 mb-8 w-fit max-w-full">
              {[
                { key: 'overview', label: 'Overview', icon: Activity },
                { key: 'features', label: 'Features', icon: PieChart },
                { key: 'users', label: 'Students', icon: Users },
                { key: 'calls', label: 'API Calls', icon: Zap },
                { key: 'daily', label: 'Daily Log', icon: Calendar },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ═══════════════ OVERVIEW TAB ═══════════════ */}
            {activeTab === 'overview' && (
              <>
                {/* Daily bar chart */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#0D9488]" />
                      Daily API Cost
                    </h3>
                    <span className="text-xs text-gray-400">Avg: {fmt(summary.avgDailyTokens || 0)} tokens/day</span>
                  </div>
                  <div style={{ height: '280px' }}>
                    <canvas ref={dailyChartRef} />
                  </div>
                </div>

                {/* Cumulative trend */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-[#0D9488]" />
                    Cumulative Usage Trend
                  </h3>
                  <div style={{ height: '240px' }}>
                    <canvas ref={trendLineRef} />
                  </div>
                </div>

                {/* Feature mini cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  {features.map(f => {
                    const meta = FEATURE_META[f.feature] || { label: f.feature, bg: 'bg-gray-50', text: 'text-gray-700', gradient: 'from-gray-500 to-gray-600', border: 'border-gray-200' };
                    return (
                      <div key={f.feature} className={`bg-white rounded-2xl p-5 border ${meta.border} shadow-sm hover:shadow-md transition-all`}>
                        <div className={`text-xs font-bold px-2.5 py-1 rounded-full w-fit mb-3 ${meta.bg} ${meta.text}`}>
                          {meta.label}
                        </div>
                        <div className="text-2xl font-bold text-gray-900">₹{f.costINR}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {usd(f.costINR)} · {f.calls || 0} calls · {fmt(f.tokens)} tokens
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 mt-3">
                          <div className={`h-2 rounded-full bg-gradient-to-r ${meta.gradient}`} style={{ width: `${Math.max(parseFloat(f.percentage), 2)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Voice Cost Details Section */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <Mic className="w-5 h-5 text-[#0D9488]" />
                    Voice Services Cost Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* TTS Card */}
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                          Text-to-Speech (TTS)
                        </span>
                        <span className="text-xs text-gray-400">Gemini / ElevenLabs</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        ₹{parseFloat(analyticsData.voiceSummary?.ttsCostINR || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Total Characters: {(analyticsData.voiceSummary?.ttsChars || 0).toLocaleString('en-IN')} chars
                      </div>
                      <div className="text-[11px] text-gray-400 mt-2">
                        Gemini TTS ≈ $16.80 per 1M characters (text + audio tokens); cached replays are free
                      </div>
                    </div>
                    {/* STT Card */}
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                          Speech-to-Text (STT)
                        </span>
                        <span className="text-xs text-gray-400">AssemblyAI</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        ₹{parseFloat(analyticsData.voiceSummary?.sttCostINR || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Total Audio Duration: {(analyticsData.voiceSummary?.sttSeconds || 0).toLocaleString('en-IN')} seconds
                      </div>
                      <div className="text-[11px] text-gray-400 mt-2">
                        Live mic transcription is not metered yet, so this shows ₹0
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ═══════════════ FEATURES TAB ═══════════════ */}
            {activeTab === 'features' && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Doughnut */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                      <PieChart className="w-4 h-4 text-[#0D9488]" />
                      Feature Distribution
                    </h3>
                    <div style={{ height: '320px' }}>
                      <canvas ref={featurePieRef} />
                    </div>
                  </div>

                  {/* Horizontal bar */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                      <BarChart3 className="w-4 h-4 text-[#0D9488]" />
                      Feature Comparison
                    </h3>
                    <div style={{ height: '320px' }}>
                      <canvas ref={featureBarRef} />
                    </div>
                  </div>
                </div>

                {/* Detailed feature table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-5 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Feature-by-Feature Breakdown</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Which AI features cost the most · sorted by cost</p>
                  </div>
                  {features.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm">No feature data yet</div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {features.map((f, i) => {
                        const meta = FEATURE_META[f.feature] || { label: f.feature, bg: 'bg-gray-50', text: 'text-gray-700', gradient: 'from-gray-500 to-gray-600', icon: Zap };
                        const Icon = meta.icon;
                        return (
                          <div key={f.feature} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                            <div className="w-7 text-center text-sm font-bold text-gray-400">#{i + 1}</div>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.bg} ${meta.text}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 text-sm">{meta.label}</div>
                              <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                                <div className={`h-2 rounded-full bg-gradient-to-r ${meta.gradient}`} style={{ width: `${Math.max(parseFloat(f.percentage), 2)}%` }} />
                              </div>
                            </div>
                            <div className="text-right shrink-0 w-20 hidden sm:block">
                              <div className="text-base font-bold text-gray-900">{(f.calls || 0).toLocaleString('en-IN')}</div>
                              <div className="text-xs text-gray-400">calls · {f.users || 0} users</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-base font-bold text-gray-900">{fmt(f.tokens)}</div>
                              <div className="text-xs text-gray-400">{f.percentage}% tokens</div>
                            </div>
                            <div className="text-right shrink-0 w-36 hidden md:block">
                              <div className="text-xs font-mono font-medium text-gray-600 truncate">{f.modelSlug || '—'}</div>
                              <div className="text-[10px] text-gray-400 font-semibold uppercase">{f.vendor || 'Anthropic'}</div>
                            </div>
                            <div className="text-right shrink-0 w-24">
                              <div className="text-sm font-semibold text-[#0D9488] flex items-center justify-end gap-1">
                                {f.isEstimated && (
                                  <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-200 px-1 rounded font-medium shrink-0">Est.</span>
                                )}
                                ₹{f.costINR}
                              </div>
                              <div className="text-xs text-gray-400">{usd(f.costINR)}{f.costPerCallINR != null ? ` · ₹${f.costPerCallINR}/call` : ''}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ═══════════════ USERS TAB ═══════════════ */}
            {activeTab === 'users' && (
              <>
                {/* Top 10 chart */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-[#0D9488]" />
                    Top 10 Students by Cost
                  </h3>
                  <div style={{ height: '300px' }}>
                    <canvas ref={userBarRef} />
                  </div>
                </div>

                {/* Full user table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">Cost per Student</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Sorted by cost · {users.length} accounts · click a row for the feature breakdown</p>
                    </div>
                    <div className="relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search name or email..."
                        className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm w-56 focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] outline-none"
                      />
                    </div>
                  </div>
                  {parseFloat(summary.anonymousCostINR || 0) > 0 && (
                    <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-100 text-xs text-amber-700">
                      ₹{summary.anonymousCostINR} came from calls with no signed-in student (older calls, or pages used before login). New calls are tagged with the student automatically.
                    </div>
                  )}
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm">No user data</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50/80 text-xs text-gray-500 uppercase tracking-wide">
                          <tr>
                            <th className="px-4 py-3 text-left">#</th>
                            <th className="px-4 py-3 text-left">Student</th>
                            <th className="px-4 py-3 text-right">Calls</th>
                            <th className="px-4 py-3 text-right">Tokens</th>
                            <th className="px-4 py-3 text-right">AI ₹</th>
                            <th className="px-4 py-3 text-right">Voice ₹</th>
                            <th className="px-4 py-3 text-right">Total</th>
                            <th className="px-4 py-3 text-right">Last active</th>
                            <th className="px-4 py-3 text-left">Top features by cost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredUsers.map((user, i) => {
                            const isOpen = expandedUser === user.userId;
                            const detail = Object.entries(user.featureDetail || {}).sort((a, b) => b[1].costINR - a[1].costINR);
                            return (
                              <Fragment key={user.userId}>
                                <tr
                                  onClick={() => setExpandedUser(isOpen ? null : user.userId)}
                                  className={`cursor-pointer transition-colors ${isOpen ? 'bg-teal-50/50' : 'hover:bg-gray-50/50'}`}
                                >
                                  <td className="px-4 py-3.5 text-gray-400 font-medium">{i + 1}</td>
                                  <td className="px-4 py-3.5">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0D9488] to-[#0891B2] flex items-center justify-center text-white text-xs font-bold shrink-0">
                                        {(user.name || '?')[0].toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="font-medium text-gray-900 flex items-center gap-1.5">
                                          {user.name}
                                          {user.role && user.role !== 'student' && (
                                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{user.role}</span>
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-400 truncate max-w-[220px]">{[user.email, user.college].filter(Boolean).join(' · ')}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3.5 text-right text-gray-700">{(user.calls || 0).toLocaleString('en-IN')}</td>
                                  <td className="px-4 py-3.5 text-right text-gray-700">{fmt(user.total)}</td>
                                  <td className="px-4 py-3.5 text-right text-gray-700">{cost(user.llmCostINR || 0)}</td>
                                  <td className="px-4 py-3.5 text-right text-gray-700">{cost(user.voiceCostINR || 0)}</td>
                                  <td className="px-4 py-3.5 text-right">
                                    <div className="text-[#0D9488] font-bold">{cost(user.totalCostINR)}</div>
                                    <div className="text-[11px] text-gray-400">{usd(user.totalCostINR)}</div>
                                  </td>
                                  <td className="px-4 py-3.5 text-right text-gray-500 whitespace-nowrap">
                                    {user.lastSeen ? new Date(user.lastSeen).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                                    <div className="text-[11px] text-gray-400">{user.days} day{user.days === 1 ? '' : 's'}</div>
                                  </td>
                                  <td className="px-4 py-3.5">
                                    <div className="flex flex-wrap gap-1.5">
                                      {detail.slice(0, 3).map(([f, d]) => {
                                        const meta = FEATURE_META[f];
                                        return (
                                          <span key={f} className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${meta?.bg || 'bg-gray-100'} ${meta?.text || 'text-gray-600'}`}>
                                            {meta?.label || f} · ₹{d.costINR}
                                          </span>
                                        );
                                      })}
                                      {detail.length > 3 && <span className="text-[11px] text-gray-400">+{detail.length - 3} more</span>}
                                    </div>
                                  </td>
                                </tr>
                                {isOpen && (
                                  <tr className="bg-gray-50/60">
                                    <td colSpan={9} className="px-6 py-4">
                                      {detail.length === 0 ? (
                                        <div className="text-xs text-gray-500">Only voice usage for this account.</div>
                                      ) : (
                                        <table className="w-full text-xs">
                                          <thead className="text-gray-500 uppercase tracking-wide">
                                            <tr>
                                              <th className="py-1.5 text-left">Feature</th>
                                              <th className="py-1.5 text-right">Calls</th>
                                              <th className="py-1.5 text-right">Tokens</th>
                                              <th className="py-1.5 text-right">Cost ₹</th>
                                              <th className="py-1.5 text-right">Cost $</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-100">
                                            {detail.map(([f, d]) => (
                                              <tr key={f}>
                                                <td className="py-1.5 text-gray-800 font-medium">{FEATURE_META[f]?.label || f}</td>
                                                <td className="py-1.5 text-right text-gray-600">{d.calls || '—'}</td>
                                                <td className="py-1.5 text-right text-gray-600">{fmt(d.tokens)}</td>
                                                <td className="py-1.5 text-right text-[#0D9488] font-semibold">{cost(d.costINR)}</td>
                                                <td className="py-1.5 text-right text-gray-500">{usd(d.costINR)}</td>
                                              </tr>
                                            ))}
                                            {(user.voiceCostINR || 0) > 0 && (
                                              <tr>
                                                <td className="py-1.5 text-gray-800 font-medium">AI voice (text-to-speech)</td>
                                                <td className="py-1.5 text-right text-gray-600">—</td>
                                                <td className="py-1.5 text-right text-gray-600">{fmt(user.voiceChars || 0)} chars</td>
                                                <td className="py-1.5 text-right text-[#0D9488] font-semibold">{cost(user.voiceCostINR)}</td>
                                                <td className="py-1.5 text-right text-gray-500">{usd(user.voiceCostINR)}</td>
                                              </tr>
                                            )}
                                          </tbody>
                                        </table>
                                      )}
                                      <div className="text-[11px] text-gray-400 mt-2">First seen {user.firstSeen} · UID {user.userId}</div>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ═══════════════ API CALLS TAB ═══════════════ */}
            {activeTab === 'calls' && (() => {
              const calls = (analyticsData.recentCalls || []).filter(c => {
                if (!callSearch) return true;
                const q = callSearch.toLowerCase();
                return [c.name, c.email, c.feature, FEATURE_META[c.feature]?.label, c.model]
                  .some(v => (v || '').toLowerCase().includes(q));
              });
              return (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-[#0D9488]" />
                        Every API call
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">Latest 500 calls in this period, newest first · recorded from 14 Nov 2026 onwards</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={callSearch}
                          onChange={(e) => setCallSearch(e.target.value)}
                          placeholder="Student, feature or model..."
                          className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm w-56 focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] outline-none"
                        />
                      </div>
                      <button
                        onClick={exportCallsCSV}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-xs font-semibold transition-all shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        CSV
                      </button>
                    </div>
                  </div>
                  {calls.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm">No calls recorded in this period yet</div>
                  ) : (
                    <div className="overflow-x-auto max-h-[640px]">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left">Time (IST)</th>
                            <th className="px-4 py-3 text-left">Student</th>
                            <th className="px-4 py-3 text-left">Feature</th>
                            <th className="px-4 py-3 text-left">Model</th>
                            <th className="px-4 py-3 text-right">In / Out</th>
                            <th className="px-4 py-3 text-right">Cost ₹</th>
                            <th className="px-4 py-3 text-right">Cost $</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {calls.map(c => {
                            const meta = FEATURE_META[c.feature];
                            return (
                              <tr key={c.id} className="hover:bg-gray-50/50">
                                <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                                  {c.time ? new Date(c.time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className="font-medium text-gray-900">{c.name}</div>
                                  {c.email && <div className="text-[11px] text-gray-400">{c.email}</div>}
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${meta?.bg || 'bg-gray-100'} ${meta?.text || 'text-gray-600'}`}>
                                    {meta?.label || c.feature}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-xs font-mono text-gray-600">{c.model}</td>
                                <td className="px-4 py-2.5 text-right text-gray-600 whitespace-nowrap">
                                  {c.kind === 'tts' ? `${(c.chars || 0).toLocaleString('en-IN')} chars` : `${(c.inputTokens || 0).toLocaleString('en-IN')} / ${(c.outputTokens || 0).toLocaleString('en-IN')}`}
                                </td>
                                <td className="px-4 py-2.5 text-right text-[#0D9488] font-semibold">₹{Number(c.costINR || 0).toFixed(3)}</td>
                                <td className="px-4 py-2.5 text-right text-gray-500">${Number(c.costUSD || 0).toFixed(4)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ═══════════════ DAILY LOG TAB ═══════════════ */}
            {activeTab === 'daily' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#0D9488]" />
                      Day-Wise Usage Breakdown
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">Click column headers to sort. {analyticsData?.summary?.dateRange ? `${analyticsData.summary.dateRange.start} → ${analyticsData.summary.dateRange.end}` : ''}</p>
                  </div>
                  <button
                    onClick={() => {
                      const rows = [
                        ['Date', 'Calls', 'Tokens', 'AI Cost (₹)', 'TTS Cost (₹)', 'STT Cost (₹)', 'Total Cost (₹)', 'Active Users'],
                        ...[...daily].map(d => [d.date, d.calls || 0, d.total, parseFloat(d.llmCostINR || 0).toFixed(2), parseFloat(d.ttsCostINR || 0).toFixed(2), parseFloat(d.sttCostINR || 0).toFixed(2), parseFloat(d.totalCostINR || 0).toFixed(2), d.users]),
                      ];
                      const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
                      const a = document.createElement('a');
                      a.href = URL.createObjectURL(blob);
                      a.download = `bridge-daily-usage-${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-xs font-semibold transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50/80 text-xs text-gray-500 uppercase tracking-wide sticky top-0">
                      <tr>
                        {[
                          { key: 'date', label: 'Date' },
                          { key: 'calls', label: 'Calls' },
                          { key: 'total', label: 'Tokens' },
                          { key: 'llmCostINR', label: 'AI Cost ₹' },
                          { key: 'ttsCostINR', label: 'TTS ₹' },
                          { key: 'sttCostINR', label: 'STT ₹' },
                          { key: 'totalCostINR', label: 'Total ₹' },
                          { key: 'users', label: 'Users' },
                        ].map(col => (
                          <th
                            key={col.key}
                            onClick={() => {
                              if (dailySortKey === col.key) setDailySortDir(d => d === 'asc' ? 'desc' : 'asc');
                              else { setDailySortKey(col.key); setDailySortDir('desc'); }
                            }}
                            className="px-4 py-3 text-left cursor-pointer select-none hover:text-gray-800 transition-colors"
                          >
                            {col.label} {dailySortKey === col.key ? (dailySortDir === 'asc' ? '↑' : '↓') : ''}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {[...daily]
                        .sort((a, b) => {
                          const av = a[dailySortKey] ?? '';
                          const bv = b[dailySortKey] ?? '';
                          if (typeof av === 'number') return dailySortDir === 'asc' ? av - bv : bv - av;
                          return dailySortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
                        })
                        .map((stat) => (
                          <tr key={stat.date} className={`transition-colors ${stat.isToday ? 'bg-teal-50/60' : 'hover:bg-gray-50/40'}`}>
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {new Date(stat.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                              {stat.isToday && <span className="ml-2 text-[10px] bg-[#0D9488] text-white px-1.5 py-0.5 rounded-full font-bold uppercase">Today</span>}
                            </td>
                            <td className="px-4 py-3 text-gray-700">{stat.calls || 0}</td>
                            <td className="px-4 py-3 font-bold text-gray-900">{fmt(stat.total)}</td>
                            <td className="px-4 py-3 text-[#0D9488] font-semibold">₹{parseFloat(stat.llmCostINR || 0).toFixed(2)}</td>
                            <td className="px-4 py-3 text-gray-600">₹{parseFloat(stat.ttsCostINR || 0).toFixed(2)}</td>
                            <td className="px-4 py-3 text-gray-600">₹{parseFloat(stat.sttCostINR || 0).toFixed(2)}</td>
                            <td className="px-4 py-3 font-semibold text-gray-800">₹{parseFloat(stat.totalCostINR || 0).toFixed(2)}</td>
                            <td className="px-4 py-3 text-gray-500">{stat.users}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {daily.length === 0 && (
                    <div className="text-center py-12 text-gray-400 text-sm">No data for this period</div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
