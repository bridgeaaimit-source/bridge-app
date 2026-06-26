'use client';

import { useEffect, useState } from 'react';

/**
 * AnalysisLoader
 * 
 * Immersive full-screen overlay during GD evaluation.
 * Cycles through 4 evaluation steps:
 * 1. Extracting transcripts & speaker statistics
 * 2. Evaluating voice clarity & speech parameters
 * 3. Analyzing logic flow, active listening, and argument quality
 * 4. Synthesizing recruiter feedback & custom growth exercises
 * 
 * Props:
 *   isOpen  boolean — whether the loader is visible
 */
export default function AnalysisLoader({ isOpen = false }) {
  const steps = [
    { title: 'Processing GD Transcript', desc: 'Reconstructing conversational turns and mapping speaker timeline...' },
    { title: 'Assessing Core Soft Skills', desc: 'Analyzing confidence levels, active listening, and articulation clarity...' },
    { title: 'Evaluating Leadership & Structuring', desc: 'Scoring argument framing, debate balance, and cooperative cues...' },
    { title: 'Generating Personalized Report', desc: 'Crafting custom practice exercises and action items...' },
  ];

  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    // Reset state
    setActiveStep(0);
    setProgress(0);

    // Slowly increment progress bar (takes ~30-40 seconds to fill if evaluation is slow)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 98) return 98; // Hold at 98% until finished
        return prev + 1;
      });
    }, 350);

    // Cycle through steps based on estimated progress
    const stepInterval = setInterval(() => {
      setActiveStep(prev => {
        if (prev >= steps.length - 1) return steps.length - 1;
        return prev + 1;
      });
    }, 6000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-100/50 flex flex-col items-center text-center">
        {/* Animated brain/assessment visual */}
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full bg-teal-500/10 animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-2 rounded-full bg-teal-500/20 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-teal-600 flex items-center justify-center text-white shadow-lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8 animate-pulse">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
        </div>

        {/* Header */}
        <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Analyzing GD Performance</h2>
        <p className="text-sm text-slate-400 max-w-sm mb-8">
          Our AI recruiter engine is parsing your inputs. This takes up to 30 seconds.
        </p>

        {/* Progress Bar & Numeric Indicator */}
        <div className="w-full mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">Assessment Pipeline</span>
            <span className="text-sm font-extrabold text-slate-700">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-teal-500 h-full rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Pipeline Step List */}
        <div className="w-full text-left space-y-4">
          {steps.map((step, idx) => {
            const isActive = idx === activeStep;
            const isCompleted = idx < activeStep;

            return (
              <div 
                key={idx} 
                className={`flex gap-4 p-3 rounded-2xl border transition-all duration-300 ${
                  isActive 
                    ? 'bg-teal-50/50 border-teal-200 shadow-sm' 
                    : isCompleted 
                      ? 'border-slate-100 opacity-60' 
                      : 'border-transparent opacity-40'
                }`}
              >
                {/* Step number indicator */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  isActive 
                    ? 'bg-teal-500 text-white' 
                    : isCompleted 
                      ? 'bg-teal-100 text-teal-700' 
                      : 'bg-slate-100 text-slate-400'
                }`}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                
                <div className="space-y-0.5">
                  <h4 className={`text-sm font-bold leading-tight ${isActive ? 'text-teal-900' : 'text-slate-700'}`}>
                    {step.title}
                  </h4>
                  {isActive && (
                    <p className="text-xs text-teal-700/80 leading-relaxed animate-fade-in">
                      {step.desc}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
