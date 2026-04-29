"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const GOALS = [
  { id: "placement", emoji: "🎯", label: "Land a placement this year" },
  { id: "confidence", emoji: "💪", label: "Improve my interview confidence" },
  { id: "company", emoji: "📊", label: "Crack a specific company (FAANG/TCS/Infosys)" },
  { id: "explore", emoji: "🧠", label: "Just explore and practice" },
];

const COMPANIES = [
  "Amazon","Google","Microsoft","TCS","Infosys","Wipro",
  "Accenture","Flipkart","Swiggy","Zomato","JP Morgan","Deloitte","Other",
];

const slideVariants = {
  enter: (dir) => ({ x: dir * 40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir * -40, opacity: 0 }),
};

function ScoreRing({ animate }) {
  const [score, setScore] = useState(0);
  useEffect(() => {
    if (!animate) { setScore(0); return; }
    let start = null;
    const target = 520;
    const duration = 1400;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setScore(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [animate]);
  const r = 54;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} stroke="#E5E7EB" strokeWidth="12" fill="none" />
        <circle cx="64" cy="64" r={r} stroke="url(#og)" strokeWidth="12" fill="none"
          strokeDasharray={`${circ * (score / 1000)} ${circ}`} strokeLinecap="round" />
        <defs>
          <linearGradient id="og" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0D9488" /><stop offset="100%" stopColor="#14B8A6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-[#0D9488]">{score}</span>
        <span className="text-[10px] text-gray-500">/ 1000</span>
      </div>
    </div>
  );
}

export default function OnboardingModal({ isOpen, userName, onComplete, onSkip }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [scoreAnimated, setScoreAnimated] = useState(false);

  useEffect(() => {
    if (step === 1) setTimeout(() => setScoreAnimated(true), 200);
    else setScoreAnimated(false);
  }, [step]);

  useEffect(() => {
    if (step === 4 && typeof window !== "undefined") {
      import("canvas-confetti").then((m) => {
        const fire = (ratio, opts) => m.default({ origin: { y: 0.6 }, particleCount: Math.floor(200 * ratio), ...opts });
        setTimeout(() => {
          fire(0.25, { spread: 26, startVelocity: 55 });
          fire(0.2, { spread: 60 });
          fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
          fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        }, 300);
      });
    }
  }, [step]);

  const go = (n) => { setDir(n > step ? 1 : -1); setStep(n); };
  const TOTAL = 5;
  const firstName = (userName || "there").split(" ")[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9000] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto">
        {/* Step header */}
        {step > 0 && step < 4 && (
          <div className="flex items-center justify-between px-6 pt-5">
            <button onClick={() => go(step - 1)} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">← Back</button>
            <span className="text-xs font-medium text-gray-400">Step {step + 1} of {TOTAL}</span>
            <button onClick={onSkip} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Skip</button>
          </div>
        )}

        <div className="p-6 pb-8">
          <AnimatePresence mode="wait" custom={dir}>
            {/* Step 0 — Welcome */}
            {step === 0 && (
              <motion.div key="s0" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.22 }} className="text-center">
                <motion.img src="/images/logo_400w.png" alt="BridgeAI"
                  initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}
                  className="h-14 mx-auto mb-6 object-contain" />
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Welcome to BridgeAI, {firstName} 👋</h2>
                <p className="text-gray-500 leading-relaxed mb-8">
                  You're about to go from nervous to unstoppable.<br />Let's set you up in 60 seconds.
                </p>
                <div className="flex justify-center gap-2 mb-8">
                  {Array.from({ length: TOTAL }).map((_, i) => (
                    <div key={i} className={`h-2 rounded-full transition-all ${i === step ? "w-6 bg-[#0D9488]" : "w-2 bg-gray-200"}`} />
                  ))}
                </div>
                <button onClick={() => go(1)} className="w-full bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all">
                  Let's go →
                </button>
              </motion.div>
            )}

            {/* Step 1 — BRIDGE Score */}
            {step === 1 && (
              <motion.div key="s1" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }}>
                <ScoreRing animate={scoreAnimated} />
                <h2 className="text-xl font-bold text-gray-900 mt-5 mb-2 text-center">Your BRIDGE Score — your placement passport</h2>
                <p className="text-gray-500 text-sm leading-relaxed text-center mb-5">
                  Every mock, GD battle, and interview pushes this number up. Recruiters love students above 700. You start at 0 — let's change that.
                </p>
                <div className="relative h-2.5 rounded-full overflow-hidden mb-2"
                  style={{ background: "linear-gradient(to right, #ef4444 0%, #f97316 30%, #eab308 60%, #22c55e 100%)" }}>
                  <div className="absolute top-0 w-1 h-full bg-white rounded-full shadow" style={{ left: "52%" }} />
                </div>
                <div className="grid grid-cols-4 text-center text-[10px] text-gray-500 mb-6 gap-1">
                  <span>0–400<br /><b>Beginner</b></span>
                  <span>401–650<br /><b>Intermediate</b></span>
                  <span>651–850<br /><b>Advanced</b></span>
                  <span>851–1000<br /><b>Expert</b></span>
                </div>
                <button onClick={() => go(2)} className="w-full bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all">
                  Got it →
                </button>
              </motion.div>
            )}

            {/* Step 2 — Goal */}
            {step === 2 && (
              <motion.div key="s2" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }}>
                <h2 className="text-xl font-bold text-gray-900 mb-1">What's your #1 goal right now?</h2>
                <p className="text-gray-500 text-sm mb-5">This helps us personalise your experience.</p>
                <div className="space-y-3 mb-6">
                  {GOALS.map((g) => (
                    <button key={g.id} onClick={() => setSelectedGoal(g.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                        selectedGoal === g.id ? "border-[#0D9488] bg-[#F0FDFA]" : "border-gray-200 hover:border-gray-300"
                      }`}>
                      <span className="text-xl">{g.emoji}</span>
                      <span className={`font-medium text-sm ${selectedGoal === g.id ? "text-[#0D9488]" : "text-gray-800"}`}>{g.label}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => go(3)} disabled={!selectedGoal}
                  className="w-full bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white py-3.5 rounded-xl font-semibold disabled:opacity-40 hover:shadow-lg transition-all">
                  This is my goal →
                </button>
              </motion.div>
            )}

            {/* Step 3 — Target Company */}
            {step === 3 && (
              <motion.div key="s3" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }}>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Any company in mind?</h2>
                <p className="text-gray-500 text-sm mb-5">Select all that apply.</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {COMPANIES.map((c) => (
                    <button key={c}
                      onClick={() => setSelectedCompanies((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c])}
                      className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                        selectedCompanies.includes(c) ? "border-[#0D9488] bg-[#F0FDFA] text-[#0D9488]" : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
                <button onClick={() => { onComplete({ goal: selectedGoal, companies: selectedCompanies }); go(4); }}
                  className="w-full bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all mb-3">
                  Set my target →
                </button>
                <button onClick={() => { onComplete({ goal: selectedGoal, companies: [] }); go(4); }}
                  className="w-full text-sm text-gray-400 hover:text-gray-600 py-1 transition-colors">
                  Skip for now
                </button>
              </motion.div>
            )}

            {/* Step 4 — All set */}
            {step === 4 && (
              <motion.div key="s4" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.22 }} className="text-center">
                <svg className="w-20 h-20 mx-auto mb-4" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="36" fill="#F0FDFA" stroke="#0D9488" strokeWidth="4" />
                  <motion.path d="M24 40 L36 52 L56 28" fill="none" stroke="#0D9488" strokeWidth="4"
                    strokeLinecap="round" strokeLinejoin="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.3 }} />
                </svg>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">You're ready to bridge the gap! 🎉</h2>
                <p className="text-gray-500 text-sm mb-6">Here's your personalised plan:</p>
                <div className="text-left bg-[#F0FDFA] rounded-xl p-4 mb-6 space-y-2.5">
                  {["Take your first mock interview","Join a GD battle","Build your resume","Check your BRIDGE Score"].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-[#0F766E] font-medium">
                      <div className="w-5 h-5 rounded-full bg-[#0D9488] flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
                <Link href="/interview" onClick={onSkip}
                  className="block w-full bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all mb-3 text-center">
                  Start my first mock →
                </Link>
                <button onClick={onSkip} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                  Take me to dashboard
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
