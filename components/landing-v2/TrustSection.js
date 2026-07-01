"use client";

import { m } from "framer-motion";
import { Shield, Mail, Phone, MapPin, Building } from "lucide-react";

const FOUNDERS = [
  {
    name: "Aditya Shah",
    role: "Co-Founder & CEO",
    bio: "Ex-Product Leader at top Indian tech firms. Management Consultant alumnus. Passionate about leveling the placement playing field.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop"
  },
  {
    name: "Neha Patel",
    role: "Co-Founder & COO",
    bio: "Ex-Corporate Recruiter & Campus Placement Lead. Passionate about batch analytics accuracy and matching logic optimization.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop"
  }
];

export default function TrustSection() {
  return (
    <section id="about-us" className="relative py-24 bg-transparent border-b border-gray-200 dark:border-white/10 transition-colors overflow-hidden">
      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16 text-center mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-[#0D9488] dark:text-teal-300 text-[11px] font-bold uppercase tracking-wider mb-5">
            <Shield className="h-3.5 w-3.5" /> Corporate Trust & Credibility
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
            A Serious Platform Built on Credibility
          </h2>
          <p className="mt-4 text-base text-gray-500 dark:text-slate-300 max-w-xl mx-auto font-medium leading-relaxed">
            BridgeAI is backed by verifiable corporate registry credentials, local physical offices, and experienced founders with deep backgrounds in Indian campus placements.
          </p>
        </div>

        {/* 2-Column layout: Left (Mission & Details), Right (Founders) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left: Mission & Registered Info */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white dark:bg-[#0A1211]/50 border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">Our Mission</span>
              <p className="text-sm text-gray-800 dark:text-slate-200 font-medium leading-relaxed">
                "To democratize institutional campus recruiting in India by replacing subjective filtering with verified, diagnostic, and standardized skill signals."
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#0D9488] uppercase tracking-wider">Company Information</h4>
              
              <div className="space-y-4 text-xs font-medium text-gray-600 dark:text-slate-300">
                <div className="flex gap-3">
                  <MapPin className="h-5 w-5 text-[#0D9488] flex-shrink-0" />
                  <div>
                    <span className="block font-bold text-gray-900 dark:text-white">Office Address</span>
                    <span>Pune, Maharashtra, India</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Phone className="h-5 w-5 text-[#0D9488] flex-shrink-0" />
                  <div>
                    <span className="block font-bold text-gray-900 dark:text-white">Support Hotline</span>
                    <a href="tel:+919571657890" className="hover:text-teal-400 font-semibold">+919571657890</a>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Mail className="h-5 w-5 text-[#0D9488] flex-shrink-0" />
                  <div>
                    <span className="block font-bold text-gray-900 dark:text-white">Inquiry Email</span>
                    <a href="mailto:bridgeaimit@gmail.com" className="hover:text-teal-400 font-semibold">bridgeaimit@gmail.com</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Founders */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FOUNDERS.map((founder, idx) => (
              <div key={idx} className="bg-white dark:bg-[#0A1211]/50 border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="aspect-square w-20 h-20 rounded-xl overflow-hidden mb-4 bg-gray-100 dark:bg-white/5">
                    <img src={founder.image} alt={founder.name} className="w-full h-full object-cover grayscale" />
                  </div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">{founder.name}</h4>
                  <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block mb-2">{founder.role}</span>
                  <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed font-medium mb-4">
                    {founder.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
