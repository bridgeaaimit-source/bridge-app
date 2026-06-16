"use client";

import { useState, useRef } from "react";
import { m } from "framer-motion";
import { Video, Users, FileText, Compass, Award, BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";

const STACK_ITEMS = [
  {
    title: "AI Mock Interviews",
    benefit: "Practice role-specific voice & video interviews with real-time feedback.",
    icon: <Video className="h-6 w-6 text-teal-400" />,
    link: "/students#interviews",
    color: "from-teal-500/20 to-teal-500/5",
    glow: "rgba(20, 184, 166, 0.15)",
  },
  {
    title: "GD Practice & GD Battles",
    benefit: "Engage in AI-moderated group discussions with friends or live peer groups.",
    icon: <Users className="h-6 w-6 text-indigo-400" />,
    link: "/students#gd",
    color: "from-indigo-500/20 to-indigo-500/5",
    glow: "rgba(99, 102, 241, 0.15)",
  },
  {
    title: "Resume Intelligence",
    benefit: "Get instant keyword optimizations and recruiter-grade ATS scoring.",
    icon: <FileText className="h-6 w-6 text-emerald-400" />,
    link: "/students#resume",
    color: "from-emerald-500/20 to-emerald-500/5",
    glow: "rgba(16, 185, 129, 0.15)",
  },
  {
    title: "Career Intelligence",
    benefit: "Map personalized week-by-week placement roadmaps tailored to roles.",
    icon: <Compass className="h-6 w-6 text-sky-400" />,
    link: "/students#career",
    color: "from-sky-500/20 to-sky-500/5",
    glow: "rgba(56, 189, 248, 0.15)",
  },
  {
    title: "Aptitude Assessments",
    benefit: "Benchmark quantitative, verbal, and analytical skill readiness levels.",
    icon: <BookOpen className="h-6 w-6 text-amber-400" />,
    link: "/students#aptitude",
    color: "from-amber-500/20 to-amber-500/5",
    glow: "rgba(245, 158, 11, 0.15)",
  },
  {
    title: "Bridge Score",
    benefit: "Get a verified, single-score readiness credential trusted by top employers.",
    icon: <Award className="h-6 w-6 text-violet-400" />,
    link: "/#bridge-score",
    color: "from-violet-500/20 to-violet-500/5",
    glow: "rgba(139, 92, 246, 0.15)",
  },
];

function StackCard({ item, idx }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <m.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: idx * 0.08, ease: "easeOut" }}
      className="relative rounded-2xl bg-white dark:bg-[#0A1211]/50 backdrop-blur-md border border-gray-200 dark:border-white/5 p-6 flex flex-col justify-between group overflow-hidden transition-all duration-300 shadow-sm dark:shadow-none hover:border-teal-500/30 dark:hover:border-teal-400/20"
    >
      {/* Spotlight highlight */}
      <m.div
        className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        style={{
          background: `radial-gradient(circle 220px at ${mousePosition.x}px ${mousePosition.y}px, ${item.glow}, transparent 85%)`,
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* Premium Icon Wrapper */}
        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300`}>
          {item.icon}
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
          {item.title}
        </h3>

        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 font-medium leading-relaxed flex-grow">
          {item.benefit}
        </p>

        <Link
          href={item.link}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D9488] dark:text-[#2DD4BF] group-hover:gap-2.5 transition-all duration-200 mt-auto cursor-pointer"
        >
          Learn More <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </m.div>
  );
}

export default function ReadinessStack() {
  return (
    <section className="relative py-20 bg-transparent overflow-hidden">
      {/* Background soft grids/effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16 text-center mx-auto">
          <m.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-[#0D9488] dark:text-teal-300 text-[11px] font-bold uppercase tracking-wider mb-5"
          >
            All-In-One Platform
          </m.span>
          
          <m.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none"
          >
            Everything You Need To Become <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0D9488] to-teal-500 dark:from-teal-400 dark:to-teal-300">
              Placement Ready
            </span>
          </m.h2>
          
          <m.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-base text-gray-500 dark:text-slate-300 max-w-xl mx-auto font-medium leading-relaxed"
          >
            Stop switching between disjointed prep tools. BridgeAI integrates mock interviews, collaborative group discussions, and score credentials into one seamless platform.
          </m.p>
        </div>

        {/* 6-Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {STACK_ITEMS.map((item, idx) => (
            <StackCard key={idx} item={item} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
