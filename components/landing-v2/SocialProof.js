"use client";

import { m } from "framer-motion";

const INSTITUTIONS = [
  "IIT Bombay", "IIM Ahmedabad", "BITS Pilani", "ISB", "NMIMS", "FMS",
  "Deloitte", "McKinsey", "BCG", "EY", "Amazon", "Microsoft"
];

export default function SocialProof() {
  return (
    <section className="bg-transparent border-b border-gray-200 dark:border-white/10 pt-8 pb-16 overflow-hidden transition-colors">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 text-center mb-12">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">
          Trusted by ambitious candidates across India’s top campuses and firms.
        </h2>
      </div>

      <div className="relative flex overflow-x-hidden w-full max-w-[1400px] mx-auto">
        <div className="pointer-events-none absolute left-0 top-0 h-full w-32 bg-gradient-to-r from-[#F8FAFC] dark:from-[#030908] to-transparent z-10 transition-colors" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-[#F8FAFC] dark:from-[#030908] to-transparent z-10 transition-colors" />
        
        <m.div 
          className="whitespace-nowrap inline-flex items-center opacity-80 hover:opacity-100 transition-opacity duration-500"
          animate={{ x: ["0%", "-33.33%"] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          {[...INSTITUTIONS, ...INSTITUTIONS, ...INSTITUTIONS].map((name, idx) => (
            <span
              key={idx}
              className="mx-6 sm:mx-10 inline-flex items-center justify-center font-display text-xl sm:text-3xl font-extrabold text-gray-300 hover:text-[#0D9488] dark:text-slate-800 transition-all duration-300 dark:hover:text-teal-400 cursor-default"
            >
              {name}
            </span>
          ))}
        </m.div>
      </div>

      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 text-center mt-12">
        <p className="text-[13px] font-semibold text-gray-400">
          BridgeAI candidates are building verified readiness signals beyond resumes.
        </p>
      </div>
    </section>
  );
}



