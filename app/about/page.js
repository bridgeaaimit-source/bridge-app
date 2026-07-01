"use client";

import { useEffect } from "react";
import Navbar from "@/components/landing-v2/Navbar";
import FooterCTA from "@/components/landing-v2/FooterCTA";
import AnimatedBackground from "@/components/landing-v2/AnimatedBackground";
import { m } from "framer-motion";

export default function AboutUsPage() {
  useEffect(() => {
    document.title = "About Us — BridgeAI";
  }, []);

  return (
    <div className="min-h-screen relative landing-theme">
      <AnimatedBackground />
      <Navbar />

      <main className="relative z-10 pt-32 sm:pt-40 pb-24 px-4 sm:px-6 lg:px-8 max-w-[800px] mx-auto">
        
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

        {/* Vision & Mission Typographic Flow */}
        <div className="space-y-16 text-gray-700 dark:text-slate-300 leading-relaxed font-medium">
          
          {/* Our Vision Section */}
          <m.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white" style={{ fontFamily: "Syne, sans-serif" }}>
              Our Vision
            </h2>
            <div className="space-y-4 text-base">
              <p>
                Every career begins with ambition, but ambition alone isn't enough. Too many talented students step into the job market without the guidance, confidence, or opportunities they deserve. They aren't held back by their potential, but by the gap between education and employment.
              </p>
              <p>
                At BridgeAI, we envision a future where every student, regardless of their college or background, has an equal opportunity to prove what they're capable of. A future where skills speak louder than resumes, preparation replaces uncertainty, and talent is recognized for its true potential. We believe careers should be built on ability, not circumstance, and we're committed to creating a world where every student has a fair chance to succeed.
              </p>
            </div>
          </m.section>

          {/* Our Mission Section */}
          <m.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white" style={{ fontFamily: "Syne, sans-serif" }}>
              Our Mission
            </h2>
            <div className="space-y-4 text-base">
              <p>
                We are building BridgeAI to make career readiness accessible, measurable, and personalized for every student. Through AI powered mock interviews, group discussions, resume intelligence, personalized learning paths, and real time feedback, we help students prepare for the moments that define their future.
              </p>
              <p>
                Our mission extends beyond students. We enable colleges to better understand placement readiness and help recruiters identify talent based on demonstrated skills rather than assumptions. Every feature we build is designed to reduce uncertainty, build confidence, and create meaningful connections between education and employment.
              </p>
              <p className="font-extrabold text-gray-900 dark:text-white text-lg">
                BridgeAI isn't just preparing students for interviews. We're preparing them for careers.
              </p>
            </div>
          </m.section>

        </div>

      </main>

      <FooterCTA />
    </div>
  );
}
