"use client";

import { useEffect } from "react";
import Navbar from "@/components/landing-v2/Navbar";
import FooterCTA from "@/components/landing-v2/FooterCTA";
import AnimatedBackground from "@/components/landing-v2/AnimatedBackground";
import { m } from "framer-motion";
import { CheckCircle2, Video, FileText, Users, Award, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function StudentsPage() {
  useEffect(() => {
    document.title = "BridgeAI — Practice Mock Interviews & GD Battles";
  }, []);
  return (
    <div className="min-h-screen relative landing-theme">
      <AnimatedBackground />
      <Navbar />

      <main className="relative z-10 pt-32 sm:pt-40">
        
        {/* Hero Section */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto text-center pb-16">
          <m.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-[#0D9488] dark:text-teal-300 text-[11px] font-bold uppercase tracking-wider mb-5"
          >
            For Ambitious Students
          </m.span>
          
          <m.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display text-4xl sm:text-5xl lg:text-7xl font-black text-gray-900 dark:text-white leading-[1.08] tracking-tight"
          >
            Crack Placements. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0D9488] to-teal-500 dark:from-teal-400 dark:to-teal-300">
              Practice Before It Matters.
            </span>
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-base sm:text-lg text-gray-600 dark:text-slate-300 max-w-xl mx-auto font-medium leading-relaxed"
          >
            Stop guessing if you are placement ready. Experience real recruiter-vetted simulated interview runs, multiplayer GD battles, and ATS-optimized resume audits.
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-8 flex flex-wrap justify-center gap-4"
          >
            <Link href="/login" className="cursor-pointer">
              <m.span
                className="inline-flex items-center gap-2 rounded-xl bg-[#0D524C] px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-[#0A3D36]"
                whileHover={{ scale: 1.02, y: -0.5 }}
                whileTap={{ scale: 0.98 }}
              >
                Start Free Diagnostic &rarr;
              </m.span>
            </Link>
            <a href="#features" className="cursor-pointer">
              <m.span
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-sm font-semibold text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
                whileHover={{ scale: 1.02, y: -0.5 }}
                whileTap={{ scale: 0.98 }}
              >
                See Features
              </m.span>
            </a>
          </m.div>
        </section>

        {/* Feature Grid Section */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto border-t border-gray-150 dark:border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <span className="text-xs font-bold text-[#0D9488] uppercase tracking-wider">AI Mock Coach</span>
              <h2 className="font-display text-3xl font-extrabold text-gray-900 dark:text-white mt-2 mb-4">
                Real Interview Scenarios. 24/7 Coaching.
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 leading-relaxed">
                Choose your target company and domain (SDE, PM, Consultant, Analyst). Our voice and video interview engine simulates realistic placement stress with resume-aware, customized technical and behavioral questioning.
              </p>
              <ul className="space-y-3 text-xs text-gray-600 dark:text-slate-300 font-semibold">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> STAR framework structure coaching
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Vocal pitch and filler word diagnostics
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#0D9488]" /> Unlimited domain-specific cases
                </li>
              </ul>
            </div>
            <div className="bg-white dark:bg-[#0A1211]/50 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <div className="aspect-video bg-gray-950 rounded-xl relative flex flex-col justify-between overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600')] bg-cover bg-center opacity-40" />
                <div className="p-4 flex items-center justify-between z-10">
                  <span className="bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded font-bold uppercase">Webcam On</span>
                  <span className="text-white text-[10px] bg-black/40 px-2 py-0.5 rounded font-semibold">Active Session</span>
                </div>
                <div className="p-4 bg-black/60 backdrop-blur z-10">
                  <p className="text-xs text-teal-300 font-bold mb-1">AI Prompt:</p>
                  <p className="text-[11px] text-white italic">"How would you optimize database read latencies when handling concurrent scaling issues?"</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center border-t border-gray-150 dark:border-white/5 pt-20">
            <div className="md:order-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">ATS Resume Optimizer</span>
              <h2 className="font-display text-3xl font-extrabold text-gray-900 dark:text-white mt-2 mb-4">
                Recruiter-Grade Resume Audit
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 leading-relaxed">
                BridgeAI processes your projects, internships, and skill claims. Our optimizer instantly identifies missing keywords, syntax weaknesses, and maps your resume directly to active recruiter criteria.
              </p>
              <ul className="space-y-3 text-xs text-gray-600 dark:text-slate-300 font-semibold">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Quantifiable metric audits
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> ATS compatibility checks
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#0D9488]" /> Precision keyword boosting suggestions
                </li>
              </ul>
            </div>
            <div className="md:order-1 bg-white dark:bg-[#0A1211]/50 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <div className="rounded-xl border border-teal-100 dark:border-teal-500/20 bg-teal-50/50 dark:bg-[#0D524C]/10 p-5">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">ATS FIT CHECK</span>
                  <span className="bg-teal-500/10 text-teal-400 border border-teal-500/25 px-2.5 py-0.5 rounded text-[10px] font-bold">READY (92%)</span>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-red-400 block font-bold">⚠️ Vague Impact Statements</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">"Responsible for software features" &rarr; "Led 3-engineer sprint optimizing latency by 12%"</span>
                  </div>
                  <div>
                    <span className="text-amber-400 block font-bold">⚠️ Missing Keywords</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Add: MECE Case Structure, Redis Caching, STAR behavioral.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Segment */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto border-t border-gray-150 dark:border-white/5 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">Student Pricing Plans</span>
          <h2 className="font-display mt-3 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Placement Readiness Plans
          </h2>
          <p className="mt-4 text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-12">
            Start preparing for free, or unlock unlimited mock coaching and collaborative group discussion arenas when you're ready to lock in your score.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free */}
            <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-black/10 p-8 flex flex-col justify-between text-left">
              <div>
                <span className="text-xs font-bold text-[#0D9488] uppercase tracking-wider">Diagnostic Starter</span>
                <p className="text-2xl font-black text-gray-900 dark:text-white mt-2">₹0 <span className="text-xs font-semibold text-gray-400">/ Free Forever</span></p>
                <ul className="mt-6 space-y-3 text-xs text-gray-500 dark:text-slate-300 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> 4 AI mock interviews</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> 1 GD battle / week</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Basic BRIDGE Score credential</li>
                </ul>
              </div>
              <Link href="/login" className="mt-8 block text-center rounded-xl border border-[#0D9488] py-2.5 text-xs font-bold text-[#0D9488] hover:bg-teal-50 dark:hover:bg-[#0D9488]/10 cursor-pointer">
                Start Free Diagnostic
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border border-[#0D524C] bg-[#0D524C]/80 p-8 flex flex-col justify-between text-left relative overflow-hidden group">
              <div className="absolute top-4 right-4 z-10">
                <span className="bg-white/10 text-white border border-white/20 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">Popular</span>
              </div>
              <div>
                <span className="text-xs font-bold text-teal-200 uppercase tracking-wider">Placement Crusher</span>
                <p className="text-2xl font-black text-white mt-2">₹499 <span className="text-xs font-semibold text-teal-200">/ month</span></p>
                <ul className="mt-6 space-y-3 text-xs text-teal-100 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> 20 AI mock interviews / month</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> Unlimited GD battle rooms</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> Priority roadmaps & skill updates</li>
                </ul>
              </div>
              <Link href="/login" className="mt-8 block text-center rounded-xl bg-white py-2.5 text-xs font-bold text-[#0D524C] hover:bg-gray-50 cursor-pointer shadow-sm">
                Get Placement Crusher &rarr;
              </Link>
            </div>
          </div>
        </section>

        <FooterCTA />
      </main>
    </div>
  );
}
