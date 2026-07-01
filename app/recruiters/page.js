"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/landing-v2/Navbar";
import FooterCTA from "@/components/landing-v2/FooterCTA";
import AnimatedBackground from "@/components/landing-v2/AnimatedBackground";
import { m } from "framer-motion";
import { CheckCircle2, Search, Filter, ShieldCheck, Mail, Building, ArrowRight } from "lucide-react";

const MOCK_CANDIDATES = [
  { name: "Anish K.", role: "Software Engineer (Backend)", score: 842, college: "IIT Bombay", fit: "94% Match" },
  { name: "Priya S.", role: "Product Manager", score: 815, college: "BITS Pilani", fit: "89% Match" },
  { name: "Rahul M.", role: "Management Consultant", score: 856, college: "IIM Ahmedabad", fit: "92% Match" }
];

export default function RecruitersPage() {
  useEffect(() => {
    document.title = "BridgeAI — Campus Hiring & Verified Candidate Registry";
  }, []);

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", company: "", phone: "", roles: "Tech" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/send-demo-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, type: "recruiter" }),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch (err) {
      console.error("Demo submission failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative landing-theme">
      <AnimatedBackground />
      <Navbar />

      <main className="relative z-10 pt-32 sm:pt-40">
        
        {/* Hero Section */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto text-center pb-16">
          <m.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-[#0D9488] dark:text-teal-300 text-[11px] font-bold uppercase tracking-wider mb-5"
          >
            For Recruiters & Enterprise
          </m.span>
          
          <m.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display text-4xl sm:text-5xl lg:text-7xl font-black text-gray-900 dark:text-white leading-[1.08] tracking-tight"
          >
            Zero Screening. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0D9488] to-teal-500 dark:from-teal-400 dark:to-teal-300">
              Verified Pre-vetted Talent.
            </span>
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-base sm:text-lg text-gray-600 dark:text-slate-300 max-w-xl mx-auto font-medium leading-relaxed"
          >
            Skip the resume stack. Connect directly with students whose structured thinking, communication stability, and domain rigor are verified by Bridge Scores.
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-8 flex flex-wrap justify-center gap-4"
          >
            <a href="#inquiry" className="cursor-pointer">
              <m.span
                className="inline-flex items-center gap-2 rounded-xl bg-[#0D524C] px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-[#0A3D36]"
                whileHover={{ scale: 1.02, y: -0.5 }}
                whileTap={{ scale: 0.98 }}
              >
                Request Access <ArrowRight className="h-4 w-4" />
              </m.span>
            </a>
            <a href="#dashboard" className="cursor-pointer">
              <m.span
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-sm font-semibold text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
                whileHover={{ scale: 1.02, y: -0.5 }}
                whileTap={{ scale: 0.98 }}
              >
                See Candidates Dashboard
              </m.span>
            </a>
          </m.div>
        </section>

        {/* Candidate Search Mockup Section */}
        <section id="dashboard" className="py-20 px-4 sm:px-6 lg:px-8 max-w-[1000px] mx-auto border-t border-gray-150 dark:border-white/5">
          <div className="bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 border-b border-gray-150 dark:border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-[#0D9488]" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">Smart Match Registry</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[10px] bg-teal-500/10 text-teal-400 px-2.5 py-1 rounded font-bold">Score Limit &gt; 800</span>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded font-bold">Pre-evaluated</span>
              </div>
            </div>

            {/* Simulated Candidate List */}
            <div className="space-y-4">
              {MOCK_CANDIDATES.map((cand, idx) => (
                <div key={idx} className="flex flex-wrap justify-between items-center bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/5 rounded-2xl p-5 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-sm text-gray-900 dark:text-white">{cand.name}</strong>
                      <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-bold">{cand.fit}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-slate-400 block mt-0.5">{cand.role} &middot; {cand.college}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-sm font-black text-[#0D9488] dark:text-[#2DD4BF] block">{cand.score}</span>
                      <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Bridge Score</span>
                    </div>
                    <button className="rounded-xl border border-gray-200 dark:border-white/10 hover:border-[#0D9488] dark:hover:border-[#2DD4BF] px-4 py-2 text-xs font-semibold dark:text-gray-200 transition-colors">
                      Unlock Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits for Recruiters */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto border-t border-gray-150 dark:border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Discover Better Candidates",
                desc: "Identify top-tier profiles by communication poise, logical structure, and specialized domain competencies."
              },
              {
                title: "Reduce Screening Effort",
                desc: "Avoid resume parsing tools. Access pre-evaluated candidate data with audio and video validation trails."
              },
              {
                title: "Hire Faster",
                desc: "Run campaigns mapped to your exact requirements and get shortlists matching your criteria in 24 hours."
              }
            ].map((card, idx) => (
              <div key={idx} className="bg-white dark:bg-[#0A1211]/50 border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                <div className="h-10 w-10 bg-teal-50 dark:bg-white/5 rounded-lg flex items-center justify-center mb-5 text-[#0D9488]">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                  {card.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed font-medium">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Segment */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto border-t border-gray-150 dark:border-white/5 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">Enterprise Hiring Plans</span>
          <h2 className="font-display mt-3 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Campus Hiring Solutions
          </h2>
          <p className="mt-4 text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-12">
            Pricing plans are tailored to your annual volume and customization needs. Connect with our team to secure sandbox access.
          </p>

          <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-black/10 p-8 max-w-lg mx-auto text-left relative overflow-hidden">
            <span className="text-xs font-bold text-[#0D9488] uppercase tracking-wider">Campus Hiring Plans</span>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-2 mb-4">Contact Us For Pricing</p>
            <ul className="space-y-3 text-xs text-gray-500 dark:text-slate-300 font-medium mb-8">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> API Access to Bridge Score database</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Dedicated campus hiring drives dashboard</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Custom branding and role-specific threshold setups</li>
            </ul>
            <a href="#inquiry" className="block text-center rounded-xl bg-[#0D524C] hover:bg-[#0A3D36] py-3 text-xs font-bold text-white shadow-md cursor-pointer transition-colors">
              Talk To Sales / Book Demo &rarr;
            </a>
          </div>
        </section>

        {/* Recruiter Inquiry Form Section */}
        <section id="inquiry" className="py-20 px-4 sm:px-6 lg:px-8 max-w-[650px] mx-auto border-t border-gray-150 dark:border-white/5">
          <div className="bg-white dark:bg-[#0A1211]/50 border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-sm">
            <h2 className="font-display text-2xl font-extrabold text-gray-900 dark:text-white text-center mb-2">
              Recruiter Inquiry Form
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 text-center mb-8 leading-relaxed">
              Connect with our corporate team to request verified candidates, API sandbox credentials, or custom corporate hiring setups.
            </p>

            {submitted ? (
              <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-6 text-center">
                <span className="text-3xl">🎉</span>
                <h3 className="font-display text-lg font-bold text-white mt-3 mb-1">Corporate Request Received</h3>
                <p className="text-xs text-emerald-400 font-medium">Our corporate accounts team will coordinate details with you within 12 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Your Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-[#0D9488]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Corporate Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="hiring@company.com"
                      className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-[#0D9488]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 99999 88888"
                      className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-[#0D9488]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Company Name</label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Fintech Global Inc."
                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-[#0D9488]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Primary Roles to Hire</label>
                  <select
                    value={formData.roles}
                    onChange={(e) => setFormData({ ...formData, roles: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm outline-none focus:border-[#0D9488]"
                  >
                    <option value="Tech">Software Engineers (SDE)</option>
                    <option value="Product">Product Management (PM)</option>
                    <option value="Consulting">Strategy & Case Consultants</option>
                    <option value="Multiple">Multiple Domain Roles</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#0D524C] hover:bg-[#0A3D36] py-3 text-sm font-bold text-white shadow-md cursor-pointer transition-all mt-4 disabled:opacity-50"
                >
                  {loading ? "Submitting Request..." : "Request Recruiter Access \u2192"}
                </button>
              </form>
            )}
          </div>
        </section>

        <FooterCTA />
      </main>
    </div>
  );
}
