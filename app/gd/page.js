"use client";

import { useState, useEffect } from "react";
import { Users, Target, Zap, Plus, X, Activity } from "lucide-react";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";
import { db, auth } from "@/lib/firebase";
import { useAuthBypass } from "@/hooks/useAuthBypass";
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { useRouter } from "next/navigation";

const DEFAULT_TOPICS = [
  { topic: "AI in Education: Boon or Risk?", category: "Technology", difficulty: "Medium" },
  { topic: "Remote Work vs Office Culture", category: "Work Culture", difficulty: "Easy" },
  { topic: "Should Coding Be Mandatory for MBAs?", category: "Education", difficulty: "Hard" }
];

export default function GDPage() {
  const router = useRouter();
  const { isBypassed, mockUser } = useAuthBypass();
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Custom Room States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [customCategory, setCustomCategory] = useState('Custom');
  const [customDifficulty, setCustomDifficulty] = useState('Medium');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // Bypass mode: synthesize mock rooms from DEFAULT_TOPICS, skip Firestore
    if (isBypassed) {
      const mockBattles = DEFAULT_TOPICS.map((t, i) => ({
        id: `mock-room-${i}`,
        topic: t.topic,
        category: t.category,
        difficulty: t.difficulty,
        participants: [],
        participantCount: 0,
        maxParticipants: 6,
        status: 'waiting',
        createdAt: { toMillis: () => Date.now() - i * 1000 },
        startTime: null,
        isCustom: false
      }));
      setBattles(mockBattles);
      setLoading(false);
      return;
    }

    // Listen to live battles (no orderBy to avoid requiring a composite index)
    const q = query(
      collection(db, 'gdBattles'),
      where('status', 'in', ['waiting', 'active'])
    );
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const liveBattles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort client-side by createdAt descending
      liveBattles.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      
      // Auto-create defaults if none exist (only if user is authenticated)
      if (liveBattles.length === 0 && !loading) {
        const user = auth.currentUser;
        if (user) {
          console.log("No active battles found. Creating defaults...");
          try {
            for (const t of DEFAULT_TOPICS) {
              await addDoc(collection(db, 'gdBattles'), {
                topic: t.topic,
                category: t.category,
                difficulty: t.difficulty,
                participants: [],
                participantCount: 0,
                maxParticipants: 6,
                status: 'waiting',
                createdAt: serverTimestamp(),
                startTime: null,
                isCustom: false
              });
            }
          } catch(e) {
            console.error("Error creating default battles", e);
          }
        } else {
          console.log("No active battles found and no authenticated user; skipping defaults creation.");
        }
      } else {
        setBattles(liveBattles);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error loading battles:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loading, isBypassed]);

  const handleJoinBattle = async (room) => {
    const user = isBypassed ? mockUser : auth.currentUser;
    if (!user) {
      toast.error('Please login to join a battle!');
      return;
    }

    if (room.participantCount >= room.maxParticipants && !room.participants?.some(p => p.uid === user.uid)) {
      toast.error('This room is full!');
      return;
    }

    // Bypass mode: update local state only, skip Firestore
    if (isBypassed) {
      const isAlreadyIn = room.participants?.some(p => p.uid === user.uid);
      if (!isAlreadyIn) {
        setBattles(prev => prev.map(b => b.id === room.id ? {
          ...b,
          participants: [...(b.participants || []), { uid: user.uid, name: user.name || 'Test Student', joinedAt: new Date().toISOString() }],
          participantCount: (b.participantCount || 0) + 1
        } : b));
      }
      router.push(`/gd/battle/${room.id}`);
      return;
    }

    try {
      const roomRef = doc(db, 'gdBattles', room.id);
      
      // Check if user already in room
      const isAlreadyIn = room.participants?.some(p => p.uid === user.uid);
      
      if (!isAlreadyIn) {
        await updateDoc(roomRef, {
          participants: arrayUnion({
            uid: user.uid,
            name: user.displayName || user.name || 'Anonymous User',
            joinedAt: new Date().toISOString()
          }),
          participantCount: increment(1)
        });
      }
      
      router.push(`/gd/battle/${room.id}`);
    } catch (error) {
      console.error("Error joining battle", error);
      toast.error('Failed to join the room');
    }
  };

  const createCustomRoom = async () => {
    const user = isBypassed ? mockUser : auth.currentUser;
    if (!user) {
      toast.error('Please login to create a battle room!');
      return;
    }
    if (!customTopic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setIsCreating(true);
    try {
      const roomData = {
        topic: customTopic,
        category: customCategory,
        difficulty: customDifficulty,
        participants: [],
        participantCount: 0,
        maxParticipants: 6,
        status: 'waiting',
        createdAt: isBypassed ? { toMillis: () => Date.now() } : serverTimestamp(),
        startTime: null,
        isCustom: true
      };

      let roomId;
      if (isBypassed) {
        // Bypass mode: generate mock ID, add to local state
        roomId = `mock-room-${Date.now()}`;
        setBattles(prev => [{ id: roomId, ...roomData }, ...prev]);
      } else {
        const docRef = await addDoc(collection(db, 'gdBattles'), roomData);
        roomId = docRef.id;
      }
      
      const response = await fetch('/api/gd-from-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_title: customTopic,
          topic: customTopic,
          category: 'Custom',
          uid: user.uid
        })
      });
      let aiContent = null;
      if (response.ok) {
        aiContent = await response.json();
      }
      
      toast.success('Battle room created!');
      setShowCreateModal(false);
      setCustomTopic('');
      
      // Auto join
      handleJoinBattle({ id: roomId, ...roomData });
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create room');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-6 md:py-10 min-h-screen">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900" style={{fontFamily:'Syne,sans-serif'}}>GD Battle Arena</h1>
            <p className="text-gray-500 mt-1 text-sm">Join live rooms, argue your points, and get instantly scored by AI.</p>
          </div>
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[#0D9488] text-white px-5 py-2.5 rounded-full font-semibold text-sm shadow-md hover:bg-[#0F766E] transition-colors">
            <Plus className="w-4 h-4" /> Create Battle Room
          </button>
        </div>

        {/* Live Battles */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-700 mb-5 flex items-center gap-2" style={{fontFamily:'Syne,sans-serif'}}>
            <Zap className="w-5 h-5 text-[#0D9488]" /> Live & Upcoming Battles
          </h2>
          
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D9488]"></div>
            </div>
          ) : battles.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              Generating battle rooms...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {battles.map((room) => (
                <div key={room.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(13,148,136,0.06)] hover:shadow-[0_4px_20px_rgba(13,148,136,0.14)] hover:border-[#CCFBF1] transition-all overflow-hidden group flex flex-col h-full">
                  
                  {/* Status Bar */}
                  <div className={`h-1.5 w-full transition-all duration-500 rounded-t-2xl ${room.status === 'active' ? 'bg-[#0D9488] animate-pulse' : 'bg-gray-300'}`} />
                  
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-3">
                      <span className="inline-block text-[11px] font-bold uppercase tracking-wide text-[#0D9488] bg-[#CCFBF1] px-2 py-0.5 rounded-full">{room.category}</span>
                      
                      {room.status === 'active' ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-red-500">
                          <Activity className="w-3 h-3 animate-pulse" /> LIVE
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-gray-500">Waiting for players</span>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-gray-900 mb-4 leading-snug text-lg flex-grow" style={{fontFamily:'Syne,sans-serif'}}>{room.topic}</h3>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-[#0D9488]" />
                          {room.participantCount || 0} / {room.maxParticipants}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-4 h-4 text-[#0D9488]" />
                          {room.difficulty}
                        </span>
                      </div>
                      <button onClick={() => handleJoinBattle(room)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                          room.status === 'active' 
                            ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                            : 'bg-[#0D9488] text-white hover:bg-[#0F766E]'
                        }`}>
                        {room.status === 'active' ? 'Spectate / Join' : 'Join Battle'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Room Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900" style={{fontFamily:'Syne,sans-serif'}}>Create Battle Room</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Topic</label>
                  <input type="text" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Enter an arguable topic..."
                    className="w-full bg-gray-50 border-2 border-[#CCFBF1] focus:border-[#0D9488] rounded-xl px-4 py-3 outline-none text-sm placeholder:text-gray-400 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                  <input type="text" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="e.g. Technology, Business, Politics"
                    className="w-full bg-gray-50 border-2 border-[#CCFBF1] focus:border-[#0D9488] rounded-xl px-4 py-3 outline-none text-sm placeholder:text-gray-400 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty</label>
                  <div className="flex gap-2">
                    {['Easy','Medium','Hard'].map((level) => (
                      <button key={level} onClick={() => setCustomDifficulty(level)}
                        className={`flex-1 py-2 rounded-full text-sm font-bold transition-colors ${customDifficulty===level ? 'bg-[#0D9488] text-white' : 'bg-gray-100 text-gray-600 hover:bg-[#CCFBF1]'}`}>
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={createCustomRoom} disabled={isCreating || !customTopic.trim()}
                  className="w-full bg-[#0D9488] text-white py-3.5 rounded-2xl font-bold hover:bg-[#0F766E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {isCreating ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
