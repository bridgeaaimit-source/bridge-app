"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { ArrowRight, Info, Check, Unlock, Lock } from "lucide-react";

const SIGNALS = [
  { label: "Communication Verified", minScore: 400 },
  { label: "Structured Reasoning Validated", minScore: 550 },
  { label: "Leadership Presence Certified", minScore: 680 },
  { label: "Domain Rigor Certified", minScore: 760 },
  { label: "Recruiter Registry Unlocked", minScore: 800 }
];

export default function BridgeScoreSection() {
  const [metrics, setMetrics] = useState({
    thinking: 40,
    communication: 35,
    leadership: 45,
    domain: 30,
  });

  const [totalScore, setTotalScore] = useState(420);
  const [isManualMode, setIsManualMode] = useState(false);
  const [liveJitter, setLiveJitter] = useState(0);

  const sectionRef = useRef(null);
  
  // Track scroll viewport coordinates of the section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.85", "start 0.25"] // animates as the section moves into view
  });

  // Listener to dynamically update metrics and totalScore based on scroll position
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (!isManualMode) {
      // Clamp between 0 and 1
      const progress = Math.max(0, Math.min(1, latest));
      
      const thinking = Math.round(40 + (92 - 40) * progress);
      const communication = Math.round(35 + (88 - 35) * progress);
      const leadership = Math.round(45 + (90 - 45) * progress);
      const domain = Math.round(30 + (85 - 30) * progress);
      const score = Math.round(420 + (842 - 420) * progress);

      setMetrics({ thinking, communication, leadership, domain });
      setTotalScore(score);
    }
  });

  // Continuous live evaluation fluctuation
  useEffect(() => {
    if (isManualMode) {
      setLiveJitter(0);
      return;
    }
    const interval = setInterval(() => {
      // Random fluctuation between -6 and +6 to simulate live AI processing
      setLiveJitter(Math.floor(Math.random() * 13) - 6);
    }, 1200);
    return () => clearInterval(interval);
  }, [isManualMode]);

  const handleSliderChange = (key, val) => {
    setIsManualMode(true);
    setMetrics((p) => ({ ...p, [key]: parseInt(val) }));
  };

  // Convert percentages to out-of-250 scores, then sum for total out of 1000
  const thinkingScore = Math.round((metrics.thinking / 100) * 250);
  const commScore = Math.round((metrics.communication / 100) * 250);
  const leadershipScore = Math.round((metrics.leadership / 100) * 250);
  const domainScore = Math.round((metrics.domain / 100) * 250);
  
  const currentTotal = isManualMode 
    ? (thinkingScore + commScore + leadershipScore + domainScore) 
    : Math.max(0, Math.min(1000, totalScore + liveJitter));

  // Determine readiness bracket and color theme dynamically
  let bracket = "Developing Composure";
  let bracketColor = "text-sky-400 bg-sky-500/10 border-sky-500/20";
  let gaugeColor = "#38bdf8"; // sky-400
  
  if (currentTotal >= 800) {
    bracket = "Placement Ready (Elite)";
    bracketColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    gaugeColor = "#0D524C"; // brand-dark
  } else if (currentTotal < 600) {
    bracket = "Skill Foundation";
    bracketColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
    gaugeColor = "#f43f5e"; // rose-500
  }

  return (
    <section ref={sectionRef} className="bg-transparent pt-28 pb-20 border-b border-gray-200 dark:border-white/10 transition-colors">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">Skill Credentials</span>
          <h2 className="font-display mt-3 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
            A readiness signal recruiters can trust.
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            The BRIDGE Score transforms interview performance, communication quality, structured thinking, and professional composure into a measurable credential.
          </p>
        </div>

        {/* Interactive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Gauge Column */}
          <motion.div 
            className="lg:col-span-5 flex flex-col items-center justify-center bg-white dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-3xl p-8 transition-colors shadow-sm dark:shadow-none"
            animate={{ 
              y: [0, -14, 0, -7, 0],
              boxShadow: [
                "0 4px 20px -4px rgba(13, 82, 76, 0.06)",
                "0 20px 40px -8px rgba(13, 82, 76, 0.12)",
                "0 4px 20px -4px rgba(13, 82, 76, 0.06)",
                "0 12px 30px -6px rgba(13, 82, 76, 0.09)",
                "0 4px 20px -4px rgba(13, 82, 76, 0.06)"
              ]
            }}
            transition={{
              duration: 5,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "loop"
            }}
            style={{ willChange: "transform" }}
          >
            
            {/* Mode Toggle Pill */}
            <div className="flex bg-gray-100 dark:bg-black/40 backdrop-blur-md p-1 rounded-full mb-6 text-[10px] font-bold">
              <button
                onClick={() => setIsManualMode(false)}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  !isManualMode ? "bg-[#14B8A6] text-white dark:text-black" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Journey Mode
              </button>
              <button
                onClick={() => setIsManualMode(true)}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  isManualMode ? "bg-[#14B8A6] text-white dark:text-black" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Manual Sandbox
              </button>
            </div>
            
            <div className="relative h-48 w-48 sm:h-56 sm:w-56">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={gaugeColor}
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  animate={{ strokeDashoffset: 251.2 - (251.2 * currentTotal) / 1000 }}
                  transition={{ type: "spring", stiffness: 280, damping: 26 }}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-4xl sm:text-5xl font-black text-gray-900 dark:text-white">
                  {currentTotal}
                </span>
                <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 font-bold tracking-widest uppercase">/ 1000</span>
              </div>
            </div>

            <div className="mt-6 text-center w-full">
              <span className={`inline-flex items-center gap-1.5 border px-3 py-1 rounded-full text-xs font-bold transition-all ${bracketColor}`}>
                {currentTotal >= 800 ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                {bracket}
              </span>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2 font-semibold">
                {!isManualMode 
                  ? "Scroll down to see the metrics progress, or toggle Manual Sandbox to adjust."
                  : "Sandbox Mode active: Drag the sliders to simulate score changes."}
              </p>
              
              <div className="mt-5 pt-5 border-t border-gray-100 dark:border-white/10 w-full">
                <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">Verification Signals</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {SIGNALS.map((signal, idx) => {
                    const isUnlocked = currentTotal >= signal.minScore;
                    return (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[9px] font-bold transition-all duration-200 whitespace-nowrap ${
                          isUnlocked
                            ? "bg-[#0D9488]/10 border-teal-500/20 text-[#0D9488] dark:text-[#2DD4BF]"
                            : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400 opacity-60"
                        }`}
                      >
                        {isUnlocked ? "✓" : "🔒"} {signal.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sliders Column */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Metric 1 */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-bold text-gray-900 dark:text-white">Structured Thinking</span>
                <span className="text-sm font-black text-[#0D9488] dark:text-[#2DD4BF]">{thinkingScore} / 250</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={metrics.thinking}
                onChange={(e) => handleSliderChange("thinking", e.target.value)}
                className="w-full appearance-none cursor-pointer"
                style={{
                  '--track-bg': `linear-gradient(to right, #0D9488 0%, #0D524C ${((metrics.thinking - 30) / 70) * 100}%, #E5E7EB ${((metrics.thinking - 30) / 70) * 100}%, #E5E7EB 100%)`
                }}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                Framework MECE applicability, product trade-offs, and logical decomposition.
              </p>
            </div>

            {/* Metric 2 */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-bold text-gray-900 dark:text-white">Communication Clarity</span>
                <span className="text-sm font-black text-[#0D9488] dark:text-[#2DD4BF]">{commScore} / 250</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={metrics.communication}
                onChange={(e) => handleSliderChange("communication", e.target.value)}
                className="w-full appearance-none cursor-pointer"
                style={{
                  '--track-bg': `linear-gradient(to right, #0D9488 0%, #0D524C ${((metrics.communication - 30) / 70) * 100}%, #E5E7EB ${((metrics.communication - 30) / 70) * 100}%, #E5E7EB 100%)`
                }}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                Pacing control, active filler word minimization, and logical transition phrases.
              </p>
            </div>

            {/* Metric 3 */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-bold text-gray-900 dark:text-white">Leadership Composure</span>
                <span className="text-sm font-black text-[#0D9488] dark:text-[#2DD4BF]">{leadershipScore} / 250</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={metrics.leadership}
                onChange={(e) => handleSliderChange("leadership", e.target.value)}
                className="w-full appearance-none cursor-pointer"
                style={{
                  '--track-bg': `linear-gradient(to right, #0D9488 0%, #0D524C ${((metrics.leadership - 30) / 70) * 100}%, #E5E7EB ${((metrics.leadership - 30) / 70) * 100}%, #E5E7EB 100%)`
                }}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                Situational STAR framework accuracy, voice frequency stability, and crisis poise.
              </p>
            </div>

            {/* Metric 4 */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-bold text-gray-900 dark:text-white">Domain Rigor</span>
                <span className="text-sm font-black text-[#0D9488] dark:text-[#2DD4BF]">{domainScore} / 250</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={metrics.domain}
                onChange={(e) => handleSliderChange("domain", e.target.value)}
                className="w-full appearance-none cursor-pointer"
                style={{
                  '--track-bg': `linear-gradient(to right, #0D9488 0%, #0D524C ${((metrics.domain - 30) / 70) * 100}%, #E5E7EB ${((metrics.domain - 30) / 70) * 100}%, #E5E7EB 100%)`
                }}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                Technical depth, product prioritizing logic, or consulting case competency.
              </p>
            </div>

            {/* Historical Progress */}
            <motion.div 
              variants={{ hidden: { opacity: 0, scale: 0.98 }, visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 120, damping: 22 } } }}
              className="rounded-2xl bg-teal-50 dark:bg-[#0D9488]/5 border border-teal-100 dark:border-teal-500/20 backdrop-blur-md p-5 mt-8 transition-colors"
            >
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 text-[#0D9488] dark:text-[#2DD4BF]" />
                <span className="text-xs font-bold text-[#0D9488] dark:text-[#2DD4BF] uppercase tracking-wider">Typical Score Progression</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-bold flex-wrap gap-3">
                <span>Week 1: <strong className="text-gray-900 dark:text-white">460</strong></span>
                <ArrowRight className="h-3 w-3 text-gray-400 dark:text-gray-600" />
                <span>Week 4: <strong className="text-gray-900 dark:text-white">690</strong></span>
                <ArrowRight className="h-3 w-3 text-gray-400 dark:text-gray-600" />
                <span>Week 8: <strong className="text-[#0D9488] dark:text-[#2DD4BF]">820+</strong></span>
              </div>
            </motion.div>

          </div>

        </div>

      </div>
    </section>
  );
}
