"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Video, Mic, Activity, TrendingUp, Users, MessageSquare, BookOpen, FileText, Target, LayoutGrid, CheckCircle2, ShieldCheck, ChevronRight, BarChart, Sparkles } from "lucide-react";

export default function EcosystemSection() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  return (
    <section className="bg-transparent relative overflow-hidden" ref={containerRef}>
      
      {/* 1. Header Section */}
      <div className="pt-32 pb-16 mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.span 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="inline-flex items-center gap-1.5 rounded-full border border-teal-600/20 bg-teal-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#0D524C]"
        >
          <Activity className="h-3.5 w-3.5" />
          The Readiness Engine
        </motion.span>
        
        <motion.h2 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.1 }}
          className="font-display mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-[1.1]"
        >
          The operating system for <br className="hidden sm:block" />
          <span className="text-[#0D9488] dark:text-[#2DD4BF]">career readiness.</span>
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed"
        >
          Everything between preparation and placement. Practice realistically, improve measurably, and build confidence recruiters can verify.
        </motion.p>
      </div>

      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 pb-32 space-y-32">
        {/* FEATURE BLOCK 1: SMART MOCK INTERVIEW */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-150px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-[2.5rem] bg-white dark:bg-[#0E1A18]/60 backdrop-blur-md border border-gray-200 dark:border-white/10 p-8 sm:p-12 shadow-sm dark:shadow-2xl dark:shadow-teal-900/10 overflow-hidden transition-colors"
        >
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0D9488]/10 rounded-full blur-3xl opacity-50 pointer-events-none translate-x-1/2 -translate-y-1/2" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            
            {/* Left: Video Interface Mockup */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-900 shadow-xl relative aspect-video flex flex-col">
                {/* Simulated Webcam Feed */}
                <div className="flex-1 relative bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 opacity-80 bg-[url('/indian_student.png')] bg-cover bg-center" />
                  
                  {/* Eye Contact Indicator Overlay */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 text-xs font-semibold text-white">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Eye Contact Tracking
                  </div>

                  {/* Interviewer Avatar (AI) */}
                  <div className="absolute bottom-4 right-4 w-24 h-32 rounded-xl overflow-hidden border-2 border-gray-700 bg-gray-800 shadow-lg z-10">
                     <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center" />
                     <div className="absolute bottom-1 left-1 right-1 bg-black/60 backdrop-blur text-[8px] text-white px-1.5 py-0.5 rounded text-center">
                       AI Interviewer
                     </div>
                  </div>
                </div>

                {/* Bottom Controls Bar */}
                <div className="h-14 bg-gray-950 border-t border-gray-800 flex items-center justify-center gap-4 px-4 shrink-0 relative z-20">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-white cursor-pointer hover:bg-gray-700 transition">
                    <Mic className="h-4 w-4" />
                  </div>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-white cursor-pointer hover:bg-gray-700 transition">
                    <Video className="h-4 w-4" />
                  </div>
                  <div className="flex items-center justify-center px-4 h-8 rounded-full bg-red-600 text-white text-xs font-bold cursor-pointer hover:bg-red-500 transition">
                    End Panel
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Live AI Insights */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <span className="text-xs font-bold tracking-widest text-[#0D9488] dark:text-teal-400 uppercase mb-3">Live Panel Interviews</span>
              <h3 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Train under recruiter-grade pressure.
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Experience realistic interview environments. BridgeAI analyzes your pacing, eye contact, and structured thinking in real-time, completely invisibly.
              </p>

              {/* Real-time metrics UI */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/10 rounded-xl p-4">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-gray-700 dark:text-gray-300">Confidence Stability</span>
                    <span className="text-[#0D9488] dark:text-[#2DD4BF]">82% (Steady)</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: "40%" }}
                      whileInView={{ width: "82%" }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-[#0D9488] dark:bg-[#2DD4BF] rounded-full"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/10 rounded-xl p-4">
                   <div className="flex justify-between items-center mb-3">
                     <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Real-time Analysis</span>
                     <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                   </div>
                   <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                     <li className="flex items-center gap-2">
                       <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                       Communication Clarity: <span className="font-semibold text-gray-900 dark:text-white">Excellent</span>
                     </li>
                     <li className="flex items-center gap-2">
                       <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                       Structured Thinking: <span className="font-semibold text-gray-900 dark:text-white">Improving (MECE applied)</span>
                     </li>
                     <li className="flex items-center gap-2">
                       <Activity className="h-3.5 w-3.5 text-amber-500" />
                       Pacing Control: <span className="font-semibold text-gray-900 dark:text-white">Slightly fast (160 wpm)</span>
                     </li>
                   </ul>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
        {/* FEATURE BLOCK 2: LIVE GD ROOMS */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-150px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-[2.5rem] bg-gray-50 dark:bg-gray-900/60 backdrop-blur-md border border-gray-200 dark:border-gray-800 p-8 sm:p-12 shadow-sm dark:shadow-2xl dark:shadow-gray-950 overflow-hidden transition-colors"
        >
          {/* Subtle noise and glow */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500 rounded-full blur-[120px] opacity-20 pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            
            {/* Left: Text & Story */}
            <div className="lg:col-span-5 flex flex-col justify-center order-2 lg:order-1">
              <span className="text-xs font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase mb-3">Strategic Group Dynamics</span>
              <h3 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Build leadership in real environments.
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Join live MBA-style case discussions. The system measures consensus-building, strategic articulation, and leadership initiative against peers.
              </p>

              {/* After-GD Metrics */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-sm shadow-sm dark:shadow-none">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                      <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Speaking Balance</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">Optimal (24%)</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-sm shadow-sm dark:shadow-none">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Leadership Initiative</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">Top Quartile</span>
                </div>
              </div>
            </div>

            {/* Right: GD UI Mockup */}
            <div className="lg:col-span-7 order-1 lg:order-2">
              <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg dark:shadow-2xl p-6 relative transition-colors">
                <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-800 pb-4 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Live Case: Market Entry</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded transition-colors">04:12</span>
                </div>

                {/* Grid of Participants */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {/* You */}
                  <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                    <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop')] bg-cover bg-center opacity-80" />
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[10px] font-semibold text-white">
                      You
                    </div>
                    {/* Active Speaker Ring */}
                    <div className="absolute inset-0 border-2 border-indigo-400 rounded-xl animate-pulse" />
                  </div>
                  
                  {/* AI Moderator */}
                  <div className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 transition-colors">
                    <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=400&auto=format&fit=crop')] bg-cover bg-center opacity-50 grayscale" />
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-teal-900/80 border border-teal-500/30 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-teal-300">
                      <Sparkles className="h-2.5 w-2.5" /> Moderator (AI)
                    </div>
                  </div>

                  {/* Student 2 */}
                  <div className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 transition-colors">
                    <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop')] bg-cover bg-center opacity-70" />
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[10px] font-semibold text-gray-300">
                      Rahul S.
                    </div>
                  </div>

                  {/* Student 3 */}
                  <div className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 transition-colors">
                    <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=400&auto=format&fit=crop')] bg-cover bg-center opacity-70" />
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[10px] font-semibold text-gray-300">
                      Ananya P.
                    </div>
                  </div>

                  {/* AI Participant */}
                  <div className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 transition-colors">
                    <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop')] bg-cover bg-center opacity-50 grayscale" />
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-indigo-900/80 border border-indigo-500/30 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-indigo-300">
                      <Sparkles className="h-2.5 w-2.5" /> Panelist (AI)
                    </div>
                  </div>
                </div>

                {/* AI Transcript & Flow Tracking */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-800 transition-colors">
                  <div className="text-[10px] font-bold text-gray-500 uppercase mb-2">Live Transcription Analysis</div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed italic">
                    "<span className="text-indigo-300 not-italic font-medium">Adding to Rahul's point about supply chain risk</span>, if we map the unit economics, localizing production actually reduces our margin by 4% in year one, but shields us from tariff shocks."
                  </p>
                  <div className="flex gap-2 mt-3">
                    <span className="text-[9px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20">Consensus Building</span>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">MECE Structure</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
        {/* FEATURE BLOCK 3: DAILY CAREER INTELLIGENCE */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-150px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-[2.5rem] bg-white dark:bg-[#0E1A18]/60 backdrop-blur-md border border-gray-200 dark:border-white/10 p-8 sm:p-12 shadow-sm transition-colors"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left: Text */}
            <div>
              <span className="text-xs font-bold tracking-widest text-[#0D9488] dark:text-teal-400 uppercase mb-3">Enterprise Career Intelligence</span>
              <h3 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-4">
                News that prepares you.
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 leading-relaxed max-w-md">
                Stop reading generic feeds. BridgeAI takes the day's top business developments and generates consulting case structures and strategy frameworks.
              </p>
              
              <ul className="space-y-4">
                {[
                  { icon: <MessageSquare className="h-4 w-4" />, text: "Automated GD debate angles" },
                  { icon: <LayoutGrid className="h-4 w-4" />, text: "Consulting framework mapping" },
                  { icon: <Target className="h-4 w-4" />, text: "Likely interviewer questions" }
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-500/10 text-[#0D9488] dark:text-teal-400">
                      {item.icon}
                    </div>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: News UI Mockup */}
            <div className="bg-white dark:bg-black/40 rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl overflow-hidden transition-colors">
              {/* Header */}
              <div className="bg-gray-50 dark:bg-black/20 border-b border-gray-200 dark:border-white/10 p-4 flex items-center justify-between transition-colors">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Today's Briefing</span>
                <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 px-2 py-1 rounded">Tech & Strategy</span>
              </div>
              
              {/* Article Content */}
              <div className="p-6">
                <h4 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                  Tesla announces entry into the Indian EV market with localized manufacturing.
                </h4>
                <p className="text-xs text-gray-400 mb-6">Published 4 hours ago • Bloomberg Markets</p>

                {/* AI Insights Card */}
                <div className="rounded-xl border border-teal-200 dark:border-teal-500/30 bg-teal-50/50 dark:bg-[#0D524C]/10 overflow-hidden transition-colors">
                  <div className="bg-teal-50 dark:bg-[#0D524C]/30 px-4 py-2 border-b border-teal-100 dark:border-teal-500/20 flex items-center gap-2 transition-colors">
                    <Sparkles className="h-3 w-3 text-teal-400" />
                    <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider">AI Readiness Extraction</span>
                  </div>
                  <div className="p-4 space-y-4 text-xs">
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white block mb-1">Consulting Case Angle</span>
                      <p className="text-gray-600 dark:text-gray-300">Estimate the unit economics of localized battery production vs import tariffs over a 5-year horizon.</p>
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white block mb-1">GD Talking Point</span>
                      <p className="text-gray-600 dark:text-gray-300">Debate the impact on domestic OEMs (Tata, Mahindra) and charging infrastructure bottlenecks.</p>
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white block mb-1">PM Implication</span>
                      <p className="text-gray-600 dark:text-gray-300">How would you adapt the in-car software ecosystem for Indian traffic density and road infrastructure?</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
        {/* FEATURE BLOCKS 4, 5, 6: ROADMAP, RESUME, MATCHING */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: AI Profile Builder */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-150px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-[2.5rem] bg-white dark:bg-[#0E1A18]/60 backdrop-blur-md border border-gray-200 dark:border-white/10 p-8 sm:p-10 shadow-sm dark:shadow-xl dark:shadow-teal-900/5 relative overflow-hidden transition-colors"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#0D9488] to-[#0D524C]" />
            <span className="text-xs font-bold tracking-widest text-[#0D9488] dark:text-[#2DD4BF] uppercase mb-2 block">Readiness Roadmap</span>
            <h3 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Your personalized placement strategy.
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              Upload your resume. BridgeAI identifies missing capabilities and maps a week-by-week progression to hit target role requirements.
            </p>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 dark:bg-red-500/10 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-red-500 dark:text-red-400" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white block">Resume_v4_Final.pdf</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Analyzed • 85% Core Fit</span>
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>

              {/* Roadmap */}
              <div className="pl-4 border-l-2 border-teal-500/20 space-y-4 py-2 relative">
                <div className="absolute top-2 left-[-5px] w-2 h-2 rounded-full bg-teal-500" />
                <div className="absolute bottom-2 left-[-5px] w-2 h-2 rounded-full bg-gray-600" />
                
                <div>
                  <span className="text-[10px] font-bold text-[#0D9488] dark:text-teal-400 uppercase tracking-wider block mb-1">Week 1: High Priority</span>
                  <div className="bg-white dark:bg-black/20 border border-teal-100 dark:border-teal-500/30 shadow-sm rounded-lg p-3 text-xs text-gray-600 dark:text-gray-300">
                    <strong className="block text-gray-900 dark:text-white mb-0.5">Improve quantified impact</strong>
                    Revise bullet points to include exact metrics (e.g., "$1.2M revenue").
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">Week 2: Practice</span>
                  <div className="bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/10 shadow-sm rounded-lg p-3 text-xs text-gray-500 dark:text-gray-400 opacity-90 dark:opacity-70">
                    <strong className="block text-gray-700 dark:text-gray-300 mb-0.5">Leadership GD Module</strong>
                    Focus on confident interruption pacing and consensus closing.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Middle: AI Resume */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-150px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
            className="rounded-[2.5rem] bg-emerald-50 dark:bg-emerald-950/20 backdrop-blur-md border border-emerald-100 dark:border-emerald-500/20 p-8 sm:p-10 shadow-sm dark:shadow-xl dark:shadow-emerald-900/5 relative overflow-hidden flex flex-col transition-colors"
          >
            <div className="flex-1">
              {/* UI Graphic */}
              <div className="bg-white dark:bg-black/40 rounded-2xl p-6 shadow-sm border border-emerald-100 dark:border-emerald-500/10 mb-10 transition-colors">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-xs font-bold text-[#0D9488] dark:text-[#2DD4BF]">ATS Score</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">96%</span>
                </div>
                <div className="h-2.5 w-full bg-teal-900/30 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-[#2DD4BF] rounded-full w-[96%]" />
                </div>
                <div className="inline-flex items-center gap-1 bg-teal-500/10 text-[#2DD4BF] px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide border border-teal-500/20">
                  <span>✓</span> 3 keywords boosted
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-3 leading-tight tracking-tight">
                AI Resume — ATS-optimized. Recruiter-approved.
              </h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-300/80 leading-relaxed font-medium">
                Instant keyword suggestions and role-specific improvements.
              </p>
            </div>
          </motion.div>

          {/* Right: AI Job Matching */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-150px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="rounded-[2.5rem] bg-white dark:bg-[#0A0A0A]/60 backdrop-blur-md border border-gray-200 dark:border-gray-800 p-8 sm:p-10 shadow-sm dark:shadow-2xl relative overflow-hidden text-gray-900 dark:text-white transition-colors"
          >
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#0D524C] rounded-full blur-[100px] opacity-10 dark:opacity-20 pointer-events-none translate-x-1/3 -translate-y-1/3" />
            <span className="text-xs font-bold tracking-widest text-[#0D9488] dark:text-[#2DD4BF] uppercase mb-2 block">Placement Intelligence</span>
            <h3 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Connect with precision.
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              Based on your BRIDGE Score and profile, we highlight exact role compatibilities backed by institutional data.
            </p>

            <div className="space-y-3">
              {/* Top Match */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white block">Product Analyst</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Fintech • Series B</span>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs font-bold">
                    89% Match
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Strong structured thinking (92/100)
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Verified leadership signals
                  </div>
                </div>
              </div>

              {/* Second Match */}
              <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white block">Strategy Consultant</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Tier 2 Consulting</span>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-1 rounded text-xs font-bold">
                    74% Match
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Excellent communication clarity
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 ml-0.5 mr-0.5" /> Weak domain rigor (needs practice)
                  </div>
                </div>
              </div>
            </div>

          </motion.div>

        </div>

      </div>
      
    </section>
  );
}
