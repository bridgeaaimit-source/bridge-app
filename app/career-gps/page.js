"use client";
import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { CheckCircle, Circle, ArrowRight, ExternalLink, Target, BookOpen, Zap, AlertTriangle, MapPin, GraduationCap, Briefcase, ChevronRight } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useCareerGPS } from "@/hooks/useCareerGPS";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const item      = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } };

const STAGES = [
  { id: "10th",       label: "Class 10th",  icon: "🏫" },
  { id: "12th",       label: "Class 12th",  icon: "📚" },
  { id: "graduation", label: "Graduation",  icon: "🎓" },
  { id: "postgrad",   label: "Post Grad",   icon: "🚀" },
  { id: "career-intelligence", label: "Career Intelligence", icon: "🧠" },
];

/* ── Animated score ring ── */
function MarketFitRing({ score, loading }) {
  const [displayScore, setDisplayScore] = useState(0);
  const [dashOffset, setDashOffset] = useState(0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (!score || loading) return;
    const duration = 1200;
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore((score * eased).toFixed(1));
      setDashOffset(circumference - eased * (score / 10) * circumference);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score, loading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="skeleton w-36 h-36 rounded-full" />
        <div className="skeleton h-4 w-40 rounded" />
      </div>
    );
  }

  const color = score >= 8 ? "#22c55e" : score >= 6 ? "#0D9488" : score >= 4 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="#F0FDFA" strokeWidth="10" />
          <circle
            cx="64" cy="64" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset || circumference}
            style={{ transition: "stroke-dashoffset 0.05s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ fontFamily: "Syne, sans-serif", color }}>{displayScore}</span>
          <span className="text-xs text-gray-400">out of 10</span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className="text-sm font-bold text-gray-900">Market Fit Score</div>
        <div className="text-xs text-gray-500 mt-0.5">How much the market wants YOU</div>
      </div>
    </div>
  );
}

/* ── Score breakdown bars ── */
function ScoreBreakdown({ breakdown, loading }) {
  if (loading) return <div className="space-y-3"><div className="skeleton h-6 w-full rounded" /><div className="skeleton h-6 w-5/6 rounded" /><div className="skeleton h-6 w-4/6 rounded" /></div>;
  const items = [
    { key: "skills",   label: "Skills Match",   icon: Zap },
    { key: "degree",   label: "Degree Match",   icon: GraduationCap },
    { key: "location", label: "Location Match", icon: MapPin },
    { key: "salary",   label: "Salary Align",   icon: Briefcase },
  ];
  return (
    <div className="space-y-3">
      {items.map(({ key, label, icon: Icon }, i) => (
        <div key={key}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-gray-600 font-medium"><Icon className="w-3 h-3" />{label}</span>
            <span className="font-bold text-gray-900">{breakdown?.[key] || 0}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <m.div
              initial={{ width: 0 }}
              whileInView={{ width: `${breakdown?.[key] || 0}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }}
              className="h-full rounded-full bg-gradient-to-r from-[#0D9488] to-[#14B8A6]"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Skill gaps ── */
function SkillGaps({ gaps, loading }) {
  if (loading) return <div className="space-y-4"><div className="skeleton h-12 w-full rounded-xl" /><div className="skeleton h-12 w-full rounded-xl" /><div className="skeleton h-12 w-full rounded-xl" /></div>;
  return (
    <div className="space-y-4">
      {(gaps || []).map((g, i) => (
        <m.div key={g.skill} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-gray-800">{g.skill}</span>
            <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${g.priority === "high" ? "bg-red-50 text-red-600" : g.priority === "medium" ? "bg-amber-50 text-amber-600" : "bg-[#F0FDFA] text-[#0D9488]"}`}>
              {g.priority === "high" ? "🔥 Critical" : g.priority === "medium" ? "⚡ Important" : "✓ Good"}
            </span>
          </div>
          <div className="relative h-5 bg-gray-100 rounded-full overflow-hidden">
            {/* Required bar (ghost) */}
            <m.div
              initial={{ width: 0 }}
              whileInView={{ width: `${g.required}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.08 }}
              className="absolute top-0 left-0 h-full rounded-full border-2 border-[#0D9488]/30 bg-transparent"
            />
            {/* User bar */}
            <m.div
              initial={{ width: 0 }}
              whileInView={{ width: `${g.userLevel}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
              className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#0D9488] to-[#14B8A6]"
            />
          </div>
          <div className="flex justify-between text-xs mt-1 text-gray-400">
            <span>You: {g.userLevel}%</span>
            <span className="text-red-500">Gap: {g.required - g.userLevel}%</span>
            <span>Required: {g.required}%</span>
          </div>
        </m.div>
      ))}
    </div>
  );
}

/* ── Timeline ── */
function JourneyTimeline({ timeline, loading }) {
  if (loading) return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-14 w-full rounded-xl" />)}</div>;
  return (
    <div className="relative">
      <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-gray-100" />
      <div className="space-y-4">
        {(timeline || []).map((t, i) => (
          <m.div
            key={t.id}
            initial={{ x: -32, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12, duration: 0.5 }}
            className="flex gap-4 items-start relative"
          >
            {/* Node */}
            <div className="relative z-10 shrink-0">
              {t.status === "done" ? (
                <div className="w-10 h-10 bg-[#0D9488] rounded-full flex items-center justify-center shadow-[0_0_0_4px_#CCFBF1]">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              ) : t.status === "active" ? (
                <m.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-10 h-10 bg-[#0D9488] rounded-full flex items-center justify-center shadow-[0_0_0_6px_#CCFBF1]"
                >
                  <div className="w-3 h-3 bg-white rounded-full" />
                </m.div>
              ) : (
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-200">
                  <Circle className="w-5 h-5 text-gray-300" />
                </div>
              )}
            </div>
            {/* Content */}
            <div className="flex-1 pt-1.5 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-semibold ${t.status === "done" ? "text-gray-500 line-through" : t.status === "active" ? "text-gray-900" : "text-gray-400"}`}>
                  {t.title}
                </span>
                {t.status === "active" && (
                  <span className="badge-shimmer text-xs bg-[#CCFBF1] text-[#0D9488] px-2 py-0.5 rounded-full font-bold">In Progress</span>
                )}
                {t.status === "done" && <span className="text-xs text-[#0D9488] font-medium">{t.date}</span>}
              </div>
              {t.status === "active" && t.progress !== undefined && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Progress</span><span>{t.progress}%</span></div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <m.div
                      initial={{ width: 0 }}
                      animate={{ width: `${t.progress}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                      className="h-full rounded-full bg-gradient-to-r from-[#0D9488] to-[#14B8A6]"
                    />
                  </div>
                </div>
              )}
              {(t.status === "upcoming" || t.status === "active") && t.courseUrl && (
                <a href={t.courseUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-[#0D9488] hover:underline">
                  <ExternalLink className="w-3 h-3" /> Start learning
                </a>
              )}
            </div>
          </m.div>
        ))}
      </div>
    </div>
  );
}

/* ── Stage Selector ── */
function StageSelector({ active, onChange }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
      {STAGES.map((s) => (
        <m.button
          key={s.id}
          onClick={() => onChange(s.id)}
          whileTap={{ scale: 0.97 }}
          animate={{ scale: active === s.id ? 1.02 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-colors ${
            active === s.id
              ? "bg-[#00C4A7] border-[#00C4A7] text-white shadow-md shadow-[#00C4A7]/20"
              : "bg-white/70 backdrop-blur-md border-white/30 text-gray-650 hover:border-[#00C4A7] hover:text-[#00C4A7]"
          }`}
        >
          <span className="text-xl">{s.icon}</span>
          {s.label}
        </m.button>
      ))}
    </div>
  );
}

/* ── 10th stage content ── */
function Stage10th({ stageData }) {
  return (
    <m.div key="10th" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(stageData?.streams || []).map((s, i) => (
          <m.div key={s.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,196,167,0.15)" }}
            className="bg-white/70 backdrop-blur-md border border-white/30 rounded-3xl p-5 shadow-sm">
            <div className="font-bold text-gray-900 mb-1" style={{ fontFamily: "Syne, sans-serif" }}>{s.name}</div>
            <div className="text-xs text-[#0D9488] font-semibold mb-3">{s.trend}</div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">Avg salary in 4yr</span>
              <span className="font-bold text-gray-900">{s.avgSalary}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
              <m.div initial={{ width: 0 }} whileInView={{ width: `${s.demandScore}%` }} viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1 }} className="h-full rounded-full bg-gradient-to-r from-[#0D9488] to-[#14B8A6]" />
            </div>
            <div className="flex flex-wrap gap-1">
              {s.careers.map(c => <span key={c} className="text-xs bg-[#F0FDFA] text-[#0D9488] px-2 py-0.5 rounded-full border border-[#CCFBF1]">{c}</span>)}
            </div>
          </m.div>
        ))}
      </div>
    </m.div>
  );
}

/* ── 12th stage content ── */
function Stage12th({ stageData }) {
  return (
    <m.div key="12th" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(stageData?.degrees || []).map((d, i) => (
          <m.div key={d.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,196,167,0.15)" }}
            className="bg-white/70 backdrop-blur-md border border-white/30 rounded-3xl p-5 shadow-sm">
            <div className="font-bold text-gray-900 mb-1" style={{ fontFamily: "Syne, sans-serif" }}>{d.name}</div>
            <div className="flex items-center justify-between mb-3">
              <div><span className="text-xs text-gray-400">ROI</span><div className="font-bold text-[#0D9488]">{d.roi}</div></div>
              <div className="text-right"><span className="text-xs text-gray-400">Avg salary</span><div className="font-bold text-gray-900">{d.avgSalary}</div></div>
              <div className="text-right"><span className="text-xs text-gray-400">Total fees</span><div className="text-sm text-gray-600">{d.fees}</div></div>
            </div>
            <div className="flex flex-wrap gap-1">
              {d.topColleges.map(c => <span key={c} className="text-xs bg-[#F0FDFA] text-[#0D9488] px-2 py-0.5 rounded-full border border-[#CCFBF1]">{c}</span>)}
            </div>
          </m.div>
        ))}
      </div>
    </m.div>
  );
}

/* ── Post Grad stage content ── */
function StagePostGrad({ stageData }) {
  return (
    <m.div key="postgrad" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(stageData?.paths || []).map((p, i) => (
          <m.div key={p.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,196,167,0.15)" }}
            className="bg-white/70 backdrop-blur-md border border-white/30 rounded-3xl p-5 shadow-sm">
            <div className="font-bold text-gray-900 mb-3" style={{ fontFamily: "Syne, sans-serif" }}>{p.name}</div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-[#F0FDFA] rounded-xl p-2 text-center"><div className="text-xs text-gray-500">ROI timeline</div><div className="font-bold text-[#0D9488] text-sm">{p.roi}</div></div>
              <div className="bg-gray-50 rounded-xl p-2 text-center"><div className="text-xs text-gray-500">Earning at 3yr</div><div className="font-bold text-gray-900 text-sm">{p.earningAt3yr}</div></div>
            </div>
            <div className="text-xs text-gray-500 bg-amber-50 px-3 py-2 rounded-lg">🎯 Best for: <span className="font-semibold text-amber-700">{p.bestFor}</span></div>
          </m.div>
        ))}
      </div>
    </m.div>
  );
}

/* ── Career Intelligence stage content ── */
function StageCareerIntelligence({ stageData }) {
  return (
    <m.div key="career-intelligence" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
      <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-3xl p-6 shadow-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🧠</div>
          <h3 className="font-bold text-gray-900 text-xl mb-1" style={{ fontFamily: "Syne, sans-serif" }}>Career Intelligence</h3>
          <p className="text-sm text-gray-500">AI-powered career gap analysis and recommendations</p>
        </div>
        <a href="/career-intelligence" className="block w-full">
          <m.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white px-6 py-3 rounded-xl font-semibold shadow hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" /> Open Career Intelligence
            <ArrowRight className="w-4 h-4" />
          </m.button>
        </a>
      </div>
    </m.div>
  );
}

/* ── Recommendations ── */
function Recommendations({ recs, loading }) {
  if (loading) return <div className="space-y-3"><div className="skeleton h-16 w-full rounded-xl" /><div className="skeleton h-16 w-full rounded-xl" /></div>;
  return (
    <div className="space-y-3">
      {(recs || []).map((r, i) => (
        <m.a
          key={r.title}
          href={r.url}
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08 }}
          whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(13,148,136,0.12)" }}
          className={`flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-sm block ${r.urgent ? "bg-[#00C4A7]/10 border-[#00C4A7]/30 text-[#00C4A7]" : "bg-white/40 border-white/30 text-slate-700"}`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${r.urgent ? "bg-[#CCFBF1]" : "bg-gray-100"}`}>
            {r.urgent ? <Zap className="w-4 h-4 text-[#0D9488]" /> : <BookOpen className="w-4 h-4 text-gray-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-gray-900 flex items-center gap-1">
              {r.urgent && <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold">Urgent</span>}
              {r.title}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{r.reason}</div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
        </m.a>
      ))}
    </div>
  );
}

/* ── Main page ── */
export default function CareerGPSPage() {
  const [userId, setUserId] = useState(null);
  const [activeStage, setActiveStage] = useState("graduation");
  const isBypass = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";

  useEffect(() => {
    if (isBypass) {
      const timer = setTimeout(() => setUserId("bypass"), 0);
      return () => clearTimeout(timer);
    }
    const unsub = onAuthStateChanged(auth, (u) => setUserId(u?.uid || null));
    return unsub;
  }, []);

  const { gpsData, loading } = useCareerGPS(userId);

  const stageContent = gpsData?.stageData?.[activeStage];

  return (
    <AppShell>
      <m.div variants={container} initial="hidden" animate="visible" className="max-w-[1200px] mx-auto px-4 md:px-10 py-6 md:py-10">

        {/* Header */}
        <m.div variants={item} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900" style={{ fontFamily: "Syne, sans-serif" }}>Career GPS</h1>
            <span className="text-xs bg-[#CCFBF1] text-[#0D9488] px-3 py-1 rounded-full font-bold border border-[#99F6E4]">Personalized</span>
          </div>
          <p className="text-gray-500 text-sm">Your navigation system from where you are to where you want to be</p>
        </m.div>

        {/* Stage Selector */}
        <m.div variants={item}>
          <StageSelector active={activeStage} onChange={setActiveStage} />
        </m.div>

        {/* Stage title */}
        <AnimatePresence mode="wait">
          <m.div key={activeStage + "-title"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="mb-6">
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "Syne, sans-serif" }}>{stageContent?.title || ""}</h2>
            <p className="text-sm text-gray-500">{stageContent?.subtitle || ""}</p>
          </m.div>
        </AnimatePresence>

        {/* Graduation stage — 2-column layout */}
        {activeStage === "graduation" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Market Fit Score */}
              <m.div variants={item} whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,196,167,0.15)" }}
                className="bg-white/70 backdrop-blur-md border border-white/30 rounded-3xl shadow-sm p-6">
                <MarketFitRing score={gpsData?.marketFitScore} loading={loading} />
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Score Breakdown</div>
                  <ScoreBreakdown breakdown={gpsData?.scoreBreakdown} loading={loading} />
                </div>
              </m.div>

              {/* Recommendations */}
              <m.div variants={item} className="bg-white/70 backdrop-blur-md border border-white/30 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#0D9488]" />
                  <h2 className="font-bold text-gray-900" style={{ fontFamily: "Syne, sans-serif" }}>Your Action Plan</h2>
                </div>
                <div className="p-4">
                  <Recommendations recs={gpsData?.recommendations} loading={loading} />
                </div>
              </m.div>
            </div>

            {/* Right column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Journey Timeline */}
              <m.div variants={item} className="bg-white/70 backdrop-blur-md border border-white/30 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <span className="text-lg">🗺️</span>
                  <h2 className="font-bold text-gray-900" style={{ fontFamily: "Syne, sans-serif" }}>Your Journey</h2>
                </div>
                <div className="p-5">
                  <JourneyTimeline timeline={gpsData?.timeline} loading={loading} />
                </div>
              </m.div>

              {/* Skill Gaps */}
              <m.div variants={item} className="bg-white/70 backdrop-blur-md border border-white/30 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h2 className="font-bold text-gray-900" style={{ fontFamily: "Syne, sans-serif" }}>Skill Gaps</h2>
                  <span className="ml-auto text-xs text-gray-400">vs market requirements</span>
                </div>
                <div className="p-5">
                  {loading ? (
                    <div className="space-y-4"><div className="skeleton h-14 w-full rounded-xl" /><div className="skeleton h-14 w-full rounded-xl" /><div className="skeleton h-14 w-5/6 rounded-xl" /></div>
                  ) : (
                    <SkillGaps gaps={gpsData?.skillGaps} loading={loading} />
                  )}
                </div>
                <div className="px-5 pb-5">
                  <a href="/smart-interview" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow hover:opacity-90 transition-opacity">
                    <Zap className="w-4 h-4" /> Practice Gap Skills in AI Interview
                  </a>
                </div>
              </m.div>
            </div>
          </div>
        ) : (
          /* Other stages */
          <AnimatePresence mode="wait">
            {activeStage === "10th"              && <Stage10th              key="10th"              stageData={stageContent} />}
            {activeStage === "12th"              && <Stage12th              key="12th"              stageData={stageContent} />}
            {activeStage === "postgrad"           && <StagePostGrad           key="postgrad"           stageData={stageContent} />}
            {activeStage === "career-intelligence" && <StageCareerIntelligence key="career-intelligence" stageData={stageContent} />}
          </AnimatePresence>
        )}

        {/* Connect to SkillPulse CTA */}
        <m.div variants={item} className="mt-8 bg-gradient-to-r from-[#0D9488] to-[#14B8A6] rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-bold text-lg mb-1" style={{ fontFamily: "Syne, sans-serif" }}>See what the market wants THIS week</div>
            <div className="text-[#CCFBF1] text-sm">SkillPulse shows live hiring trends — your GPS updates from it automatically</div>
          </div>
          <a href="/skillpulse" className="shrink-0 bg-white text-[#0D9488] px-5 py-2.5 rounded-xl font-bold text-sm hover:shadow-lg transition-shadow flex items-center gap-2">
            Open SkillPulse <ArrowRight className="w-4 h-4" />
          </a>
        </m.div>

      </m.div>
    </AppShell>
  );
}
