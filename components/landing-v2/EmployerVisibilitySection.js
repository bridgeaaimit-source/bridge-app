"use client";

import { useState, useEffect, useRef } from "react";
import { m, AnimatePresence, useInView } from "framer-motion";
import { Search, Sliders, ShieldCheck, Check } from "lucide-react";

const MOCK_CANDIDATES = [
  { name: "Meera Nair", school: "IIM Bangalore", track: "Product Management", score: 852, category: "pm" },
  { name: "Rohan Sen", school: "BITS Pilani", track: "Strategy Consulting", score: 818, category: "consulting" },
  { name: "Priya Sharma", school: "ISB Hyderabad", track: "Corporate Leadership", score: 840, category: "leadership" },
  { name: "Siddharth Roy", school: "IIM Ahmedabad", track: "Management Consulting", score: 865, category: "consulting" },
  { name: "Ananya Iyer", school: "BITS Pilani", track: "Software Engineering", score: 835, category: "tech" },
  { name: "Kabir Mehta", school: "FMS Delhi", track: "Product Strategy", score: 828, category: "pm" }
];

export default function EmployerVisibilitySection() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [typedText, setTypedText] = useState("");
  
  const containerRef = useRef(null);
  const isRegistryInView = useInView(containerRef, { once: true, margin: "-120px" });

  useEffect(() => {
    if (isRegistryInView) {
      const fullText = "BITS Pilani, Strategy Consulting...";
      let i = 0;
      const interval = setInterval(() => {
        setTypedText(fullText.substring(0, i));
        i++;
        if (i > fullText.length) {
          clearInterval(interval);
        }
      }, 60);
      return () => clearInterval(interval);
    }
  }, [isRegistryInView]);

  const filteredCandidates = MOCK_CANDIDATES.filter(
    (c) => activeFilter === "all" || c.category === activeFilter
  );
  return (
    <section className="bg-transparent pt-20 pb-28 border-b border-gray-200 dark:border-white/10 transition-colors">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        
        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-5 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488] dark:text-[#2DD4BF]">Recruiter Network</span>
            <h2 className="font-display mt-3 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl leading-tight">
              Verified by Bridge.<br />Trusted by Industry.
            </h2>
            <p className="mt-4 text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              Resumes can be polished, but your BRIDGE Score is evidence-backed and validated by real-world communication logs, case strategy recordings, and structured reasoning. 
            </p>
            <p className="mt-3 text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              When recruiters query the Bridge Talent Registry, they access secure, performance-validated profiles of candidates who have proven their boardroom-ready capabilities.
            </p>

            <div className="mt-8 space-y-3">
              {[
                "Evidence-backed, objective meritocratic evaluation standards",
                "Performance-verified communication and structure diagnostics",
                "Recruiter-trusted verification pipelines across elite careers"
              ].map((point, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Recruiter Dashboard Mock */}
          <div ref={containerRef} className="lg:col-span-7">
            <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 backdrop-blur-md p-6 shadow-sm dark:shadow-xl dark:shadow-teal-900/10 overflow-hidden relative transition-colors">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#0D9488] dark:text-[#2DD4BF]" />
                  <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                    Bridge Talent Registry
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">
                  Recruiter Interface
                </span>
              </div>

              {/* Search HUD */}
              <div className="bg-white dark:bg-[#0E1A18]/60 border border-gray-200 dark:border-white/10 rounded-xl p-3 flex items-center justify-between mb-4 text-xs shadow-sm dark:shadow-none">
                <div className="flex items-center gap-2 flex-1 text-gray-700 dark:text-gray-300">
                  <Search className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <span className="font-medium">
                    {typedText || <span className="text-gray-400">Search registry...</span>}
                    <m.span 
                      animate={{ opacity: [1, 0, 1] }} 
                      transition={{ repeat: Infinity, duration: 0.8 }}
                      className="inline-block w-1 h-3.5 bg-[#0D9488] dark:bg-[#2DD4BF] ml-0.5 align-middle"
                    />
                  </span>
                </div>
                <div className="flex items-center gap-1.5 border-l border-gray-200 dark:border-white/10 pl-3">
                  <Sliders className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="font-bold text-[#0D9488] dark:text-[#2DD4BF]">Filters</span>
                </div>
              </div>

              {/* Filtering tags */}
              <div className="flex flex-wrap gap-2 mb-5">
                {[
                  { label: "All Tracks", id: "all" },
                  { label: "Consulting", id: "consulting" },
                  { label: "Product Mgmt", id: "pm" },
                  { label: "Leadership", id: "leadership" },
                  { label: "Engineering", id: "tech" }
                ].map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setActiveFilter(tag.id)}
                    className={`rounded-lg px-3 py-1 text-[10px] font-bold transition-all cursor-pointer border ${
                      activeFilter === tag.id
                        ? "bg-[#14B8A6] border-[#14B8A6] text-white dark:text-black shadow-sm"
                        : "bg-teal-50 dark:bg-teal-500/10 border-teal-100 dark:border-teal-500/20 text-[#0D9488] dark:text-[#2DD4BF] hover:bg-teal-100 dark:hover:bg-teal-500/20"
                    }`}
                  >
                    {activeFilter === tag.id ? "✓ " : ""}{tag.label}
                  </button>
                ))}
              </div>

              {/* Candidates Table Mock */}
              <m.div layout className="space-y-3 min-h-[190px]">
                <AnimatePresence mode="popLayout">
                  {filteredCandidates.map((cand) => (
                    <m.div
                      layout
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 450, damping: 28 }}
                      key={cand.name}
                      className="bg-white dark:bg-[#0E1A18]/60 rounded-xl border border-gray-200 dark:border-white/10 p-4 flex items-center justify-between cursor-pointer shadow-sm dark:shadow-none"
                      whileHover={{ scale: 1.01, borderColor: "rgba(13, 148, 136, 0.4)", boxShadow: "0 6px 16px -4px rgba(13, 82, 76, 0.08)" }}
                      whileTap={{ scale: 0.985 }}
                    >
                      <div>
                        <p className="font-bold text-xs text-gray-900 dark:text-white">{cand.name}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase mt-0.5">
                          {cand.school} &middot; {cand.track}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block bg-[#0D9488]/10 border border-teal-500/20 px-3 py-1 rounded-lg text-xs font-black text-[#0D9488] dark:text-[#2DD4BF]">
                          {cand.score} <span className="text-[9px] font-bold text-[#0D9488] dark:text-teal-400">/ 1000</span>
                        </span>
                      </div>
                    </m.div>
                  ))}
                </AnimatePresence>
              </m.div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

