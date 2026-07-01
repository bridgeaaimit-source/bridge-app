"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/landing-v2/Navbar";
import FooterCTA from "@/components/landing-v2/FooterCTA";
import AnimatedBackground from "@/components/landing-v2/AnimatedBackground";
import { m } from "framer-motion";
import { Shield, BarChart3, Users, ArrowRight } from "lucide-react";

export default function CollegesPage() {
  useEffect(() => {
    document.title = "BridgeAI — Placement Readiness Analytics for Colleges";
  }, []);

  // Form State
  const [formData, setFormData] = useState({ name: "", email: "", college: "", phone: "", size: "100-500" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/send-demo-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, type: "college" }),
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
            For Institutions & TPOs
          </m.span>
          
          <m.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display text-4xl sm:text-5xl lg:text-7xl font-black text-gray-900 dark:text-white leading-[1.08] tracking-tight"
          >
            Empower Your Campus. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0D9488] to-teal-500 dark:from-teal-400 dark:to-teal-300">
              Maximize Placement Success.
            </span>
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-base sm:text-lg text-gray-600 dark:text-slate-300 max-w-xl mx-auto font-medium leading-relaxed"
          >
            Monitor student placement readiness metrics, scale automated mock interview campaigns, and drive recruiter connections with India&apos;s primary TPO analytics cockpit.
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-8 flex flex-wrap justify-center gap-4"
          >
            <a href="#demo" className="cursor-pointer">
              <m.span
                className="inline-flex items-center gap-2 rounded-xl bg-[#0D524C] px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-[#0A3D36]"
                whileHover={{ scale: 1.02, y: -0.5 }}
                whileTap={{ scale: 0.98 }}
              >
                Book Demo <ArrowRight className="h-4 w-4" />
              </m.span>
            </a>
          </m.div>
        </section>

        {/* Core Features */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto border-t border-gray-150 dark:border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <BarChart3 className="h-6 w-6 text-teal-400" />,
                title: "Placement Analytics Dashboard",
                desc: "Monitor student metrics across structured thinking, communication stability, and domain mock scores at a department-wide level."
              },
              {
                icon: <Users className="h-6 w-6 text-indigo-400" />,
                title: "Mock Interview Campaigns",
                desc: "Instantly launch batch-level placement mock interview drives. Customize behavioral and technical thresholds with a click."
              },
              {
                icon: <Shield className="h-6 w-6 text-emerald-400" />,
                title: "Recruiter Pipeline Exposure",
                desc: "Promote pre-vetted students based on secure, validated Bridge Scores directly to partner companies looking for active talent."
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white dark:bg-[#0A1211]/50 border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                <div className="h-12 w-12 rounded-xl bg-teal-50 dark:bg-white/5 flex items-center justify-center mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                  {feature.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed font-medium">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How We Help Campuses Section */}
        <section id="how-we-help" className="py-20 px-4 sm:px-6 lg:px-8 max-w-[1000px] mx-auto border-t border-gray-150 dark:border-white/5">
          <div className="bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden text-center">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-500 to-[#0D9488]" />
            
            <div className="max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1 bg-teal-500/10 border border-teal-500/25 px-2.5 py-1 rounded-full text-[10px] font-bold text-[#0D9488] dark:text-teal-400 tracking-wide">
                Supporting Campus Placements
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-3">
                How We Empower Institutions & Training Cells
              </h2>
              <p className="text-sm text-gray-600 dark:text-slate-300 mt-6 leading-relaxed font-medium">
                BridgeAI bridges the gap between academic preparation and real-world corporate expectations. We partner with institutions to provide automated, campus-wide mock interview campaigns, diagnostic aptitude assessments, and interactive group discussion simulations. By equipping training and placement cells with comprehensive competency dashboards, we enable colleges to identify skill gaps early, run targeted training, and secure better corporate opportunities for every student.
              </p>
            </div>
          </div>
        </section>

        {/* Demo Booking Form Section */}
        <section id="demo" className="py-20 px-4 sm:px-6 lg:px-8 max-w-[650px] mx-auto border-t border-gray-150 dark:border-white/5">
          <div className="bg-white dark:bg-[#0A1211]/50 border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-sm">
            <h2 className="font-display text-2xl font-extrabold text-gray-900 dark:text-white text-center mb-2">
              Book Placement Readiness Demo
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 text-center mb-8 leading-relaxed">
              Schedule a private walkthrough with our sales team and learn how to run institutional mock campaigns for your campus.
            </p>

            {submitted ? (
              <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-6 text-center">
                <span className="text-3xl">🎉</span>
                <h3 className="font-display text-lg font-bold text-white mt-3 mb-1">Inquiry Submitted Successfully</h3>
                <p className="text-xs text-emerald-400 font-medium">Our enterprise team will reach out to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Contact Person Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Prof. Rajesh Sharma"
                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-[#0D9488]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Official Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="tpo@college.edu.in"
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
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-[#0D9488]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">College / University Name</label>
                  <input
                    type="text"
                    required
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    placeholder="Institute of Technology"
                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-[#0D9488]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Estimated Batch Size</label>
                  <select
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm outline-none focus:border-[#0D9488]"
                  >
                    <option value="Under 100">Under 100 Students</option>
                    <option value="100-500">100 to 500 Students</option>
                    <option value="500-1000">500 to 1000 Students</option>
                    <option value="1000+">1000+ Students</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#0D524C] hover:bg-[#0A3D36] py-3 text-sm font-bold text-white shadow-md cursor-pointer transition-all mt-4 disabled:opacity-50"
                >
                  {loading ? "Submitting Request..." : "Book Demo Now \u2192"}
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
