"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  ArrowRight, Sun, Moon, Menu, X, CheckCircle, Check, Star,
  Search, Shield, Mic, Users, BarChart2, Brain, Trophy, Zap,
  Video, MessageSquare, TrendingUp, Eye, ChevronRight
} from "lucide-react";
import Link from "next/link";

/* ─── DARK MODE HOOK ────────────────────────────────── */
function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("bridge_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  const toggle = () => {
    setDark(d => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("bridge_theme", next ? "dark" : "light");
      return next;
    });
  };
  return [dark, toggle];
}

/* ─── SCORE GAUGE SVG ───────────────────────────────── */
function ScoreGauge({ score, max = 1000, size = 180, strokeWidth = 12 }) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - score / max);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(45,212,191,0.12)" strokeWidth={strokeWidth} />
        <motion.circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="url(#gaugeGrad)" strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.2, ease: "easeOut" }} />
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0D9488" />
            <stop offset="100%" stopColor="#2DD4BF" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span className="text-3xl font-black text-[#0D9488]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>{score}</motion.span>
        <span className="text-xs text-gray-400 dark:text-gray-500">/ {max}</span>
      </div>
    </div>
  );
}

/* ─── METRIC BAR ────────────────────────────────────── */
function MetricBar({ label, value, delay = 0 }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-semibold text-[#0D9488]">{value}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-[#0D9488] to-[#2DD4BF]"
          initial={{ width: 0 }} animate={{ width: `${value}%` }}
          transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }} />
      </div>
    </div>
  );
}

/* ─── MARQUEE ───────────────────────────────────────── */
function Marquee({ items, duration = 30 }) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden relative">
      <div className="absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-[#FAF9F6] dark:from-[#030908] to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-[#FAF9F6] dark:from-[#030908] to-transparent pointer-events-none" />
      <motion.div className="flex gap-4 whitespace-nowrap"
        animate={{ x: [0, "-50%"] }} transition={{ duration, repeat: Infinity, ease: "linear" }}>
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center px-5 py-2 rounded-full border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-[#0E1A18]/60 backdrop-blur-sm text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── TIMELINE STEP ─────────────────────────────────── */
function TimelineStep({ num, title, desc, icon: Icon, isLast }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <div ref={ref} className="flex gap-6">
      <div className="flex flex-col items-center">
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={inView ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-12 h-12 rounded-full border-2 border-[#0D9488] bg-white dark:bg-[#0A1211] flex items-center justify-center flex-shrink-0 shadow-[0_0_16px_rgba(13,148,136,0.25)]">
          <Icon className="w-5 h-5 text-[#0D9488]" />
        </motion.div>
        {!isLast && <div className="w-px flex-1 bg-gradient-to-b from-[#0D9488]/60 to-transparent mt-2 min-h-[48px]" />}
      </div>
      <motion.div initial={{ opacity: 0, x: 24 }} animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.2 }} className="pb-12">
        <span className="text-xs font-mono text-[#0D9488] mb-1 block">0{num}</span>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-md">{desc}</p>
      </motion.div>
    </div>
  );
}

/* ─── RECRUIT ROW ───────────────────────────────────── */
function RecruitRow({ name, college, track, score }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-[#0E1A18]/50 backdrop-blur-sm hover:border-[#0D9488]/40 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0D9488] to-[#2DD4BF] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
          {name.split(" ").map(w => w[0]).join("").slice(0, 2)}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{college}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-[#F0FDFA] dark:bg-[#0D9488]/10 text-[#0D9488] border border-[#CCFBF1] dark:border-[#0D9488]/20">{track}</span>
        <span className="font-bold text-sm text-gray-800 dark:text-white">{score}<span className="text-gray-400 font-normal">/1000</span></span>
        <Shield className="w-4 h-4 text-[#0D9488]" />
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function LandingPage() {
  const [dark, toggleDark] = useDarkMode();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Consulting");
  const [recruitSearch, setRecruitSearch] = useState("");
  const [recruitFilter, setRecruitFilter] = useState("All");

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const TABS = {
    Consulting: {
      score: 842, role: "Management Consultant", sub: "BCG · McKinsey · Deloitte",
      metrics: [
        { label: "Structured Thinking", value: 88 }, { label: "Pacing & Delivery", value: 84 },
        { label: "Composure Under Pressure", value: 79 }, { label: "Case Framework", value: 91 },
      ],
      transcript: "Walk me through a profitability framework for a mid-size FMCG brand seeing 15% margin compression in Q2.",
    },
    Product: {
      score: 815, role: "Product Manager", sub: "Razorpay · Zepto · CRED",
      metrics: [
        { label: "Product Intuition", value: 82 }, { label: "User Empathy", value: 86 },
        { label: "Prioritization Logic", value: 77 }, { label: "Metrics Fluency", value: 80 },
      ],
      transcript: "You're the PM for Google Pay India. DAU drops 18% on Tuesdays. How do you diagnose and respond?",
    },
    Leadership: {
      score: 798, role: "Leadership Track", sub: "TATA · Mahindra · Aditya Birla",
      metrics: [
        { label: "Conflict Resolution", value: 81 }, { label: "Stakeholder Influence", value: 76 },
        { label: "Vision Communication", value: 84 }, { label: "Team Alignment", value: 79 },
      ],
      transcript: "You've inherited a disengaged team of 12. Two are actively disruptive. What's your 30-day plan?",
    },
    Tech: {
      score: 871, role: "Software Engineer", sub: "Google · Microsoft · Flipkart",
      metrics: [
        { label: "System Design", value: 89 }, { label: "DSA Fluency", value: 85 },
        { label: "Code Quality", value: 88 }, { label: "Trade-off Reasoning", value: 82 },
      ],
      transcript: "Design a distributed URL shortener handling 100M URLs/day. Walk through your architecture choices.",
    },
  };
  const current = TABS[activeTab];

  const ALL_RECRUITS = [
    { name: "Siddharth Roy", college: "IIM Ahmedabad", track: "Consulting", score: 865 },
    { name: "Priya Sharma", college: "IIT Bombay", track: "Tech", score: 891 },
    { name: "Arjun Menon", college: "BITS Pilani", track: "Product", score: 823 },
    { name: "Kavya Nair", college: "ISB Hyderabad", track: "Leadership", score: 844 },
    { name: "Rohan Das", college: "IIM Calcutta", track: "Consulting", score: 812 },
    { name: "Sneha Iyer", college: "NIT Trichy", track: "Tech", score: 876 },
    { name: "Vikram Patel", college: "IIM Bangalore", track: "Product", score: 809 },
    { name: "Ananya Gupta", college: "XLRI Jamshedpur", track: "Leadership", score: 858 },
  ];

  const filteredRecruits = useMemo(() =>
    ALL_RECRUITS.filter(r => {
      const s = r.name.toLowerCase().includes(recruitSearch.toLowerCase()) || r.college.toLowerCase().includes(recruitSearch.toLowerCase());
      const f = recruitFilter === "All" || r.track === recruitFilter;
      return s && f;
    }),
  [recruitSearch, recruitFilter]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#030908] text-gray-900 dark:text-white transition-colors duration-300 overflow-x-hidden" style={{ fontFamily: "Inter, sans-serif" }}>

      {/* ── BACKGROUND SYSTEM ──────────────────────────── */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(13,148,136,0.18) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(45,212,191,0.12) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 7.5 }} />
        <div className="absolute inset-0 opacity-[0.07] dark:opacity-[0.12]"
          style={{ backgroundImage: "radial-gradient(#2dd4bf 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <motion.div className="absolute top-[30%] h-[1px] w-[300px]"
          style={{ background: "linear-gradient(to right, transparent, rgba(13,148,136,0.7), transparent)", filter: "drop-shadow(0 0 6px #0D9488)", transform: "skewY(-2deg)" }}
          animate={{ x: ["-100vw", "110vw"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear", repeatDelay: 4 }} />
        <motion.div className="absolute top-[65%] h-[1px] w-[200px]"
          style={{ background: "linear-gradient(to left, transparent, rgba(45,212,191,0.5), transparent)", filter: "drop-shadow(0 0 4px #2DD4BF)", transform: "skewY(1.5deg)" }}
          animate={{ x: ["110vw", "-100vw"] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear", repeatDelay: 6 }} />
        <motion.div className="absolute top-[50%] h-[2px] w-[120px]"
          style={{ background: "linear-gradient(to right, transparent, rgba(13,148,136,0.9), transparent)", filter: "drop-shadow(0 0 8px #0D9488)" }}
          animate={{ x: ["-10%", "110vw"] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear", repeatDelay: 3 }} />
        <motion.div className="absolute left-[40%] w-[2px] h-[120px]"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(45,212,191,0.8), transparent)", filter: "drop-shadow(0 0 8px #2DD4BF)" }}
          animate={{ y: ["-10%", "110vh"] }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear", repeatDelay: 2 }} />
      </div>

      {/* ── NAVBAR ─────────────────────────────────────── */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "backdrop-blur-md bg-white/80 dark:bg-black/60 border-b border-gray-200/50 dark:border-white/8 shadow-sm" : ""}`}>
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0D9488] to-[#2DD4BF] flex items-center justify-center">
              <span className="text-white font-black text-sm">B</span>
            </div>
            <span style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }} className="font-black text-xl tracking-tight text-gray-900 dark:text-white">Bridge<span className="text-[#0D9488]">AI</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-300">
            {[["#product","Product"],["#score","Score"],["#recruiters","Recruiters"],["#pricing","Pricing"]].map(([h,l]) => (
              <a key={h} href={h} className="hover:text-[#0D9488] transition-colors">{l}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              {dark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
            </button>
            <Link href="/login" className="hidden sm:inline-flex px-4 py-2 rounded-lg border border-gray-300 dark:border-white/20 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">Login</Link>
            <Link href="/login" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0D524C] hover:bg-[#0D9488] text-white text-sm font-semibold transition-colors shadow-[0_0_16px_rgba(13,148,136,0.3)]">
              Start Free <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button onClick={() => setMenuOpen(v => !v)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
              className="md:hidden overflow-hidden bg-white/95 dark:bg-[#030908]/95 backdrop-blur-md border-b border-gray-100 dark:border-white/8">
              <div className="px-6 py-4 flex flex-col gap-4 text-sm font-medium">
                {[["#product","Product"],["#score","Score"],["#recruiters","Recruiters"],["#pricing","Pricing"]].map(([h,l]) => (
                  <a key={h} href={h} onClick={() => setMenuOpen(false)} className="text-gray-700 dark:text-gray-300 hover:text-[#0D9488]">{l}</a>
                ))}
                <Link href="/login" className="text-center py-2.5 rounded-lg bg-[#0D9488] text-white font-semibold">Start Free</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO ───────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8" id="product">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#CCFBF1] dark:border-[#0D9488]/30 bg-[#F0FDFA] dark:bg-[#0D9488]/10 text-xs font-semibold text-[#0D9488] mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] animate-pulse" />
                AI-Powered Career Readiness · India&apos;s #1 Platform
              </div>
              <h1 style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }} className="text-5xl lg:text-6xl font-black tracking-tighter leading-[1.05] text-gray-900 dark:text-white mb-4">
                Become impossible<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0D9488] to-[#2DD4BF]">to ignore.</span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-8 max-w-lg">
                BridgeAI turns raw potential into verified proof. Train with AI interviewers, earn your BRIDGE Score, and walk into placements with institutional credibility.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#0D9488] to-[#0D524C] text-white font-bold shadow-[0_4px_24px_rgba(13,148,136,0.35)] hover:scale-[1.02] transition-transform">
                  Unlock Your BRIDGE Score <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="#score" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  Explore the Framework
                </a>
              </div>
              <div className="mt-8 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex -space-x-2">
                  {[["AK","bg-violet-500"],["PR","bg-pink-500"],["RS","bg-amber-500"],["SP","bg-sky-500"]].map(([i,c]) => (
                    <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-white dark:border-[#030908] flex items-center justify-center text-xs text-white font-bold`}>{i}</div>
                  ))}
                </div>
                <span><strong className="text-gray-800 dark:text-white">2,500+</strong> students trained this month</span>
              </div>
            </motion.div>

            {/* Score Widget */}
            <motion.div initial={{ opacity: 0, y: 32, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}>
              <div className="rounded-2xl border border-gray-200/60 dark:border-white/8 bg-white/70 dark:bg-[#0E1A18]/60 backdrop-blur-md p-6 shadow-[0_8px_40px_rgba(13,148,136,0.08)]">
                <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-900/60 mb-6">
                  {Object.keys(TABS).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2 px-1 rounded-lg text-xs font-semibold transition-all ${activeTab === tab ? "bg-white dark:bg-[#0D9488]/20 text-[#0D9488] shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}>
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="flex gap-6 items-start">
                  <div className="flex flex-col items-center gap-3">
                    <AnimatePresence mode="wait">
                      <motion.div key={activeTab} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.4 }}>
                        <ScoreGauge score={current.score} />
                      </motion.div>
                    </AnimatePresence>
                    <div className="text-center">
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{current.role}</p>
                      <p className="text-xs text-[#0D9488]">{current.sub}</p>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3 min-w-0">
                    <AnimatePresence mode="wait">
                      <motion.div key={activeTab} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.35 }} className="space-y-3">
                        {current.metrics.map((m, i) => <MetricBar key={m.label} label={m.label} value={m.value} delay={i * 0.08} />)}
                      </motion.div>
                    </AnimatePresence>
                    <AnimatePresence mode="wait">
                      <motion.div key={`t-${activeTab}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, delay: 0.2 }}
                        className="mt-4 p-3 rounded-xl border border-[#CCFBF1] dark:border-[#0D9488]/20 bg-[#F0FDFA] dark:bg-[#0D9488]/5">
                        <p className="text-xs text-[#0D9488] font-semibold mb-1">AI Interviewer</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 italic leading-relaxed">&ldquo;{current.transcript}&rdquo;</p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ─────────────────────────────────────── */}
      <section className="py-12 border-y border-gray-100 dark:border-white/5 overflow-hidden">
        <Marquee duration={28} items={[
          "IIT Bombay","IIT Delhi","IIM Ahmedabad","IIM Bangalore","BITS Pilani","ISB Hyderabad","XLRI","NIT Trichy",
          "BCG","McKinsey","Deloitte","Amazon","Microsoft","Razorpay","CRED","Zepto",
        ]} />
      </section>

      {/* ── READINESS JOURNEY ───────────────────────────── */}
      <section className="py-28 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[700px]">
          <div className="text-center mb-16">
            <span className="text-xs font-mono text-[#0D9488] tracking-widest uppercase mb-3 block">The Journey</span>
            <h2 style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }} className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">Your readiness, by design.</h2>
          </div>
          {[
            { title: "Deep Assessment", desc: "AI maps your strengths, blind spots, and communication style across 8 dimensions in the first 20 minutes.", icon: Brain },
            { title: "Active Simulation", desc: "Real-time AI mock interviews tailored to your target role. Voice, video, case, GD — all covered.", icon: Mic },
            { title: "Feedback Loop", desc: "Every session generates a structured debrief with specific language coaching and STAR framework analysis.", icon: MessageSquare },
            { title: "Merit Signalling", desc: "Your BRIDGE Score is computed after each session, creating a verified, growing track record.", icon: TrendingUp },
            { title: "Credibility Layer", desc: "Scores are cryptographically hashed and verifiable by any recruiter through our Registry HUD.", icon: Shield },
            { title: "Placement Ready", desc: "Walk into every interview with AI-matched job roles, smart apply answers, and verified credentials.", icon: Trophy },
          ].map((s, i, arr) => <TimelineStep key={s.title} num={i + 1} title={s.title} desc={s.desc} icon={s.icon} isLast={i === arr.length - 1} />)}
        </div>
      </section>

      {/* ── BRIDGE SCORE ────────────────────────────────── */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-[#F0FDFA]/40 dark:via-[#0D9488]/5 to-transparent" id="score">
        <div className="mx-auto max-w-[600px] text-center">
          <span className="text-xs font-mono text-[#0D9488] tracking-widest uppercase mb-3 block">Verified Credential</span>
          <h2 style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }} className="text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-4">The BRIDGE Score.</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-12">One number that tells the whole story. Earned, not claimed.</p>
          <div className="rounded-2xl border border-[#CCFBF1] dark:border-[#0D9488]/20 bg-white/70 dark:bg-[#0E1A18]/60 backdrop-blur-md p-10 shadow-[0_8px_48px_rgba(13,148,136,0.10)]">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F0FDFA] dark:bg-[#0D9488]/10 border border-[#CCFBF1] dark:border-[#0D9488]/20 text-[10px] font-mono text-[#0D9488] mb-8 tracking-widest">
              <Shield className="w-3 h-3" /> SECURE DECENTRALIZED VERIFICATION ID · #BRG-2025-00418
            </div>
            <div className="flex justify-center mb-8"><ScoreGauge score={860} size={200} strokeWidth={14} /></div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/30 text-emerald-700 dark:text-emerald-400 text-sm font-bold mb-8">
              <CheckCircle className="w-4 h-4" /> Top 2% Nationally Verified
            </div>
            <div className="space-y-3 text-left">
              {[{ label: "Structured Thinking", value: 91 }, { label: "Communication Clarity", value: 86 }, { label: "Composure Under Pressure", value: 83 }].map((m, i) => (
                <MetricBar key={m.label} label={m.label} value={m.value} delay={i * 0.1} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── INTERVIEW SIMULATION ────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-xs font-mono text-[#0D9488] tracking-widest uppercase mb-3 block">Smart Interview</span>
              <h2 style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }} className="text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-4">
                AI that interviews like<br />a real partner-level panel.
              </h2>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6">Voice-to-voice simulation with eye contact tracking, pacing analysis, and instant structured feedback after every answer.</p>
              <ul className="space-y-3">
                {["Resume-contextual first questions — never generic","Real-time vocal pacing & filler word detection","STAR framework gap identification post-session","Supports Consulting, PM, Tech, and Leadership rounds"].map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <Check className="w-4 h-4 text-[#0D9488] mt-0.5 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-gray-200/60 dark:border-white/8 bg-white/70 dark:bg-[#0E1A18]/60 backdrop-blur-md overflow-hidden shadow-[0_8px_40px_rgba(13,148,136,0.08)]">
              <div className="relative bg-gray-900 aspect-video flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0D9488] to-[#2DD4BF] flex items-center justify-center">
                    <Video className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-white text-sm font-medium">You</span>
                </div>
                <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-400/40 backdrop-blur-sm">
                  <Eye className="w-3 h-3 text-green-400" />
                  <span className="text-green-400 text-[10px] font-mono font-semibold">Eye Contact Tracking Active</span>
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                </div>
                <div className="absolute bottom-3 right-3 w-20 rounded-xl overflow-hidden border-2 border-[#0D9488]/50">
                  <div className="bg-gradient-to-br from-[#0D524C] to-[#0D9488] aspect-video flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white/70" />
                  </div>
                  <div className="bg-black/80 px-2 py-0.5 text-[9px] text-center text-white font-mono">AI Panel</div>
                </div>
              </div>
              <div className="p-4 grid grid-cols-3 gap-3 border-t border-gray-100 dark:border-white/5">
                {[{ label: "Vocal Pacing", value: "92/100", color: "text-green-500" }, { label: "Filler Words", value: "2 detected", color: "text-yellow-500" }, { label: "Eye Contact", value: "87%", color: "text-[#0D9488]" }].map(s => (
                  <div key={s.label} className="text-center">
                    <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── GD ROOMS ────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-[#F0FDFA]/30 dark:via-[#0D9488]/3 to-transparent">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="rounded-2xl border border-gray-200/60 dark:border-white/8 bg-white/70 dark:bg-[#0E1A18]/60 backdrop-blur-md p-6 shadow-[0_8px_40px_rgba(13,148,136,0.08)] order-2 lg:order-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-mono text-green-600 dark:text-green-400 font-semibold">GD Session · Live</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { name: "You", color: "from-[#0D9488] to-[#2DD4BF]", icon: <Video className="w-5 h-5 text-white" />, active: true },
                  { name: "AI Moderator", color: "from-violet-500 to-purple-600", icon: <Brain className="w-5 h-5 text-white" />, active: false },
                  { name: "Rahul S.", color: "from-amber-400 to-orange-500", icon: <Users className="w-5 h-5 text-white" />, active: false },
                ].map(p => (
                  <div key={p.name} className={`rounded-xl overflow-hidden border-2 ${p.active ? "border-[#0D9488]" : "border-gray-200 dark:border-gray-700"}`}>
                    <div className={`bg-gradient-to-br ${p.color} aspect-video flex items-center justify-center`}>{p.icon}</div>
                    <div className="bg-gray-900/80 px-2 py-1 text-[10px] text-center text-white">{p.name}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {[
                  { speaker: "Rahul S.", tag: "Consensus Builder", text: "Tesla's real barrier isn't EV tech — it's the charging infrastructure trust deficit.", color: "bg-amber-500" },
                  { speaker: "You", tag: "MECE Framework", text: "Structuring this: Supply-side constraints, demand signals, regulatory headwinds.", color: "bg-[#0D9488]" },
                  { speaker: "AI Moderator", tag: "Facilitator", text: "Strong point. Can someone challenge the infrastructure narrative with data?", color: "bg-violet-500" },
                ].map((line, i) => (
                  <div key={i} className="flex gap-3 text-xs">
                    <div className={`w-5 h-5 rounded-full ${line.color} flex-shrink-0 flex items-center justify-center text-white font-bold`}>{line.speaker[0]}</div>
                    <div>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{line.speaker}</span>
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] bg-[#F0FDFA] dark:bg-[#0D9488]/10 text-[#0D9488] font-mono">{line.tag}</span>
                      <p className="text-gray-500 dark:text-gray-400 mt-0.5">{line.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <span className="text-xs font-mono text-[#0D9488] tracking-widest uppercase mb-3 block">GD Pulse</span>
              <h2 style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }} className="text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-4">
                Group discussions<br />that sharpen, not just simulate.
              </h2>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">AI moderator structures the debate. Real-time speech tagging identifies your framework usage and consensus-building patterns. Post-GD breakdown tells you exactly where you led and where you faded.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CAREER INTELLIGENCE ─────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-xs font-mono text-[#0D9488] tracking-widest uppercase mb-3 block">Career Intelligence</span>
              <h2 style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }} className="text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-4">
                Daily Strategy Digest.<br />Built for GD and cases.
              </h2>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">Every morning, BridgeAI surfaces a real global event — mapped to consulting angles, GD debate points, and interview talking positions.</p>
            </div>
            <div className="rounded-2xl border border-gray-200/60 dark:border-white/8 bg-white/70 dark:bg-[#0E1A18]/60 backdrop-blur-md p-6 shadow-[0_8px_40px_rgba(13,148,136,0.08)]">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0D9488] to-[#2DD4BF] flex items-center justify-center">
                  <BarChart2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900 dark:text-white">Daily Strategy Digest</p>
                  <p className="text-[10px] text-gray-400">Today · May 26, 2026</p>
                </div>
                <span className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              <div className="rounded-xl bg-gradient-to-br from-[#0D9488]/5 to-transparent border border-[#CCFBF1] dark:border-[#0D9488]/20 p-4 mb-4">
                <p className="text-xs font-mono text-[#0D9488] mb-1">GLOBAL BRIEFING</p>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Tesla&apos;s Entry to Indian EV Market</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Competitive dynamics, infrastructure gaps, and regulatory tailwinds reshaping India&apos;s EV landscape.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { title: "Consulting Angle", points: ["Market entry framework", "PESTLE deep-dive", "BCG matrix positioning"] },
                  { title: "GD Debate Points", points: ["Infrastructure deficit", "Domestic vs import duty", "Consumer trust curve"] },
                ].map(col => (
                  <div key={col.title} className="rounded-xl p-3 border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/30">
                    <p className="text-[10px] font-semibold text-[#0D9488] mb-2 uppercase tracking-wide">{col.title}</p>
                    <ul className="space-y-1">
                      {col.points.map(p => (
                        <li key={p} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                          <ChevronRight className="w-3 h-3 text-[#0D9488] flex-shrink-0 mt-0.5" />{p}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── RECRUITER REGISTRY ──────────────────────────── */}
      <section className="py-28 px-4 sm:px-6 lg:px-8" id="recruiters">
        <div className="mx-auto max-w-[900px]">
          <div className="text-center mb-12">
            <span className="text-xs font-mono text-[#0D9488] tracking-widest uppercase mb-3 block">Recruiter Registry</span>
            <h2 style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }} className="text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-3">Verified talent. Zero noise.</h2>
            <p className="text-gray-500 dark:text-gray-400">Every candidate score is cryptographically verified. Filter by track, search by name.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={recruitSearch} onChange={e => setRecruitSearch(e.target.value)} placeholder="Search by name or college..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-[#0E1A18]/60 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#0D9488] transition-colors" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["All", "Consulting", "Product", "Leadership", "Tech"].map(f => (
                <button key={f} onClick={() => setRecruitFilter(f)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${recruitFilter === f ? "bg-[#0D9488] text-white shadow-[0_0_12px_rgba(13,148,136,0.3)]" : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#0D9488]/50 bg-white/50 dark:bg-[#0E1A18]/40"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200/60 dark:border-white/8 bg-white/50 dark:bg-[#0E1A18]/40 backdrop-blur-md overflow-hidden shadow-[0_4px_24px_rgba(13,148,136,0.06)]">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#0D9488]" />
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400">LIVE VERIFIED CANDIDATES · {filteredRecruits.length} results</span>
            </div>
            <div className="p-3 space-y-2 min-h-[240px]">
              <AnimatePresence>
                {filteredRecruits.length > 0 ? filteredRecruits.map(r => <RecruitRow key={r.name} {...r} />) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Search className="w-8 h-8 mb-2 opacity-40" /><p className="text-sm">No candidates match your search.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-[#F0FDFA]/40 dark:via-[#0D9488]/5 to-transparent">
        <div className="mx-auto max-w-[1200px]">
          <div className="text-center mb-12">
            <span className="text-xs font-mono text-[#0D9488] tracking-widest uppercase mb-3 block">Success Stories</span>
            <h2 style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }} className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">They came. They trained. They placed.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { init: "AR", color: "from-violet-500 to-purple-600", name: "Ananya Rao", college: "IIM Bangalore → BCG", score: "868", delta: "+186 pts in 3 weeks", quote: "BCG asked me the exact case types I'd practiced. Bridge felt like insider training." },
              { init: "VK", color: "from-[#0D9488] to-[#2DD4BF]", name: "Vikram Kumar", college: "IIT Delhi → Razorpay PM", score: "841", delta: "+140 pts", quote: "The PM simulations were scarily accurate. First-round offer from Razorpay." },
              { init: "MS", color: "from-amber-400 to-orange-500", name: "Meera Sharma", college: "BITS Pilani → Microsoft", score: "891", delta: "+203 pts in 4 weeks", quote: "System design rounds felt familiar because I'd done them 20 times already on Bridge." },
            ].map(t => (
              <motion.div key={t.name} whileHover={{ y: -4 }} className="rounded-2xl border border-gray-200/60 dark:border-white/8 bg-white/70 dark:bg-[#0E1A18]/60 backdrop-blur-md p-7 shadow-[0_4px_24px_rgba(13,148,136,0.06)]">
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-black text-sm flex-shrink-0`}>{t.init}</div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{t.name}</p>
                    <p className="text-xs text-[#0D9488]">{t.college}</p>
                  </div>
                </div>
                <div className="flex text-yellow-400 mb-3">{[...Array(5)].map((_,i) => <Star key={i} className="w-3.5 h-3.5 fill-current"/>)}</div>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-xs font-bold text-[#0D9488]">Score {t.score}/1000</span>
                  <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-700/30 px-2 py-1 rounded-full font-semibold">{t.delta}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────── */}
      <section className="py-28 px-4 sm:px-6 lg:px-8" id="pricing">
        <div className="mx-auto max-w-[800px]">
          <div className="text-center mb-12">
            <span className="text-xs font-mono text-[#0D9488] tracking-widest uppercase mb-3 block">Pricing</span>
            <h2 style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }} className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">Start free. Go pro when you&apos;re ready.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-[#0E1A18]/60 backdrop-blur-md p-8">
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1">Starter</h3>
              <div className="text-4xl font-black text-gray-900 dark:text-white mb-1">₹0 <span className="text-base font-normal text-gray-400">/ forever</span></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">For students just getting started.</p>
              <ul className="space-y-3 mb-8">
                {["5 AI mock interviews/month","BRIDGE Score (basic)","GD Pulse access","Career Intelligence digest","Community access"].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <Check className="w-4 h-4 text-[#0D9488] flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="block text-center py-3 rounded-xl border border-[#0D9488] text-[#0D9488] font-semibold hover:bg-[#F0FDFA] dark:hover:bg-[#0D9488]/10 transition-colors">
                Start for Free
              </Link>
            </div>
            <div className="rounded-2xl border-2 border-[#0D9488] bg-gradient-to-b from-[#0D9488]/5 to-white/70 dark:from-[#0D9488]/10 dark:to-[#0E1A18]/80 backdrop-blur-md p-8 relative shadow-[0_0_40px_rgba(13,148,136,0.15)]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#0D9488] text-white text-xs font-bold whitespace-nowrap">Most Popular</div>
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1">Pro</h3>
              <div className="text-4xl font-black text-gray-900 dark:text-white mb-1">₹999 <span className="text-base font-normal text-gray-400">/ month</span></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">For serious placement seekers.</p>
              <ul className="space-y-3 mb-8">
                {["Unlimited AI mock interviews","Full BRIDGE Score + verified certificate","Live GD rooms with AI moderation","Smart Apply — AI job matching","Recruiter Registry visibility","Weekly personalized prep plan","Priority support"].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                    <Check className="w-4 h-4 text-[#0D9488] flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="block text-center py-3 rounded-xl bg-gradient-to-r from-[#0D9488] to-[#0D524C] text-white font-bold shadow-[0_4px_16px_rgba(13,148,136,0.35)] hover:shadow-[0_4px_24px_rgba(13,148,136,0.5)] transition-all">
                Start Pro Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────── */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 bg-[#030908] dark:bg-[#010605] relative overflow-hidden">
        <motion.div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(13,148,136,0.25) 0%, transparent 70%)" }}
          animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute top-0 inset-x-0 h-[1px]"
          style={{ background: "linear-gradient(to right, transparent, #0D9488, transparent)" }}
          animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 3, repeat: Infinity }} />
        <div className="relative mx-auto max-w-[700px] text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-400/30 text-red-300 text-sm font-semibold mb-8">
            <Zap className="w-4 h-4" /> Only 50 free spots remaining this batch
          </div>
          <h2 style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }} className="text-5xl font-black tracking-tighter text-white mb-4">
            Your competition<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0D9488] to-[#2DD4BF]">already started.</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10">Don&apos;t walk into placement season as a guess. Walk in as a verified, prepared, impossible-to-ignore candidate.</p>
          <Link href="/login" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#0D9488] to-[#2DD4BF] text-white font-black text-lg shadow-[0_4px_32px_rgba(13,148,136,0.5)] hover:shadow-[0_4px_48px_rgba(13,148,136,0.7)] transition-all hover:scale-[1.02]">
            Unlock Your BRIDGE Score <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-gray-500 text-sm mt-4">No credit card. Takes 2 minutes.</p>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer className="bg-[#030908] dark:bg-[#010605] border-t border-white/5 px-4 sm:px-6 lg:px-8 py-16">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0D9488] to-[#2DD4BF] flex items-center justify-center">
                  <span className="text-white font-black text-sm">B</span>
                </div>
                <span className="font-black text-white">Bridge<span className="text-[#0D9488]">AI</span></span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">AI-powered placement readiness for Indian students. Train. Verify. Place.</p>
              <p className="text-xs text-gray-600 mt-4">hello@appbridgeai.in</p>
            </div>
            {[
              { title: "Product", links: ["Smart Interview", "GD Pulse", "SkillPulse", "Career GPS", "Jobs"] },
              { title: "Company", links: ["About", "Careers", "Blog", "Press"] },
              { title: "Legal", links: ["Privacy Policy", "Terms of Use", "Cookie Policy"] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-xs font-bold text-white mb-4 tracking-widest uppercase">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(l => <li key={l}><a href="#" className="text-xs text-gray-500 hover:text-[#0D9488] transition-colors">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-white/5 gap-4">
            <p className="text-xs text-gray-600">© 2026 BridgeAI. All rights reserved.</p>
            <p className="text-xs text-gray-600">Built with intent. For India&apos;s next generation of leaders.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
