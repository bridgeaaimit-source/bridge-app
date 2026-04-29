"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  { target: "[data-tour='bridge-score-card']", title: "Your BRIDGE Score", body: "This is your placement readiness out of 1000. Every activity you do here pushes it higher. Aim for 700+.", pos: "right" },
  { target: "[data-tour='start-challenge']", title: "AI Mock Interviews", body: "Practice real HR and technical questions. Our AI scores your answer, tone, and confidence in real time.", pos: "top" },
  { target: "[data-tour='nav-gd']", title: "Group Discussion Battles", body: "Join live GD sessions with 3 other students. AI judges who spoke best, most clearly, and led the group.", pos: "right" },
  { target: "[data-tour='nav-leaderboard']", title: "Leaderboard", body: "See where you rank among students at your college and across India. Top 10 get featured to recruiters.", pos: "right" },
  { target: "[data-tour='nav-interview']", title: "AI Resume Builder", body: "Upload your resume. Our AI rewrites it to be ATS-optimized and tailored to your target company.", pos: "right" },
  { target: "[data-tour='nav-career']", title: "Career Intelligence", body: "Paste any job description. We'll tell you exactly what skills and certifications you're missing — with direct links.", pos: "right" },
  { target: "[data-tour='streak-card']", title: "Daily Streak 🔥", body: "Practice every day to build your streak. Students with 7+ day streaks improve 3x faster.", pos: "top" },
  { target: "[data-tour='bell']", title: "Notifications", body: "Get alerts when GD battles start, when your score changes, and when new company packs drop.", pos: "bottom" },
  { target: "[data-tour='profile-avatar']", title: "Your Profile", body: "Add your college, target company, and resume here. A complete profile gets 2x better AI recommendations.", pos: "bottom" },
];

function getRect(selector) {
  try {
    const el = document.querySelector(selector);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    // Return viewport-relative coordinates (no scrollY/X)
    return {
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
      right: r.right,
      bottom: r.bottom
    };
  } catch { return null; }
}

const PAD = 12;
const TOOLTIP_W = 288;
const TOOLTIP_H = 160;

function getTooltipStyle(rect, pos, windowW, windowH) {
  if (!rect) return { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };

  // Check if element is in sidebar (left side, narrow width)
  const isInSidebar = rect.left < 300 && rect.width < 280;
  const isMobile = windowW < 768;

  // Calculate available space
  const spaceRight = windowW - rect.right;
  const spaceLeft = rect.left;
  const spaceBottom = windowH - rect.bottom;
  const spaceTop = rect.top;

  // Determine best position
  let finalPos = pos;

  // If requested position doesn't fit, pick one that does
  if (pos === "right" && spaceRight < TOOLTIP_W + PAD) finalPos = "left";
  if (pos === "left" && spaceLeft < TOOLTIP_W + PAD) finalPos = "bottom";
  if (pos === "bottom" && spaceBottom < TOOLTIP_H) finalPos = "top";
  if (pos === "top" && spaceTop < TOOLTIP_H) finalPos = "right";

  // Mobile: always use top or bottom
  if (isMobile) {
    finalPos = spaceBottom > TOOLTIP_H ? "bottom" : "top";
  }

  // Calculate position
  let top, left;

  if (finalPos === "right") {
    top = Math.max(PAD, Math.min(rect.top + rect.height / 2 - 60, windowH - TOOLTIP_H - PAD));
    left = Math.min(rect.right + PAD, windowW - TOOLTIP_W - PAD);
  } else if (finalPos === "left") {
    top = Math.max(PAD, Math.min(rect.top + rect.height / 2 - 60, windowH - TOOLTIP_H - PAD));
    left = Math.max(PAD, rect.left - TOOLTIP_W - PAD);
  } else if (finalPos === "bottom") {
    top = Math.min(rect.bottom + PAD, windowH - TOOLTIP_H - PAD);
    left = Math.max(PAD, Math.min(rect.left, windowW - TOOLTIP_W - PAD));
  } else {
    // top (default)
    top = Math.max(PAD, rect.top - TOOLTIP_H - PAD);
    left = Math.max(PAD, Math.min(rect.left + rect.width / 2 - TOOLTIP_W / 2, windowW - TOOLTIP_W - PAD));
  }

  return { position: "fixed", top, left };
}

export default function ProductTour({ isOpen, onClose, startStep = 0 }) {
  const [step, setStep] = useState(startStep);
  const [rect, setRect] = useState(null);
  const [windowSize, setWindowSize] = useState({ w: 1200, h: 800 });
  const rafRef = useRef(null);

  const measure = useCallback(() => {
    if (step >= STEPS.length) return;
    const r = getRect(STEPS[step].target);
    setRect(r);
    setWindowSize({ w: window.innerWidth, h: window.innerHeight });
  }, [step]);

  useEffect(() => {
    if (!isOpen) return;
    setStep(startStep);
  }, [isOpen, startStep]);

  useEffect(() => {
    if (!isOpen) return;
    // Small delay to ensure DOM is settled
    const timer = setTimeout(() => {
      measure();
      // Scroll element into view if needed
      try {
        const el = document.querySelector(STEPS[step]?.target);
        if (el) {
          const r = el.getBoundingClientRect();
          // Only scroll if element is off-screen
          if (r.top < 0 || r.bottom > window.innerHeight) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      } catch {}
    }, 100);
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [step, isOpen, measure]);

  if (!isOpen) return null;

  const current = STEPS[step];
  const tooltipStyle = getTooltipStyle(rect, current?.pos, windowSize.w, windowSize.h);
  const isLast = step === STEPS.length - 1;

  // Spotlight using 4 overlay quadrants (viewport coordinates)
  const spotPad = 8;
  const sTop = rect ? Math.max(0, rect.top - spotPad) : 0;
  const sLeft = rect ? Math.max(0, rect.left - spotPad) : 0;
  const sW = rect ? rect.width + spotPad * 2 : 0;
  const sH = rect ? rect.height + spotPad * 2 : 0;

  return (
    <div className="fixed inset-0 z-[8000] pointer-events-none">
      {/* 4-quadrant dark overlay */}
      {rect && (<>
        <div className="absolute bg-black/70 pointer-events-auto" style={{ top: 0, left: 0, right: 0, height: sTop }} />
        <div className="absolute bg-black/70 pointer-events-auto" style={{ top: sTop, left: 0, width: sLeft, height: sH }} />
        <div className="absolute bg-black/70 pointer-events-auto" style={{ top: sTop, left: sLeft + sW, right: 0, height: sH }} />
        <div className="absolute bg-black/70 pointer-events-auto" style={{ top: sTop + sH, left: 0, right: 0, bottom: 0 }} />
        {/* Spotlight highlight border */}
        <div className="absolute rounded-xl pointer-events-none" style={{ top: sTop, left: sLeft, width: sW, height: sH, boxShadow: "0 0 0 3px #14B8A6", transition: "all 0.3s ease" }} />
      </>)}
      {!rect && <div className="absolute inset-0 bg-black/70 pointer-events-auto" />}

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.93 }}
          transition={{ duration: 0.18 }}
          className="absolute bg-white rounded-xl shadow-2xl p-4 w-72 pointer-events-auto z-10"
          style={tooltipStyle}>
          <p className="font-semibold text-gray-900 text-[15px] mb-1">{current?.title}</p>
          <p className="text-gray-500 text-[13px] leading-relaxed mb-4">{current?.body}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Step {step + 1} of {STEPS.length}</span>
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Skip tour</button>
              {isLast ? (
                <button onClick={onClose}
                  className="px-4 py-1.5 bg-[#0D9488] text-white text-sm rounded-lg hover:bg-[#0F766E] transition-colors font-medium">
                  Finish tour 🎉
                </button>
              ) : (
                <button onClick={() => setStep((s) => s + 1)}
                  className="px-4 py-1.5 bg-[#0D9488] text-white text-sm rounded-lg hover:bg-[#0F766E] transition-colors font-medium">
                  Next →
                </button>
              )}
            </div>
          </div>
          {/* Dot progress */}
          <div className="flex gap-1 mt-3 justify-center">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all ${i === step ? "w-4 bg-[#0D9488]" : "w-1 bg-gray-200"}`} />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
