"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { MessageSquare, Users, Sparkles, Trophy, Brain, BarChart2, ShieldAlert, ArrowRight } from "lucide-react";
import Link from "next/link";

const GD_MODES = [
  {
    title: "Solo GD Practice",
    desc: "Practice against intelligent AI avatars to warm up or hone your strategies before live sessions.",
    icon: <Brain className="h-5 w-5 text-teal-400" />
  },
  {
    title: "GD With Friends",
    desc: "Host private rooms with classmates to collaborate, practice specific campus themes, and compare results.",
    icon: <Users className="h-5 w-5 text-sky-400" />
  },
  {
    title: "Live GD Battles",
    desc: "Enter competitive matchmaking pools to engage with peer groups from top institutions across India.",
    icon: <Trophy className="h-5 w-5 text-indigo-400" />
  },
  {
    title: "AI Moderator",
    desc: "Keep sessions on track with active prompts, automated turn-taking control, and timekeepers.",
    icon: <Sparkles className="h-5 w-5 text-amber-400" />
  },
  {
    title: "AI Evaluation",
    desc: "Receive comprehensive analysis of your speech, relevancy, confidence, and leadership metrics.",
    icon: <BarChart2 className="h-5 w-5 text-emerald-400" />
  },
  {
    title: "GD Market Pulse",
    desc: "Get real-time case updates generated from daily top business news and global macroeconomic trends.",
    icon: <MessageSquare className="h-5 w-5 text-violet-400" />
  }
];

const EVAL_DIMENSIONS = [
  { name: "Communication", value: 88, color: "bg-teal-500", desc: "Clarity, pacing, volume, and articulation poise." },
  { name: "Relevance", value: 92, color: "bg-sky-500", desc: "Logical consistency, framework use, and MECE logic." },
  { name: "Confidence", value: 85, color: "bg-indigo-500", desc: "Vocal stability, body posture, and presence indicators." },
  { name: "Participation", value: 78, color: "bg-amber-500", desc: "Interrupt frequency control and optimal speaking time." },
  { name: "Leadership", value: 90, color: "bg-emerald-500", desc: "Consensus-building, direction-setting, and summarization." }
];

export default function GDShowcase() {
  const [activeModeIdx, setActiveModeIdx] = useState(0);

  return (
    <section className="relative py-24 bg-transparent border-b border-gray-200 dark:border-white/10 transition-colors overflow-hidden">
      {/* Background gradients */}
      <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute left-0 bottom-0 w-96 h-96 bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-20 text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[#0D9488] dark:text-indigo-300 text-[11px] font-bold uppercase tracking-wider mb-5">
            Competitive Edge
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
            AI-Powered Group Discussions
          </h2>
          <p className="mt-4 text-base text-gray-600 dark:text-slate-300 max-w-xl font-medium leading-relaxed">
            The group discussion is the highest-friction filter in campus hiring. BridgeAI's multiplayer arenas let you practice under real pressure, with AI moderators benchmarking your collaborative leadership.
          </p>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: GD Modes Selection & Details */}
          <div className="lg:col-span-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {GD_MODES.map((mode, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveModeIdx(idx)}
                  className={`rounded-2xl border p-5 transition-all cursor-pointer ${
                    activeModeIdx === idx
                      ? "border-teal-500/30 bg-teal-500/5 dark:bg-[#0D9488]/10"
                      : "border-gray-200 dark:border-white/5 bg-white dark:bg-black/10 hover:border-gray-300 dark:hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/5">
                      {mode.icon}
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{mode.title}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium leading-relaxed">
                    {mode.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Link href="/students#gd" className="inline-block">
                <m.span
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0D524C] px-6 py-3.5 text-xs font-bold text-white shadow-md hover:bg-[#0A3D36] cursor-pointer"
                  whileHover={{ scale: 1.02, y: -0.5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Explore GD Solutions <ArrowRight className="h-4 w-4" />
                </m.span>
              </Link>
            </div>
          </div>

          {/* Right Column: AI Live Evaluation Simulation & Dimensions */}
          <div className="lg:col-span-6">
            <div className="bg-white/80 dark:bg-[#0A1211]/60 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-teal-500 to-emerald-500" />
              
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-white/5 pb-4">
                <div>
                  <h4 className="font-display text-sm font-bold text-gray-900 dark:text-white">AI Evaluation Scorecard</h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Verifying dimensions for: <strong className="text-teal-500">GD Battle #412</strong></p>
                </div>
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold">
                  882 / 1000 READY
                </span>
              </div>

              {/* Evaluation Dimensions sliders/meters */}
              <div className="space-y-4 mb-6">
                {EVAL_DIMENSIONS.map((dim, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-700 dark:text-slate-300">{dim.name}</span>
                      <span className="text-gray-900 dark:text-white font-bold">{dim.value}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <m.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${dim.value}%` }}
                        transition={{ duration: 1.2, delay: idx * 0.1, ease: "easeOut" }}
                        className={`h-full rounded-full ${dim.color}`}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
                      {dim.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Live transcript indicator */}
              <div className="bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Live Leadership Diagnostics</span>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed italic">
                  "Let's summarize. Rahul focus is on manufacturing setup. However, to hedge the import timeline risks, we can propose a phased integration where we import parts for the initial 18 months..."
                </p>
                <div className="flex items-center gap-2 mt-3 text-[9px] font-bold text-[#0D9488] dark:text-teal-400">
                  <span>🏆 Leadership closing structure registered</span>
                  <span>•</span>
                  <span>92% relevancy score</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
