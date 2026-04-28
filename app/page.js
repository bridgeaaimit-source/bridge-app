"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Trophy, Star, Users, Menu, X, CheckCircle,
  Play, Video, MessageSquare, FileText, MapPin, Zap,
  TrendingUp, Award, Brain
} from "lucide-react";
import Link from 'next/link';

/* ─── COUNT-UP HOOK ──────────────────────────────────── */
function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(e * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, target, duration]);

  return [count, ref];
}

/* ─── ANIMATION VARIANTS ─────────────────────────────── */
const FU = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};
const FI = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5 } } };
const STAGGER = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

/* ─── DATA ───────────────────────────────────────────── */
const TICKER = [
  "🔥 Aarav from VIT just scored 812 on Amazon mock",
  "🟢 Live GD Battle starting · 3 seats left",
  "🎉 Priya cleared Infosys round 2 today",
  "📈 Karan: 612 → 748 in 4 weeks",
  "🏆 Top of leaderboard: Meera (PSG)",
  "⚡ Rohan unlocked TCS Digital pack",
  "💼 Sneha finished her 50th mock interview",
];
const COLLEGES = ["VIT", "PSG Tech", "SRMIST", "MIT WPU", "Manipal", "LPU", "Amity", "NMIMS", "BITS Pilani", "SRM", "Anna Univ", "VIT-AP"];
const COMPANIES = ["Amazon", "Google", "TCS", "Infosys", "Wipro", "Microsoft", "HCL", "Cognizant"];

/* ─── COUNTER ITEM ───────────────────────────────────── */
function StatCounter({ target, suffix, label }) {
  const [count, ref] = useCountUp(target, 2000);
  return (
    <div ref={ref} className="text-center">
      <p className="font-display text-5xl font-black text-[#0D9488]">{count.toLocaleString()}{suffix}</p>
      <p className="mt-2 text-base text-gray-600">{label}</p>
    </div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────── */
export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [recSecs, setRecSecs] = useState(134);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setRecSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#0D0D1A]">
      <style jsx global>{`
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes pdot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.4)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes speakPulse { 0%{box-shadow:0 0 0 0 rgba(13,148,136,0.45)} 70%{box-shadow:0 0 0 9px rgba(13,148,136,0)} 100%{box-shadow:0 0 0 0 rgba(13,148,136,0)} }
        .marquee { animation: marquee 30s linear infinite; }
        .float-card { animation: float 4s ease-in-out infinite; }
        .pdot { animation: pdot 1.4s ease-in-out infinite; }
        .speak-ring { animation: speakPulse 1.6s ease-out infinite; }
        .shimmer-btn {
          background: linear-gradient(90deg,#0D9488 0%,#14B8A6 45%,#0D9488 90%);
          background-size: 200% 100%;
          animation: shimmer 2.5s linear infinite;
        }
        .bento-card {
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .bento-card:hover {
          box-shadow: 0 8px 32px rgba(13,148,136,0.15);
          border-color: #2DD4BF;
        }
        @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
      `}</style>

      {/* ── NAVBAR ──────────────────────────────────────── */}
      <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled ? "border-b border-gray-100 bg-white/95 backdrop-blur-lg shadow-sm" : "bg-white"}`}>
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
          <Link href="/" className="flex items-center">
            <img src="/images/logo_navbar_64h.png" alt="BridgeAI" style={{height:'40px',width:'auto'}} />
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            {[["#features","Features"],["#how-it-works","How it Works"],["#pricing","Pricing"],["#stories","Stories"]].map(([h,l])=>(
              <a key={h} href={h} className="text-sm font-medium text-gray-600 hover:text-[#0D9488] transition-colors">{l}</a>
            ))}
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-[#0D9488] hover:text-[#0D9488] transition-all">Login</Link>
            <Link href="/login" className="shimmer-btn rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-md">Start Free</Link>
          </div>
          <button onClick={()=>setMobileMenuOpen(p=>!p)} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden">
            {mobileMenuOpen ? <X className="h-6 w-6"/> : <Menu className="h-6 w-6"/>}
          </button>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
              className="border-t border-gray-100 bg-white overflow-hidden md:hidden">
              <div className="space-y-1 px-4 py-4">
                {[["#features","Features"],["#how-it-works","How it Works"],["#pricing","Pricing"],["#stories","Stories"]].map(([h,l])=>(
                  <a key={h} href={h} onClick={()=>setMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-[#F0FDFA] hover:text-[#0D9488]">{l}</a>
                ))}
                <Link href="/login" className="mt-2 block rounded-lg shimmer-btn px-4 py-2.5 text-center text-sm font-semibold text-white">Start Free</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── SECTION 1: HERO ─────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A3D36] via-[#0D9488] to-[#0F766E] text-white" style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(#fff 1px,transparent 1px)",backgroundSize:"28px 28px"}}/>
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl pointer-events-none"/>
        <div className="absolute top-1/2 -left-24 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none"/>

        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8 pt-32 pb-16 flex-1">
          {/* LEFT */}
          <motion.div variants={STAGGER} initial="hidden" animate="visible" className="flex flex-col justify-center">
            <motion.div variants={FU}>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
                <span className="pdot h-2 w-2 rounded-full bg-red-400 inline-block"/>
                Live · 1,247 students practicing now
              </span>
            </motion.div>

            <motion.h1 variants={FU} className="mt-6 font-display text-5xl font-black leading-[1.05] sm:text-6xl lg:text-7xl">
              Crack your<br/><span className="text-[#CCFBF1]">dream job.</span>
            </motion.h1>

            <motion.p variants={FU} className="mt-5 max-w-lg text-lg text-white/80 leading-relaxed">
              Real questions. Live AI feedback. Daily GD battles.<br/>One score that proves you&apos;re ready.
            </motion.p>

            <motion.div variants={FU} className="mt-8 flex flex-wrap gap-4">
              <Link href="/login">
                <motion.span whileHover={{scale:1.04}} whileTap={{scale:0.97}}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-bold text-[#0D9488] shadow-lg cursor-pointer">
                  Start free mock <ArrowRight className="h-5 w-5"/>
                </motion.span>
              </Link>
              <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.97}}
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-7 py-3.5 text-base font-semibold backdrop-blur-sm">
                <Play className="h-5 w-5"/> Watch 90-sec demo
              </motion.button>
            </motion.div>

            <motion.div variants={FU} className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2">
                {[["AK","bg-violet-500"],["PR","bg-pink-500"],["RS","bg-amber-500"],["SN","bg-sky-500"]].map(([i,c])=>(
                  <div key={i} className={`${c} h-9 w-9 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white`}>{i}</div>
                ))}
              </div>
              <p className="text-sm text-white/80"><strong className="text-white">2,500+</strong> students · ⭐ 4.9 rating</p>
            </motion.div>
          </motion.div>

          {/* RIGHT — Floating App Mockup */}
          <motion.div initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} transition={{duration:0.8,delay:0.3}}
            className="flex items-center justify-center lg:justify-end relative">
            {/* Background card */}
            <div className="absolute top-4 right-2 w-64 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 rotate-3 scale-90 opacity-50 pointer-events-none">
              <div className="flex items-center gap-2 mb-3">
                <span className="pdot h-2 w-2 rounded-full bg-red-400 inline-block"/>
                <span className="text-xs text-white/60">Interview in progress...</span>
              </div>
              <div className="h-14 rounded-lg bg-white/10 flex items-center justify-center text-white/30 text-xs">🎤 Recording answer...</div>
            </div>
            {/* Main floating card */}
            <div className="float-card relative z-10 w-72 sm:w-80 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-xl font-bold">BRIDGE Score</h3>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                  <span className="pdot h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block"/> LIVE
                </span>
              </div>
              <div className="flex justify-center mb-5">
                <div className="relative">
                  <svg width="110" height="110" viewBox="0 0 110 110">
                    <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8"/>
                    <circle cx="55" cy="55" r="46" fill="none" stroke="#CCFBF1" strokeWidth="8"
                      strokeDasharray="289" strokeDashoffset="80" strokeLinecap="round"
                      transform="rotate(-90 55 55)"/>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-3xl font-black text-white">720</span>
                    <span className="text-xs text-white/60">/ 1000</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {[["🔥 Streak","14 days"],["🏆 Rank","#42 / 1,200"],["💪 Confidence","8.4 / 10"]].map(([l,v])=>(
                  <div key={l} className="flex justify-between rounded-xl bg-white/10 px-4 py-2.5">
                    <span className="text-sm text-white/80">{l}</span>
                    <span className="text-sm font-semibold text-[#CCFBF1]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Ticker */}
        <div className="relative overflow-hidden bg-black/20 backdrop-blur-sm border-t border-white/10 py-3">
          <div className="pointer-events-none absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-[#0A3D36] to-transparent z-10"/>
          <div className="pointer-events-none absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-[#0F766E] to-transparent z-10"/>
          <div className="marquee whitespace-nowrap inline-flex">
            {[...TICKER,...TICKER].map((item,i)=>(
              <span key={i} className="mx-8 inline-flex items-center gap-2 text-sm font-medium text-white/75">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block"/>{item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 2: COLLEGE STRIP ────────────────────── */}
      <section className="bg-white border-b border-gray-100 py-10">
        <motion.p variants={FI} initial="hidden" whileInView="visible" viewport={{once:true}}
          className="text-center text-sm font-semibold text-gray-500 mb-6">
          Students from 50+ colleges trust Bridge
        </motion.p>
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-white to-transparent z-10"/>
          <div className="pointer-events-none absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-white to-transparent z-10"/>
          <div className="marquee whitespace-nowrap inline-flex">
            {[...COLLEGES,...COLLEGES].map((c,i)=>(
              <span key={i} className="mx-3 inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-5 py-2 text-sm font-semibold text-gray-600">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: FEATURES BENTO ───────────────────── */}
      <section id="features" className="bg-[#F0FDFA] py-24">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <motion.div variants={STAGGER} initial="hidden" whileInView="visible" viewport={{once:true,margin:"-100px"}} className="mb-14 text-center">
            <motion.p variants={FU} className="text-sm font-bold uppercase tracking-widest text-[#0D9488]">The Stack</motion.p>
            <motion.h2 variants={FU} className="font-display mt-3 text-4xl font-black text-[#0D0D1A] sm:text-5xl">Six weapons. One unfair advantage.</motion.h2>
            <motion.p variants={FU} className="mt-3 text-lg text-gray-600">Every feature is built to push your BRIDGE Score closer to 1000.</motion.p>
          </motion.div>

          <motion.div
            variants={{ hidden:{}, visible:{ transition:{ staggerChildren:0.1 } } }}
            initial="hidden" whileInView="visible" viewport={{once:true,margin:"-80px"}}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* Card 1 — AI Video (span 2) */}
            <motion.div
              variants={{ hidden:{opacity:0,y:24,scale:0.97}, visible:{opacity:1,y:0,scale:1,transition:{duration:0.5}} }}
              whileHover={{y:-6,scale:1.01,transition:{duration:0.2}}}
              className="bento-card lg:col-span-2 bg-[#F0FDFA] rounded-2xl border border-[#99F6E4] p-7 cursor-pointer">
              <div className="mb-5 rounded-xl bg-gray-900 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="pdot h-2 w-2 rounded-full bg-red-500 inline-block"/>
                    <span className="text-xs font-semibold text-red-400">REC</span>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">
                    {String(Math.floor(recSecs/60)).padStart(2,'0')}:{String(recSecs%60).padStart(2,'0')}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-20 rounded-lg bg-gray-800 flex items-center justify-center">
                    <span className="text-xs font-bold text-[#0D9488]">YOU</span>
                  </div>
                  <div className="col-span-2 space-y-2">
                    {[["Eye Contact",92,"text-emerald-400"],["Confidence",84,"text-sky-400"],["Clarity",78,"text-amber-400"]].map(([l,v,c])=>(
                      <div key={l} className="bg-gray-800 rounded-lg px-3 py-1.5">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-400">{l}</span>
                          <span className={`text-xs font-bold ${c}`}>{v}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-gray-700 overflow-hidden">
                          <motion.div initial={{width:0}} whileInView={{width:`${v}%`}}
                            transition={{duration:0.8,delay:0.2}} viewport={{once:true}}
                            className={`h-full rounded-full ${l==="Eye Contact"?"bg-emerald-400":l==="Confidence"?"bg-sky-400":"bg-amber-400"}`}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <h3 className="font-display text-xl font-bold text-[#134E4A]">Your camera on. Our AI watches everything.</h3>
              <p className="mt-2 text-sm text-teal-700">Eye contact, posture, voice tremor, filler words — all analyzed in real time.</p>
            </motion.div>

            {/* Card 2 — BRIDGE Score */}
            <motion.div
              variants={{ hidden:{opacity:0,y:24,scale:0.97}, visible:{opacity:1,y:0,scale:1,transition:{duration:0.5}} }}
              whileHover={{y:-6,scale:1.01,transition:{duration:0.2}}}
              className="bento-card bg-[#F0FDFA] rounded-2xl border border-[#99F6E4] p-7 cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-[#134E4A]">BRIDGE Score</span>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <span className="pdot h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block"/> LIVE
                </span>
              </div>
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <svg width="88" height="88" viewBox="0 0 88 88">
                    <circle cx="44" cy="44" r="35" fill="none" stroke="#CCFBF1" strokeWidth="6"/>
                    <motion.circle cx="44" cy="44" r="35" fill="none" stroke="#0D9488" strokeWidth="6"
                      strokeDasharray="220" initial={{strokeDashoffset:220}} whileInView={{strokeDashoffset:61}}
                      transition={{duration:1.2,ease:"easeOut"}} viewport={{once:true}}
                      strokeLinecap="round" transform="rotate(-90 44 44)"/>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-2xl font-black text-[#134E4A]">720</span>
                    <span className="text-[10px] text-teal-500">/1000</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                {[["Comm",82],["Confidence",75],["Technical",68]].map(([l,v])=>(
                  <div key={l}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-teal-600">{l}</span>
                      <span className="font-semibold text-[#134E4A]">{v}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-teal-100 overflow-hidden">
                      <motion.div initial={{width:0}} whileInView={{width:`${v}%`}}
                        transition={{duration:0.9,ease:"easeOut",delay:0.1}} viewport={{once:true}}
                        className="h-full bg-[#0D9488] rounded-full"/>
                    </div>
                  </div>
                ))}
              </div>
              <h3 className="font-display text-base font-bold text-[#134E4A]">BRIDGE Score — Placement readiness / 1000</h3>
            </motion.div>

            {/* Card 3 — GD Battles */}
            <motion.div
              variants={{ hidden:{opacity:0,y:24,scale:0.97}, visible:{opacity:1,y:0,scale:1,transition:{duration:0.5}} }}
              whileHover={{y:-6,scale:1.01,transition:{duration:0.2}}}
              className="bento-card bg-[#F0FDFA] rounded-2xl border border-[#99F6E4] p-7 cursor-pointer">
              <div className="flex items-center gap-2 mb-5">
                {[["AK","bg-violet-500",false],["PR","bg-pink-500",false],["RS","bg-amber-500",false],["AI","bg-[#0D9488]",true]].map(([init,col,speaking])=>(
                  <div key={init} className={`${col} ${speaking?"speak-ring":""} h-11 w-11 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white`}>{init}</div>
                ))}
              </div>
              <h3 className="font-display text-xl font-bold text-[#134E4A]">GD Battles — 4 students. 5 mins. AI judge.</h3>
              <p className="mt-2 text-sm text-teal-700">Practice like a real selection round with live opponents.</p>
            </motion.div>

            {/* Card 4 — Questions */}
            <motion.div
              variants={{ hidden:{opacity:0,y:24,scale:0.97}, visible:{opacity:1,y:0,scale:1,transition:{duration:0.5}} }}
              whileHover={{y:-6,scale:1.01,transition:{duration:0.2}}}
              className="bento-card bg-[#F0FDFA] rounded-2xl border border-[#99F6E4] p-7 cursor-pointer">
              <div className="flex flex-wrap gap-2 mb-5">
                {COMPANIES.slice(0,6).map((c,i)=>(
                  <motion.span key={c}
                    initial={{opacity:0,scale:0.8}} whileInView={{opacity:1,scale:1}}
                    transition={{duration:0.3,delay:i*0.05}} viewport={{once:true}}
                    whileHover={{scale:1.05}}
                    className="rounded-full bg-white border border-[#99F6E4] px-3 py-1 text-xs font-semibold text-[#0D9488] cursor-pointer transition-colors hover:border-[#0D9488]">{c}</motion.span>
                ))}
                <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-600">+200 more</span>
              </div>
              <h3 className="font-display text-xl font-bold text-[#134E4A]">500+ real questions from real companies.</h3>
              <p className="mt-2 text-sm text-teal-700">Sourced from actual interview experiences at top companies.</p>
            </motion.div>

            {/* Card 5 — Resume */}
            <motion.div
              variants={{ hidden:{opacity:0,y:24,scale:0.97}, visible:{opacity:1,y:0,scale:1,transition:{duration:0.5}} }}
              whileHover={{y:-6,scale:1.01,transition:{duration:0.2}}}
              className="bento-card bg-[#F0FDFA] rounded-2xl border border-[#99F6E4] p-7 cursor-pointer">
              <div className="mb-5 rounded-xl bg-white border border-[#CCFBF1] p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-semibold text-teal-600">ATS Score</span>
                  <span className="text-lg font-black text-[#134E4A]">96%</span>
                </div>
                <div className="h-2 rounded-full bg-teal-100 overflow-hidden">
                  <motion.div initial={{width:0}} whileInView={{width:"96%"}}
                    transition={{duration:1,ease:"easeOut",delay:0.2}} viewport={{once:true}}
                    className="h-full bg-[#0D9488] rounded-full"/>
                </div>
                <span className="mt-2 inline-block rounded-full bg-teal-100 text-teal-700 px-2 py-0.5 text-xs font-semibold">✓ 3 keywords boosted</span>
              </div>
              <h3 className="font-display text-xl font-bold text-[#134E4A]">AI Resume — ATS-optimized. Recruiter-approved.</h3>
              <p className="mt-2 text-sm text-teal-700">Instant keyword suggestions and role-specific improvements.</p>
            </motion.div>

            {/* Card 6 — Roadmap (full width) */}
            <motion.div
              variants={{ hidden:{opacity:0,y:24,scale:0.97}, visible:{opacity:1,y:0,scale:1,transition:{duration:0.5}} }}
              whileHover={{y:-6,scale:1.01,transition:{duration:0.2}}}
              className="bento-card lg:col-span-3 bg-[#F0FDFA] rounded-2xl border border-[#99F6E4] p-7 cursor-pointer">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-5">
                {[["M","Mock"],["T","GD"],["W","DSA"],["T","Mock"],["F","Resume"],["S","GD"],["S","Rest"]].map(([day,act],i)=>(
                  <motion.div key={i}
                    initial={{opacity:0,y:12}} whileInView={{opacity:1,y:0}}
                    transition={{duration:0.35,delay:i*0.06}} viewport={{once:true}}
                    className={`flex-shrink-0 flex flex-col items-center gap-1 rounded-xl px-4 py-3 min-w-[64px] ${i===3?"bg-[#0D9488] text-white":"bg-white border border-[#CCFBF1]"}`}>
                    <span className={`text-xs font-bold ${i===3?"text-white/70":"text-teal-400"}`}>{day}</span>
                    <span className={`text-xs font-semibold ${i===3?"text-white":"text-teal-700"}`}>{act}</span>
                    {i===3 && <span className="text-[10px] text-[#CCFBF1]">Today</span>}
                  </motion.div>
                ))}
              </div>
              <h3 className="font-display text-xl font-bold text-[#134E4A]">Personal Roadmap — Your next 7 days, planned by AI.</h3>
              <p className="mt-2 text-sm text-teal-700">Built from your weak spots. Updated every morning. No guesswork.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 4: SCORE EXPLAINER ──────────────────── */}
      <section className="bg-white py-24">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <motion.div variants={STAGGER} initial="hidden" whileInView="visible" viewport={{once:true}} className="text-center mb-16">
            <motion.h2 variants={FU} className="font-display text-4xl font-black text-[#0D0D1A] sm:text-5xl">Watch yourself level up.</motion.h2>
            <motion.p variants={FU} className="mt-3 text-lg text-gray-600">One number. Built from every mock, every battle, every word.</motion.p>
          </motion.div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{opacity:0,x:-40}} whileInView={{opacity:1,x:0}} transition={{duration:0.7}} viewport={{once:true}} className="flex flex-col items-center">
              <div className="relative">
                <svg width="200" height="200" viewBox="0 0 200 200">
                  <defs>
                    <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0D9488"/>
                      <stop offset="100%" stopColor="#14B8A6"/>
                    </linearGradient>
                  </defs>
                  <circle cx="100" cy="100" r="80" fill="none" stroke="#F0FDFA" strokeWidth="14"/>
                  <circle cx="100" cy="100" r="80" fill="none" stroke="url(#sg)" strokeWidth="14"
                    strokeDasharray="503" strokeDashoffset="140" strokeLinecap="round" transform="rotate(-90 100 100)"/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-5xl font-black text-[#0D9488]">720</span>
                  <span className="text-gray-400 text-sm">/ 1000</span>
                  <span className="mt-1 rounded-full bg-[#F0FDFA] px-3 py-0.5 text-xs font-semibold text-[#0D9488]">Intermediate</span>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3 text-xs font-semibold">
                <span className="text-red-400">Beginner</span>
                <div className="h-px w-20 bg-gradient-to-r from-red-300 via-amber-300 to-emerald-400"/>
                <span className="text-emerald-500">Expert</span>
              </div>
            </motion.div>
            <motion.div variants={STAGGER} initial="hidden" whileInView="visible" viewport={{once:true,margin:"-80px"}} className="space-y-6">
              {[["Communication",82],["Technical Depth",68],["Confidence",75],["Problem Solving",71]].map(([label,pct])=>(
                <motion.div key={label} variants={FU}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">{label}</span>
                    <span className="text-sm font-bold text-[#0D9488]">{pct}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-[#F0FDFA] overflow-hidden">
                    <motion.div initial={{width:0}} whileInView={{width:`${pct}%`}} transition={{duration:1,ease:"easeOut",delay:0.2}}
                      viewport={{once:true}} className="h-full rounded-full bg-gradient-to-r from-[#0D9488] to-[#14B8A6]"/>
                  </div>
                </motion.div>
              ))}
              <motion.div variants={FU} className="rounded-xl bg-[#F0FDFA] border border-[#CCFBF1] p-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Score progression</p>
                <div className="flex items-center gap-3 text-sm font-bold flex-wrap">
                  <span className="text-gray-500">Week 1: <span className="text-[#0D9488]">460</span></span>
                  <ArrowRight className="h-3 w-3 text-gray-400"/>
                  <span className="text-gray-500">Week 3: <span className="text-[#0D9488]">610</span></span>
                  <ArrowRight className="h-3 w-3 text-gray-400"/>
                  <span className="text-gray-500">Week 6: <span className="text-[#0D9488]">780</span></span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: HOW IT WORKS ─────────────────────── */}
      <section id="how-it-works" className="bg-[#F0FDFA] py-24">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <motion.h2 variants={FU} initial="hidden" whileInView="visible" viewport={{once:true}}
            className="font-display text-4xl font-black text-center text-[#0D0D1A] sm:text-5xl mb-16">
            From signup to offer letter.
          </motion.h2>
          <motion.div variants={STAGGER} initial="hidden" whileInView="visible" viewport={{once:true,margin:"-80px"}}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {n:"01",icon:<Zap className="h-6 w-6 text-[#0D9488]"/>,title:"Sign up",desc:"90 seconds. No card."},
              {n:"02",icon:<Video className="h-6 w-6 text-[#0D9488]"/>,title:"Take a mock",desc:"Real questions, AI feedback."},
              {n:"03",icon:<TrendingUp className="h-6 w-6 text-[#0D9488]"/>,title:"Track score",desc:"Watch it climb daily."},
              {n:"04",icon:<Award className="h-6 w-6 text-[#0D9488]"/>,title:"Walk in confident",desc:"You've practiced this."},
            ].map((step,i)=>(
              <motion.div key={step.n} variants={FU} whileHover={{y:-4,transition:{duration:0.2}}}
                className="relative bg-white rounded-2xl border border-gray-100 p-7 shadow-sm text-center">
                {i < 3 && <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10"><ArrowRight className="h-5 w-5 text-[#CCFBF1]"/></div>}
                <div className="font-display text-4xl font-black text-[#CCFBF1] mb-3">{step.n}</div>
                <div className="inline-flex rounded-xl bg-[#F0FDFA] p-3 mb-3">{step.icon}</div>
                <h3 className="font-display text-xl font-bold text-[#0D0D1A]">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 6: PRICING ──────────────────────────── */}
      <section id="pricing" className="bg-white py-24">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <motion.div variants={STAGGER} initial="hidden" whileInView="visible" viewport={{once:true}} className="text-center mb-16">
            <motion.h2 variants={FU} className="font-display text-4xl font-black text-[#0D0D1A] sm:text-5xl">Honest pricing. Built for students.</motion.h2>
            <motion.p variants={FU} className="mt-3 text-lg text-gray-600">Start free. Upgrade when you&apos;re hooked.</motion.p>
          </motion.div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div initial={{opacity:0,x:-40}} whileInView={{opacity:1,x:0}} transition={{duration:0.6}} viewport={{once:true}}
              whileHover={{y:-4}} className="rounded-3xl border-2 border-gray-200 bg-white p-10 shadow-sm">
              <p className="text-sm font-semibold text-[#0D9488]">Starter</p>
              <h3 className="font-display mt-2 text-3xl font-black text-[#0D0D1A]">Free Forever</h3>
              <p className="mt-1 text-lg text-gray-500">₹0 / forever</p>
              <ul className="mt-6 space-y-3 text-sm text-gray-700">
                {["4 AI mock interviews","1 GD battle","Basic BRIDGE score","PDF Resume review"].map(f=>(
                  <li key={f} className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0"/>{f}</li>
                ))}
              </ul>
              <Link href="/login">
                <motion.span whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                  className="mt-8 inline-flex cursor-pointer rounded-xl border-2 border-[#0D9488] px-7 py-3 text-base font-semibold text-[#0D9488] hover:bg-[#F0FDFA] transition-colors">
                  Start Free
                </motion.span>
              </Link>
            </motion.div>

            <motion.div initial={{opacity:0,x:40}} whileInView={{opacity:1,x:0}} transition={{duration:0.6,delay:0.1}} viewport={{once:true}}
              whileHover={{y:-4}} className="rounded-3xl border-2 border-[#0D9488] bg-gradient-to-br from-[#0D9488] to-[#0F766E] p-10 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="rounded-full bg-white/20 border border-white/30 px-3 py-1 text-xs font-bold">⭐ Most popular</span>
              </div>
              <p className="text-sm font-semibold text-[#CCFBF1]">Pro</p>
              <h3 className="font-display mt-2 text-3xl font-black">Placement Crusher</h3>
              <p className="mt-1 text-xl font-bold text-[#CCFBF1]">₹499 <span className="text-base font-normal">/ month</span></p>
              <p className="text-xs text-white/50 mt-0.5">Less than 1 day of coaching fees.</p>
              <ul className="mt-6 space-y-3 text-sm">
                {["20 AI video interviews / month","20 GD battles / month","Unlimited improvement guides","Priority question bank","Personal roadmap updates"].map(f=>(
                  <li key={f} className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-300 flex-shrink-0"/>{f}</li>
                ))}
              </ul>
              <Link href="/login">
                <motion.span whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                  className="mt-8 inline-flex cursor-pointer rounded-xl bg-white px-7 py-3 text-base font-bold text-[#0D9488] shadow-md">
                  Go Pro →
                </motion.span>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECTION 7: TESTIMONIALS ─────────────────────── */}
      <section id="stories" className="bg-[#F0FDFA] py-24">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <motion.div variants={STAGGER} initial="hidden" whileInView="visible" viewport={{once:true}} className="text-center mb-16">
            <motion.h2 variants={FU} className="font-display text-4xl font-black text-[#0D0D1A] sm:text-5xl">They walked in. They got the offer.</motion.h2>
            <motion.div variants={FU} className="mt-3 flex justify-center items-center gap-2">
              <div className="flex text-yellow-400">{[...Array(5)].map((_,i)=><Star key={i} className="h-5 w-5 fill-current"/>)}</div>
              <span className="text-gray-600 text-sm">4.9 from 1,200+ students</span>
            </motion.div>
          </motion.div>
          <motion.div variants={STAGGER} initial="hidden" whileInView="visible" viewport={{once:true,margin:"-80px"}} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {init:"AK",color:"bg-violet-500",name:"Akhil Kumar",school:"VIT → Amazon",quote:"Walked into Amazon already knowing the questions. Bridge is insane.",chip:"+45 mocks"},
              {init:"PR",color:"bg-pink-500",name:"Priya Nair",school:"PSG → Infosys",quote:"GD battles flipped my fear into real leadership confidence.",chip:"10 GDs won"},
              {init:"RS",color:"bg-amber-500",name:"Rohan Sharma",school:"SRMIST → Wipro",quote:"480 → 790 in 6 weeks. Insane clarity on exactly what to improve.",chip:"+310 pts"},
              {init:"SP",color:"bg-sky-500",name:"Sneha Patel",school:"Manipal → TCS",quote:"80% question match with real interview. Got the offer day one.",chip:"Day 1 offer"},
            ].map(t=>(
              <motion.div key={t.name} variants={FU} whileHover={{y:-4,transition:{duration:0.2}}}
                className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`${t.color} h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}>{t.init}</div>
                  <div>
                    <p className="font-semibold text-[#0D0D1A]">{t.name}</p>
                    <p className="text-sm text-[#0D9488]">{t.school}</p>
                  </div>
                  <span className="ml-auto rounded-full bg-[#F0FDFA] border border-[#CCFBF1] px-3 py-1 text-xs font-semibold text-[#0D9488] flex-shrink-0">{t.chip}</span>
                </div>
                <div className="flex text-yellow-400 mb-3">{[...Array(5)].map((_,i)=><Star key={i} className="h-4 w-4 fill-current"/>)}</div>
                <p className="text-gray-700 leading-relaxed">&quot;{t.quote}&quot;</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 8: STATS ────────────────────────────── */}
      <section className="bg-white py-24 border-y border-gray-100">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
            <StatCounter target={10000} suffix="+" label="Mock Interviews"/>
            <StatCounter target={2500}  suffix="+" label="Active Students"/>
            <StatCounter target={85}    suffix="%" label="Confidence Boost"/>
            <StatCounter target={50}    suffix="+" label="Colleges"/>
          </div>
        </div>
      </section>

      {/* ── SECTION 9: FINAL CTA ────────────────────────── */}
      <section className="bg-[#0A3D36] py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(#fff 1px,transparent 1px)",backgroundSize:"24px 24px"}}/>
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[#0D9488]/40 blur-3xl pointer-events-none"/>
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[#14B8A6]/20 blur-3xl pointer-events-none"/>
        <motion.div variants={STAGGER} initial="hidden" whileInView="visible" viewport={{once:true}}
          className="relative mx-auto max-w-[800px] rounded-3xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-sm text-white">
          <motion.div variants={FU} className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-red-500/20 border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-300">
              <span className="pdot h-2 w-2 rounded-full bg-red-400 inline-block"/>
              Only 50 free spots this week
            </span>
          </motion.div>
          <motion.h2 variants={FU} className="font-display text-4xl font-black sm:text-5xl">Your competition already started.</motion.h2>
          <motion.p variants={FU} className="mt-4 text-lg text-white/70">Free forever. No card. 60-second signup.</motion.p>
          <motion.div variants={FU} className="mt-8">
            <Link href="/login">
              <motion.span whileHover={{scale:1.05}} whileTap={{scale:0.97}}
                className="shimmer-btn inline-flex items-center gap-2 cursor-pointer rounded-xl px-10 py-4 text-lg font-bold text-white shadow-lg">
                Take your free mock now <ArrowRight className="h-6 w-6"/>
              </motion.span>
            </Link>
          </motion.div>
          <motion.div variants={FU} className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-white/60">
            {["No credit card","Cancel anytime","Used by 1,200+ students"].map(t=>(
              <span key={t} className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-400"/>{t}</span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer className="bg-[#0b0f1f] px-4 py-14 text-gray-400 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <div className="inline-flex items-center rounded-xl bg-white px-3 py-2">
              <img src="/images/logo_navbar_64h.png" alt="BridgeAI" style={{height:'36px',width:'auto'}} />
            </div>
            <p className="mt-3 text-sm">AI placement prep for ambitious Indian students.</p>
          </div>
          <div>
            <p className="text-sm font-bold text-white">Product</p>
            <ul className="mt-3 space-y-2 text-sm">
              {[["#features","Features"],["#how-it-works","How it works"],["#pricing","Pricing"],["#","BRIDGE Score"]].map(([h,l])=>(
                <li key={l}><a href={h} className="hover:text-[#0D9488] transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold text-white">Company</p>
            <ul className="mt-3 space-y-2 text-sm">
              {["About","Blog","Careers","Press"].map(l=><li key={l}>{l}</li>)}
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold text-white">Contact</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>info@appbridgeai.in</li>
              <li>Pune, India</li>
              <li>For Recruiters</li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-10 w-full max-w-[1200px] border-t border-white/10 pt-5 text-center text-xs">
          © 2026 BridgeAI · Crafted with intent in India
        </div>
      </footer>
    </div>
  );
}
