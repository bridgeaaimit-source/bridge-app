"use client";

import { useState } from "react";
import { m, motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import Link from "next/link";

const MotionLink = motion(Link);

export default function PricingSection() {
  const [spotFree, setSpotFree] = useState({ x: 0, y: 0, active: false });
  const [spotPro, setSpotPro] = useState({ x: 0, y: 0, active: false });

  const handleMouseMoveFree = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSpotFree({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
  };
  const handleMouseLeaveFree = () => setSpotFree((p) => ({ ...p, active: false }));

  const handleMouseMovePro = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSpotPro({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
  };
  const handleMouseLeavePro = () => setSpotPro((p) => ({ ...p, active: false }));
  const listContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const listItem = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <section id="pricing" className="bg-transparent pt-24 pb-28 border-b border-gray-200 dark:border-white/10 transition-colors">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488] dark:text-[#2DD4BF]">Pricing Options</span>
          <h2 className="font-display mt-3 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Start diagnostic practice for free.
          </h2>
          <p className="mt-4 text-base text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
            Upgrade when you need unlimited access to group battles, resume review, and personalized roadmaps.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Card 1: Free Starter */}
          <m.div 
            onMouseMove={handleMouseMoveFree}
            onMouseLeave={handleMouseLeaveFree}
            style={{
              background: spotFree.active
                ? `radial-gradient(circle 240px at ${spotFree.x}px ${spotFree.y}px, rgba(13, 148, 136, 0.06), transparent)`
                : "transparent"
            }}
            className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0E1A18]/60 backdrop-blur-md p-8 sm:p-10 flex flex-col justify-between cursor-default transition-all duration-150 relative overflow-hidden shadow-sm dark:shadow-none"
            whileHover={{ y: -4, borderColor: "rgba(13, 148, 136, 0.35)", boxShadow: "0 12px 24px -6px rgba(13, 82, 76, 0.08)" }}
            whileTap={{ scale: 0.995 }}
            transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
          >
            <div className="relative z-10">
              <p className="text-xs font-bold text-[#0D9488] dark:text-[#2DD4BF] uppercase tracking-wider">Starter</p>
              
              <h3 className="font-display mt-2 text-2xl font-extrabold text-gray-900 dark:text-white uppercase">
                FREE FOREVER
              </h3>
              
              <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">
                ₹0 <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">/ forever</span>
              </p>
              
              <m.ul 
                variants={listContainer} 
                initial="hidden" 
                whileInView="show" 
                viewport={{ once: true, margin: "-50px" }}
                className="mt-8 space-y-4 text-xs font-semibold text-gray-600 dark:text-gray-300"
              >
                {[
                  "4 AI mock interviews",
                  "1 GD battle",
                  "Basic BRIDGE score",
                  "PDF Resume review"
                ].map((f) => (
                  <m.li variants={listItem} key={f} className="flex items-center gap-3">
                    <span className="h-5 w-5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                      <Check className="h-3 w-3" />
                    </span>
                    <span>{f}</span>
                  </m.li>
                ))}
              </m.ul>
            </div>

            <div className="mt-8 relative z-10">
              <MotionLink 
                href="/login" 
                className="block text-center rounded-xl border border-[#0D9488] dark:border-[#2DD4BF] py-3 text-sm font-bold text-[#0D9488] dark:text-[#2DD4BF] hover:bg-teal-50 dark:hover:bg-[#2DD4BF]/10 transition-colors cursor-pointer"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 600, damping: 30 }}
              >
                Start Free
              </MotionLink>
            </div>
          </m.div>

          {/* Card 2: Pro Track */}
          <m.div 
            className="rounded-3xl border border-[#0D524C] bg-[#0D524C]/80 backdrop-blur-md p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden cursor-default group"
            whileHover={{ y: -4, boxShadow: "0 16px 36px -8px rgba(13, 82, 76, 0.4)" }}
            whileTap={{ scale: 0.995 }}
            transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
          >
            {/* Ambient Shine Effect */}
            <m.div
              className="absolute -inset-full w-[250%] h-[200%] bg-gradient-to-r from-transparent via-white/10 to-transparent -rotate-45 pointer-events-none"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 7, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
            />
            
            <div className="absolute top-4 right-4 z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[9px] font-bold tracking-wider uppercase text-[#CCFBF1]">
                <m.span
                  animate={{ opacity: [1, 0.5, 1], scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Star className="h-3 w-3 fill-current text-[#CCFBF1]" />
                </m.span>
                Most popular
              </span>
            </div>
            
            <div className="relative z-10">
              <p className="text-xs font-bold text-[#CCFBF1] uppercase tracking-wider">Pro</p>
              
              <h3 className="font-display mt-2 text-2xl font-extrabold text-white uppercase">
                PLACEMENT CRUSHER
              </h3>
              
              <p className="mt-1 text-2xl font-black text-white">
                ₹499 <span className="text-xs font-semibold text-teal-200">/ month</span>
              </p>
              <p className="text-[10px] text-teal-200 font-semibold mt-1">
                Less than 1 day of coaching fees.
              </p>
              
              <m.ul 
                variants={listContainer} 
                initial="hidden" 
                whileInView="show" 
                viewport={{ once: true, margin: "-50px" }}
                className="mt-8 space-y-4 text-xs font-semibold"
              >
                {[
                  "20 AI video interviews / month",
                  "20 GD battles / month",
                  "Unlimited improvement guides",
                  "Priority question bank",
                  "Personal roadmap updates"
                ].map((f) => (
                  <m.li variants={listItem} key={f} className="flex items-center gap-3">
                    <span className="h-5 w-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300 flex-shrink-0 group-hover:bg-white/20 transition-colors">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="text-slate-100">{f}</span>
                  </m.li>
                ))}
              </m.ul>
            </div>

            <div className="mt-8 relative z-10">
              <MotionLink 
                href="/login" 
                className="block text-center rounded-xl bg-white py-3 text-sm font-bold text-[#0D524C] hover:bg-gray-100 transition-colors cursor-pointer shadow-sm"
                whileHover={{ scale: 1.01, y: -0.5 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 600, damping: 30 }}
              >
                Go Pro &rarr;
              </MotionLink>
            </div>
          </m.div>

        </div>

      </div>
    </section>
  );
}

