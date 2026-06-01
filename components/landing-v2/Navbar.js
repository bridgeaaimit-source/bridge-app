"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { m, AnimatePresence } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";



export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme } = useTheme();
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-300 border-b ${
        scrolled 
          ? "border-gray-200/50 bg-white/80 dark:border-white/10 dark:bg-black/60 backdrop-blur-md shadow-sm" 
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5">
        <Link href="/" className="flex items-center">
          {mounted && (theme === 'dark') ? (
            <Image
              src="/images/logo_transparent_white_text.png"
              alt="BridgeAI Logo"
              width={140}
              height={44}
              priority
              className="h-10 sm:h-11 w-auto transition-all duration-300"
            />
          ) : (
            <Image
              src="/images/logo_transparent.png"
              alt="BridgeAI Logo"
              width={140}
              height={44}
              priority
              className="h-10 sm:h-11 w-auto transition-all duration-300"
            />
          )}
        </Link>

        {/* Desktop Links */}
        <div className="hidden items-center gap-8 md:flex">
          {[
            ["#features", "Features"],
            ["#how-it-works", "How it Works"],
            ["#pricing", "Pricing"],
            ["#stories", "Stories"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="text-sm font-medium transition-colors duration-150 ease-out relative group py-1 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              {label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-200 ease-out group-hover:w-full bg-[#2DD4BF]" />
            </a>
          ))}
        </div>

        {/* Action Buttons & Theme */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          
          <Link href="/login" passHref legacyBehavior>
            <m.a
              className="rounded-xl border px-4 py-2 text-sm font-medium transition-all cursor-pointer border-gray-200 bg-white text-gray-700 hover:border-[#0D9488] hover:text-[#0D9488] dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:border-[#2DD4BF] dark:hover:text-[#2DD4BF]"
              whileHover={{ scale: 1.015, y: -0.5 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 600, damping: 30 }}
            >
              Login
            </m.a>
          </Link>
          <Link href="/login" passHref legacyBehavior>
            <m.a
              className="rounded-xl bg-[#0D524C] px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-[#0A3D36] transition-all cursor-pointer"
              whileHover={{ scale: 1.015, y: -0.5, boxShadow: "0 4px 12px rgba(13, 82, 76, 0.12)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 600, damping: 30 }}
            >
              Start Free
            </m.a>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen((p) => !p)}
            className="rounded-lg p-2 transition-colors text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="border-t overflow-hidden md:hidden border-gray-100 bg-white dark:border-white/10 dark:bg-[#0A1211]"
          >
            <div className="space-y-1 px-4 py-4">
              {[
                ["#features", "Features"],
                ["#how-it-works", "How it Works"],
                ["#pricing", "Pricing"],
                ["#stories", "Stories"],
              ].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-xl px-4 py-2.5 text-sm font-medium transition-colors text-gray-700 hover:bg-gray-50 hover:text-[#0D9488] dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-[#2DD4BF]"
                >
                  {label}
                </a>
              ))}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t mt-2 border-gray-100 dark:border-white/10">
                <Link href="/login" passHref legacyBehavior>
                  <m.a
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl border px-4 py-2.5 text-center text-sm font-medium cursor-pointer border-gray-200 bg-white text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
                    whileTap={{ scale: 0.965 }}
                    transition={{ type: "spring", stiffness: 600, damping: 30 }}
                  >
                    Login
                  </m.a>
                </Link>
                <Link href="/login" passHref legacyBehavior>
                  <m.a
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl bg-[#0D524C] px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm cursor-pointer"
                    whileTap={{ scale: 0.965 }}
                    transition={{ type: "spring", stiffness: 600, damping: 30 }}
                  >
                    Start Free
                  </m.a>
                </Link>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </nav>
  );
}


