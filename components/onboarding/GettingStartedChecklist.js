"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const ITEMS = [
  { id: "profile", label: "Complete your profile (college, year, target company)", href: "/profile" },
  { id: "interview", label: "Take your first mock interview", href: "/interview" },
  { id: "gd", label: "Join a GD battle", href: "/gd" },
  { id: "resume", label: "Upload your resume", href: "/profile" },
];

function loadLocal() {
  try { return JSON.parse(localStorage.getItem("bridge_checklist") || "{}"); } catch { return {}; }
}
function saveLocal(data) {
  try { localStorage.setItem("bridge_checklist", JSON.stringify(data)); } catch {}
}

export default function GettingStartedChecklist({ stats, userProfile, gdJoined = false, resumeUploaded = false }) {
  const [checked, setChecked] = useState({});
  const [dismissed, setDismissed] = useState(false);
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    const stored = loadLocal();
    // Auto-check all 4 items based on real data (no manual ticking)
    const auto = {
      interview: (stats?.interviewsDone || 0) > 0,
      profile: !!(userProfile?.college && userProfile?.college !== "Add College" && userProfile?.college !== ""),
      gd: gdJoined,
      resume: resumeUploaded || !!(userProfile?.resume || userProfile?.resumeUrl),
    };
    setChecked(auto);
    setDismissed(!!stored._dismissed);
  }, [stats, userProfile, gdJoined, resumeUploaded]);

  useEffect(() => {
    const done = ITEMS.every((i) => checked[i.id]);
    if (done && !allDone) {
      setAllDone(true);
      // Confetti burst
      if (typeof window !== "undefined") {
        import("canvas-confetti").then((m) => {
          m.default({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        });
      }
      // Auto-dismiss after 5s
      setTimeout(() => setDismissed(true), 5000);
    }
  }, [checked, allDone]);

  const dismiss = () => {
    const next = { ...checked, _dismissed: true };
    saveLocal(next);
    setDismissed(true);
  };

  const completedCount = ITEMS.filter((i) => checked[i.id]).length;
  const pct = Math.round((completedCount / ITEMS.length) * 100);

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6"
      >
        {allDone ? (
          <div className="text-center py-2">
            <div className="text-2xl mb-2">🎉</div>
            <p className="font-semibold text-gray-900">You're all set! Keep practicing to climb the leaderboard.</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Get started — 4 steps to your first score</h3>
                <p className="text-xs text-gray-500 mt-0.5">{pct}% setup complete</p>
              </div>
              <button onClick={dismiss} className="text-gray-300 hover:text-gray-500 transition-colors text-lg leading-none">×</button>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#0D9488] to-[#14B8A6]"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="space-y-3">
              {ITEMS.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  {/* Non-clickable checkbox - auto-tick only */}
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                      checked[item.id] ? "bg-[#0D9488] border-[#0D9488]" : "border-gray-300"
                    }`}
                  >
                    {checked[item.id] && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <Link href={item.href}
                    className={`text-sm flex-1 hover:text-[#0D9488] transition-colors ${
                      checked[item.id] ? "line-through text-gray-400" : "text-gray-700"
                    }`}>
                    {item.label}
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
