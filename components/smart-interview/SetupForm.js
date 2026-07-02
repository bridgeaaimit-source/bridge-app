"use client";

import React, { useState, useRef } from 'react';
import { useInterviewState, useInterviewDispatch } from '@/context/InterviewContext';
import { 
  Upload, 
  CheckCircle, 
  FileText, 
  Mic, 
  Play, 
  History, 
  Sliders, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Award,
  Video
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { Button, Input, Textarea, ProgressBar } from '@/components/DesignSystem';

export default function SetupForm({ startInterview, loadFeedbackHistory, handleResumeUpload, loading }) {
  const state = useInterviewState();
  const dispatch = useInterviewDispatch();
  const fileInputRef = useRef(null);
  
  const [step, setStep] = useState(1);
  const [difficulty, setDifficulty] = useState('Intermediate'); // local UX choice

  const resumeFileName = state.config.resumeFileName;
  const jobRole = state.config.jobRole;
  const jobDescription = state.config.jobDescription;
  const startError = state.error;

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const isStep1Valid = !!state.config.round;
  const isStep2Valid = !!state.config.mode;
  const isStep3Valid = !!state.config.resumeBase64 && !!state.config.jobRole;

  return (
    <AppShell>

      <div className="relative max-w-[1240px] mx-auto px-6 py-8 z-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 border-b border-slate-100 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Smart Interview</h1>
            <p className="text-slate-500 text-sm mt-1">Placement Readiness Flagship Experience</p>
          </div>
          <Button
            variant="outline"
            onClick={loadFeedbackHistory}
            className="self-start sm:self-center"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>View History</span>
          </Button>
        </div>

        {/* Wizard Progress Bar */}
        <div className="mb-10 space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-400 tracking-wider">
            <span>STEP {step} OF 4</span>
          <span className="text-[#00C4A7]">{step === 1 ? 'ROUND TYPE' : step === 2 ? 'PARAMETERS' : step === 3 ? 'BASE MATERIAL' : 'LAUNCH BRIEF'}</span>
          </div>
          <ProgressBar progress={(step / 4) * 100} />
        </div>

        {/* Error message */}
        {startError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center text-red-600 shrink-0 text-xs font-bold">!</div>
            <div>
              <p className="text-red-600 text-sm font-semibold">{startError}</p>
              <button onClick={() => dispatch({ type: 'SET_ERROR', payload: '' })} className="text-red-400 hover:text-red-500 text-xs mt-1 font-semibold underline">Dismiss</button>
            </div>
          </div>
        )}

        {/* ── STEP 1: CHOOSE INTERVIEW TYPE ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Choose Round Focus</h2>
              <p className="text-slate-500 text-sm mt-1">Select the interview focus area you want to benchmark.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { r: 'Technical Round', title: 'Technical Interview', desc: 'Assess coding speed, system design tradeoffs, and fundamental algorithms.' },
                { r: 'HR Round', title: 'HR & Behavioral', desc: 'Evaluate communication, STAR scenario formatting, and cultural alignment.' },
                { r: 'Managerial Round', title: 'Managerial Round', desc: 'Assess situational logic, conflict resolution, and technical leadership.' },
                { r: 'Final Round', title: 'Executive Placement Mock', desc: 'Comprehensive panel emulation designed for top tier company hiring filters.' }
              ].map((item) => (
                <div 
                  key={item.r}
                  onClick={() => dispatch({ type: 'SET_CONFIG', payload: { round: item.r } })}
                  className={`bg-white/70 backdrop-blur-md border border-white/30 rounded-3xl p-6 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 ${
                    state.config.round === item.r 
                      ? 'border-[#00C4A7] ring-2 ring-[#00C4A7]/10 bg-white/90' 
                      : 'border-slate-100 hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-800 text-base">{item.title}</h3>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      state.config.round === item.r ? 'border-[#00C4A7] bg-[#00C4A7] text-white' : 'border-slate-200 bg-white'
                    }`}>
                      {state.config.round === item.r && "✓"}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2.5 leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button disabled={!isStep1Valid} onClick={nextStep} variant="teal">
                <span>Continue Parameters</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: SELECT DIFFICULTY & MODE ── */}
        {step === 2 && (
          <div className="space-y-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Select Difficulty Level</h2>
                <p className="text-slate-500 text-sm mt-1">Calibrate the questions complexity to match your current target.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { d: 'Beginner', desc: 'Basic terms, syntax, loops, core values. (+10 Bridge score impact)' },
                  { d: 'Intermediate', desc: 'Standard DSA, frameworks, scenarios. (+25 Bridge score impact)' },
                  { d: 'Placement Ready', desc: 'Complex problem-solving, scale, STAR formats. (+40 Bridge score impact)' }
                ].map((item) => (
                  <div 
                    key={item.d}
                    onClick={() => setDifficulty(item.d)}
                    className={`bg-white/70 backdrop-blur-md border border-white/30 rounded-3xl p-5 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 ${
                      difficulty === item.d 
                        ? 'border-[#6366F1] ring-2 ring-[#6366F1]/10 bg-white/90' 
                        : 'border-slate-100 hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700">{item.d}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        difficulty === item.d ? 'border-[#6366F1] bg-[#6366F1] text-white' : 'border-slate-200 bg-white'
                      }`}>
                        {difficulty === item.d && "✓"}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6 pt-4 border-t border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Practice Mode</h2>
                <p className="text-slate-500 text-sm mt-1">Choose whether to enable video recording alongside voice inputs.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { m: 'voice', label: 'Voice Only', desc: 'Hands-free audio transcription.', icon: Mic },
                  { m: 'video', label: 'Video & Voice', desc: 'Assess body language & visual responses.', icon: Video }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div 
                      key={item.m}
                      onClick={() => dispatch({ type: 'SET_CONFIG', payload: { mode: item.m } })}
                      className={`bg-white/70 backdrop-blur-md border border-white/30 rounded-3xl p-5 cursor-pointer flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-300 ${
                        state.config.mode === item.m 
                          ? 'border-[#00C4A7] ring-2 ring-[#00C4A7]/10 bg-white/90' 
                          : 'border-slate-100 hover:-translate-y-0.5'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${
                        state.config.mode === item.m ? 'bg-[#00C4A7] text-white' : 'bg-slate-50 text-slate-500'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="font-extrabold text-slate-800 text-sm block">{item.label}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block font-semibold">{item.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-slate-100">
              <Button onClick={prevStep} variant="outline">
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
              <Button disabled={!isStep2Valid} onClick={nextStep} variant="teal">
                <span>Continue Base Material</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: BASE MATERIAL ── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Upload Target Base Material</h2>
              <p className="text-slate-550 text-sm mt-1">We tailor questions dynamically to your resume claims and target job requirements.</p>
            </div>

            {/* Resume Upload Box */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase">RESUME (PDF, DOCX)</label>
              <label htmlFor="resume-upload" className={`relative bg-white/60 backdrop-blur-sm border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group shadow-sm ${
                state.config.resumeBase64 ? 'border-[#00C4A7] bg-[#00C4A7]/5' : 'border-slate-200 hover:border-[#00C4A7]/60'
              }`}>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors duration-300 ${
                  state.config.resumeBase64 ? 'bg-[#00C4A7] text-white' : 'bg-slate-50 text-slate-500 group-hover:bg-[#00C4A7] group-hover:text-white'
                }`}>
                  {resumeFileName ? <CheckCircle className="w-7 h-7" /> : <Upload className="w-7 h-7" />}
                </div>
                {resumeFileName ? (
                  <>
                    <p className="font-extrabold text-slate-800 text-sm">{resumeFileName}</p>
                    <p className="text-xs text-slate-400 mt-1.5 font-semibold">Click to replace file</p>
                  </>
                ) : (
                  <>
                    <p className="font-extrabold text-slate-800 text-sm">Upload your Resume</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed font-semibold">Drag & drop your PDF/DOCX here. Questions will adapt to your claims.</p>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="hidden" id="resume-upload" />
              </label>
            </div>

            {/* Role & JD inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase">TARGET JOB ROLE</label>
                <Input 
                  type="text"
                  value={jobRole}
                  onChange={(e) => dispatch({ type: 'SET_CONFIG', payload: { jobRole: e.target.value } })}
                  placeholder="e.g. Software Engineer, Marketing Analyst"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase">JOB DESCRIPTION (OPTIONAL)</label>
                <Input 
                  type="text"
                  value={jobDescription}
                  onChange={(e) => dispatch({ type: 'SET_CONFIG', payload: { jobDescription: e.target.value } })}
                  placeholder="e.g. Paste JD snippet or keywords"
                />
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-slate-100">
              <Button onClick={prevStep} variant="outline">
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
              <Button disabled={!isStep3Valid} onClick={nextStep} variant="teal">
                <span>Review AI Brief</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 4: LAUNCH BRIEF SUMMARY ── */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Confirm AI Interview Brief</h2>
              <p className="text-slate-500 text-sm mt-1">Review parameters and outcomes prior to session launch.</p>
            </div>

            <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-3xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-sm">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">INTERVIEW PROPERTIES</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-medium text-slate-500">
                    <span>Round Focus:</span>
                    <span className="font-bold text-slate-700">{state.config.round}</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium text-slate-500">
                    <span>Mode:</span>
                    <span className="font-bold text-slate-700 capitalize">{state.config.mode} & Voice</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium text-slate-500">
                    <span>Target Role:</span>
                    <span className="font-bold text-slate-700">{state.config.jobRole}</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium text-slate-500">
                    <span>Resume:</span>
                    <span className="font-bold text-slate-700">{resumeFileName}</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium text-slate-500">
                    <span>Difficulty:</span>
                    <span className="font-bold text-slate-700">{difficulty}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-200/80 pt-6 md:pt-0 md:pl-6">
                <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">SESSION BOUNDS</h3>
                <div className="space-y-3 text-xs text-slate-500 leading-relaxed">
                  <div className="flex justify-between">
                    <span>⏱️ Est. Duration:</span>
                    <span className="font-bold text-slate-700">15-20 Mins</span>
                  </div>
                  <div className="flex justify-between">
                    <span>📝 Questions Count:</span>
                    <span className="font-bold text-slate-700">8-12 Questions</span>
                  </div>
                  <div className="flex justify-between">
                    <span>⚡ Bridge Score Impact:</span>
                    <span className="font-extrabold text-[#00C4A7]">{difficulty === 'Beginner' ? '+10 Pts' : difficulty === 'Intermediate' ? '+25 Pts' : '+40 Pts'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 leading-normal">
                    This interview calculates real-time integrity alerts. Switching tabs or exiting fullscreen may negatively affect your evaluation metrics.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-slate-100">
              <Button onClick={prevStep} variant="outline">
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
              <Button 
                onClick={() => startInterview(false)} 
                disabled={loading}
                variant="teal"
                className="px-8 animate-pulse shadow-md"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Preparing Session...</>
                ) : (
                  <>Start Practice Interview <Sparkles className="w-4 h-4" /></>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
