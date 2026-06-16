"use client";

import { m } from "framer-motion";
import { GraduationCap, School, Briefcase, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

const SEGMENTS = [
  {
    title: "STUDENTS",
    headline: "Become Placement Ready",
    icon: <GraduationCap className="h-6 w-6 text-teal-400" />,
    link: "/students",
    cta: "Explore Solutions",
    bullets: [
      "Practice real interviews before they matter",
      "Benchmark your capability on GD battles",
      "Upload resumes for ATS-grade keyword checks",
      "Generate personalized readiness roadmaps"
    ]
  },
  {
    title: "COLLEGES",
    headline: "Improve Placement Outcomes",
    icon: <School className="h-6 w-6 text-indigo-400" />,
    link: "/colleges",
    cta: "Book Demo",
    bullets: [
      "Track department-wide readiness statistics",
      "Automate bulk mock interview campaigns",
      "Accelerate recruiter pipelines",
      "Access batch ROI & progress analytics"
    ],
    highlight: true
  },
  {
    title: "RECRUITERS",
    headline: "Discover Better Candidates",
    icon: <Briefcase className="h-6 w-6 text-emerald-400" />,
    link: "/recruiters",
    cta: "Talk To Sales",
    bullets: [
      "Zero screening effort - direct qualified pools",
      "Verify student competence with Bridge Scores",
      "Listen to real audio response logs",
      "Speed up hiring pipelines by 3x"
    ]
  }
];

export default function AudienceSegmentation() {
  return (
    <section className="relative py-24 bg-transparent border-b border-gray-200 dark:border-white/10 transition-colors overflow-hidden">
      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16 text-center mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-[#0D9488] dark:text-teal-300 text-[11px] font-bold uppercase tracking-wider mb-5">
            Solutions
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
            Who is BridgeAI For?
          </h2>
          <p className="mt-4 text-base text-gray-500 dark:text-slate-300 max-w-xl mx-auto font-medium leading-relaxed">
            A cohesive placement ecosystem designed to empower candidates, training officers, and recruiters simultaneously.
          </p>
        </div>

        {/* 3-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SEGMENTS.map((seg, idx) => (
            <m.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: idx * 0.1, ease: "easeOut" }}
              className={`rounded-2xl border p-8 flex flex-col justify-between cursor-default transition-all duration-300 ${
                seg.highlight
                  ? "border-[#0D524C] bg-[#0D524C]/80 text-white shadow-lg"
                  : "border-gray-200 dark:border-white/5 bg-white dark:bg-[#0A1211]/50"
              }`}
            >
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${seg.highlight ? "bg-white/10 text-white" : "bg-teal-50 dark:bg-white/5"}`}>
                    {seg.icon}
                  </div>
                  <span className={`text-[10px] font-bold tracking-widest uppercase ${seg.highlight ? "text-teal-200" : "text-[#0D9488]"}`}>
                    {seg.title}
                  </span>
                </div>

                <h3 className={`text-xl font-black leading-tight mb-6 ${seg.highlight ? "text-white" : "text-gray-900 dark:text-white"}`}>
                  {seg.headline}
                </h3>

                <ul className="space-y-3 mb-8">
                  {seg.bullets.map((bullet, bidx) => (
                    <li key={bidx} className="flex gap-2 items-start text-xs font-medium">
                      <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${seg.highlight ? "text-emerald-300" : "text-emerald-500"}`} />
                      <span className={seg.highlight ? "text-teal-50" : "text-gray-600 dark:text-slate-300"}>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={seg.link}
                className={`block text-center rounded-xl py-3 text-xs font-bold transition-all shadow-sm cursor-pointer ${
                  seg.highlight
                    ? "bg-white text-[#0D524C] hover:bg-gray-50"
                    : "border border-[#0D9488] text-[#0D9488] hover:bg-teal-50 dark:hover:bg-[#0D9488]/10 dark:border-[#2DD4BF] dark:text-[#2DD4BF]"
                }`}
              >
                {seg.cta} &rarr;
              </Link>
            </m.div>
          ))}
        </div>

      </div>
    </section>
  );
}
