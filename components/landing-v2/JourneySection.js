"use client";

import { useRef, useState, useEffect } from "react";
import { m, useScroll, useMotionValueEvent  } from "framer-motion";
import { 
  Video, 
  Mic, 
  TrendingUp, 
  ShieldCheck, 
  Search, 
  Activity, 
  Eye, 
  CheckCircle2, 
  Users, 
  BarChart, 
  BookOpen, 
  Lock,
  Unlock,
  Target,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const STEPS = [
  {
    num: "STEP 01",
    title: "Discover your readiness.",
    desc: "Experience recruiter-grade communication diagnostics, interview simulations, and structured reasoning analysis to understand how recruiters currently perceive you."
  },
  {
    num: "STEP 02",
    title: "Practice under pressure.",
    desc: "Train through realistic mock interviews, live case discussions, and moderated strategy rooms designed to simulate high-pressure professional environments."
  },
  {
    num: "STEP 03",
    title: "Improve every week.",
    desc: "Receive personalized readiness roadmaps, communication refinement plans, and industry intelligence mapped directly to your target role."
  },
  {
    num: "STEP 04",
    title: "Build your BRIDGE Score.",
    desc: "Transform communication quality, leadership composure, structured thinking, and domain rigor into measurable professional credibility."
  },
  {
    num: "STEP 05",
    title: "Get verified by Bridge.",
    desc: "Unlock a performance-validated professional profile backed by recruiter-grade diagnostics and measurable readiness benchmarks."
  },
  {
    num: "STEP 06",
    title: "Get discovered.",
    desc: "Recruiters access verified readiness profiles to identify candidates with proven communication quality, strategic thinking, and leadership potential."
  }
];

/* ── Step Visual Components ─────────────────────────── */

function StepVisual01() {
  return (
    <div className="absolute inset-0 p-6 flex flex-col bg-transparent rounded-3xl transition-colors">
      <div className="flex-1 rounded-2xl overflow-hidden border border-gray-200 bg-white dark:border-white/10 dark:bg-black/20 backdrop-blur-md relative shadow-sm p-5 flex flex-col gap-4 transition-colors">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3 transition-colors">
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Live Diagnostic Dashboard</span>
          <span className="bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded text-[9px] font-bold">Scanning...</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 h-full">
          {/* Left: Video */}
          <div className="rounded-xl overflow-hidden bg-gray-900 relative shadow-inner h-full border border-gray-200 dark:border-white/10">
             <div className="absolute inset-0 opacity-90 bg-[url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop')] bg-cover bg-[center_10%]" />
             
             {/* Eye Contact Tracking overlay */}
             <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/60 backdrop-blur-sm px-2 py-1 rounded shadow text-[9px] font-bold flex items-center gap-1.5 text-gray-900 dark:text-white">
               <Eye className="h-3 w-3 text-teal-600 dark:text-teal-500" />
               Eye Contact: Optimal (88%)
             </div>
             
             {/* Bottom bar */}
             <div className="absolute bottom-3 left-3 right-3 flex justify-center gap-2">
               <div className="w-6 h-6 rounded-full bg-white/90 dark:bg-gray-900/80 backdrop-blur border border-gray-200 dark:border-white/20 flex items-center justify-center text-gray-900 dark:text-white"><Mic className="w-3 h-3" /></div>
               <div className="w-6 h-6 rounded-full bg-white/90 dark:bg-gray-900/80 backdrop-blur border border-gray-200 dark:border-white/20 flex items-center justify-center text-gray-900 dark:text-white"><Video className="w-3 h-3" /></div>
             </div>
          </div>
          
          {/* Right: Metrics */}
          <div className="flex flex-col gap-3">
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-lg p-3 transition-colors">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">Communication Clarity</span>
                <span className="text-[10px] font-black text-teal-600 dark:text-teal-400">High</span>
              </div>
              <div className="h-1 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 w-[90%]" />
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-lg p-3 transition-colors">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">Pacing Analysis</span>
                <span className="text-[10px] font-black text-amber-600 dark:text-amber-500">145 WPM</span>
              </div>
              <div className="h-1 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden flex">
                <div className="h-full bg-teal-500 w-[40%]" />
                <div className="h-full bg-amber-400 w-[20%]" />
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-lg p-3 transition-colors">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">Confidence Stability</span>
                <span className="text-[10px] font-black text-teal-600 dark:text-teal-400">Steady</span>
              </div>
              <div className="h-1 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 w-[85%]" />
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-lg p-3 flex-1 transition-colors">
              <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 block mb-1">Transcript Intelligence</span>
              <p className="text-[9px] text-gray-700 dark:text-gray-300 italic border-l-2 border-teal-500/30 pl-2 leading-relaxed">
                "The core issue isn't <span className="font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10">user acquisition</span>, but rather <span className="font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10">retention leakage</span> in the first 7 days..."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepVisual02() {
  return (
    <div className="absolute inset-0 p-6 flex items-center justify-center bg-transparent rounded-3xl">
      <div className="w-full bg-white dark:bg-black/40 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl overflow-hidden p-5 flex flex-col gap-4 transition-colors">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Live Strategy Room</span>
          </div>
          <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded border border-gray-200 dark:border-gray-800">Recording</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="relative aspect-video rounded-lg overflow-hidden border border-teal-500/50 shadow-sm">
            <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop')] bg-cover bg-center opacity-90" />
            <div className="absolute bottom-1 left-1 bg-white/90 dark:bg-black/60 backdrop-blur px-1.5 py-0.5 rounded text-[9px] font-semibold text-gray-900 dark:text-white shadow-sm">You</div>
            <div className="absolute inset-0 border border-teal-400 rounded-lg shadow-[inset_0_0_15px_rgba(45,212,191,0.2)] animate-pulse" />
          </div>
          <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900">
            <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=400&auto=format&fit=crop')] bg-cover bg-center opacity-40 grayscale" />
            <div className="absolute bottom-1 left-1 bg-teal-50 dark:bg-teal-900/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 backdrop-blur px-1.5 py-0.5 rounded text-[9px] font-bold shadow-sm">Moderator (AI)</div>
          </div>
          <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900">
            <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop')] bg-cover bg-center opacity-60" />
            <div className="absolute bottom-1 left-1 bg-white/90 dark:bg-black/60 backdrop-blur px-1.5 py-0.5 rounded text-[9px] font-semibold text-gray-700 dark:text-gray-300 shadow-sm">Participant B</div>
          </div>
          <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900">
            <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=400&auto=format&fit=crop')] bg-cover bg-center opacity-60" />
            <div className="absolute bottom-1 left-1 bg-white/90 dark:bg-black/60 backdrop-blur px-1.5 py-0.5 rounded text-[9px] font-semibold text-gray-700 dark:text-gray-300 shadow-sm">Participant C</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-1">
          <div className="bg-gray-50 dark:bg-gray-900/80 rounded-lg p-3 border border-gray-100 dark:border-gray-800/80">
             <div className="flex items-center gap-1.5 mb-1.5">
               <Users className="w-3 h-3 text-teal-600 dark:text-teal-400" />
               <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">Speaking Balance</span>
             </div>
             <span className="text-[11px] font-black text-teal-600 dark:text-teal-400">Optimal (28%)</span>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/80 rounded-lg p-3 border border-gray-100 dark:border-gray-800/80">
             <div className="flex items-center gap-1.5 mb-1.5">
               <BarChart className="w-3 h-3 text-teal-600 dark:text-teal-400" />
               <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">Leadership Initiative</span>
             </div>
             <span className="text-[11px] font-black text-teal-600 dark:text-teal-400">Top Quartile</span>
          </div>
        </div>

        <div className="bg-teal-50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30 rounded-lg p-3">
          <span className="text-[9px] font-bold text-teal-600 dark:text-teal-500 uppercase tracking-wider block mb-1">Moderator Insight: Consensus Building</span>
          <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed">
            Excellent pivot. You successfully synthesized Participant B's operational concern with Participant C's financial model.
          </p>
        </div>
      </div>
    </div>
  );
}

function StepVisual03() {
  return (
    <div className="absolute inset-0 p-6 flex flex-col bg-transparent rounded-3xl transition-colors">
      <div className="flex-1 rounded-2xl overflow-hidden border border-gray-200 bg-white dark:border-white/10 dark:bg-black/20 backdrop-blur-md shadow-sm p-5 flex flex-col gap-5 transition-colors">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Readiness Roadmap</span>
          <span className="bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded text-[9px] font-bold">Target: Strategy Analyst</span>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
               <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">Week 3 Progression</span>
               <span className="text-xl font-black text-gray-900 dark:text-white">720 <span className="text-xs font-semibold text-gray-400">/ 1000</span></span>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded">
              <TrendingUp className="w-3 h-3" /> +45 pts
            </span>
          </div>

          <div className="bg-teal-50 dark:bg-[#0D524C]/20 border border-teal-100 dark:border-teal-500/20 rounded-xl p-3">
            <span className="text-[9px] font-bold text-teal-600 dark:text-teal-300 uppercase tracking-wider block mb-2">Quantified Resume Improvements</span>
            <div className="bg-white dark:bg-black/40 rounded-lg p-2 text-[10px] text-gray-600 dark:text-gray-300 border border-teal-100 dark:border-teal-500/10 shadow-sm">
              <div className="line-through text-gray-400 mb-1">Led marketing campaign for new product.</div>
              <div className="font-semibold text-gray-900 dark:text-white">Spearheaded GTM campaign driving 
.2M pipeline within 30 days, optimizing CAC by 15%.</div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Strategic Drills</span>
            <div className="flex items-center justify-between border border-gray-200 dark:border-white/5 rounded-lg p-3 bg-gray-50 dark:bg-white/5">
               <div className="flex items-center gap-2">
                 <BookOpen className="w-4 h-4 text-gray-400" />
                 <div>
                   <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200 block">Market Sizing (MECE)</span>
                   <span className="text-[9px] text-gray-500">Consulting Insight</span>
                 </div>
               </div>
               <span className="text-[10px] font-bold text-gray-400">Due Today</span>
            </div>
            <div className="flex items-center justify-between border border-emerald-100 dark:border-emerald-500/20 rounded-lg p-3 bg-emerald-50 dark:bg-emerald-950/20">
               <div className="flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                 <div>
                   <span className="text-[10px] font-bold text-gray-900 dark:text-gray-200 block">Framework Structuring</span>
                   <span className="text-[9px] text-emerald-700 dark:text-gray-500">Completed</span>
                 </div>
               </div>
               <span className="text-[10px] font-bold text-emerald-600">Score: 94/100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepVisual04() {
  return (
    <div className="absolute inset-0 p-6 flex flex-col bg-transparent rounded-3xl transition-colors">
      <div className="flex-1 rounded-2xl border border-gray-200 dark:border-teal-500/20 bg-white dark:bg-black/40 backdrop-blur-md shadow-sm dark:shadow-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden text-center transition-colors">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-100 dark:bg-teal-500/20 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-xs mx-auto">
          <span className="text-[10px] font-bold text-teal-600 dark:text-teal-500 uppercase tracking-widest block mb-4">Professional Credibility</span>
          
          <div className="relative w-40 h-40 mx-auto mb-6">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" className="stroke-gray-100 dark:stroke-[#112a27]" strokeWidth="6" />
              <m.circle 
                cx="50" cy="50" r="46" fill="none" stroke="#2DD4BF" strokeWidth="6" 
                strokeDasharray="289" strokeDashoffset="289"
                animate={{ strokeDashoffset: 289 - (289 * 0.85) }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-5xl font-black text-gray-900 dark:text-white">852</span>
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1">Top 4%</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="bg-gray-50 dark:bg-[#030908] border border-gray-100 dark:border-[#112a27] rounded-lg p-2.5">
              <span className="text-[9px] text-gray-500 font-bold block mb-1">Communication</span>
              <div className="h-1 w-full bg-gray-200 dark:bg-gray-900 rounded-full overflow-hidden mb-1"><div className="h-full bg-teal-500 dark:bg-teal-400 w-[92%]" /></div>
              <span className="text-[10px] font-black text-teal-600 dark:text-teal-300">230 / 250</span>
            </div>
            <div className="bg-gray-50 dark:bg-[#030908] border border-gray-100 dark:border-[#112a27] rounded-lg p-2.5">
              <span className="text-[9px] text-gray-500 font-bold block mb-1">Structured Thinking</span>
              <div className="h-1 w-full bg-gray-200 dark:bg-gray-900 rounded-full overflow-hidden mb-1"><div className="h-full bg-teal-500 dark:bg-teal-400 w-[88%]" /></div>
              <span className="text-[10px] font-black text-teal-600 dark:text-teal-300">220 / 250</span>
            </div>
            <div className="bg-gray-50 dark:bg-[#030908] border border-gray-100 dark:border-[#112a27] rounded-lg p-2.5">
              <span className="text-[9px] text-gray-500 font-bold block mb-1">Leadership Presence</span>
              <div className="h-1 w-full bg-gray-200 dark:bg-gray-900 rounded-full overflow-hidden mb-1"><div className="h-full bg-teal-500 dark:bg-teal-400 w-[84%]" /></div>
              <span className="text-[10px] font-black text-teal-600 dark:text-teal-300">210 / 250</span>
            </div>
            <div className="bg-gray-50 dark:bg-[#030908] border border-gray-100 dark:border-[#112a27] rounded-lg p-2.5">
              <span className="text-[9px] text-gray-500 font-bold block mb-1">Domain Rigor</span>
              <div className="h-1 w-full bg-gray-200 dark:bg-gray-900 rounded-full overflow-hidden mb-1"><div className="h-full bg-teal-500 dark:bg-teal-400 w-[76%]" /></div>
              <span className="text-[10px] font-black text-teal-600 dark:text-teal-300">192 / 250</span>
            </div>
          </div>

          <div className="mt-5 flex justify-center gap-2 flex-wrap">
             <span className="inline-flex items-center gap-1 bg-teal-50 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/20 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">
               <ShieldCheck className="w-2.5 h-2.5" /> Verified
             </span>
             <span className="inline-flex items-center gap-1 bg-teal-50 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/20 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">
               <Unlock className="w-2.5 h-2.5" /> Registry Unlocked
             </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepVisual05() {
  return (
    <div className="absolute inset-0 p-6 flex flex-col bg-transparent rounded-3xl transition-colors">
      <div className="flex-1 rounded-2xl overflow-hidden border border-gray-200 bg-white dark:border-white/10 dark:bg-black/20 backdrop-blur-md shadow-sm p-6 flex flex-col relative transition-colors">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border-b border-gray-100 dark:border-white/10" />
        
        <div className="relative z-10 flex gap-5 items-end mb-6 pt-4">
          <div className="w-20 h-20 rounded-full bg-[url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop')] bg-cover bg-center border-4 border-white dark:border-gray-800 shadow-lg" />
          <div className="pb-1">
             <h4 className="font-display text-2xl font-black text-gray-900 dark:text-white leading-tight">Aditi Sharma</h4>
             <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product Strategy &middot; IIM Ahmedabad</span>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4 flex justify-between items-center shadow-sm">
             <div>
               <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-0.5">Recruiter Verification</span>
               <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                 <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500" /> Institutionally Validated
               </span>
             </div>
             <div className="text-right">
               <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-0.5">BRIDGE Score</span>
               <span className="text-xl font-black text-emerald-600">852</span>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="border border-gray-100 bg-white dark:border-white/10 rounded-lg p-3 text-center dark:bg-black/20 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-teal-500 mx-auto mb-1.5" />
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 block">Communication</span>
                <span className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">Validated</span>
             </div>
             <div className="border border-gray-100 bg-white dark:border-white/10 rounded-lg p-3 text-center dark:bg-black/20 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-teal-500 mx-auto mb-1.5" />
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 block">Structured Reasoning</span>
                <span className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">Certified</span>
             </div>
             <div className="border border-gray-100 bg-white dark:border-white/10 rounded-lg p-3 text-center dark:bg-black/20 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-teal-500 mx-auto mb-1.5" />
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 block">Leadership Presence</span>
                <span className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">Benchmarked</span>
             </div>
             <div className="border border-gray-100 bg-gray-50 dark:border-white/10 rounded-lg p-3 text-center opacity-60 dark:opacity-40 grayscale dark:bg-black/20 shadow-sm">
                <Lock className="w-4 h-4 text-gray-400 mx-auto mb-1.5" />
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-300 block">Technical Depth</span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wider">Locked</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepVisual06() {
  return (
    <div className="absolute inset-0 p-6 flex items-center justify-center bg-transparent rounded-3xl transition-colors">
      <div className="w-full bg-white dark:bg-black/40 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl overflow-hidden p-5 flex flex-col h-full transition-colors">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Search Talent Registry...</span>
          </div>
          <div className="flex gap-2">
            <span className="text-[9px] font-bold text-teal-700 bg-teal-50 dark:text-teal-300 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/20 px-2 py-1 rounded uppercase tracking-wider">BRIDGE &gt; 800</span>
            <span className="text-[9px] font-bold text-teal-700 bg-teal-50 dark:text-teal-300 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/20 px-2 py-1 rounded uppercase tracking-wider">Product Strategy</span>
          </div>
        </div>

        <div className="space-y-3 flex-1 overflow-hidden relative">
           <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-[#0A1211] z-10 pointer-events-none" />
           
           {/* Candidate 1 */}
           <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between relative z-0">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-xl" />
              <div className="flex items-center gap-4 pl-2">
                <div className="w-10 h-10 rounded-full bg-[url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop')] bg-cover bg-center shadow-sm" />
                <div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white block">Aditi Sharma</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider block mt-0.5">IIM Ahmedabad &middot; Top 4%</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-500 font-bold block mb-0.5">BRIDGE Score</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">852</span>
              </div>
           </div>

           {/* Candidate 2 */}
           <div className="bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between opacity-80 relative z-0">
              <div className="flex items-center gap-4 pl-3">
                <div className="w-10 h-10 rounded-full bg-[url('https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&auto=format&fit=crop')] bg-cover bg-center grayscale shadow-sm" />
                <div>
                  <span className="text-sm font-bold text-gray-700 dark:text-white block">Rahul Mehta</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider block mt-0.5">BITS Pilani &middot; Top 8%</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-500 font-bold block mb-0.5">BRIDGE Score</span>
                <span className="text-lg font-black text-gray-700 dark:text-white">815</span>
              </div>
           </div>

           {/* Candidate 3 */}
           <div className="bg-white dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between opacity-60 relative z-0">
              <div className="flex items-center gap-4 pl-3">
                <div className="w-10 h-10 rounded-full bg-[url('https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=200&auto=format&fit=crop')] bg-cover bg-center grayscale shadow-sm" />
                <div>
                  <span className="text-sm font-bold text-gray-600 dark:text-white block">Sneha Patel</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider block mt-0.5">ISB Hyderabad &middot; Top 12%</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-500 font-bold block mb-0.5">BRIDGE Score</span>
                <span className="text-lg font-black text-gray-600 dark:text-white">790</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

const VISUALS = [StepVisual01, StepVisual02, StepVisual03, StepVisual04, StepVisual05, StepVisual06];


/* ── Main Section ───────────────────────────────────── */

export default function JourneySection() {
  const containerRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // 6 steps -> thresholds roughly every 16.6%
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v < 0.16) setActiveStep(0);
    else if (v < 0.33) setActiveStep(1);
    else if (v < 0.5) setActiveStep(2);
    else if (v < 0.66) setActiveStep(3);
    else if (v < 0.83) setActiveStep(4);
    else setActiveStep(5);
  });

  const handleNext = () => {
    if (!containerRef.current) return;
    if (activeStep < 5) {
      const rect = containerRef.current.getBoundingClientRect();
      const sectionTop = rect.top + window.scrollY;
      // scroll down by exactly 1 window height relative to the section top
      window.scrollTo({ top: sectionTop + (activeStep + 1) * window.innerHeight, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (!containerRef.current) return;
    if (activeStep > 0) {
      const rect = containerRef.current.getBoundingClientRect();
      const sectionTop = rect.top + window.scrollY;
      window.scrollTo({ top: sectionTop + (activeStep - 1) * window.innerHeight, behavior: "smooth" });
    }
  };

  const ActiveVisual = VISUALS[activeStep];

  return (
    <section ref={containerRef} id="journey" className="relative bg-transparent border-b border-gray-200 dark:border-white/10 transition-colors" style={{ height: "600vh" }}>
      <div className="sticky top-0 h-screen w-full flex items-center justify-center">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* ── Left: Narrative Text ── */}
          <div className="flex flex-col justify-center max-w-lg">
            {/* Static Header */}
            <div className="mb-12">
              <span className="text-xs font-bold tracking-widest text-[#0D9488] dark:text-[#2DD4BF] uppercase block mb-3">The Readiness Journey</span>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-[1.05]">
                From preparation{" "}
                <span className="text-[#0D9488] dark:text-[#2DD4BF]">to placement.</span>
              </h2>
              <p className="mt-5 text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                BridgeAI combines recruiter-grade simulations, structured reasoning diagnostics, communication intelligence, and verified credibility into one continuous readiness ecosystem.
              </p>
            </div>

            {/* Step Progress Indicator & Controls */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-1.5">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className="h-1 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: i === activeStep ? 40 : 8,
                      backgroundColor: i === activeStep ? "#0D9488" : "#D1D5DB",
                      opacity: i > activeStep ? 0.5 : 1
                    }}
                  />
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrev}
                  disabled={activeStep === 0}
                  className="p-1.5 rounded-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-[#0D9488] dark:hover:text-[#2DD4BF] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleNext}
                  disabled={activeStep === 5}
                  className="p-1.5 rounded-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-[#0D9488] dark:hover:text-[#2DD4BF] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Active Step Text (crossfade) */}
            <div className="relative h-[160px]">
              {STEPS.map((step, i) => (
                <div
                  key={step.num}
                  className="absolute inset-0 transition-all duration-500 ease-out"
                  style={{
                    opacity: i === activeStep ? 1 : 0,
                    transform: i === activeStep ? "translateY(0)" : "translateY(16px)",
                    pointerEvents: i === activeStep ? "auto" : "none"
                  }}
                >
                  <span className="text-xs font-bold tracking-widest text-[#0D9488] dark:text-[#2DD4BF] uppercase mb-2 block">{step.num}</span>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">{step.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Visual Mockup ── */}
          <div className="relative h-[520px] w-full rounded-[2rem] border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl overflow-hidden bg-gray-50 dark:bg-black/20 backdrop-blur-3xl transition-colors">
            {VISUALS.map((Visual, i) => (
              <div
                key={i}
                className="absolute inset-0 transition-all duration-700 ease-in-out"
                style={{
                  opacity: i === activeStep ? 1 : 0,
                  transform: i === activeStep ? "scale(1)" : i < activeStep ? "scale(1.05)" : "scale(0.95)",
                  pointerEvents: i === activeStep ? "auto" : "none"
                }}
              >
                <Visual />
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}


