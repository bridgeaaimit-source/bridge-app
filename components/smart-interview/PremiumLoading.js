"use client";

import { useEffect, useState } from 'react';

// Animated checklist items — each streams in with a staggered delay
const ANALYSIS_ITEMS = [
  { id: 'communication',  label: 'Communication',       icon: '🗣️', delay: 600  },
  { id: 'technical',      label: 'Technical Accuracy',  icon: '💡', delay: 1400 },
  { id: 'confidence',     label: 'Confidence & Clarity', icon: '🎯', delay: 2200 },
  { id: 'structure',      label: 'Answer Structure',    icon: '📐', delay: 3000 },
  { id: 'resume',         label: 'Resume Relevance',    icon: '📄', delay: 3800 },
  { id: 'recruiter',      label: 'Recruiter Readiness', icon: '🏆', delay: 4600 },
];

export default function PremiumLoading() {
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [pulseIdx, setPulseIdx] = useState(0);

  // Sequentially check off each item
  useEffect(() => {
    const timers = ANALYSIS_ITEMS.map(({ id, delay }) =>
      setTimeout(() => {
        setCheckedItems(prev => new Set([...prev, id]));
      }, delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Animate the "currently processing" pulse across items
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseIdx(prev => (prev + 1) % ANALYSIS_ITEMS.length);
    }, 700);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      }}
    >
      {/* Background shimmer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #14B8A6 0%, transparent 70%)',
          }}
        />
        {/* Floating particles */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-teal-400 opacity-30"
            style={{
              left: `${10 + (i * 8) % 80}%`,
              top: `${15 + (i * 13) % 70}%`,
              animation: `float ${3 + (i % 3)}s ease-in-out ${i * 0.3}s infinite alternate`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          from { transform: translateY(0px) scale(1); opacity: 0.2; }
          to   { transform: translateY(-18px) scale(1.4); opacity: 0.6; }
        }
        @keyframes shimmer-check {
          0%   { box-shadow: 0 0 0 0 rgba(20,184,166,0.6); }
          70%  { box-shadow: 0 0 0 8px rgba(20,184,166,0); }
          100% { box-shadow: 0 0 0 0 rgba(20,184,166,0); }
        }
        @keyframes rotate-ring {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes check-pop {
          0%   { transform: scale(0.5); opacity: 0; }
          60%  { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        .anim-fade-up   { animation: fade-up 0.6s ease forwards; }
        .anim-check-pop { animation: check-pop 0.35s cubic-bezier(.18,.89,.32,1.28) forwards; }
      `}</style>

      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">

        {/* Central spinner ring */}
        <div className="relative w-24 h-24 mb-8">
          {/* Outer glow */}
          <div
            className="absolute inset-0 rounded-full opacity-30"
            style={{
              background: 'radial-gradient(circle, #14B8A6 0%, transparent 70%)',
              animation: 'shimmer-check 2s ease infinite',
            }}
          />
          {/* Spinning ring */}
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ animation: 'rotate-ring 1.6s linear infinite' }}
            viewBox="0 0 96 96"
          >
            <circle cx="48" cy="48" r="42" fill="none" stroke="#1e293b" strokeWidth="6" />
            <circle
              cx="48" cy="48" r="42" fill="none"
              stroke="url(#grad)" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="264" strokeDashoffset="200"
            />
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14B8A6" />
                <stop offset="100%" stopColor="#6366F1" />
              </linearGradient>
            </defs>
          </svg>
          {/* Brain icon */}
          <div className="absolute inset-0 flex items-center justify-center text-3xl">
            🧠
          </div>
        </div>

        {/* Headline */}
        <h2
          className="text-white text-2xl font-bold text-center mb-2 anim-fade-up"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          Analyzing your interview...
        </h2>
        <p
          className="text-slate-400 text-sm text-center mb-8 anim-fade-up px-4"
          style={{ animationDelay: '0.2s', opacity: 0 }}
        >
          Please wait while BridgeAI evaluates your interview performance and generates your personalized feedback. This may take a few moments.
        </p>

        {/* Analysis checklist */}
        <div className="w-full space-y-3">
          {ANALYSIS_ITEMS.map(({ id, label, icon }, idx) => {
            const isDone    = checkedItems.has(id);
            const isPulsing = !isDone && pulseIdx === idx;
            return (
              <div
                key={id}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-500"
                style={{
                  background: isDone
                    ? 'linear-gradient(135deg, rgba(20,184,166,0.15), rgba(99,102,241,0.08))'
                    : 'rgba(255,255,255,0.04)',
                  border: isDone
                    ? '1px solid rgba(20,184,166,0.35)'
                    : '1px solid rgba(255,255,255,0.06)',
                  transform: isDone ? 'translateX(0)' : isPulsing ? 'translateX(4px)' : 'none',
                }}
              >
                {/* Status indicator */}
                <div className="shrink-0 w-7 h-7 flex items-center justify-center">
                  {isDone ? (
                    <div
                      className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center anim-check-pop"
                      style={{ animation: 'shimmer-check 1.5s ease 0.1s 1, check-pop 0.35s cubic-bezier(.18,.89,.32,1.28) forwards' }}
                    >
                      <svg viewBox="0 0 14 14" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="2,7 5.5,10.5 12,3" />
                      </svg>
                    </div>
                  ) : isPulsing ? (
                    <div className="w-7 h-7 rounded-full border-2 border-teal-400 border-t-transparent flex items-center justify-center"
                      style={{ animation: 'rotate-ring 0.8s linear infinite' }}
                    >
                      <div className="w-2 h-2 rounded-full bg-teal-400" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full border-2 border-slate-700 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-slate-600" />
                    </div>
                  )}
                </div>

                {/* Icon + Label */}
                <span className="text-base leading-none">{icon}</span>
                <span className={`text-sm font-semibold transition-colors duration-300 ${isDone ? 'text-teal-300' : isPulsing ? 'text-slate-200' : 'text-slate-500'}`}>
                  {label}
                </span>

                {/* Done badge */}
                {isDone && (
                  <span className="ml-auto text-[10px] font-bold text-teal-400 uppercase tracking-wider anim-check-pop">
                    Analysed
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom info strip */}
        <p className="mt-8 text-xs text-slate-600 text-center">
          This usually takes 10–20 seconds. Please don&apos;t close this window.
        </p>
      </div>
    </div>
  );
}
