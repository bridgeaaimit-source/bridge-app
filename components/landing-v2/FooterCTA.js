"use client";

import { useState, useEffect } from "react";
import { m } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";

export default function FooterCTA() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="bg-transparent">
      {/* Final CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">

        <m.div 
          className="relative mx-auto max-w-[800px] rounded-3xl border border-teal-100 dark:border-[#143d38] bg-white dark:bg-[#0A1C1A] p-10 sm:p-12 text-center backdrop-blur-sm text-gray-900 dark:text-white cursor-default shadow-sm dark:shadow-none transition-colors"
          whileHover={{ scale: 1.002, borderColor: "rgba(20, 184, 166, 0.3)", boxShadow: "0 12px 24px -6px rgba(13, 148, 136, 0.06)" }}
          whileTap={{ scale: 0.998 }}
          transition={{ type: "spring", stiffness: 450, damping: 28 }}
        >
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#3e2424] border border-[#5c3636] px-4 py-1.5 text-[11px] font-bold text-[#e5a9a9] tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f472b6] animate-pulse" />
              Only 50 free spots this week
            </span>
          </div>

          <h2 
            className="font-display text-4xl sm:text-5xl lg:text-[56px] font-black text-gray-900 dark:text-[#f8fafc] leading-[1.05] tracking-tighter"
            style={{ transform: "scaleX(1.1)", transformOrigin: "center" }}
          >
            Your competition<br className="hidden sm:block" /> already started.
          </h2>
          <p className="mt-5 text-sm sm:text-base text-gray-600 dark:text-slate-300 max-w-md mx-auto">
            Free forever. No card. 60-second signup.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4">
            <Link href="/colleges#demo" className="cursor-pointer w-full sm:w-auto">
              <m.span 
                className="inline-flex justify-center items-center gap-2 rounded-xl bg-[#0D9488] px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-teal-950/30 hover:bg-[#14B8A6] cursor-pointer w-full"
                whileHover={{ scale: 1.02, y: -0.5, boxShadow: "0 8px 25px -4px rgba(13, 148, 136, 0.25)" }}
                whileTap={{ scale: 0.98, y: 0 }}
                transition={{ type: "spring", stiffness: 600, damping: 30 }}
              >
                Book Demo / Talk to Sales <ArrowRight className="h-4 w-4" />
              </m.span>
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs font-medium text-gray-500 dark:text-slate-400">
            {[
              "No credit card",
              "Cancel anytime",
              "Used by 1,200+ students"
            ].map((bullet, idx) => (
              <span key={idx} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#0D9488]" />
                {bullet}
              </span>
            ))}
          </div>
        </m.div>
      </section>

      {/* Main Footer */}
      <footer className="border-t border-gray-200 dark:border-[#112a27]/50 px-4 py-14 text-gray-500 dark:text-slate-400 text-[13px] sm:px-6 lg:px-8 relative overflow-hidden bg-white/50 dark:bg-[#0A1211]/50 backdrop-blur-md transition-colors">
        
        {/* Neon Green Laser Animation */}
        <div className="absolute top-0 left-0 w-full h-[1px] overflow-hidden">
          <m.div
            className="w-1/4 h-full bg-gradient-to-r from-transparent via-[#2DD4BF] to-transparent"
            style={{ filter: "drop-shadow(0 0 8px #2DD4BF)" }}
            animate={{ x: ["-100%", "400%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-10 md:grid-cols-4">
          
          <div>
            <div className="inline-flex items-center">
              {mounted && theme === "dark" ? (
                <img
                  src="/images/logo_transparent_white_text.png"
                  alt="BridgeAI"
                  className="h-8 sm:h-9 w-auto transition-all"
                />
              ) : (
                <img
                  src="/images/logo_transparent.png"
                  alt="BridgeAI"
                  className="h-8 sm:h-9 w-auto transition-all"
                />
              )}
            </div>
            <p className="mt-4 text-gray-600 dark:text-slate-400 leading-relaxed font-medium pr-4 mb-4">
              AI placement prep for ambitious Indian students.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 dark:bg-[#112a27] border border-teal-100 dark:border-[#143d38] px-3 py-1 text-[10px] font-bold text-[#0D9488] dark:text-teal-400 tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              Only 50 free spots left
            </div>
          </div>

          <div>
            <p className="font-bold text-gray-900 dark:text-white mb-4">Product</p>
            <ul className="space-y-3 font-medium">
              {[
                ["#features", "Features"],
                ["#how-it-works", "How it works"],
                ["#pricing", "Pricing"],
                ["#", "BRIDGE Score"]
              ].map(([href, label]) => (
                <li key={label}>
                  <a href={href} className="text-gray-500 dark:text-slate-400 hover:text-[#0D9488] dark:hover:text-[#2DD4BF] transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-bold text-gray-900 dark:text-white mb-4">Company</p>
            <ul className="space-y-3 font-medium">
              {[
                "About",
                "Blog",
                "Careers",
                "Press"
              ].map((label) => (
                <li key={label}>
                  <span className="text-gray-500 dark:text-slate-400 hover:text-[#0D9488] dark:hover:text-[#2DD4BF] transition-colors cursor-pointer">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-bold text-gray-900 dark:text-white mb-4">Contact Us</p>
            <div className="space-y-3 text-xs leading-relaxed">
              <span className="block font-bold text-gray-900 dark:text-white">Bridgeconnex Technologies Private Limited</span>
              <span className="block text-gray-500 dark:text-slate-400">
                Unit No 441, Fourth Floor,<br />
                Lodha Signet 1, Kolshet Road,<br />
                Thane, Maharashtra, India
              </span>
              <span className="block text-gray-500 dark:text-slate-400">
                Phone: <a href="tel:+919920580247" className="hover:text-[#0D9488] font-bold">+91 99205 80247</a><br />
                Email: <a href="mailto:sales@bridgeai.in" className="hover:text-[#0D9488] font-bold">sales@bridgeai.in</a>
              </span>
            </div>
          </div>

        </div>

        <div className="mx-auto w-full max-w-[1200px] mt-12 pt-8 border-t border-gray-200 dark:border-[#112a27]/50 flex justify-center items-center text-gray-400 dark:text-slate-500 font-medium text-xs">
          <p>&copy; 2026 BridgeAI &middot; Crafted with intent in India</p>
        </div>
      </footer>
    </div>
  );
}

