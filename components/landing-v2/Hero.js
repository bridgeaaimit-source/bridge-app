"use client";

import { useState, useEffect } from "react";
import { m, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, Sparkles, MessageSquare, Award } from "lucide-react";
import Link from "next/link";

const ROLE_DATA = {
  consulting: {
    title: "Management Consultant",
    score: 842,
    subText: "Case Strategy & Structuring",
    analysis: "MECE Structure Verified",
    metrics: [
      { label: "Structured Thinking", value: 92, color: "bg-emerald-500" },
      { label: "Communication Clarity", value: 88, color: "bg-sky-500" },
      { label: "Estimation Poise", value: 85, color: "bg-teal-500" },
      { label: "Leadership Composure", value: 90, color: "bg-indigo-500" }
    ],
    transcript: "Our recommendation to enter the Southeast Asian logistics market rests on three pillars: market size viability, competitive landscape, and regulatory feasibility."
  },
  pm: {
    title: "Product Manager",
    score: 815,
    subText: "Product Strategy & Execution",
    analysis: "Prioritization Validated",
    metrics: [
      { label: "Prioritization Logic", value: 88, color: "bg-sky-500" },
      { label: "User Empathy", value: 92, color: "bg-violet-500" },
      { label: "Communication Clarity", value: 85, color: "bg-pink-500" },
      { label: "Structured Thinking", value: 82, color: "bg-teal-500" }
    ],
    transcript: "To double our activation rate, we must optimize the onboarding flow. The drop-off data indicates that user friction is concentrated at the step-two verification step."
  },
  leadership: {
    title: "Corporate Leader / MBA",
    score: 856,
    subText: "Executive Presence & Alignment",
    analysis: "Vocal Poise & STAR Checked",
    metrics: [
      { label: "Leadership Composure", value: 94, color: "bg-emerald-500" },
      { label: "Communication Clarity", value: 90, color: "bg-sky-500" },
      { label: "Stakeholder Empathy", value: 88, color: "bg-teal-500" },
      { label: "Structured Thinking", value: 85, color: "bg-indigo-500" }
    ],
    transcript: "To drive cross-functional alignment, I will first sync with regional lead executives to secure early buy-in before cascading the vision across the wider product teams."
  },
  engineering: {
    title: "Software Engineer",
    score: 838,
    subText: "Technical Depth & System Architecture",
    analysis: "System Design Validated",
    metrics: [
      { label: "Technical Depth", value: 95, color: "bg-teal-500" },
      { label: "System Design Flow", value: 88, color: "bg-emerald-500" },
      { label: "Communication Clarity", value: 82, color: "bg-indigo-500" },
      { label: "Leadership Composure", value: 78, color: "bg-amber-500" }
    ],
    transcript: "To support this traffic scale, we selected an event-driven queue topology, reducing write latency from 150 milliseconds to less than 10."
  }
};

export default function Hero() {
  const [activeTab, setActiveTab] = useState("consulting");
  const data = ROLE_DATA[activeTab];

  // Auto-cycle the roles to keep the hero section and score ring continuously alive
  useEffect(() => {
    const keys = Object.keys(ROLE_DATA);
    const interval = setInterval(() => {
      setActiveTab(prev => {
        const nextIdx = (keys.indexOf(prev) + 1) % keys.length;
        return keys[nextIdx];
      });
    }, 4500); // cycle every 4.5s
    return () => clearInterval(interval);
  }, []);

  // Scroll linked values for subtle scale, perspective shift, and background grid y-movement
  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, 600], [1.02, 0.90]);
  const mockupY = useTransform(scrollY, [0, 600], [0, 40]);
  const gridY = useTransform(scrollY, [0, 600], [0, -40]);
  const heroOpacity = 1;
  const heroScale = useTransform(scrollY, [0, 500], [1, 0.95]);
  const heroY = useTransform(scrollY, [0, 500], [0, -30]);

  // Mouse tilt tracking values (3D card effect)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for tilt values
  const rotateX = useSpring(useTransform(mouseY, [-180, 180], [6, -6]), { stiffness: 220, damping: 28 });
  const rotateY = useSpring(useTransform(mouseX, [-180, 180], [-6, 6]), { stiffness: 220, damping: 28 });

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const x = event.clientX - rect.left - width / 2;
    const y = event.clientY - rect.top - height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <section className="relative pt-32 pb-12 lg:pt-40 lg:pb-16 bg-transparent">

      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-12 lg:gap-16 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        
        {/* Left Copy Column */}
        <m.div 
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="flex flex-col justify-center lg:col-span-6 text-left"
        >
          <m.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-600/10 bg-teal-500/5 px-4 py-1.5 text-xs font-semibold text-[#0D524C]">
              <Sparkles className="h-3.5 w-3.5" />
              {"India's AI-Powered Placement Readiness & Campus Hiring Platform"}
            </span>
          </m.div>

          <m.h1
            className="mt-6 font-display text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl leading-[1.08]"
          >
            <m.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
              className="block"
            >
              Turn Placement Preparation
            </m.span>
            <m.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.16 }}
              className="block text-[#0D9488] dark:text-[#2DD4BF]"
            >
              Into Placement Success
            </m.span>
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.24 }}
            className="mt-6 max-w-lg text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-medium"
          >
            AI-powered interviews, GD practice, resume intelligence, career guidance, and readiness analytics for students, colleges, and recruiters.
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.32 }}
            className="mt-8 flex flex-wrap gap-4 animate-parent"
          >
            <Link href="/colleges#demo" className="cursor-pointer">
              <m.span
                className="inline-flex items-center gap-2 rounded-xl bg-[#0D524C] px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-teal-900/10 hover:bg-[#0A3D36] cursor-pointer"
                whileHover={{ scale: 1.03, y: -1.5, boxShadow: "0 10px 25px -4px rgba(13, 82, 76, 0.22)" }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 600, damping: 28 }}
              >
                Book Demo <ArrowRight className="h-5 w-5" />
              </m.span>
            </Link>
            <a href="#demo" className="cursor-pointer">
              <m.span
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-7 py-3.5 text-base font-semibold text-gray-700 hover:border-[#0D9488] hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:border-[#2DD4BF] dark:hover:bg-white/10 cursor-pointer"
                whileHover={{ scale: 1.03, y: -1.5 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 600, damping: 28 }}
              >
                Watch Demo
              </m.span>
            </a>
          </m.div>

          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.4 }}
            className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-gray-200/50 dark:border-white/10 pt-6"
          >
            {[
              { label: "AI-Powered", desc: "Real-time evaluation" },
              { label: "Placement Focused", desc: "Recruiter vetted" },
              { label: "College Ready", desc: "Batch analytics" },
              { label: "Recruiter Friendly", desc: "Pre-screened talent" }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col">
                <span className="text-sm font-bold text-[#0D9488] dark:text-[#2DD4BF]">{item.label}</span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">{item.desc}</span>
              </div>
            ))}
          </m.div>

          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="mt-8 flex items-center gap-3"
          >
            <div className="flex -space-x-2">
              {["bg-indigo-500", "bg-violet-500", "bg-[#0D9488]", "bg-teal-500"].map((c, i) => (
                <div
                  key={i}
                  className={`${c} h-9 w-9 rounded-full border-2 border-white/10 flex items-center justify-center text-[10px] font-bold text-white shadow-sm`}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Trusted by ambitious students, leading colleges, and recruiters across India.
            </p>
          </m.div>
        </m.div>

        {/* Right Dashboard Mockup Column */}
        <m.div 
          style={{ scale, y: mockupY, opacity: heroOpacity }}
          className="lg:col-span-6 flex flex-col items-center justify-center relative"
        >
          
          {/* Role Tabs */}
          <div className="flex w-full max-w-md bg-[#060E0D]/20 border border-[#00C4A7]/15 p-1 rounded-full mb-6 shadow-lg overflow-x-auto backdrop-blur-xl">
            {Object.keys(ROLE_DATA).map((roleKey) => (
              <button
                key={roleKey}
                onClick={() => setActiveTab(roleKey)}
                className={`relative flex-1 py-2 px-3 text-[11px] sm:text-xs font-bold rounded-full transition-all cursor-pointer min-w-[80px] ${
                  activeTab === roleKey ? "text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {activeTab === roleKey && (
                  <m.div
                    layoutId="activeHeroTab"
                    className="absolute inset-0 bg-[#00C4A7]/15 rounded-full border border-[#00C4A7]/40 shadow-[0_0_12px_rgba(0,196,167,0.25)]"
                    transition={{ type: "spring", stiffness: 550, damping: 35 }}
                  />
                )}
                <span className="relative z-10">
                  {roleKey === "consulting" ? "Consulting" : roleKey === "pm" ? "Product Mgmt" : roleKey === "leadership" ? "Leadership" : "Tech"}
                </span>
              </button>
            ))}
          </div>
 
          {/* Interactive Widget Box */}
          <m.div 
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="relative w-full max-w-md bg-gradient-to-br from-[#060E0D]/25 to-[#030706]/35 rounded-3xl border border-white/10 dark:border-teal-500/20 p-6 shadow-[0_0_50px_rgba(0,196,167,0.15)] overflow-hidden backdrop-blur-2xl"
          >
            {/* Glowing top line highlight */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00C4A7] to-transparent shadow-[0_1px_15px_rgba(0,196,167,0.6)]" />
            <div className="absolute -right-20 -top-20 w-42 h-42 bg-[#00C4A7]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-42 h-42 bg-[#6366F1]/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div>
                <h3 className="font-display text-lg font-bold text-white leading-tight">{data.title}</h3>
                <p className="text-xs text-[#00C4A7]/70 font-semibold tracking-wide mt-1">{data.subText}</p>
              </div>
              <span className="flex items-center gap-1.5 bg-[#051C18]/60 border border-[#00C4A7]/30 px-3 py-1 rounded-full text-[9px] font-bold text-[#00C4A7] tracking-wider uppercase shadow-[0_0_8px_rgba(0,196,167,0.15)]">
                <Award className="h-3 w-3" /> PLACEMENT READY
              </span>
            </div>
 
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center mb-6 relative z-10">
              
              {/* Circular score gauge */}
              <div className="sm:col-span-5 flex flex-col items-center">
                <div className="relative h-28 w-28">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="7" />
                    <m.circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#00C4A7"
                      strokeWidth="7"
                      strokeDasharray="263.8"
                      initial={{ strokeDashoffset: 263.8 }}
                      animate={{ strokeDashoffset: 263.8 - (263.8 * data.score) / 1000 }}
                      transition={{ type: "spring", stiffness: 180, damping: 20 }}
                      strokeLinecap="round"
                      className="drop-shadow-[0_0_5px_rgba(0,196,167,0.4)]"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-3xl font-black text-white">{data.score}</span>
                    <span className="text-[8px] text-[#00C4A7]/65 font-bold uppercase tracking-widest mt-1">Top 4%</span>
                  </div>
                </div>
                <div className="mt-4 w-full">
                  <div className="border border-[#00C4A7]/30 bg-[#051C18]/60 text-[#00C4A7] font-extrabold text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-xl text-center shadow-[0_0_8px_rgba(0,196,167,0.1)]">
                    {data.analysis}
                  </div>
                </div>
              </div>
 
              {/* Sub-Metrics list */}
              <div className="sm:col-span-7 space-y-3.5">
                <AnimatePresence mode="wait">
                  <m.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.99 }}
                    transition={{ duration: 0.12, ease: "easeOut" }}
                    className="space-y-3.5"
                  >
                    {data.metrics.map((metric) => (
                      <div key={metric.label}>
                        <div className="flex justify-between text-[11px] mb-1 font-semibold">
                          <span className="text-slate-350">{metric.label}</span>
                          <span className="font-bold text-white">{metric.value}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#121E1C]/80 rounded-full overflow-hidden">
                          <m.div
                            initial={{ width: 0 }}
                            animate={{ width: `${metric.value}%` }}
                            transition={{ type: "spring", stiffness: 200, damping: 22 }}
                            className={`h-full rounded-full ${metric.color}`}
                          />
                        </div>
                      </div>
                    ))}
                  </m.div>
                </AnimatePresence>
              </div>
 
            </div>
 
            {/* Speech Analysis HUD */}
            <div className="rounded-2xl border border-white/5 dark:border-teal-950/30 bg-[#030605]/35 p-4 relative z-10 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-2 text-[10px] font-extrabold text-[#00C4A7]/75 tracking-wider">
                <MessageSquare className="h-3.5 w-3.5 text-[#00C4A7]" />
                <span>LIVE TRANSCRIPT SYNTHESIS</span>
              </div>
              <AnimatePresence mode="wait">
                <m.p
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.99 }}
                  transition={{ duration: 0.1, ease: "easeOut" }}
                  className="text-xs text-slate-300 italic leading-relaxed font-medium"
                >
                  &ldquo;{data.transcript}&rdquo;
                </m.p>
              </AnimatePresence>
            </div>
 
          </m.div>

        </m.div>

      </div>

      {/* Scroll Down Indicator */}
      <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 opacity-80">Scroll to Explore</span>
        <div className="w-5 h-8 border-2 border-gray-300 dark:border-gray-500 rounded-full flex justify-center p-1">
          <m.div 
            animate={{ y: [0, 8, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-1 h-2 bg-[#0D9488] rounded-full" 
          />
        </div>
      </div>
    </section>
  );
}


