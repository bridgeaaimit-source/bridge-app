"use client";

import React, { useRef } from 'react';
import { useInterviewState, useInterviewDispatch } from '@/context/InterviewContext';
import { Upload, CheckCircle, FileText, Mic, Play, History, Lightbulb } from 'lucide-react';
import AppShell from '@/components/AppShell';

export default function SetupForm({ startInterview, loadFeedbackHistory, handleResumeUpload, loading }) {
  const state = useInterviewState();
  const dispatch = useInterviewDispatch();
  const fileInputRef = useRef(null);
  const resumeFileName = state.config.resumeFileName;
  const jobRole = state.config.jobRole;
  const jobDescription = state.config.jobDescription;
  const startError = state.error;

  return (
      <AppShell>
        <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-6 md:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Smart Interview</h1>
              <p className="text-gray-600 mt-1">Personalized based on your resume & job description</p>
            </div>
            <button
              onClick={loadFeedbackHistory}
              className="flex items-center gap-2 px-4 py-2 bg-[#0D9488] text-white rounded-lg hover:bg-[#0F766E] transition-colors"
            >
              <History className="w-5 h-5" />
              View History
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Setup form */}
              <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(13,148,136,0.08)] border border-gray-100 overflow-hidden">
                <div className="bg-[#CCFBF1] px-6 py-4">
                  <h2 className="font-bold text-[#0D9488] flex items-center gap-2" style={{fontFamily:'Syne,sans-serif'}}>
                    <Upload className="w-5 h-5" /> Base Material
                  </h2>
                </div>
                <div className="p-6">
                  <label htmlFor="resume-upload" className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group ${
                    state.config.resumeFileName ? 'border-[#0D9488] bg-[#F0FDFA]' : 'border-[#CCFBF1] hover:border-[#0D9488] bg-[#F0FDFA]/50'
                  }`}>
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors ${
                      state.config.resumeFileName ? 'bg-[#0D9488] text-white' : 'bg-[#CCFBF1] text-[#0D9488] group-hover:bg-[#0D9488] group-hover:text-white'
                    }`}>
                      {resumeFileName ? <CheckCircle className="w-7 h-7" /> : <Upload className="w-7 h-7" />}
                    </div>
                    {resumeFileName ? (
                      <>
                        <p className="font-bold text-[#0D9488] text-sm">{resumeFileName}</p>
                        <p className="text-xs text-gray-400 mt-1">Click to replace</p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-gray-700 mb-1">Upload your Resume</p>
                        <p className="text-sm text-gray-400 max-w-xs">Drag & drop your PDF or DOCX here. {"We'll"} tailor questions to your experience.</p>
                      </>
                    )}
                    <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="hidden" id="resume-upload" />
                  </label>
                </div>

              <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(13,148,136,0.08)] border border-gray-100 overflow-hidden">
                <div className="bg-[#CCFBF1] px-6 py-4">
                  <h2 className="font-bold text-[#0D9488] flex items-center gap-2" style={{fontFamily:'Syne,sans-serif'}}>
                    <FileText className="w-5 h-5" /> Interview Parameters
                  </h2>
                </div>
                <div className="p-6 flex flex-col gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Job Role</label>
                      <input
                        type="text"
                        value={jobRole}
                        onChange={(e) => dispatch({ type: 'SET_CONFIG', payload: { jobRole: e.target.value } })}
                        placeholder="e.g. Software Engineer, Product Manager"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Job Description (Optional)</label>
                      <input type="text" value={jobDescription} onChange={(e) => dispatch({ type: 'SET_CONFIG', payload: { jobDescription: e.target.value } })}
                        placeholder="Paste JD text snippet"
                        className="w-full bg-gray-50 border-2 border-[#CCFBF1] focus:border-[#0D9488] rounded-xl px-4 py-3 outline-none text-gray-800 text-sm transition-colors" />
                    </div>
                  </div>
                </div>

                {/* Interview Settings */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Interview Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Interview Round</label>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {['HR Round', 'Technical Round', 'Managerial Round', 'Final Round'].map((r) => (
                          <button
                            key={r}
                            onClick={() => dispatch({ type: 'SET_CONFIG', payload: { round: r } })}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              state.config.round === r
                                ? 'bg-[#F0FDFA] text-[#0D9488] font-semibold'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Practice Mode</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[{m:'voice',Icon:Mic,label:'Voice Only'},{m:'video',Icon:Play,label:'Video & Voice'}].map(({m,Icon,label}) => (
                        <button key={m} onClick={() => dispatch({ type: 'SET_CONFIG', payload: { mode: m } })}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                            state.config.mode === m ? 'border-[#0D9488] bg-[#F0FDFA] text-[#0D9488]' : 'border-[#CCFBF1] text-gray-400 hover:border-[#0D9488]/40'
                          }`}>
                          <Icon className="w-6 h-6" />
                          <span className="text-xs font-bold">{label}</span>
                        </button>
                      ))}
                      </div>
                    </div>
                  </div>
                </div>

              <div className="bg-[#F0FDFA] rounded-2xl p-6 border border-[#CCFBF1]">
                <p className="font-bold text-[#0D9488] mb-3 flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4" /> What to expect
                </p>
                <ul className="text-xs text-gray-600 space-y-1.5 mb-6">
                  <li>• AI asks 8–12 highly personalized questions</li>
                  <li>• Hands-free conversational speech flow</li>
                  <li>• Full scoring analysis and integrity rating provided</li>
                </ul>
                {startError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                    <p className="text-red-600 text-sm">❌ {startError}</p>
                    <button onClick={() => dispatch({ type: 'SET_ERROR', payload: '' })} className="text-red-400 text-xs mt-1">Dismiss</button>
                  </div>
                )}
                <button onClick={() => startInterview(false)} disabled={!state.config.resumeBase64 || !state.config.jobRole || loading}
                  className="w-full bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white py-4 rounded-2xl font-bold text-base hover:opacity-90 transition-opacity shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Preparing Interview…</> : <>Start Practice Interview <FileText className="w-4 h-4" /></>}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(13,148,136,0.08)] border border-gray-100">
                <h3 className="font-bold text-[#0D9488] mb-4 flex items-center gap-2" style={{fontFamily:'Syne,sans-serif'}}>
                  <Lightbulb className="w-5 h-5" /> Pacing & Pointers
                </h3>
                <div className="flex flex-col gap-3">
                  {[
                    {title:'STAR Method', body:'Structure answers using Situation, Task, Action, and Result.'},
                    {title:'Comprehension Time', body:'You get 5 seconds to think before the mic opens automatically.'},
                    {title:'Stay Focused', body:'Keep the tab active. Leaving the window will impact your integrity score.'},
                  ].map(({title,body}) => (
                    <div key={title} className="p-4 bg-[#F0FDFA] rounded-xl border border-[#CCFBF1]">
                      <p className="font-bold text-gray-800 text-sm mb-1">{title}</p>
                      <p className="text-xs text-gray-500">{body}</p>
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
}
