'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { db, auth } from '@/lib/firebase';
import { useAuthBypass } from '@/hooks/useAuthBypass';
import { Canvas, Button, Card, typography } from '@/components/DesignSystem';
import CategoryGrid from '@/components/gd-ai/CategoryGrid';
import PastSessions from '@/components/gd-ai/PastSessions';
import toast from 'react-hot-toast';
import { doc, getDoc } from 'firebase/firestore';

export default function GDAIHubPage() {
  const router = useRouter();
  const { isBypassed, mockUser } = useAuthBypass();
  const [currentUser, setCurrentUser] = useState(null);
  const [bridgeScore, setBridgeScore] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loadingScore, setLoadingScore] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Get current user auth
  useEffect(() => {
    if (isBypassed) {
      setCurrentUser(mockUser);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        // Not logged in
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, [isBypassed, mockUser]);

  // Fetch Bridge Score and Past Sessions once user is set
  useEffect(() => {
    if (!currentUser) return;

    const uid = currentUser.uid;

    // Fetch score
    setLoadingScore(true);

    // 1. Fetch baseline score from Firestore user doc first
    const userRef = doc(db, 'users', uid);
    getDoc(userRef)
      .then((snap) => {
        if (snap.exists()) {
          const score = snap.data().bridgeScore;
          if (score !== undefined && score !== null) {
            setBridgeScore(score);
          }
        }
      })
      .catch((err) => console.error('Error fetching user baseline score:', err));

    fetch(`/api/bridge-score?userId=${uid}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch score');
        return res.json();
      })
      .then((data) => {
        if (data && data.score !== null && data.score !== undefined) {
          setBridgeScore(data.score);
        }
      })
      .catch((err) => {
        console.error('Error fetching bridge score API:', err);
      })
      .finally(() => {
        setLoadingScore(false);
      });

    // Fetch sessions list
    setLoadingSessions(true);
    fetch(`/api/gd-ai/session?uid=${uid}&list=true`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch sessions');
        return res.json();
      })
      .then((data) => {
        const remoteSessions = data.sessions || [];
        let localSessions = [];
        if (typeof window !== 'undefined') {
          try {
            localSessions = JSON.parse(localStorage.getItem('local_gd_sessions') || '[]');
          } catch (e) {
            console.warn('Failed to parse local sessions:', e);
          }
        }
        
        // Combine remote and local sessions, deduplicating by sessionId
        const combined = [...remoteSessions];
        localSessions.forEach(ls => {
          if (!combined.some(s => s.sessionId === ls.sessionId)) {
            combined.push({
              sessionId: ls.sessionId,
              topic: ls.topic,
              category: ls.category,
              difficulty: ls.difficulty,
              overallScore: ls.overallScore,
              durationSeconds: ls.durationSeconds,
              createdAt: ls.createdAt,
            });
          }
        });
        
        // Sort newest first
        combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setSessions(combined);
      })
      .catch((err) => {
        console.error('Error fetching sessions:', err);
        // Fallback entirely to local storage history on failure
        if (typeof window !== 'undefined') {
          try {
            const localSessions = JSON.parse(localStorage.getItem('local_gd_sessions') || '[]');
            setSessions(localSessions);
          } catch (e) {
            toast.error('Failed to load past sessions');
          }
        } else {
          toast.error('Failed to load past sessions');
        }
      })
      .finally(() => {
        setLoadingSessions(false);
      });
  }, [currentUser]);

  const handleSelectCategory = (categoryId) => {
    if (!currentUser) {
      toast.error('Please login to start practicing!');
      return;
    }
    router.push(`/gd/ai/setup?category=${categoryId}`);
  };

  const startQuickPractice = () => {
    if (!currentUser) {
      toast.error('Please login to start practicing!');
      return;
    }
    router.push('/gd/ai/setup');
  };

  return (
    <Canvas>
      <AppShell>
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-10 min-h-screen space-y-12 bg-slate-50/30">
          
          {/* Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 to-teal-700 rounded-3xl p-8 md:p-12 text-white shadow-xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/25 rounded-full -mr-20 -mt-20 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-teal-800/30 rounded-full -ml-20 -mb-20 blur-2xl" />
            
            <div className="relative z-10 max-w-2xl space-y-6">
              <span className="inline-block text-[11px] font-black tracking-widest bg-white/20 px-3 py-1 rounded-full uppercase">
                Now Live: Solo Practice Mode
              </span>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none">
                The GD Room that is Always Full.
              </h1>
              <p className="text-teal-50 text-sm md:text-base leading-relaxed font-medium">
                Practice realistic placements group discussions anytime. Enter a simulated chamber with 4 AI candidates and 1 professional moderator. Speak, interrupt naturally, and receive direct recruiter-grade feedback.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button 
                  onClick={startQuickPractice}
                  className="!bg-white !text-teal-700 hover:!bg-teal-50 font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Start Solo AI GD
                </Button>
                <div className="text-xs text-teal-100 font-semibold">
                  ⚡ Ready in 10 seconds • No queueing
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar (Bridge Score & Streak) */}
          {currentUser && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bridge Score Card */}
              <Card className="flex items-center gap-5 p-6 border-slate-200/80">
                <div className="relative flex items-center justify-center flex-shrink-0 w-16 h-16">
                  {loadingScore ? (
                    <div className="w-12 h-12 rounded-full border-2 border-t-teal-500 animate-spin border-slate-100" />
                  ) : (
                    <>
                      <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                      <div 
                        className="absolute inset-0 rounded-full border-4 border-teal-500 border-r-transparent" 
                        style={{ transform: `rotate(${Math.min(360, ((bridgeScore || 400) / 1000) * 360)}deg)` }}
                      />
                      <span className="font-extrabold text-slate-800 text-lg">{bridgeScore || '—'}</span>
                    </>
                  )}
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-slate-800">Placement BRIDGE Score</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Your overall readiness score. Aim for 700+ to stand out to recruiters.
                  </p>
                </div>
              </Card>

              {/* Streaks & Activity */}
              <Card className="flex items-center gap-5 p-6 border-slate-200/80">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                  </svg>
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-slate-800">Regular Practice Habit</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Practice once every 3 days to lock in communication gains.
                  </p>
                </div>
              </Card>

              {/* Performance Indicator */}
              <Card className="flex items-center gap-5 p-6 border-slate-200/80">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-slate-800">Recruiter Benchmarks</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Evaluated across 9 critical soft-skills tracked by hiring partners.
                  </p>
                </div>
              </Card>
            </div>
          )}

          {/* Practice Categories Selection */}
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Select a Discussion Category</h2>
              <p className="text-xs text-slate-400 font-semibold">Choose a domain below to populate relevant topics.</p>
            </div>
            <CategoryGrid onSelectCategory={handleSelectCategory} />
          </div>

          {/* Past Sessions History */}
          <div className="space-y-4 border-t border-slate-100 pt-8">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Your Practice Logs</h2>
                <p className="text-xs text-slate-400 font-semibold">Review your performance feedback and score improvements.</p>
              </div>
            </div>
            <PastSessions sessions={sessions} loading={loadingSessions} />
          </div>

        </div>
      </AppShell>
    </Canvas>
  );
}
