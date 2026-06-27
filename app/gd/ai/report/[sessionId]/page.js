'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { Canvas, Card, Button } from '@/components/DesignSystem';
import DimensionScore from '@/components/gd-ai/DimensionScore';
import { useAuthBypass } from '@/hooks/useAuthBypass';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function GDReportPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const sessionId = params?.sessionId;
  const { isBypassed, mockUser } = useAuthBypass();
  const [currentUser, setCurrentUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);

  // Resolve user
  useEffect(() => {
    if (isBypassed) {
      setCurrentUser(mockUser);
      return;
    }
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setCurrentUser(user);
    });
    return () => unsubscribe();
  }, [isBypassed, mockUser]);

  // Fetch session data once user is resolved
  useEffect(() => {
    if (!currentUser || !sessionId) return;

    const uid = currentUser.uid;
    setLoading(true);

    fetch(`/api/gd-ai/session?uid=${uid}&sessionId=${sessionId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Session fetch failed');
        return res.json();
      })
      .then((data) => {
        if (data.session) {
          setSession(data.session);
        } else {
          throw new Error('No session details found');
        }
      })
      .catch((err) => {
        console.error('Error fetching session:', err);
        // Fallback to local storage
        if (typeof window !== 'undefined') {
          try {
            const localSessions = JSON.parse(localStorage.getItem('local_gd_sessions') || '[]');
            const found = localSessions.find(s => s.sessionId === sessionId);
            if (found) {
              setSession(found);
              return;
            }
          } catch (e) {
            console.warn('Failed to parse local sessions on fallback:', e);
          }
        }
        toast.error('Failed to load evaluation details');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentUser, sessionId]);

  if (loading) {
    return (
      <Canvas>
        <AppShell>
          <div className="flex flex-col justify-center items-center py-20 min-h-[80vh] space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            <p className="text-sm text-slate-400 font-semibold">Loading practice report...</p>
          </div>
        </AppShell>
      </Canvas>
    );
  }

  if (!session) {
    return (
      <Canvas>
        <AppShell>
          <div className="max-w-md mx-auto py-20 text-center space-y-4">
            <div className="text-rose-500 text-5xl font-black">!</div>
            <h2 className="text-xl font-bold text-slate-800">Report Not Found</h2>
            <p className="text-xs text-slate-400 font-medium">
              We couldn't retrieve the details for this discussion practice.
            </p>
            <Link href="/gd/ai">
              <Button variant="teal">Back to Hub</Button>
            </Link>
          </div>
        </AppShell>
      </Canvas>
    );
  }

  const {
    topic,
    category,
    difficulty,
    durationSeconds = 600,
    overallScore = 0,
    summary = '',
    strongestMoment = '',
    growthArea = '',
    dimensions = {},
    overallAnalysis = {},
    transcript = [],
  } = session;

  const scoreColor = 
    overallScore >= 80 ? 'text-emerald-600 border-emerald-500' :
    overallScore >= 60 ? 'text-teal-600 border-teal-500' :
    overallScore >= 45 ? 'text-amber-600 border-amber-500' :
    'text-rose-600 border-rose-500';

  const formatDuration = (sec) => {
    const min = Math.floor(sec / 60);
    return `${min} minutes`;
  };

  const SPEAKER_NAMES = {
    moderator: 'Nalini (Moderator)',
    aggressive: 'Vikram',
    analytical: 'Rohan',
    contrarian: 'Anjali',
    balanced: 'Dev',
    student: 'You',
  };

  return (
    <Canvas>
      <AppShell>
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-10 min-h-screen space-y-8 bg-slate-50/20">
          
          {/* Back Navigation Bar */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <Link href="/gd/ai" className="text-xs font-bold text-teal-600 hover:underline">
                ← Back to GD Pulse Hub
              </Link>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight mt-2 truncate max-w-lg md:max-w-2xl">
                {topic}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded">
                  {category}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-600 px-2.5 py-0.5 rounded border border-teal-100">
                  {difficulty}
                </span>
                <span className="text-[10px] text-slate-400 font-medium ml-2">
                  Duration: {formatDuration(durationSeconds)}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
              >
                Print PDF
              </button>
            </div>
          </div>

          {/* Grid Overview: Score & Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Overall Score Gauge */}
            <Card className="flex flex-col items-center justify-center text-center p-8 border-slate-200/80">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-4">
                Overall GD Score
              </span>
              <div className={`w-36 h-36 rounded-full border-[10px] flex flex-col items-center justify-center shadow-inner ${scoreColor}`}>
                <span className="text-4xl font-black">{overallScore}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Scale 0-100</span>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-6 leading-relaxed">
                Benchmark based on recruiter criteria at Tier-1 hiring drives.
              </p>
            </Card>

            {/* AI Summary Assessment */}
            <Card className="lg:col-span-2 p-8 border-slate-200/80 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  Moderator Executive Summary
                </span>
                <p className="text-base text-slate-700 leading-relaxed font-medium italic">
                  "{summary}"
                </p>
              </div>

              {/* Strengths & Weaknesses quick tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6 mt-6">
                {overallAnalysis.topStrength && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Top Strength</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl block truncate border border-emerald-100">
                      ★ {overallAnalysis.topStrength}
                    </span>
                  </div>
                )}
                {overallAnalysis.topWeakness && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Growth Area</span>
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-xl block truncate border border-rose-100">
                      ⚠ {overallAnalysis.topWeakness}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Highlights: Strongest Moment & Growth Opportunity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strongest Moment */}
            <Card className="p-6 border-slate-200/80 bg-emerald-50/20 border-emerald-100 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">★</span>
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Strongest Contribution Moment</span>
                </div>
                <blockquote className="text-xs italic text-slate-600 border-l-2 border-emerald-500 pl-3 leading-relaxed py-0.5">
                  "{strongestMoment}"
                </blockquote>
              </div>
              <p className="text-[10px] text-emerald-700/80 font-bold tracking-wide mt-4">
                This statement was logic-dense, highly persuasive, and well received by the co-participants.
              </p>
            </Card>

            {/* Growth Area */}
            <Card className="p-6 border-slate-200/80 bg-rose-50/20 border-rose-100 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold">!</span>
                  <span className="text-xs font-bold text-rose-800 uppercase tracking-wide">Primary Obstacle for Improvement</span>
                </div>
                <p className="text-xs text-slate-600 border-l-2 border-rose-500 pl-3 leading-relaxed py-0.5 font-medium">
                  {growthArea}
                </p>
              </div>
              <p className="text-[10px] text-rose-700/80 font-bold tracking-wide mt-4">
                Prioritize practicing specific exercises relating to this dimension in your next session.
              </p>
            </Card>
          </div>

          {/* Action Items Interactive list */}
          {overallAnalysis.actionItems && overallAnalysis.actionItems.length > 0 && (
            <Card className="p-6 border-slate-200/80 space-y-4">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                Your Custom 3-Step Action Plan
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {overallAnalysis.actionItems.map((item, idx) => (
                  <div key={idx} className="bg-white border border-slate-150 rounded-2xl p-4 flex gap-3 shadow-sm hover:border-teal-500/20 transition-all duration-300">
                    <input 
                      type="checkbox" 
                      id={`chk-${idx}`} 
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 mt-0.5 cursor-pointer accent-teal-600" 
                    />
                    <label htmlFor={`chk-${idx}`} className="text-xs text-slate-600 leading-relaxed font-semibold cursor-pointer select-none">
                      {item}
                    </label>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 9 Dimensions feedback grid */}
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Recruiter Evaluation Dimensions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(dimensions).map(([dimId, dimData]) => (
                <DimensionScore key={dimId} dimensionId={dimId} data={dimData} />
              ))}
            </div>
          </div>

          {/* Accordion Chat Transcript */}
          <div className="space-y-4 border-t border-slate-100 pt-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Full Practice Transcript</h2>
                <p className="text-xs text-slate-400 font-semibold">Review the verbatim discussion flow of the chamber.</p>
              </div>
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="text-xs font-bold text-teal-600 hover:bg-teal-50 border border-teal-200 px-4 py-2 rounded-xl transition-all"
              >
                {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
              </button>
            </div>

            {showTranscript && (
              <Card className="p-6 border-slate-200/80 max-h-[500px] overflow-y-auto space-y-4 bg-slate-50/30">
                {transcript.map((t, idx) => {
                  const isStudent = t.speakerId === 'student';
                  const isMod = t.speakerId === 'moderator';
                  
                  return (
                    <div 
                      key={idx}
                      className={`flex gap-3 max-w-[85%] ${
                        isStudent ? 'ml-auto flex-row-reverse text-right' : 'mr-auto flex-row text-left'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            isStudent ? 'text-sky-700 bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded' : 
                            isMod ? 'text-teal-700 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded' :
                            'text-slate-600'
                          }`}>
                            {SPEAKER_NAMES[t.speakerId] || t.speakerName || t.speakerId}
                          </span>
                        </div>
                        <p className={`text-xs p-3.5 rounded-2xl leading-relaxed inline-block font-medium ${
                          isStudent ? 'bg-sky-50 text-sky-900 rounded-tr-none text-left' :
                          isMod ? 'bg-teal-50/50 text-teal-900 rounded-tl-none text-left' :
                          'bg-white border border-slate-200 text-slate-700 rounded-tl-none text-left'
                        }`}>
                          {t.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </Card>
            )}
          </div>

        </div>
      </AppShell>
    </Canvas>
  );
}
