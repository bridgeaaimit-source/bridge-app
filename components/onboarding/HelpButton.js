"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MENU = [
  { icon: "🎯", label: "Retake product tour", action: "tour" },
  { icon: "📊", label: "How BRIDGE Score works", action: "score" },
  { icon: "🤝", label: "Talk to support", action: "support" },
  { icon: "⌨️", label: "Keyboard shortcuts", action: "shortcuts" },
];

export default function HelpButton({ onStartTour }) {
  const [open, setOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handle = (action) => {
    setOpen(false);
    if (action === "tour") onStartTour?.();
    if (action === "support") window.open("mailto:support@bridgeai.in", "_blank");
    if (action === "shortcuts") setShowShortcuts(true);
    if (action === "score") setShowScore(true);
  };

  return (
    <>
      <div ref={ref} className="fixed bottom-6 right-6 z-[7000] flex flex-col items-end gap-2">
        {/* Popover */}
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ duration: 0.15 }}
              className="bg-white rounded-xl shadow-xl border border-gray-100 p-1.5 w-52 mb-1">
              {MENU.map((item) => (
                <button key={item.action} onClick={() => handle(item.action)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[#F0FDFA] transition-colors text-left">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main button */}
        <motion.button initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
          onClick={() => setOpen((o) => !o)}
          className="w-12 h-12 bg-[#0D9488] text-white rounded-full shadow-lg flex items-center justify-center text-xl font-bold hover:bg-[#0F766E] transition-colors"
          aria-label="Help">
          {open ? "✕" : "?"}
        </motion.button>
      </div>

      {/* Shortcuts modal */}
      <AnimatePresence>
        {showShortcuts && (
          <div className="fixed inset-0 z-[9100] flex items-center justify-center bg-black/50" onClick={() => setShowShortcuts(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold text-gray-900 text-lg mb-4">⌨️ Keyboard Shortcuts</h3>
              <div className="space-y-2.5 text-sm">
                {[["G D", "Go to Dashboard"],["G I", "Go to Interview"],["G L", "Go to Leaderboard"],["G P", "Go to Profile"],["?", "Open help menu"]].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-gray-600">{v}</span>
                    <span className="font-mono bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs">{k}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowShortcuts(false)} className="mt-5 w-full py-2 bg-[#F0FDFA] text-[#0D9488] rounded-lg font-medium text-sm">Close</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Score explainer modal */}
      <AnimatePresence>
        {showScore && (
          <div className="fixed inset-0 z-[9100] flex items-center justify-center bg-black/50" onClick={() => setShowScore(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold text-gray-900 text-lg mb-3">📊 How BRIDGE Score Works</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">
                Your BRIDGE Score is a 0–1000 readiness score calculated from your activity on the platform.
              </p>
              <div className="space-y-2 text-sm">
                {[["🎤 Mock Interviews", "+10–50 pts per session"],["⚡ GD Battles", "+20–40 pts per battle"],["🏅 Streak bonus", "+5 pts per active day"],["👤 Profile completeness", "+50 pts"],["📄 Resume uploaded", "+30 pts"]].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center p-2.5 bg-[#F0FDFA] rounded-lg">
                    <span className="font-medium text-gray-700">{k}</span>
                    <span className="text-[#0D9488] font-semibold text-xs">{v}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowScore(false)} className="mt-5 w-full py-2 bg-[#0D9488] text-white rounded-lg font-medium text-sm">Got it</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
