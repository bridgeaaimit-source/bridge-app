"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Play, Sparkles, CheckCircle2, MonitorPlay } from "lucide-react";

export default function ProductDemo() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section id="demo" className="relative py-24 bg-transparent border-b border-gray-200 dark:border-white/10 transition-colors overflow-hidden">
      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16 text-center mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-[#0D9488] dark:text-teal-300 text-[11px] font-bold uppercase tracking-wider mb-5">
            <MonitorPlay className="h-3.5 w-3.5" /> Product Tour
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
            See BridgeAI In Action
          </h2>
          <p className="mt-4 text-base text-gray-600 dark:text-slate-300 max-w-xl mx-auto font-medium leading-relaxed">
            Watch how students improve placement readiness, how colleges monitor progress, and how recruiters discover talent through BridgeAI.
          </p>
        </div>

        {/* Video Player & Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Video Mockup */}
          <div className="lg:col-span-7">
            <div className="relative rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-900 shadow-2xl aspect-video flex items-center justify-center">
              
              {/* Image Thumbnail */}
              <div 
                className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?q=80&w=1000')] bg-cover bg-center transition-all duration-500"
                style={{ opacity: isPlaying ? 0.15 : 0.6 }}
              />

              <AnimatePresence mode="wait">
                {!isPlaying ? (
                  <m.button
                    key="play-btn"
                    onClick={() => setIsPlaying(true)}
                    className="relative z-10 h-16 w-16 rounded-full bg-teal-500 hover:bg-teal-400 text-white flex items-center justify-center shadow-lg shadow-teal-500/20 cursor-pointer hover:scale-105 transition-transform"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Play className="h-6 w-6 fill-current ml-1" />
                    {/* Ring animation */}
                    <span className="absolute inset-0 rounded-full border border-teal-400 animate-ping opacity-60" />
                  </m.button>
                ) : (
                  <m.div
                    key="video-loader"
                    className="z-10 text-center px-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <span className="inline-block h-8 w-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin mb-4" />
                    <p className="text-xs text-slate-300 font-bold tracking-wider uppercase">Loading Interactive Product Walkthrough...</p>
                    <button 
                      onClick={() => setIsPlaying(false)}
                      className="mt-3 text-[10px] text-teal-400 hover:underline font-semibold"
                    >
                      Reset Demo View
                    </button>
                  </m.div>
                )}
              </AnimatePresence>

              {/* Status bar */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[10px] font-bold text-white/60 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg">
                <span>SYSTEM TOUR: ALL BATCHES</span>
                <span>02:14 MIN WALKTHROUGH</span>
              </div>
            </div>
          </div>

          {/* Right Column: Highlights Checklist */}
          <div className="lg:col-span-5 space-y-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              Tour Highlights
            </h3>

            <div className="space-y-4">
              {[
                {
                  title: "For Students",
                  desc: "Learn how the AI coach targets weak structural structures and maps real placement progress."
                },
                {
                  title: "For Colleges",
                  desc: "Watch how Training & Placement Officers run department mock drives and view analytics."
                },
                {
                  title: "For Recruiters",
                  desc: "See how corporate sourcing filters candidates by verified credentials in 2 clicks."
                }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <div className="h-6 w-6 rounded-full bg-teal-50 dark:bg-white/5 flex items-center justify-center flex-shrink-0 text-emerald-500">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-1">{item.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400 leading-normal font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
