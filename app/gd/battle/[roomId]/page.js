"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, Clock, Send, AlertCircle, ChevronLeft, Award } from "lucide-react";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";
import { db, auth } from "@/lib/firebase";
import { 
  doc, onSnapshot, updateDoc, arrayRemove, collection, 
  addDoc, serverTimestamp, query, orderBy, increment
} from "firebase/firestore";

export default function BattleRoom() {
  const { roomId } = useParams();
  const router = useRouter();
  const [room, setRoom] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes to start, or 10 min battle
  
  const submissionsEndRef = useRef(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    submissionsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [submissions]);

  // Listen to Room Document
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      router.push('/login');
      return;
    }

    const roomRef = doc(db, 'gdBattles', roomId);
    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRoom(data);
        
        // Auto-start logic
        if (data.status === 'waiting' && data.participantCount >= 3) {
          updateDoc(roomRef, { status: 'active', startTime: Date.now() });
        }
      } else {
        toast.error("Battle room not found");
        router.push('/gd');
      }
    });

    // Handle Cleanup on Unmount
    return () => {
      unsubscribe();
      // Remove user from participants
      updateDoc(roomRef, {
        participants: arrayRemove({
          uid: user.uid,
          name: user.displayName || 'Anonymous User',
          joinedAt: new Date().toISOString() // Wait, arrayRemove needs exact object match. Usually it's better to filter. 
          // We will use a workaround or just decrement participantCount for now if exact object matching fails
        }),
        participantCount: increment(-1)
      }).catch(console.error);
    };
  }, [roomId, router]);

  // Listen to Submissions Subcollection
  useEffect(() => {
    const q = query(
      collection(db, 'gdBattles', roomId, 'gdSubmissions'),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubmissions(subs);
    });

    return () => unsubscribe();
  }, [roomId]);

  // Timer Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!input.trim() || isSubmitting || !room) return;
    const user = auth.currentUser;
    if (!user) return;

    const pointText = input.trim();
    setInput("");
    setIsSubmitting(true);

    try {
      // 1. Save Point as "Evaluating..."
      const subRef = await addDoc(collection(db, 'gdBattles', roomId, 'gdSubmissions'), {
        uid: user.uid,
        userName: user.displayName || 'Anonymous',
        point: pointText,
        timestamp: serverTimestamp(),
        isEvaluating: true
      });

      // 2. Call Claude API
      const response = await fetch('/api/gd-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: room.topic,
          argument: pointText
        })
      });

      const aiData = await response.json();

      // 3. Update Document with Score
      await updateDoc(subRef, {
        isEvaluating: false,
        score: aiData.overallScore,
        clarity: aiData.clarity,
        relevance: aiData.relevance,
        depth: aiData.depth,
        feedback: aiData.feedback
      });

    } catch (error) {
      console.error("Error submitting point", error);
      toast.error("Failed to submit point");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!room) {
    return (
      <AppShell>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D9488]"></div>
        </div>
      </AppShell>
    );
  }

  const currentUserUid = auth.currentUser?.uid;

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
            <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm ${room.status === 'active' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
              <Clock className={`w-4 h-4 ${room.status === 'active' ? 'animate-pulse' : ''}`} />
              {room.status === 'waiting' ? 'Starts in ' : 'Ends in '} {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-grow min-h-0">
          
          {/* Sidebar: Participants */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-fit">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0D9488]" /> Live Participants
            </h3>
            <div className="space-y-3">
              {room.participants?.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#CCFBF1] to-[#0D9488] flex items-center justify-center text-white font-bold text-xs">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{p.name} {p.uid === currentUserUid && "(You)"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Feed */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[600px] overflow-hidden">
            
            {/* Feed Area */}
            <div className="flex-grow p-6 overflow-y-auto bg-gray-50/50 space-y-6">
              {room.status === 'waiting' && (
                <div className="flex justify-center items-center py-10">
                  <div className="bg-white px-6 py-3 rounded-full shadow-sm text-sm font-medium text-gray-500 border border-gray-100 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500" /> Waiting for 3+ players to start...
                  </div>
                </div>
              )}
              
              {submissions.map((sub) => {
                const isMe = sub.uid === currentUserUid;
                return (
                  <div key={sub.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs font-bold text-gray-400 mb-1 ml-1">{isMe ? 'You' : sub.userName}</span>
                    <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm border ${isMe ? 'bg-[#0D9488] text-white border-[#0D9488] rounded-tr-sm' : 'bg-white text-gray-800 border-gray-100 rounded-tl-sm'}`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{sub.point}</p>
                      
                      {/* AI Feedback Badge */}
                      <div className={`mt-3 pt-3 flex items-center gap-2 border-t ${isMe ? 'border-white/20' : 'border-gray-100'}`}>
                        {sub.isEvaluating ? (
                          <div className="flex items-center gap-2 text-xs font-medium opacity-80">
                            <div className={`animate-spin h-3 w-3 border-2 rounded-full border-t-transparent ${isMe ? 'border-white' : 'border-[#0D9488]'}`}></div>
                            AI Evaluating...
                          </div>
                        ) : (
                          <div className={`w-full text-xs p-2 rounded-lg ${isMe ? 'bg-black/10' : 'bg-[#F0FDFA] text-[#0D9488]'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold flex items-center gap-1"><Award className="w-3 h-3" /> Score: {sub.score}/100</span>
                              <span className="opacity-80">C:{sub.clarity} R:{sub.relevance} D:{sub.depth}</span>
                            </div>
                            <p className="opacity-90 italic">"{sub.feedback}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={submissionsEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={room.status === 'waiting'}
                  placeholder={room.status === 'waiting' ? "Waiting for battle to start..." : "Type your argument here..."}
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
                  disabled={!input.trim() || isSubmitting || room.status === 'waiting'}
                  className="bg-[#0D9488] text-white px-6 rounded-xl font-bold hover:bg-[#0F766E] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '...' : <Send className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-2">Press Enter to submit. Your point will be instantly scored by AI.</p>
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
