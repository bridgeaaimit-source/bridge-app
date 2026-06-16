"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";
import { db, auth } from "@/lib/firebase";
import { useAuthBypass } from "@/hooks/useAuthBypass";
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { 
  GDPulseIcon, 
  TargetIcon, 
  Button, 
  Input, 
  Select,
  Canvas,
  SubtlePanel,
  Card,
  typography
} from "@/components/DesignSystem";

const DEFAULT_TOPICS = [
  { topic: "AI in Education: Boon or Risk?", category: "Technology", difficulty: "Medium" },
  { topic: "Remote Work vs Office Culture", category: "Work Culture", difficulty: "Easy" },
  { topic: "Should Coding Be Mandatory for MBAs?", category: "Education", difficulty: "Hard" }
];

const TRENDING_TOPICS = [
  { topic: "Is the 70-hour work week sustainable for Indian youth?", category: "Work Culture", difficulty: "Medium", heat: 94 },
  { topic: "Central Bank Digital Currencies (CBDC) vs Private Crypto", category: "Finance", difficulty: "Hard", heat: 88 },
  { topic: "Universal Basic Income: Solution to AI automation?", category: "Economics", difficulty: "Hard", heat: 91 },
  { topic: "Should social media algorithms be regulated by law?", category: "Technology", difficulty: "Medium", heat: 85 }
];

// Handcrafted SVG Icons (replacing Lucide/Emojis)
function PlusIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function XIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ActivityIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function UsersIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SparklesIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

function FireIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

export default function GDPage() {
  const router = useRouter();
  const { isBypassed, mockUser } = useAuthBypass();
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("All");
  
  // Custom Room States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [customCategory, setCustomCategory] = useState('Technology');
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
        participants: [
          { uid: "p1", name: "Ananya Sharma" },
          { uid: "p2", name: "Rohan Das" }
        ].slice(0, (i % 2) + 1),
        participantCount: (i % 2) + 1,
        maxParticipants: 6,
        status: i === 0 ? 'active' : 'waiting',
        createdAt: { toMillis: () => Date.now() - i * 1000 },
        startTime: null,
        isCustom: false
      }));
      setBattles(mockBattles);
      setLoading(false);
      return;
    }

    // Listen to live battles
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
          category: customCategory,
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

  const categories = ["All", "Technology", "Work Culture", "Education", "Finance", "Economics"];

  const filteredBattles = battles.filter(b => 
    filterCategory === "All" ? true : b.category?.toLowerCase() === filterCategory.toLowerCase()
  );

  return (
    <Canvas>
      <AppShell>
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-10 min-h-screen space-y-12">
          
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 pb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                  <GDPulseIcon className="w-6 h-6" />
                </div>
                <h1 className={typography.h1}>GD Pulse Battle Arena</h1>
              </div>
              <p className={typography.body}>
                Join live group discussion chambers, present structured arguments, and get assessed by real-time AI scoring.
              </p>
            </div>
            <Button onClick={() => setShowCreateModal(true)} variant="teal" className="shadow-sm">
              <PlusIcon className="w-4 h-4" /> Create Custom Room
            </Button>
          </div>

          {/* Trending Topics Carousel Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 tracking-wider uppercase flex items-center gap-2">
              <FireIcon className="text-orange-500 w-4 h-4 animate-bounce" /> Trending Discussion Seeders
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TRENDING_TOPICS.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    setCustomTopic(item.topic);
                    setCustomCategory(item.category);
                    setCustomDifficulty(item.difficulty);
                    setShowCreateModal(true);
                  }}
                  className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-semibold tracking-wider text-teal-600 uppercase bg-teal-50 px-2 py-0.5 rounded-md">
                        {item.category}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {item.heat}% Hot
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-800 leading-snug">
                      {item.topic}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 border-t border-slate-200/40 pt-3">
                    <span className="flex items-center gap-1">
                      <TargetIcon className="w-3.5 h-3.5 text-slate-400" /> {item.difficulty}
                    </span>
                    <span className="text-teal-600 hover:underline flex items-center gap-0.5">
                      Seed Room &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filter Ribbon */}
          <div className="flex flex-wrap gap-2 items-center border-b border-slate-100 pb-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  filterCategory === cat
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Live Battles Grid */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <ActivityIcon className="text-teal-500 animate-pulse w-5 h-5" /> Live & Upcoming Chambers
            </h2>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : filteredBattles.length === 0 ? (
              <SubtlePanel className="flex flex-col items-center justify-center text-center py-16 space-y-3">
                <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-500 mb-2">
                  <SparklesIcon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800">No active discussions here</h3>
                <p className="text-sm text-slate-500 max-w-sm">
                  Create a custom room or select a trending seeder above to kick off a brand new group discussion battle room.
                </p>
              </SubtlePanel>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBattles.map((room) => {
                  const isLive = room.status === 'active';
                  const isFull = (room.participantCount || 0) >= room.maxParticipants;
                  
                  return (
                    <Card key={room.id} className="relative flex flex-col justify-between space-y-6 min-h-[220px]">
                      {/* Top Bar Indicators */}
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold tracking-wider text-teal-600 uppercase bg-teal-50 px-2 py-0.5 rounded-md">
                          {room.category}
                        </span>
                        
                        {isLive ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-rose-500 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100 animate-pulse">
                            <ActivityIcon className="w-3.5 h-3.5" /> LIVE
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200/50">
                            WAITING
                          </span>
                        )}
                      </div>

                      {/* Topic Title */}
                      <div className="space-y-2 flex-grow">
                        <h3 className="text-base font-semibold text-slate-800 tracking-tight leading-snug">
                          {room.topic}
                        </h3>
                      </div>

                      {/* Footer Details */}
                      <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          {/* Participants Avatars */}
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                              {room.participants && room.participants.slice(0, 3).map((p, idx) => (
                                <div 
                                  key={idx}
                                  className="w-6 h-6 rounded-full border-2 border-white bg-teal-600 text-white flex items-center justify-center font-bold text-[9px]"
                                  title={p.name}
                                >
                                  {p.name?.charAt(0).toUpperCase()}
                                </div>
                              ))}
                              {room.participantCount > 3 && (
                                <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[8px]">
                                  +{room.participantCount - 3}
                                </div>
                              )}
                              {(!room.participants || room.participants.length === 0) && (
                                <div className="text-[11px] font-semibold text-slate-400 italic">No players yet</div>
                              )}
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500">
                              {room.participantCount || 0}/{room.maxParticipants}
                            </span>
                          </div>

                          {/* Difficulty badge */}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            room.difficulty === 'Easy' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : room.difficulty === 'Medium' 
                              ? 'bg-amber-50 text-amber-700' 
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            {room.difficulty}
                          </span>
                        </div>

                        {/* CTA button */}
                        <Button 
                          onClick={() => handleJoinBattle(room)}
                          variant={isLive ? "outline" : "teal"}
                          className="w-full justify-center !py-2 !rounded-lg text-xs"
                        >
                          {isLive ? "Spectate / Join" : "Enter Lobby"}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Create Room Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-8 space-y-6 relative animate-in fade-in zoom-in duration-200">
                <button 
                  onClick={() => {
                    setShowCreateModal(false);
                    setCustomTopic('');
                  }} 
                  className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <XIcon className="w-5 h-5" />
                </button>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900">Configure Discussion Chamber</h3>
                  <p className="text-xs text-slate-400">Initialize a new Group Discussion room seeded by your own theme.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chamber Topic</label>
                    <Input 
                      type="text" 
                      value={customTopic} 
                      onChange={(e) => setCustomTopic(e.target.value)}
                      placeholder="e.g. Is remote work really the future of tech companies?" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Topic Category</label>
                    <Select 
                      value={customCategory} 
                      onChange={(e) => setCustomCategory(e.target.value)}
                    >
                      <option value="Technology">Technology</option>
                      <option value="Work Culture">Work Culture</option>
                      <option value="Education">Education</option>
                      <option value="Finance">Finance</option>
                      <option value="Economics">Economics</option>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Complexity / Difficulty</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Easy', 'Medium', 'Hard'].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setCustomDifficulty(lvl)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                            customDifficulty === lvl
                              ? 'bg-slate-900 text-white border-slate-950 shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={createCustomRoom} 
                  disabled={isCreating || !customTopic.trim()}
                  variant="teal" 
                  className="w-full justify-center"
                >
                  {isCreating ? "Initializing Chamber..." : "Launch Chamber"}
                </Button>
              </div>
            </div>
          )}

        </div>
      </AppShell>
    </Canvas>
  );
}
