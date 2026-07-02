'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { Canvas, Card, Button } from '@/components/DesignSystem';
import DimensionScore from '@/components/gd-ai/DimensionScore';
import { useAuthBypass } from '@/hooks/useAuthBypass';
import { auth, db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export default function GDReportPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const sessionId = params?.sessionId;
  const { isBypassed, mockUser } = useAuthBypass();
  const [currentUser, setCurrentUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  
  // Hardened states
  const [evaluating, setEvaluating] = useState(false);
  const [evalFailed, setEvalFailed] = useState(false);
  const [isCorrupted, setIsCorrupted] = useState(false);
  const [retryAttemptText, setRetryAttemptText] = useState('');

  // Bridge Score delta state
  const [bridgeScore, setBridgeScore] = useState(null);   // { current, previous, delta }
  const [bridgeScoreLoading, setBridgeScoreLoading] = useState(false);

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

  // Fetch session data and start polling if it is evaluating
  useEffect(() => {
    if (!currentUser || !sessionId) return;

    const uid = currentUser.uid;
    let pollInterval = null;

    const fetchSession = async (showLoader = true) => {
      if (showLoader) setLoading(true);
      try {
        console.log(`[GD][Report] [Session: ${sessionId}] Fetching session details from database.`);
        const startRead = performance.now();
        const res = await fetch(`/api/gd-ai/session?uid=${uid}&sessionId=${sessionId}`);
        if (!res.ok) throw new Error('Session fetch failed');
        const data = await res.json();
        const endRead = performance.now();
        console.log(`[GD][Report] [Session: ${sessionId}] Fetch took ${(endRead - startRead).toFixed(2)}ms.`);

        if (data.session) {
          setSession(data.session);
          
          const status = data.session.status;
          console.log(`[GD][Report] [Session: ${sessionId}] Session status loaded: ${status}`);

          if (status === 'EVALUATING') {
            setEvaluating(true);
            setEvalFailed(false);
            setIsCorrupted(false);
            if (!pollInterval) {
              console.log(`[GD][Report] [Session: ${sessionId}] Report still evaluating, starting database poller...`);
              pollInterval = setInterval(() => {
                fetchSession(false);
              }, 5000);
            }
          } else {
            // Stop polling once ready or failed
            if (pollInterval) {
              console.log(`[GD][Report] [Session: ${sessionId}] Poller finished. Status: ${status}`);
              clearInterval(pollInterval);
              pollInterval = null;
            }

            if (status === 'FAILED' || status === 'evaluation_failed') {
              setEvaluating(false);
              setEvalFailed(true);
            } else if (status === 'REPORT_READY') {
              setEvaluating(false);
              setEvalFailed(false);
              
              // Validate schema check — 5-dimension schema
              const requiredDims = ['communication', 'criticalThinking', 'leadershipCollaboration', 'persuasiveness', 'participationQuality'];
              const hasAllDims = data.session.dimensions && requiredDims.every(d => data.session.dimensions[d] && typeof data.session.dimensions[d].score === 'number');
              const hasAnalysis = data.session.overallAnalysis && typeof data.session.overallAnalysis.totalScore === 'number';
              if (!hasAllDims || !hasAnalysis) {
                console.error(`[GD][Report] [Session: ${sessionId}] Validation failed: report is corrupted.`);
                setIsCorrupted(true);
              } else {
                setIsCorrupted(false);
              }
            }
          }
        } else {
          throw new Error('No session details found in Firestore');
        }
      } catch (err) {
        console.warn(`[GD][Report] [Session: ${sessionId}] Failed to fetch from database, checking local storage backup.`, err.message);
        
        // Fallback to local storage
        if (typeof window !== 'undefined') {
          try {
            const localSessions = JSON.parse(localStorage.getItem('local_gd_sessions') || '[]');
            const found = localSessions.find(s => s.sessionId === sessionId);
            if (found) {
              setSession(found);
              if (found.status === 'FAILED' || found.status === 'evaluation_failed') {
                setEvaluating(false);
                setEvalFailed(true);
              } else {
                setEvaluating(false);
                setEvalFailed(false);
              }
              setLoading(false);
              return;
            }
          } catch (e) {
            console.warn('Failed to parse local sessions on fallback:', e);
          }
        }
        toast.error('Failed to load evaluation details');
        setSession(null);
      } finally {
        if (showLoader) setLoading(false);
      }
    };

    fetchSession(true);

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [currentUser, sessionId]);

  // Bridge Score poller — polls every 2.5s for up to 15s after report loads
  useEffect(() => {
    if (!currentUser || !session || session.status !== 'REPORT_READY') return;

    const uid = currentUser.uid;
    setBridgeScoreLoading(true);

    let attempts = 0;
    const MAX_ATTEMPTS = 6; // 6 × 2.5s = 15s
    let previousScore = null;

     const poll = async () => {
       try {
         const res = await fetch(`/api/bridge-score?userId=${uid}`);
         if (!res.ok) throw new Error('API failed');
         const data = await res.json();
         if (data.score !== null && data.score !== undefined) {
           if (previousScore === null) {
             // First fetch — this is the baseline (pre-refresh may already be updated)
             previousScore = data.score;
           }
           setBridgeScore({ current: data.score, previous: previousScore, delta: data.score - previousScore });
           setBridgeScoreLoading(false);
           clearInterval(poller);
           return;
         }
       } catch {
          // Fallback to Firestore user profile bridgeScore
          try {
            const userRef = doc(db, 'users', uid);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
              const userData = snap.data();
              let currentScoreVal = typeof userData.bridgeScore === 'number' ? userData.bridgeScore : parseInt(userData.bridgeScore) || 0;
              
              try {
                const scoresRef = collection(db, "users", uid, "bridge_scores");
                const scoreQuery = query(scoresRef, orderBy("createdAt", "desc"), limit(1));
                const scoreSnap = await getDocs(scoreQuery);
                if (!scoreSnap.empty) {
                  currentScoreVal = scoreSnap.docs[0].data().score || currentScoreVal;
                }
              } catch (err) {
                console.error("Error double-checking latest bridge score in GD Report:", err);
              }
              
              setBridgeScore({ current: currentScoreVal, previous: currentScoreVal, delta: 0 });
              setBridgeScoreLoading(false);
              clearInterval(poller);
              return;
            }
          } catch { /* silent */ }
       }
       attempts++;
       if (attempts >= MAX_ATTEMPTS) {
         clearInterval(poller);
         setBridgeScoreLoading(false); // hide loading state gracefully
       }
     };

    // Small initial delay to let the background refresh write complete first
    const poller = setInterval(poll, 2500);
    setTimeout(poll, 500); // first check at 0.5s

    return () => clearInterval(poller);
  }, [currentUser, session?.status]);

  // Trigger manual API retry from the saved transcript
  const handleRetryEvaluation = async () => {
    if (!session || !currentUser) return;

    setEvaluating(true);
    setEvalFailed(false);
    setIsCorrupted(false);
    setRetryAttemptText('Starting retry evaluation pipeline...');

    const sessId = session.sessionId;
    const uid = currentUser.uid;
    const safeTurns = session.turns || session.transcript || [];

    try {
      console.log(`[GD][Evaluation] [Session: ${sessId}] Manual report regeneration requested by user.`);
      const startRetryTotal = performance.now();
      
      // Update Firestore session status to 'EVALUATING'
      await fetch('/api/gd-ai/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: uid,
          sessionData: {
            sessionId: sessId,
            topic: session.topic,
            category: session.category,
            difficulty: session.difficulty,
            turns: safeTurns.map(t => ({
              speakerId: t.speakerId,
              speakerName: t.speakerName || t.personaName || t.speakerId,
              text: t.text,
              type: t.type || 'debate'
            })),
            durationSeconds: session.durationSeconds || 600,
            status: 'EVALUATING'
          }
        })
      });

      // API trigger retry (up to 3 times)
      const maxAttempts = 3;
      let attempt = 0;
      let evalSuccess = false;
      let data = null;

      while (attempt < maxAttempts && !evalSuccess) {
        attempt++;
        try {
          console.log(`[GD][Evaluation] [Session: ${sessId}] Manual Retry: API call attempt ${attempt}/${maxAttempts}...`);
          setRetryAttemptText(`Regenerating report... (Attempt ${attempt}/${maxAttempts})`);

          const res = await fetch('/api/gd-ai/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: sessId,
              topic: session.topic,
              category: session.category,
              difficulty: session.difficulty,
              turns: safeTurns,
              elapsedSeconds: session.durationSeconds || 600,
              uid: uid,
              studentName: currentUser.displayName || currentUser.name || 'Candidate',
              attempt: attempt,
            }),
          });

          if (!res.ok) {
            let errMsg = 'Evaluation failed';
            try {
              const err = await res.json();
              errMsg = err.error || errMsg;
            } catch (jsonErr) {
              try {
                const txt = await res.text();
                errMsg = txt || errMsg;
              } catch {}
            }
            throw new Error(errMsg);
          }

          data = await res.json();

          // Validation
          if (!data.evaluation || typeof data.evaluation.overallScore !== 'number' || !data.evaluation.dimensions) {
            throw new Error('AI response structure validation failed.');
          }

          evalSuccess = true;
          console.log(`[GD][Evaluation] [Session: ${sessId}] Manual Retry: Success.`);
        } catch (err) {
          console.warn(`[GD][Evaluation] [Session: ${sessId}] Manual Retry: Attempt ${attempt} failed: ${err.message}`);
          if (attempt >= maxAttempts) {
            throw err;
          } else {
            // Task 3: Delay intervals (2s after Attempt 1, 5s after Attempt 2)
            const delay = attempt === 1 ? 2000 : 5000;
            await new Promise(r => setTimeout(r, delay));
          }
        }
      }

      toast.success('Report successfully generated!');
      const endRetryTotal = performance.now();
      console.log(`[GD][Evaluation] [Session: ${sessId}] Manual report retry total time: ${(endRetryTotal - startRetryTotal).toFixed(2)}ms.`);

      // Update local storage backup
      if (typeof window !== 'undefined') {
        try {
          const localSessions = JSON.parse(localStorage.getItem('local_gd_sessions') || '[]');
          const localRecord = {
            sessionId: sessId,
            topic: session.topic,
            category: session.category,
            difficulty: session.difficulty,
            type: 'ai_gd',
            durationSeconds: session.durationSeconds,
            overallScore: data.evaluation.overallScore,
            summary: data.evaluation.summary,
            strongestMoment: data.evaluation.strongestMoment,
            growthArea: data.evaluation.growthArea,
            dimensions: data.evaluation.dimensions,
            overallAnalysis: data.evaluation.overallAnalysis,
            transcript: safeTurns,
            status: 'REPORT_READY',
            createdAt: new Date().toISOString(),
          };
          const updated = [localRecord, ...localSessions.filter(s => s.sessionId !== sessId)].slice(0, 20);
          localStorage.setItem('local_gd_sessions', JSON.stringify(updated));
        } catch (storageErr) {
          console.warn('Failed to update local backup:', storageErr);
        }
      }
      
      // Update UI with newly generated details
      const finalRes = await fetch(`/api/gd-ai/session?uid=${uid}&sessionId=${sessId}`);
      if (finalRes.ok) {
        const finalData = await finalRes.json();
        if (finalData.session) setSession(finalData.session);
      }
      
      setEvaluating(false);
      setEvalFailed(false);
      setIsCorrupted(false);
    } catch (err) {
      console.error(`[GD][Evaluation] [Session: ${sessId}] Manual report retry failed completely:`, err);
      toast.error(`Regeneration failed: ${err.message}`);
      setEvaluating(false);
      setEvalFailed(true);
      
      // Update Firestore status to evaluation_failed (Refinement 3)
      try {
        await fetch('/api/gd-ai/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: uid,
            sessionData: {
              sessionId: sessId,
              topic: session.topic,
              category: session.category,
              difficulty: session.difficulty,
              turns: safeTurns,
              durationSeconds: session.durationSeconds || 600,
              status: 'evaluation_failed'
            }
          })
        });
      } catch (dbErr) {
        console.error(`[GD][Firestore] [Session: ${sessId}] Failed to update session status to evaluation_failed:`, dbErr);
      }
    }
  };

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

  // State-aware loading screen during active AI generation / polling
  if (evaluating) {
    return (
      <Canvas>
        <AppShell>
          <div className="flex flex-col justify-center items-center py-20 min-h-[80vh] space-y-6 text-center max-w-md mx-auto">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-teal-500/10 animate-ping" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-2 rounded-full bg-teal-500/20 animate-pulse" />
              <div className="absolute inset-4 rounded-full bg-teal-600 flex items-center justify-center text-white shadow-lg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8 animate-spin">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-black text-slate-800">Generating Performance Evaluation</h2>
              <p className="text-xs text-slate-400 font-medium">
                BridgeAI is constructing your recruiter-grade dashboard. This takes up to 45 seconds.
              </p>
            </div>
            {retryAttemptText && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold px-3 py-1.5 rounded-lg animate-pulse">
                ⚠️ status: {retryAttemptText}
              </div>
            )}
          </div>
        </AppShell>
      </Canvas>
    );
  }

  // State-aware failure / corruption screens with Retry action trigger
  if (evalFailed || isCorrupted || !session) {
    return (
      <Canvas>
        <AppShell>
          <div className="max-w-xl mx-auto py-16 text-center space-y-6 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm my-10">
            <div className="text-rose-500 text-6xl font-black mb-2">!</div>
            <h2 className="text-xl font-bold text-slate-800">
              {!session ? 'Report Not Found' : isCorrupted ? 'Evaluation Report Corrupted' : 'Evaluation Generation Failed'}
            </h2>
            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
              {!session 
                ? "We couldn't retrieve the details for this discussion practice. It may have been deleted or the ID is incorrect." 
                : isCorrupted
                  ? "The saved report is missing critical scoring parameters or dimension indices."
                  : "An unexpected error occurred while analyzing your conversational turns. The transcript was preserved."
              }
            </p>

            {session && (
              <div className="flex flex-col gap-4 max-w-md mx-auto pt-4">
                <Button 
                  onClick={handleRetryEvaluation}
                  variant="teal" 
                  className="font-bold py-3 w-full shadow-lg"
                >
                  🔄 Regenerate Feedback Report
                </Button>
                <button
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="text-xs font-semibold text-slate-500 hover:underline"
                >
                  {showTranscript ? 'Hide Preserved Transcript' : 'Review Preserved Transcript'}
                </button>

                {showTranscript && (
                  <div className="border border-slate-150 rounded-2xl p-4 bg-slate-50/50 max-h-[300px] overflow-y-auto text-left space-y-3">
                    {session.transcript?.map((t, idx) => (
                      <div key={idx} className="text-xs">
                        <span className="font-extrabold text-slate-700 uppercase tracking-wide mr-1.5">{t.speakerName || t.speakerId}:</span>
                        <span className="text-slate-600 font-medium leading-relaxed italic">"{t.text}"</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 max-w-md mx-auto">
              <Link href="/gd/ai" className="text-xs font-bold text-teal-600 hover:underline">
                ← Back to GD Pulse Hub
              </Link>
            </div>
          </div>
        </AppShell>
      </Canvas>
    );
  }

  const {
    topic = '',
    category = 'General',
    difficulty = 'intermediate',
    durationSeconds = 600,
    overallScore = 0,
    summary = '',
    strongestMoment = '',
    growthArea = '',
    dimensions = {},
    overallAnalysis = {},
    transcript = [],
  } = session;

  const safeDimensions = dimensions || {};
  const safeOverallAnalysis = overallAnalysis || {};
  const safeTranscript = transcript || session.turns || [];

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
                  {summary ? `"${summary}"` : "Unable to generate this section."}
                </p>
              </div>

              {/* Strengths & Weaknesses quick tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6 mt-6">
                {safeOverallAnalysis.topStrength ? (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Top Strength</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl block truncate border border-emerald-100">
                      ★ {safeOverallAnalysis.topStrength}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Top Strength</span>
                    <span className="text-xs text-slate-450 font-semibold italic block border border-dashed border-slate-200 px-3 py-1 rounded-xl">
                      Unable to generate this section.
                    </span>
                  </div>
                )}
                {safeOverallAnalysis.topWeakness ? (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Growth Area</span>
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-xl block truncate border border-rose-100">
                      ⚠ {safeOverallAnalysis.topWeakness}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Growth Area</span>
                    <span className="text-xs text-slate-450 font-semibold italic block border border-dashed border-slate-200 px-3 py-1 rounded-xl">
                      Unable to generate this section.
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Bridge Score Delta Card */}
          {(bridgeScoreLoading || bridgeScore) && (
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200/80 rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold text-teal-600 uppercase tracking-widest block">Bridge Score Impact</span>
                {bridgeScoreLoading ? (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-3 h-3 rounded-full bg-teal-400 animate-pulse" />
                    <span className="text-xs font-semibold text-slate-500">Updating Bridge Score...</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 font-medium">
                    Your GD evaluation has been factored into your Bridge Score.
                  </p>
                )}
              </div>
              {bridgeScore && !bridgeScoreLoading && (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Current</span>
                    <span className="text-2xl font-black text-teal-700">{bridgeScore.current}</span>
                  </div>
                  {bridgeScore.delta !== 0 && (
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-black ${
                      bridgeScore.delta > 0 
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-100 text-rose-700 border border-rose-200'
                    }`}>
                      {bridgeScore.delta > 0 ? '▲' : '▼'}
                      {bridgeScore.delta > 0 ? '+' : ''}{bridgeScore.delta}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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
                  {strongestMoment ? `"${strongestMoment}"` : "Unable to generate this section."}
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
                  {growthArea || "Unable to generate this section."}
                </p>
              </div>
              <p className="text-[10px] text-rose-700/80 font-bold tracking-wide mt-4">
                Prioritize practicing specific exercises relating to this dimension in your next session.
              </p>
            </Card>
          </div>

          {/* Action Items Interactive list */}
          {safeOverallAnalysis.actionItems && safeOverallAnalysis.actionItems.length > 0 ? (
            <Card className="p-6 border-slate-200/80 space-y-4">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                Your Custom 3-Step Action Plan
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {safeOverallAnalysis.actionItems.map((item, idx) => (
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
          ) : (
            <Card className="p-6 border-slate-200/80 space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                Your Custom 3-Step Action Plan
              </span>
              <p className="text-xs text-slate-450 font-semibold italic">Unable to generate this section.</p>
            </Card>
          )}

          {/* 5 Dimension feedback grid */}
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Recruiter Evaluation Dimensions</h2>
            {Object.keys(safeDimensions).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(safeDimensions).map(([dimId, dimData]) => (
                  <DimensionScore key={dimId} dimensionId={dimId} data={dimData} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-450 font-semibold italic">Unable to generate this section.</p>
            )}
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
                {safeTranscript.map((t, idx) => {
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
