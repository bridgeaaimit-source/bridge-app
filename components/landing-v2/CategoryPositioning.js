"use client";

import { m, useScroll, useTransform  } from "framer-motion";
import { Activity, BrainCircuit, Shield } from "lucide-react";
import { useState, useRef } from "react";

const CARDS = [
  {
    title: "Communication Intelligence",
    icon: <Activity className="h-6 w-6 text-teal-300" />,
    description: "Analyze pacing, clarity, articulation, filler usage, executive presence, and verbal confidence.",
    color: "from-teal-500 to-emerald-500"
  },
  {
    title: "Structured Thinking",
    icon: <BrainCircuit className="h-6 w-6 text-sky-300" />,
    description: "Benchmark logical decomposition, MECE thinking, prioritization quality, and strategic reasoning.",
    color: "from-sky-500 to-indigo-500"
  },
  {
    title: "Leadership Composure",
    icon: <Shield className="h-6 w-6 text-violet-300" />,
    description: "Measure decision confidence, stakeholder empathy, persuasion quality, and pressure handling.",
    color: "from-violet-500 to-fuchsia-500"
  }
];

function Card({ card, idx }) {
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
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: idx * 0.15, ease: "easeOut" }}
      className="relative rounded-3xl bg-white dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 p-8 sm:p-10 flex flex-col group overflow-hidden cursor-default transition-colors shadow-sm dark:shadow-none"
    >
      {/* Dynamic Hover Spotlight */}
      <m.div
        className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        style={{
          background: `radial-gradient(circle 300px at ${mousePosition.x}px ${mousePosition.y}px, rgba(20, 184, 166, 0.12), transparent 80%)`,
        }}
      />

      <div className="relative z-10">
        <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-8 shadow-xl shadow-teal-900/10 dark:shadow-teal-900/20 group-hover:scale-110 transition-transform duration-500 ease-out`}>
          <div className="bg-white/80 dark:bg-black/40 h-[52px] w-[52px] rounded-xl flex items-center justify-center backdrop-blur-md">
            {card.icon}
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-teal-600 group-hover:to-teal-400 dark:group-hover:from-white dark:group-hover:to-teal-200 transition-all duration-300">
          {card.title}
        </h3>
        
        <p className="text-base font-medium text-gray-600 dark:text-slate-400 leading-relaxed group-hover:text-gray-900 dark:group-hover:text-slate-300 transition-colors duration-300">
          {card.description}
        </p>
      </div>
    </m.div>
  );
}

export default function CategoryPositioning() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 0.8, 0.3]);

  return (
    <section id="features" ref={containerRef} className="relative bg-transparent pt-32 pb-40 overflow-hidden border-b border-gray-200 dark:border-white/10 transition-colors">

      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-4xl mb-24 text-center mx-auto">
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-widest mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-teal-500 dark:bg-teal-400 animate-pulse" />
            Institutional Grade Analysis
          </m.div>
          
          <m.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="font-display text-4xl sm:text-5xl lg:text-7xl font-extrabold text-gray-900 dark:text-white leading-[1.05] tracking-tight"
          >
            Resumes can be polished.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0D9488] via-[#14B8A6] to-[#0D9488] dark:from-teal-400 dark:via-emerald-200 dark:to-teal-400 bg-300% animate-gradient">
              Readiness cannot be faked.
            </span>
          </m.h2>
          
          <m.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="mt-8 text-lg sm:text-xl text-gray-600 dark:text-slate-300 leading-relaxed font-medium max-w-2xl mx-auto"
          >
            BridgeAI creates measurable professional credibility using communication diagnostics, structured reasoning analysis, live case simulations, and recruiter-grade benchmarking.
          </m.p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {CARDS.map((card, idx) => (
            <Card key={idx} card={card} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}



