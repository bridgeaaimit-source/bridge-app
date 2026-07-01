"use client";

import { useEffect } from "react";
import Navbar from "@/components/landing-v2/Navbar";
import FooterCTA from "@/components/landing-v2/FooterCTA";
import AnimatedBackground from "@/components/landing-v2/AnimatedBackground";
import { m } from "framer-motion";
import { Target, Compass } from "lucide-react";

export default function AboutUsPage() {
  useEffect(() => {
    document.title = "About Us — BridgeAI";
  }, []);

  return (
    <div className="min-h-screen relative landing-theme">
      <AnimatedBackground />
      <Navbar />

      <main className="relative z-10 pt-32 sm:pt-40 pb-20 px-4 sm:px-6 lg:px-8 max-w-[1000px] mx-auto">
        
        {/* Centered Logo Container */}
        <m.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          {/* Light Theme Logo */}
          <img 
            src="/images/logo_transparent.png" 
            alt="BridgeAI Logo" 
            className="h-20 sm:h-24 mx-auto block dark:hidden" 
          />
          {/* Dark Theme Logo */}
          <img 
            src="/images/logo_transparent_white_text.png" 
            alt="BridgeAI Logo" 
            className="h-20 sm:h-24 mx-auto hidden dark:block" 
          />
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-4 font-semibold tracking-wider uppercase">
            Bridging Academics and Careers
          </p>
        </m.div>

        {/* Vision & Mission Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
          
          {/* Our Vision Card */}
          <m.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-[#0A1211]/50 border border-gray-200 dark:border-white/5 rounded-3xl p-8 sm:p-10 shadow-sm relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-[#0D9488]" />
            <div>
              <div className="h-12 w-12 rounded-xl bg-teal-50 dark:bg-white/5 flex items-center justify-center mb-6">
                <Compass className="h-6 w-6 text-[#0D9488] dark:text-teal-400" />
              </div>
              <h2 className="font-display text-2xl font-black text-gray-900 dark:text-white mb-4">
                Our Vision
              </h2>
              <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed font-medium">
                To democratize professional placement readiness, enabling students from every corner of India to discover, hone, and validate their industry competency. We envision a future where skills speak louder than credentials, and where every ambitious student has an equal, frictionless bridge to their dream career.
              </p>
            </div>
          </m.div>

          {/* Our Mission Card */}
          <m.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-[#0A1211]/50 border border-gray-200 dark:border-white/5 rounded-3xl p-8 sm:p-10 shadow-sm relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-[#0D9488]" />
            <div>
              <div className="h-12 w-12 rounded-xl bg-teal-50 dark:bg-white/5 flex items-center justify-center mb-6">
                <Target className="h-6 w-6 text-[#0D9488] dark:text-teal-400" />
              </div>
              <h2 className="font-display text-2xl font-black text-gray-900 dark:text-white mb-4">
                Our Mission
              </h2>
              <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed font-medium">
                To construct the ultimate AI-driven skills validation infrastructure. By delivering real-time, personalized mock evaluations and verified placement readiness credentials, we empower campuses to train better, recruiters to hire faster, and students to unlock their true career potential.
              </p>
            </div>
          </m.div>

        </div>

      </main>

      <FooterCTA />
    </div>
  );
}
