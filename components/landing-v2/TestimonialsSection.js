"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    initials: "PN",
    name: "Priya Nair",
    school: "IIM Ahmedabad",
    track: "Management Consulting",
    quote: "The analytics identified a persistent pacing issue in my case structuring. Fixing my delivery tempo shifted the power dynamic in my final McKinsey panel.",
    improvement: "612 → 842 BRIDGE Score in 5 weeks",
    outcome: "Converted McKinsey & Co. offer",
    avatarBg: "bg-gray-800"
  },
  {
    initials: "AK",
    name: "Akhil Kumar",
    school: "BITS Pilani",
    track: "Product Management",
    quote: "I was failing to communicate trade-off logic clearly. The live simulations helped me structure my prioritization frameworks. It became a measurable advantage.",
    improvement: "580 → 815 BRIDGE Score in 6 weeks",
    outcome: "Converted Amazon PM role",
    avatarBg: "bg-[#0D524C]"
  },
  {
    initials: "RS",
    name: "Rohan Sharma",
    school: "ISB Hyderabad",
    track: "Corporate Leadership",
    quote: "My executive presence was lacking under pressure. The live group strategy rooms helped me build and track my consensus-building skills in real-time.",
    improvement: "690 → 855 BRIDGE Score in 4 weeks",
    outcome: "Selected for Unilever Leadership Track",
    avatarBg: "bg-teal-700"
  },
  {
    initials: "SP",
    name: "Sneha Patel",
    school: "NMIMS Mumbai",
    track: "Strategy Analyst",
    quote: "The recruiter verified signals gave me an edge before I even walked into the room. They knew my structured reasoning was already validated.",
    improvement: "710 → 835 BRIDGE Score in 8 weeks",
    outcome: "Converted Deloitte shortlist",
    avatarBg: "bg-[#111111]"
  }
];

export default function TestimonialsSection() {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <section id="stories" className="bg-transparent pt-28 pb-20 border-b border-gray-200 dark:border-white/10 transition-colors">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488] dark:text-[#2DD4BF]">Success Stories</span>
          <h2 className="font-display mt-3 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            They walked in prepared. They walked out selected.
          </h2>
          <div className="mt-4 flex justify-center items-center gap-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-current" />
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Verified outcomes across top-tier firms.
            </span>
          </div>
        </div>

        {/* Testimonials Grid */}
        <m.div 
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } }
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {TESTIMONIALS.map((t, idx) => (
            <m.div
              key={idx}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 22 } }
              }}
              animate={hoveredIndex !== null ? {
                opacity: hoveredIndex === idx ? 1 : 0.45,
                scale: hoveredIndex === idx ? 1.012 : 1
              } : { opacity: 1, scale: 1 }}
              className="bg-white dark:bg-[#0E1A18]/60 backdrop-blur-md rounded-3xl border border-gray-200 dark:border-white/10 p-7 cursor-default transition-all duration-200 shadow-sm dark:shadow-none"
              whileHover={{ borderColor: "rgba(13, 148, 136, 0.35)", boxShadow: "0 8px 18px -4px rgba(13, 82, 76, 0.05)" }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`${t.avatarBg} h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900 dark:text-white">{t.name}</p>
                  <p className="text-xs font-semibold text-[#0D9488] dark:text-[#2DD4BF]">{t.school}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Before & After</p>
                  <p className="text-xs font-bold text-[#0D9488] dark:text-[#2DD4BF]">{t.improvement}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <span className="inline-block rounded bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                  {t.outcome}
                </span>
              </div>
              
              <div className="flex text-yellow-400 mb-3.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold mb-2">
                {t.track}
              </p>
              
              <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </p>
            </m.div>
          ))}
        </m.div>

      </div>
    </section>
  );
}

