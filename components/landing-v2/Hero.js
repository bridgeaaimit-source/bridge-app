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
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
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
              The operating system for career readiness.
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
              Become
            </m.span>
            <m.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.16 }}
              className="block text-[#0D9488] dark:text-[#2DD4BF]"
            >
              impossible to ignore.
            </m.span>
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.24 }}
            className="mt-6 max-w-lg text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-medium"
          >
            BridgeAI transforms communication quality, structured thinking, leadership presence, and interview performance into measurable professional credibility recruiters can trust.
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.32 }}
            className="mt-8 flex flex-wrap gap-4 animate-parent"
          >
            <Link href="/login" className="cursor-pointer">
              <m.span
                className="inline-flex items-center gap-2 rounded-xl bg-[#0D524C] px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-teal-900/10 hover:bg-[#0A3D36] cursor-pointer"
                whileHover={{ scale: 1.03, y: -1.5, boxShadow: "0 10px 25px -4px rgba(13, 82, 76, 0.22)" }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 600, damping: 28 }}
              >
                Unlock Your BRIDGE Score <ArrowRight className="h-5 w-5" />
              </m.span>
            </Link>
            <Link href="/login" className="cursor-pointer">
              <m.span
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-7 py-3.5 text-base font-semibold text-gray-700 hover:border-[#0D9488] hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:border-[#2DD4BF] dark:hover:bg-white/10 cursor-pointer"
                whileHover={{ scale: 1.03, y: -1.5 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 600, damping: 28 }}
              >
                Explore the Readiness Framework
              </m.span>
            </Link>
          </m.div>

          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
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
              Trusted by ambitious candidates entering consulting, product, leadership, and technology careers.
            </p>
          </m.div>
        </m.div>

        {/* Right Dashboard Mockup Column */}
        <m.div 
          style={{ scale, y: mockupY, opacity: heroOpacity }}
          className="lg:col-span-6 flex flex-col items-center justify-center relative"
        >
          
          {/* Role Tabs */}
          <div className="flex w-full max-w-md bg-white border border-gray-200 dark:bg-white/5 dark:border-white/10 p-1 rounded-2xl mb-6 shadow-sm overflow-x-auto backdrop-blur-md">
            {Object.keys(ROLE_DATA).map((roleKey) => (
              <button
                key={roleKey}
                onClick={() => setActiveTab(roleKey)}
                className={`relative flex-1 py-2 px-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer min-w-[80px] ${
                  activeTab === roleKey ? "text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                {activeTab === roleKey && (
                  <m.div
                    layoutId="activeHeroTab"
                    className="absolute inset-0 bg-[#F0FDFA] dark:bg-[#0D9488]/20 rounded-xl border border-teal-100 dark:border-teal-500/20"
                    transition={{ type: "spring", stiffness: 550, damping: 35 }}
                  />
                )}
                <span className="relative z-10 capitalize">
                  {roleKey === "pm" ? "Product Mgmt" : roleKey === "engineering" ? "Tech" : roleKey}
                </span>
              </button>
            ))}
          </div>

          {/* Interactive Widget Box */}
          <m.div 
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="relative w-full max-w-md bg-white/80 dark:bg-[#0A1211]/60 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/10 p-6 shadow-2xl shadow-teal-900/10 dark:shadow-teal-900/20 overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-600 to-emerald-500" />
            
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white leading-tight">{data.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{data.subText}</p>
              </div>
              <span className="flex items-center gap-1 bg-[#F0FDFA] dark:bg-[#0D9488]/20 border border-teal-100 dark:border-teal-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold text-[#0D9488] dark:text-[#2DD4BF]">
                <Award className="h-3 w-3" /> PLACEMENT READY
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center mb-6">
              
              {/* Circular score gauge */}
              <div className="sm:col-span-5 flex flex-col items-center">
                <div className="relative h-28 w-28">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <m.circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#2DD4BF"
                      strokeWidth="8"
                      strokeDasharray="263.8"
                      initial={{ strokeDashoffset: 263.8 }}
                      animate={{ strokeDashoffset: 263.8 - (263.8 * data.score) / 1000 }}
                      transition={{ type: "spring", stiffness: 180, damping: 20 }}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-2xl font-extrabold text-gray-900 dark:text-white">{data.score}</span>
                    <span className="text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Top 4%</span>
                  </div>
                </div>
                <div className="mt-2.5 text-center">
                  <span className="inline-block px-2.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                    {data.analysis}
                  </span>
                </div>
              </div>

              {/* Sub-Metrics list */}
              <div className="sm:col-span-7 space-y-3">
                <AnimatePresence mode="wait">
                  <m.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.99 }}
                    transition={{ duration: 0.12, ease: "easeOut" }}
                    className="space-y-3"
                  >
                    {data.metrics.map((metric) => (
                      <div key={metric.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">{metric.label}</span>
                          <span className="font-bold text-gray-900 dark:text-white">{metric.value}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
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
            <div className="rounded-2xl border border-gray-100 bg-white/60 dark:border-white/10 dark:bg-white/5 p-4 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                <MessageSquare className="h-3.5 w-3.5 text-[#0D9488] dark:text-[#2DD4BF]" />
                <span>LIVE TRANSCRIPT SYNTHESIS</span>
              </div>
              <AnimatePresence mode="wait">
                <m.p
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.99 }}
                  transition={{ duration: 0.1, ease: "easeOut" }}
                  className="text-xs text-gray-600 dark:text-gray-300 italic leading-relaxed"
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


