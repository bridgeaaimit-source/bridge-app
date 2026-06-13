"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, Clock, Send, AlertCircle, ChevronLeft, TrendingUp, Target, MessageSquare, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useAuthBypass } from "@/hooks/useAuthBypass";
import { 
  doc, onSnapshot, updateDoc, collection, 
  addDoc, serverTimestamp, query, orderBy, getDocs
} from "firebase/firestore";

const GD_DURATION = 600; // 10 minutes
const LOBBY_COUNTDOWN = 30; // 30 seconds lobby wait

export default function BattleRoom() {
  const { roomId } = useParams();
  const router = useRouter();
  const { isBypassed, mockUser } = useAuthBypass();
  const [authLoading, setAuthLoading] = useState(true);
  const [room, setRoom] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Phase: 'lobby' → 'active' → 'analyzing' → 'results'
  const [phase, setPhase] = useState('lobby');
  const [lobbyCountdown, setLobbyCountdown] = useState(LOBBY_COUNTDOWN);
  const [gdTimeLeft, setGdTimeLeft] = useState(GD_DURATION);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const submissionsEndRef = useRef(null);
  const lobbyTimerRef = useRef(null);
  const gdTimerRef = useRef(null);
  const hasStartedLobby = useRef(false);

  const scrollToBottom = () => {
    submissionsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [submissions]);

  // ─── Finish GD & Run Analysis ───
  const finishGD = useCallback(async () => {
    if (phase === 'analyzing' || phase === 'results') return;
    
    setPhase('analyzing');
    setIsAnalyzing(true);
    clearInterval(gdTimerRef.current);

    const user = isBypassed ? mockUser : auth.currentUser;
    if (!user || !room) return;

    try {
      // Get all of THIS user's submissions
      let myPoints;
      if (isBypassed) {
        // Read from local state instead of Firestore
        myPoints = submissions
          .filter(s => s.uid === user.uid)
          .map(s => s.point);
      } else {
        const subsSnap = await getDocs(
          query(collection(db, 'gdBattles', roomId, 'gdSubmissions'), orderBy('timestamp', 'asc'))
        );
        myPoints = subsSnap.docs
          .map(d => d.data())
          .filter(s => s.uid === user.uid)
          .map(s => s.point);
      }

      if (myPoints.length === 0) {
        toast.error("You didn't make any points!");
        setPhase('results');
        setIsAnalyzing(false);
        setAnalysis({
          pointAnalysis: [],
          overallAnalysis: {
            totalScore: 0,
            communication: 0,
            logicalFlow: 0,
            contentQuality: 0,
            persuasiveness: 0,
            summary: "You did not submit any arguments during this GD session.",
            topStrength: "N/A",
            topWeakness: "Active participation is key in GDs.",
            actionItems: ["Practice making at least 3-4 points per GD", "Prepare key arguments before the discussion starts"]
          }
        });
        return;
      }

      // Call the comprehensive analysis API
      const response = await fetch('/api/gd-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: room.topic,
          points: myPoints
        })
      });

      const data = await response.json();
      setAnalysis(data);
      setPhase('results');
    } catch (error) {
      console.error("Error analyzing GD:", error);
      toast.error("Analysis failed. Please try again.");
      setPhase('results');
    } finally {
      setIsAnalyzing(false);
    }
  }, [phase, room, roomId, isBypassed, submissions]);

  // ─── Listen to Room Document & Auth initialization ───
  useEffect(() => {
    if (isBypassed) {
      setAuthLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setAuthLoading(false);
      if (!user) {
        router.push('/login');
      }
    });
    return () => unsubscribeAuth();
  }, [router, isBypassed]);

  useEffect(() => {
    if (authLoading) return;
    const user = isBypassed ? mockUser : auth.currentUser;
    if (!user) return;

    // Bypass mode: use mock room data instead of Firestore listener
    if (isBypassed) {
      setRoom({
        topic: 'AI in Education: Boon or Risk?',
        category: 'Technology',
        difficulty: 'Medium',
        participants: [{ uid: user.uid, name: user.name || 'Test Student', joinedAt: new Date().toISOString() }],
        participantCount: 1,
        maxParticipants: 6,
        status: 'waiting',
        isCustom: false
      });
      return;
    }

    const roomRef = doc(db, 'gdBattles', roomId);
    const unsubscribeRoom = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        setRoom(docSnap.data());
      } else {
        toast.error("Battle room not found");
        router.push('/gd');
      }
    });

    return () => unsubscribeRoom();
  }, [roomId, router, authLoading, isBypassed, mockUser]);

  // ─── Start Lobby Countdown (30s) when room data loads ───
  useEffect(() => {
    if (room && !hasStartedLobby.current && phase === 'lobby') {
      hasStartedLobby.current = true;
      setLobbyCountdown(LOBBY_COUNTDOWN);

      lobbyTimerRef.current = setInterval(() => {
        setLobbyCountdown(prev => {
          if (prev <= 1) {
            clearInterval(lobbyTimerRef.current);
            setPhase('active');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(lobbyTimerRef.current);
  }, [room, phase]);

  // ─── GD Timer (10 min) starts when phase becomes 'active' ───
  useEffect(() => {
    if (phase !== 'active') return;

    setGdTimeLeft(GD_DURATION);
    gdTimerRef.current = setInterval(() => {
      setGdTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(gdTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Mark room as active in Firestore (skip in bypass mode)
    if (!isBypassed) {
      const roomRef = doc(db, 'gdBattles', roomId);
      updateDoc(roomRef, { status: 'active', startTime: Date.now() }).catch(console.error);
    }

    return () => clearInterval(gdTimerRef.current);
  }, [phase, roomId]);

  // ─── Auto-finish when GD timer hits 0 ───
  useEffect(() => {
    if (phase === 'active' && gdTimeLeft === 0) {
      finishGD();
    }
  }, [gdTimeLeft, phase, finishGD]);

  // ─── Listen to Submissions (live feed during GD) ───
  useEffect(() => {
    // Bypass mode: skip Firestore listener, rely on local submissions state
    if (isBypassed) return;

    const q = query(
      collection(db, 'gdBattles', roomId, 'gdSubmissions'),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [roomId, isBypassed]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ─── Submit a Point (NO AI evaluation during GD) ───
  const handleSubmit = async () => {
    if (!input.trim() || isSubmitting || phase !== 'active') return;
    const user = isBypassed ? mockUser : auth.currentUser;
    if (!user) return;

    const pointText = input.trim();
    setInput("");
    setIsSubmitting(true);

    // Bypass mode: add to local state instead of Firestore
    if (isBypassed) {
      setSubmissions(prev => [...prev, {
        id: `mock-sub-${Date.now()}`,
        uid: user.uid,
        userName: user.name || 'Test Student',
        point: pointText,
        timestamp: new Date()
      }]);
      setIsSubmitting(false);
      return;
    }

    try {
      await addDoc(collection(db, 'gdBattles', roomId, 'gdSubmissions'), {
        uid: user.uid,
        userName: user.displayName || 'Anonymous',
        point: pointText,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error submitting point", error);
      toast.error("Failed to submit point");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Loading State ───
  if (authLoading || !room) {
    return (
      <AppShell>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D9488]"></div>
        </div>
      </AppShell>
    );
  }

  const currentUserUid = isBypassed ? mockUser?.uid : auth.currentUser?.uid;

  // ═══════════════════════════════════════════════════
  //  RESULTS VIEW — After GD ends
  // ═══════════════════════════════════════════════════
  if (phase === 'analyzing' || phase === 'results') {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto px-4 py-6">

          {/* Analyzing Overlay */}
          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-full bg-[#CCFBF1] flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 text-[#0D9488] animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2" style={{fontFamily:'Syne,sans-serif'}}>Analyzing Your GD Performance...</h2>
              <p className="text-sm text-gray-500">Our AI is evaluating each of your arguments individually.</p>
            </div>
          )}

          {/* Results */}
          {analysis && !isAnalyzing && (
            <div className="space-y-6">
              
              {/* Header */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <button onClick={() => router.push('/gd')} className="text-gray-400 hover:text-gray-900 mb-3 flex items-center gap-1 text-sm font-medium transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Back to Arena
                </button>
                <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{fontFamily:'Syne,sans-serif'}}>GD Performance Report</h1>
                <p className="text-sm text-gray-500">Topic: {room.topic}</p>
              </div>

              {/* Overall Score Card */}
              {analysis.overallAnalysis && (
                <div className="bg-gradient-to-br from-[#0D9488] to-[#14B8A6] rounded-2xl p-6 text-white shadow-lg">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <p className="text-white/80 text-sm font-medium mb-1">Overall Score</p>
                      <div className="text-5xl font-black">{analysis.overallAnalysis.totalScore}<span className="text-2xl font-medium text-white/60">/100</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Communication', value: analysis.overallAnalysis.communication },
                        { label: 'Logical Flow', value: analysis.overallAnalysis.logicalFlow },
                        { label: 'Content', value: analysis.overallAnalysis.contentQuality },
                        { label: 'Persuasiveness', value: analysis.overallAnalysis.persuasiveness },
                      ].map(m => (
                        <div key={m.label} className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 min-w-[130px]">
                          <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">{m.label}</p>
                          <p className="text-xl font-bold">{m.value}<span className="text-sm text-white/50">/10</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="mt-5 text-white/90 text-sm leading-relaxed border-t border-white/20 pt-4">{analysis.overallAnalysis.summary}</p>
                </div>
              )}

              {/* Strengths & Weaknesses */}
              {analysis.overallAnalysis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-green-100 p-5">
                    <h3 className="font-bold text-green-700 mb-2 flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4" /> Top Strength</h3>
                    <p className="text-sm text-gray-700">{analysis.overallAnalysis.topStrength}</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-orange-100 p-5">
                    <h3 className="font-bold text-orange-600 mb-2 flex items-center gap-2 text-sm"><Target className="w-4 h-4" /> Area to Improve</h3>
                    <p className="text-sm text-gray-700">{analysis.overallAnalysis.topWeakness}</p>
                  </div>
                </div>
              )}

              {/* Point-by-Point Breakdown */}
              {analysis.pointAnalysis && analysis.pointAnalysis.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2" style={{fontFamily:'Syne,sans-serif'}}>
                      <MessageSquare className="w-5 h-5 text-[#0D9488]" /> Point-by-Point Analysis
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {analysis.pointAnalysis.map((pa, i) => (
                      <div key={i} className="p-6 hover:bg-gray-50/50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-xs font-bold text-[#0D9488] bg-[#CCFBF1] px-2 py-0.5 rounded-full">Point {i + 1}</span>
                          <span className={`text-sm font-black ${pa.pointScore >= 70 ? 'text-green-600' : pa.pointScore >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                            {pa.pointScore}/100
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 font-medium mb-3 bg-gray-50 p-3 rounded-xl border border-gray-100 italic">"{pa.originalPoint}"</p>
                        
                        {/* Score bars */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          {[
                            { label: 'Clarity', value: pa.clarity, color: '#0D9488' },
                            { label: 'Relevance', value: pa.relevance, color: '#14B8A6' },
                            { label: 'Depth', value: pa.depth, color: '#0F766E' }
                          ].map(bar => (
                            <div key={bar.label}>
                              <div className="flex justify-between mb-1">
                                <span className="text-[10px] font-bold text-gray-500 uppercase">{bar.label}</span>
                                <span className="text-xs font-bold text-gray-700">{bar.value}/10</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${bar.value * 10}%`, backgroundColor: bar.color }}></div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2 text-xs">
                          {pa.strength && <div className="flex gap-2"><span className="text-green-600 font-bold shrink-0">✓ Strength:</span> <span className="text-gray-600">{pa.strength}</span></div>}
                          {pa.weakness && <div className="flex gap-2"><span className="text-red-500 font-bold shrink-0">✗ Weakness:</span> <span className="text-gray-600">{pa.weakness}</span></div>}
                          {pa.improvement && <div className="flex gap-2"><span className="text-[#0D9488] font-bold shrink-0">→ Improve:</span> <span className="text-gray-600">{pa.improvement}</span></div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Items */}
              {analysis.overallAnalysis?.actionItems && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2" style={{fontFamily:'Syne,sans-serif'}}>
                    <TrendingUp className="w-5 h-5 text-[#0D9488]" /> Your Action Plan
                  </h3>
                  <div className="space-y-3">
                    {analysis.overallAnalysis.actionItems.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 bg-[#F0FDFA] p-3 rounded-xl">
                        <div className="w-6 h-6 bg-[#0D9488] rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">{i + 1}</div>
                        <p className="text-sm text-gray-700">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="flex justify-center py-4">
                <button onClick={() => router.push('/gd')} className="bg-[#0D9488] text-white px-8 py-3 rounded-full font-bold hover:bg-[#0F766E] transition-colors flex items-center gap-2">
                  Try Another GD <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  // ═══════════════════════════════════════════════════
  //  LOBBY + ACTIVE GD VIEW
  // ═══════════════════════════════════════════════════
  const isLobby = phase === 'lobby';
  const isActive = phase === 'active';

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-6 min-h-[calc(100vh-80px)] flex flex-col">
        
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <button onClick={() => router.push('/gd')} className="text-gray-400 hover:text-gray-900 mb-2 flex items-center gap-1 text-sm font-medium transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back to Arena
            </button>
            <span className="inline-block text-[11px] font-bold uppercase tracking-wide text-[#0D9488] bg-[#CCFBF1] px-2 py-0.5 rounded-full mb-2">{room.category}</span>
            <h1 className="text-2xl font-bold text-gray-900" style={{fontFamily:'Syne,sans-serif'}}>{room.topic}</h1>
          </div>
          
          <div className="flex gap-4 items-center">
            <div className="bg-gray-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-gray-100">
              <Users className="w-4 h-4 text-[#0D9488]" />
              <span className="text-sm font-bold text-gray-700">{room.participantCount || 0} / {room.maxParticipants}</span>
            </div>

            {/* Timer Badge */}
            {isLobby && (
              <div className="bg-orange-50 text-orange-600 border border-orange-100 px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm">
                <Clock className="w-4 h-4" />
                Starts in {lobbyCountdown}s
              </div>
            )}
            {isActive && (
              <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm ${gdTimeLeft <= 60 ? 'bg-red-50 text-red-600 border border-red-100 animate-pulse' : 'bg-[#F0FDFA] text-[#0D9488] border border-[#CCFBF1]'}`}>
                <Clock className={`w-4 h-4 ${gdTimeLeft <= 60 ? 'animate-pulse' : ''}`} />
                {formatTime(gdTimeLeft)}
              </div>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-grow min-h-0">
          
          {/* Sidebar: Participants */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-fit">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0D9488]" /> Participants
            </h3>
            <div className="space-y-3">
              {room.participants?.map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#CCFBF1] to-[#0D9488] flex items-center justify-center text-white font-bold text-xs">
                    {p.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{p.name} {p.uid === currentUserUid && <span className="text-[10px] text-[#0D9488] font-bold">(You)</span>}</span>
                </div>
              ))}
            </div>

            {/* Submit GD Button (visible during active phase) */}
            {isActive && (
              <button onClick={finishGD} className="w-full mt-6 bg-[#0D9488] text-white py-3 rounded-xl font-bold hover:bg-[#0F766E] transition-colors text-sm flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" /> Submit & End GD
              </button>
            )}
          </div>

          {/* Chat Feed */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[600px] overflow-hidden">
            
            {/* Feed Area */}
            <div className="flex-grow p-6 overflow-y-auto bg-gray-50/50 space-y-4">
              
              {/* Lobby State */}
              {isLobby && (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center">
                    <Clock className="w-10 h-10 text-orange-500" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900" style={{fontFamily:'Syne,sans-serif'}}>GD Starting in {lobbyCountdown} seconds</h3>
                    <p className="text-sm text-gray-500 mt-1">{room.participantCount || 0} participant(s) joined · Prepare your arguments!</p>
                  </div>
                  <div className="w-48 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="h-2 bg-orange-500 rounded-full transition-all duration-1000" style={{ width: `${((LOBBY_COUNTDOWN - lobbyCountdown) / LOBBY_COUNTDOWN) * 100}%` }}></div>
                  </div>
                </div>
              )}

              {/* Active GD — Simple chat feed, no AI badges */}
              {isActive && submissions.length === 0 && (
                <div className="flex justify-center items-center py-10">
                  <div className="bg-white px-6 py-3 rounded-full shadow-sm text-sm font-medium text-gray-500 border border-gray-100 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#0D9488]" /> GD is live! Start making your points below.
                  </div>
                </div>
              )}
              
              {isActive && submissions.map((sub) => {
                const isMe = sub.uid === currentUserUid;
                return (
                  <div key={sub.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs font-bold text-gray-400 mb-1 ml-1">
                      {isMe ? 'You' : sub.userName}
                    </span>
                    <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm border ${isMe ? 'bg-[#0D9488] text-white border-[#0D9488] rounded-tr-sm' : 'bg-white text-gray-800 border-gray-100 rounded-tl-sm'}`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{sub.point}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={submissionsEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={!isActive}
                  placeholder={isLobby ? "GD hasn't started yet..." : isActive ? "Type your argument and press Enter..." : "GD has ended."}
                  className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] resize-none h-[60px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isSubmitting || !isActive}
                  className="bg-[#0D9488] text-white px-6 rounded-xl font-bold hover:bg-[#0F766E] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              {isActive && <p className="text-[10px] text-gray-400 text-center mt-2">Your points will be evaluated holistically after the GD ends. Focus on quality arguments!</p>}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
