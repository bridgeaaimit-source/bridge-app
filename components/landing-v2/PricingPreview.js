"use client";

import { m } from "framer-motion";
import { Check, ShieldAlert } from "lucide-react";
import Link from "next/link";

const PLANS = [
  {
    target: "FOR STUDENTS",
    title: "Placement Readiness Plans",
    desc: "Self-prep diagnostics, resume checks, and competitive group discussion matches.",
    price: "Book Demo To Learn More",
    link: "/students",
    cta: "See Student Options",
    features: [
      "AI Mock Coaching & video audits",
      "Live GD matches & Friends rooms",
      "ATS resume keyword reviews",
      "Personalized skill roadmaps"
    ]
  },
  {
    target: "FOR COLLEGES",
    title: "Institution Plans",
    desc: "Batch-level placement drives, automated campaigns, and institutional reports.",
    price: "Book Demo To Learn More",
    link: "/colleges#demo",
    cta: "Schedule Institution Demo",
    features: [
      "TPO Batch Analytics Dashboard",
      "Custom mock campaigns and targets",
      "Department-wise progress tracking",
      "Direct recruiter matching access"
    ],
    highlight: true
  },
  {
    target: "FOR RECRUITERS",
    title: "Campus Hiring Plans",
    desc: "Pre-screened candidates database access, verified profiles, and API access.",
    price: "Contact Us For Pricing",
    link: "/recruiters#inquiry",
    cta: "Request Recruiter Access",
    features: [
      "Direct verified Candidate Registry",
      "Bridge Score verification signals",
      "Smart Match API integrations",
      "Reduced screening funnel reports"
    ]
  }
];

export default function PricingPreview() {
  return (
    <section id="pricing" className="relative py-24 bg-transparent border-b border-gray-200 dark:border-white/10 transition-colors overflow-hidden">
      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16 text-center mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-[#0D9488] dark:text-teal-300 text-[11px] font-bold uppercase tracking-wider mb-5">
            Pricing & Plans
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
            Tailored Plans for Every Objective
          </h2>
          <p className="mt-4 text-base text-gray-500 dark:text-slate-300 max-w-xl mx-auto font-medium leading-relaxed">
            Transparent options for individual prep, campus training runs, and corporate recruiter sourcing pipelines.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan, idx) => (
            <m.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: idx * 0.1, ease: "easeOut" }}
              className={`rounded-2xl border p-8 flex flex-col justify-between cursor-default relative overflow-hidden shadow-sm dark:shadow-none transition-all duration-300 ${
                plan.highlight
                  ? "border-[#0D524C] bg-[#0D524C]/80 text-white"
                  : "border-gray-200 dark:border-white/5 bg-white dark:bg-[#0A1211]/50"
              }`}
            >
              {plan.highlight && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="bg-white/10 text-white border border-white/20 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">Recommended</span>
                </div>
              )}

              <div>
                <span className={`text-[10px] font-bold uppercase tracking-widest block mb-2 ${plan.highlight ? "text-teal-200" : "text-[#0D9488]"}`}>
                  {plan.target}
                </span>
                
                <h3 className={`text-xl font-black leading-tight mb-2 ${plan.highlight ? "text-white" : "text-gray-900 dark:text-white"}`}>
                  {plan.title}
                </h3>
                
                <p className={`text-xs font-medium mb-6 ${plan.highlight ? "text-teal-100" : "text-gray-500 dark:text-slate-400"}`}>
                  {plan.desc}
                </p>

                <p className={`text-lg font-black tracking-tight mb-8 ${plan.highlight ? "text-white" : "text-[#0D9488] dark:text-[#2DD4BF]"}`}>
                  {plan.price}
                </p>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat, fidx) => (
                    <li key={fidx} className="flex gap-2.5 items-start text-xs font-medium">
                      <Check className={`h-4 w-4 flex-shrink-0 ${plan.highlight ? "text-emerald-300" : "text-emerald-500"}`} />
                      <span className={plan.highlight ? "text-teal-50" : "text-gray-600 dark:text-slate-300"}>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={plan.link}
                className={`block text-center rounded-xl py-3 text-xs font-bold transition-colors shadow-sm cursor-pointer ${
                  plan.highlight
                    ? "bg-white text-[#0D524C] hover:bg-gray-50"
                    : "border border-[#0D9488] text-[#0D9488] hover:bg-teal-50 dark:hover:bg-[#0D9488]/10 dark:border-[#2DD4BF] dark:text-[#2DD4BF]"
                }`}
              >
                {plan.cta} &rarr;
              </Link>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
