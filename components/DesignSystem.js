"use client";

import React from 'react';

// Typography Classes Map for reference
export const typography = {
  display: "font-extrabold tracking-tight text-5xl md:text-6xl text-slate-900",
  h1: "font-bold tracking-tight text-3xl md:text-4xl text-slate-900",
  h2: "font-semibold text-xl md:text-2xl text-slate-900",
  h3: "font-medium text-lg text-slate-800",
  body: "font-normal text-sm md:text-base text-slate-600 leading-relaxed",
  caption: "font-medium text-xs text-slate-400"
};

// ─── LAYOUT PRIMITIVES ───

export function Canvas({ children, className = "" }) {
  return (
    <div className={`min-h-screen bg-white text-slate-900 ${className}`}>
      {children}
    </div>
  );
}

export function SubtlePanel({ children, className = "" }) {
  return (
    <div className={`bg-[#F8FAFC] border border-slate-200/60 rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );
}

export function Card({ children, className = "", onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:translate-y-[-2px]' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

// ─── INTERACTIVE PRIMITIVES ───

export function Button({ 
  children, 
  variant = "teal", 
  onClick, 
  disabled = false, 
  className = "", 
  type = "button" 
}) {
  const baseStyle = "active:scale-[0.98] transition-all px-5 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 select-none disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    teal: "bg-[#14B8A6] text-white hover:bg-[#0D9488]",
    cyan: "bg-[#06B6D4] text-white hover:bg-[#0891B2]",
    indigo: "bg-[#6366F1] text-white hover:bg-[#4F46E5]",
    outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    red: "bg-[#EF4444] text-white hover:bg-[#DC2626]",
    ghost: "text-slate-600 hover:bg-slate-50"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant] || variants.teal} ${className}`}
    >
      {children}
    </button>
  );
}

export function Input({ className = "", ...props }) {
  return (
    <input 
      className={`w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent transition-all placeholder-slate-400 ${className}`}
      {...props}
    />
  );
}

export function Select({ children, className = "", ...props }) {
  return (
    <select 
      className={`w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent transition-all ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className = "", ...props }) {
  return (
    <textarea 
      className={`w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent transition-all placeholder-slate-400 resize-none ${className}`}
      {...props}
    />
  );
}

// ─── PROGRESS & INDICATORS ───

export function ProgressBar({ progress }) {
  const boundedProgress = Math.max(0, Math.min(100, progress));
  return (
    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] transition-all duration-500 ease-out" 
        style={{ width: `${boundedProgress}%` }}
      />
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse bg-slate-100 rounded-xl ${className}`} />
  );
}

// ─── PREMIUM SVG ILLUSTRATIONS & ICONOGRAPHY ───

export function HouseIcon({ className = "w-6 h-6" }) {
  return <img src="/images/icons/house.png" alt="Home" className={className} />;
}

export function SmartInterviewIcon({ className = "w-6 h-6" }) {
  return <img src="/images/icons/videoconference.png" alt="Smart Interview" className={className} />;
}

export function GDPulseIcon({ className = "w-6 h-6" }) {
  return <img src="/images/icons/user-three.png" alt="GD Pulse" className={className} />;
}

export function NewspaperClippingIcon({ className = "w-6 h-6" }) {
  return <img src="/images/icons/newspaper-clipping.png" alt="News Pulse" className={className} />;
}

export function AptitudeArenaIcon({ className = "w-6 h-6" }) {
  return <img src="/images/icons/pencil-circle.png" alt="Aptitude Arena" className={className} />;
}

export function CareerIntelligenceIcon({ className = "w-6 h-6" }) {
  return <img src="/images/icons/head-circuit.png" alt="Career Intelligence" className={className} />;
}

export function JobsIcon({ className = "w-6 h-6" }) {
  return <img src="/images/icons/briefcase.png" alt="Jobs" className={className} />;
}

export function RecruitersIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function PlacementReadinessIcon({ className = "w-6 h-6" }) {
  return <img src="/images/icons/compass.png" alt="Career GPS" className={className} />;
}

export function BridgeScoreIcon({ className = "w-6 h-6" }) {
  return <img src="/images/icons/chart-bar.png" alt="Bridge Score" className={className} />;
}

export function StreakIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

export function TrophyIcon({ className = "w-6 h-6" }) {
  return <img src="/images/icons/trophy.png" alt="Leaderboard" className={className} />;
}

export function UserIcon({ className = "w-6 h-6" }) {
  return <img src="/images/icons/user.png" alt="Profile" className={className} />;
}

export function TargetIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export function StarIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function ClockIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function ShieldIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export function CheckCircleIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export function ArrowRightIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function ArrowUpRightIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

export function ArrowDownRightIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="7" x2="17" y2="17" />
      <polyline points="17 7 17 17 7 17" />
    </svg>
  );
}

export function SparklesIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5 5 3Z" opacity="0.6" />
      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" opacity="0.6" />
    </svg>
  );
}
