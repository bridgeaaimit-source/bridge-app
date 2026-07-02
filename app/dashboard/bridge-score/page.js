"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Trophy, 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronLeft, 
  ChevronRight,
  Brain, 
  Mic, 
  MessageSquare, 
  Target, 
  CheckCircle,
  TrendingUp,
  Activity,
  Sliders,
  Sparkles,
  Calendar,
  Clock,
  Award
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { useAuthBypass } from "@/hooks/useAuthBypass";

// Helper to generate calendar grids (42 days including previous/next overflow)
const getDaysInMonth = (year, month) => {
  const date = new Date(year, month, 1);
  const days = [];
  const startDayOfWeek = date.getDay();
  const prevMonthLastDate = new Date(year, month, 0).getDate();
  
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthLastDate - i),
      isCurrentMonth: false
    });
  }
  
  const lastDate = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= lastDate; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true
    });
  }
  
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false
    });
  }
  
  return days;
};

export default function BridgeScoreAnalysis() {
  const router = useRouter();
  const { isBypassed, mockUserData } = useAuthBypass();
  const [loading, setLoading] = useState(true);
  const [currentScore, setCurrentScore] = useState(0);
  const [focusAreas, setFocusAreas] = useState([]);
  const [currentBreakdown, setCurrentBreakdown] = useState({ cognitive: 0, competence: 0, communication: 0 });

  // Calendar and Day-wise states
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1)); // Default June 2026
  const [selectedDayStr, setSelectedDayStr] = useState("2026-06-28");
  const [activityMap, setActivityMap] = useState({});

  useEffect(() => {
    if (isBypassed && mockUserData) {
      const mockScore = mockUserData.stats.bridgeScore || 750;
      setCurrentScore(mockScore);
      
      const mockBreakdown = { cognitive: 248, competence: 300, communication: 202 };
      setCurrentBreakdown(mockBreakdown);
      calculateRecommendations(mockBreakdown);

      // Generate daily mock map aligned with user mockup history
      const mockMap = {
        "2026-06-01": {
          score: 700,
          change: 0,
          breakdown: { cognitive: 233, competence: 280, communication: 187 },
          activities: [{ name: "Resume Score Initial Upload", type: "resume", value: 700, positive: true }]
        },
        "2026-06-12": {
          score: 715,
          change: 15,
          breakdown: { cognitive: 248, competence: 280, communication: 187 },
          activities: [{ name: "Aptitude Area Training", type: "aptitude", value: 15, positive: true }]
        },
        "2026-06-20": {
          score: 735,
          change: 20,
          breakdown: { cognitive: 248, competence: 300, communication: 187 },
          activities: [{ name: "Smart Interview Practice", type: "interview", value: 20, positive: true }]
        },
        "2026-06-28": {
          score: 750,
          change: 15,
          breakdown: { cognitive: 248, competence: 300, communication: 202 },
          activities: [
            { name: "Smart Interview Practice", type: "interview", value: 12, positive: true },
            { name: "Group Discussion Battle", type: "gd", value: 3, positive: true }
          ]
        }
      };

      setActivityMap(mockMap);
      setSelectedDayStr("2026-06-28");
      setCurrentDate(new Date(2026, 5, 1));
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch user profile current score
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          let currentProfileScore = 750;
          let currentProfileBreakdown = { cognitive: 248, competence: 300, communication: 202 };
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const scoreVal = userData.bridgeScore;
            currentProfileScore = typeof scoreVal === 'number' ? scoreVal : parseInt(scoreVal) || 0;
            if (userData.breakdown) {
              currentProfileBreakdown = userData.breakdown;
            }
          }

          // Double-safe fetch of latest calculated score from subcollection
          try {
            const scoresRef = collection(db, "users", user.uid, "bridge_scores");
            const scoreQuery = query(scoresRef, orderBy("createdAt", "desc"), limit(1));
            const scoreSnap = await getDocs(scoreQuery);
            if (!scoreSnap.empty) {
              const latestData = scoreSnap.docs[0].data();
              currentProfileScore = latestData.score || currentProfileScore;
              if (latestData.breakdown) {
                currentProfileBreakdown = latestData.breakdown;
              }
            }
          } catch (err) {
            console.error("Error double-checking latest bridge score for calendar details:", err);
          }

          setCurrentScore(currentProfileScore);
          setCurrentBreakdown(currentProfileBreakdown);

          // Fetch historical calculated bridge scores
          const scoresRef = collection(db, "users", user.uid, "bridge_scores");
          const q = query(scoresRef, orderBy("createdAt", "desc"), limit(50));
          const snap = await getDocs(q);

          // Build the activityMap from real Firestore records
          const realMap = {};

          if (!snap.empty) {
            const scoreRecords = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            scoreRecords.forEach(r => {
              const dateObj = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt || Date.now());
              const dateStr = dateObj.toISOString().split("T")[0];
              
              if (!realMap[dateStr] || new Date(r.createdAt) > new Date(realMap[dateStr].createdAt)) {
                realMap[dateStr] = {
                  ...realMap[dateStr],
                  score: r.score,
                  breakdown: r.breakdown || { cognitive: 0, competence: 0, communication: 0 },
                  createdAt: r.createdAt,
                  activities: realMap[dateStr]?.activities || []
                };
              }
            });
          }

          // Fetch and merge Aptitude Scores
          try {
            const aptSnap = await getDocs(query(collection(db, "aptitudeScores"), where("uid", "==", user.uid)));
            aptSnap.forEach(d => {
              const data = d.data();
              const dateObj = data.completedAt?.toDate ? data.completedAt.toDate() : new Date(data.completedAt || Date.now());
              const dateStr = dateObj.toISOString().split("T")[0];
              
              if (!realMap[dateStr]) realMap[dateStr] = { activities: [] };
              realMap[dateStr].activities.push({
                name: `Aptitude: ${data.company || 'Test Practice'}`,
                type: 'aptitude',
                value: data.score || 0,
                positive: true
              });
            });
          } catch (err) {
            console.error("Error loading calendar aptitude scores:", err);
          }

          // Fetch and merge Interview Feedbacks
          try {
            const intSnap = await getDocs(collection(db, "users", user.uid, "interview_feedback"));
            intSnap.forEach(d => {
              const data = d.data();
              const dateObj = data.createdAt ? new Date(data.createdAt) : new Date(data.timestamp || Date.now());
              const dateStr = dateObj.toISOString().split("T")[0];
              
              if (!realMap[dateStr]) realMap[dateStr] = { activities: [] };
              const feedback = data.feedback || {};
              realMap[dateStr].activities.push({
                name: `Mock Interview: ${data.jobRole || 'Standard Round'}`,
                type: 'interview',
                value: feedback.overall_score || 0,
                positive: true
              });
            });
          } catch (err) {
            console.error("Error loading calendar interview scores:", err);
          }

          // Fetch and merge GD Sessions
          try {
            const gdSnap = await getDocs(query(collection(db, "users", user.uid, "gd_sessions"), where("status", "==", "REPORT_READY")));
            gdSnap.forEach(d => {
              const data = d.data();
              const dateObj = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now());
              const dateStr = dateObj.toISOString().split("T")[0];
              
              if (!realMap[dateStr]) realMap[dateStr] = { activities: [] };
              realMap[dateStr].activities.push({
                name: `GD Battle: ${data.topic || 'Discussion'}`,
                type: 'gd',
                value: data.overallScore || 0,
                positive: true
              });
            });
          } catch (err) {
            console.error("Error loading calendar GD sessions:", err);
          }

          setActivityMap(realMap);
          
          // Set initial selected day to latest day with activity or today
          const sortedDates = Object.keys(realMap).sort();
          if (sortedDates.length > 0) {
            const latestDateKey = sortedDates[sortedDates.length - 1];
            setSelectedDayStr(latestDateKey);
            const latestDateObj = new Date(latestDateKey);
            setCurrentDate(new Date(latestDateObj.getFullYear(), latestDateObj.getMonth(), 1));

            // Sync current breakdown to latest active day's breakdown
            const latestRecord = realMap[latestDateKey];
            if (latestRecord && latestRecord.breakdown) {
              setCurrentBreakdown(latestRecord.breakdown);
              calculateRecommendations(latestRecord.breakdown);
            }
          } else {
            const todayStr = new Date().toISOString().split("T")[0];
            setSelectedDayStr(todayStr);
            setCurrentDate(new Date());
          }

        } catch (error) {
          console.error("Error loading bridge score history:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isBypassed, mockUserData]);

  const calculateRecommendations = (breakdown) => {
    const cognitive = breakdown.cognitive || 0;
    const competence = breakdown.competence || 0;
    const communication = breakdown.communication || 0;

    const items = [];

    // Max limits: Cognitive (350), Competence (400), Communication (250)
    const cogPct = (cognitive / 350) * 100;
    const compPct = (competence / 400) * 100;
    const commPct = (communication / 250) * 100;

    if (cogPct < 75) {
      items.push({
        title: "Boost Cognitive Ability",
        desc: "Your quantitative and logical reasoning score is currently at " + Math.round(cogPct) + "%. Solve 3 hard aptitude puzzles to level up.",
        action: "Go to Aptitude Arena",
        href: "/aptitude",
        icon: Brain,
        color: "text-blue-600 bg-blue-50 border-blue-100"
      });
    }

    if (compPct < 75) {
      items.push({
        title: "Improve Coding & Technical Confidence",
        desc: "Your technical interview performance stands at " + Math.round(compPct) + "%. Complete an Advanced Technical Mock Interview to boost competence.",
        action: "Start Smart Interview",
        href: "/smart-interview",
        icon: Mic,
        color: "text-purple-600 bg-purple-50 border-purple-100"
      });
    }

    if (commPct < 75) {
      items.push({
        title: "Master Speech Pacing & Articulation",
        desc: "Articulation and flow stands at " + Math.round(commPct) + "%. Participating in a group battle improves live response formulation.",
        action: "Join GD Battle",
        href: "/pulse",
        icon: MessageSquare,
        color: "text-teal-600 bg-teal-50 border-teal-100"
      });
    }

    if (items.length === 0) {
      items.push({
        title: "Exceptional Placement Readiness",
        desc: "All indicators match top tiers! Keep your daily streak going to maintain your score profile.",
        action: "View Leaderboard",
        href: "/leaderboard",
        icon: Sparkles,
        color: "text-amber-600 bg-amber-50 border-amber-100"
      });
    }

    setFocusAreas(items);
  };

  const getIconColor = (type) => {
    switch (type) {
      case "aptitude": return "text-blue-500 bg-blue-50";
      case "interview": return "text-purple-500 bg-purple-50";
      case "gd": return "text-teal-500 bg-[#F0FDFA]";
      default: return "text-gray-500 bg-gray-50";
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "aptitude": return Brain;
      case "interview": return Mic;
      case "gd": return MessageSquare;
      default: return Target;
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysGrid = getDaysInMonth(currentYear, currentMonth);

  const formatDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getScoreForDay = (dateStr) => {
    const recordedDates = Object.keys(activityMap)
      .filter(d => activityMap[d].score !== undefined)
      .sort();
    
    const scoreDate = recordedDates.findLast(d => d <= dateStr);
    if (scoreDate) {
      return activityMap[scoreDate];
    }
    return {
      score: currentScore || 750,
      breakdown: currentBreakdown || { cognitive: 248, competence: 300, communication: 202 }
    };
  };

  const selectedDayData = activityMap[selectedDayStr] || {};
  const selectedDayScoreData = getScoreForDay(selectedDayStr);
  const selectedDayScore = selectedDayData.score || selectedDayScoreData.score;
  const selectedDayBreakdown = selectedDayData.breakdown || selectedDayScoreData.breakdown;
  const selectedDayActivities = selectedDayData.activities || [];

  return (
    <AppShell>
      <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-6 md:py-10">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>

        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900" style={{ fontFamily: "Syne, sans-serif" }}>
              BRIDGE Score Analysis
            </h1>
            <p className="text-gray-600 mt-1">Audit your placements readiness index and see daily score changes.</p>
          </div>
          <div className="flex items-center gap-2 bg-[#CCFBF1] text-[#0D9488] px-4 py-2 rounded-xl border border-[#99F6E4]">
            <Trophy className="w-5 h-5 shrink-0" />
            <span className="text-sm font-bold">Top 15% Percentile</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-[#0D9488]/30 border-t-[#0D9488] rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading audit history...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Overall Index and Recommendations */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              
              {/* Score Circular Display Card */}
              <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-3xl shadow-sm p-6 text-center flex flex-col items-center">
                <h3 className="font-bold text-gray-800 text-lg w-full text-left mb-6" style={{ fontFamily: "Syne, sans-serif" }}>
                  Current Index
                </h3>
                <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" fill="none" stroke="#cbd5e1" strokeWidth="8" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="44" 
                      fill="none" 
                      stroke="#0D9488" 
                      strokeWidth="8" 
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 44}
                      strokeDashoffset={2 * Math.PI * 44 - (2 * Math.PI * 44 * Math.min(currentScore, 1000) / 1000)} 
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-extrabold text-[#0D9488]">{currentScore || "—"}</span>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">out of 1000</span>
                  </div>
                </div>

                {/* Sub-Score Breakdown Lists */}
                <div className="w-full space-y-3 mt-4">
                  {[
                    { label: "Cognitive (Aptitude)", value: currentBreakdown.cognitive, max: 350, icon: Brain, color: "bg-blue-50 text-blue-600" },
                    { label: "Competence (Interviews)", value: currentBreakdown.competence, max: 400, icon: Mic, color: "bg-purple-50 text-purple-600" },
                    { label: "Communication (GD & Speech)", value: currentBreakdown.communication, max: 250, icon: MessageSquare, color: "bg-teal-50 text-teal-600" }
                  ].map(({ label, value, max, icon: Icon, color }) => (
                    <div key={label} className="flex items-center justify-between p-3 bg-slate-50/50 backdrop-blur-sm rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${color}`}>
                           <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">{label}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-900">{value} <span className="text-gray-400 font-normal">/ {max}</span></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Focus Areas Card */}
              <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-3xl shadow-sm p-6">
                <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2" style={{ fontFamily: "Syne, sans-serif" }}>
                  <Activity className="w-5 h-5 text-[#0D9488]" /> Focus Areas
                </h3>
                <div className="flex flex-col gap-4">
                  {focusAreas.map((area, index) => {
                    const Icon = area.icon;
                    return (
                      <div key={index} className={`p-4 rounded-xl border flex flex-col gap-3 ${area.color}`}>
                        <div>
                          <p className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                            <Icon className="w-4 h-4 shrink-0" /> {area.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{area.desc}</p>
                        </div>
                        <Link href={area.href} className="inline-flex items-center justify-center px-4 py-2 bg-[#0D9488] text-white rounded-lg text-xs font-bold hover:bg-[#0F766E] transition-colors self-start shadow-sm">
                          {area.action}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Day-wise Placement Activity Calendar */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Placement Activity Calendar Card */}
              <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-3xl shadow-sm p-6">
                
                {/* Header Month Selector */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2" style={{ fontFamily: "Syne, sans-serif" }}>
                      <Calendar className="w-5 h-5 text-[#0D9488]" /> Placement Calendar
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Hover over days to see scores; click to view activity details.</p>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-2 py-1">
                    <button 
                      onClick={handlePrevMonth}
                      className="p-1 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-100 text-slate-500 hover:text-slate-900"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-slate-700 min-w-[100px] text-center">
                      {monthNames[currentMonth]} {currentYear}
                    </span>
                    <button 
                      onClick={handleNextMonth}
                      className="p-1 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-100 text-slate-500 hover:text-slate-900"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Days of Week Header */}
                <div className="grid grid-cols-7 gap-2 text-center mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                    <span key={day} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {day}
                    </span>
                  ))}
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {daysGrid.map((dayObj, index) => {
                    const dateKey = formatDateKey(dayObj.date);
                    const dayData = activityMap[dateKey] || {};
                    const hasActivities = dayData.activities && dayData.activities.length > 0;
                    const dayScoreData = getScoreForDay(dateKey);
                    const dayScore = dayData.score || dayScoreData.score;
                    const isSelected = selectedDayStr === dateKey;
                    const dayNum = dayObj.date.getDate();

                    return (
                      <div 
                        key={index} 
                        onClick={() => {
                          if (dayObj.isCurrentMonth) {
                            setSelectedDayStr(dateKey);
                          }
                        }}
                        className={`group relative aspect-square rounded-xl border flex flex-col items-center justify-between p-2 cursor-pointer transition-all duration-200 select-none ${
                          !dayObj.isCurrentMonth 
                            ? "bg-slate-50/50 border-slate-50 text-slate-300 pointer-events-none" 
                            : isSelected
                              ? "bg-[#00C4A7]/10 border-[#00C4A7] ring-2 ring-[#00C4A7]/20 text-[#00C4A7] font-extrabold shadow-sm"
                              : hasActivities
                                ? "bg-[#00C4A7]/10 hover:bg-[#00C4A7]/20 border-[#00C4A7]/30 text-[#00C4A7] font-bold"
                                : "bg-white/40 hover:bg-white/60 border-white/20 text-slate-700 hover:border-white/40"
                        }`}
                      >
                        <span className="text-xs">{dayNum}</span>

                        {/* Tiny Indicator Dot if day has activities */}
                        {dayObj.isCurrentMonth && hasActivities && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                        )}

                        {/* Hover Tooltip */}
                        {dayObj.isCurrentMonth && (
                          <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 w-48 pointer-events-none">
                            <div className="bg-slate-900 text-white text-xs rounded-xl p-3 shadow-lg flex flex-col gap-1 w-full text-left">
                              <span className="font-bold text-[9px] text-slate-400">
                                {dayObj.date.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })}
                              </span>
                              <span className="font-extrabold text-teal-400">Bridge Score: {dayScore || "—"}</span>
                              <div className="border-t border-slate-700/60 mt-1 pt-1 space-y-1">
                                {hasActivities ? (
                                  dayData.activities.map((act, i) => (
                                    <div key={i} className="text-[10px] truncate">
                                      • {act.name}
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-[9px] text-slate-500">No activity logged</span>
                                )}
                              </div>
                            </div>
                            <div className="w-2.5 h-2.5 bg-slate-900 rotate-45 -mt-1.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Day Details Panel */}
              <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-3xl shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-50 mb-6">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected Day Audit</span>
                    <h4 className="text-base font-bold text-gray-900 mt-0.5">
                      {new Date(selectedDayStr).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h4>
                  </div>
                  
                  {/* Selected Day Score Indicator */}
                  <div className="flex items-center gap-2 bg-[#CCFBF1] text-[#0D9488] px-3 py-1.5 rounded-xl border border-[#99F6E4]">
                    <Award className="w-4 h-4 animate-pulse" />
                    <span className="text-xs font-extrabold">Score: {selectedDayScore || "—"}</span>
                  </div>
                </div>

                {/* Sub-scores breakdown for the selected day */}
                <div className="grid grid-cols-3 gap-3 py-3 px-4 bg-slate-50/50 backdrop-blur-sm rounded-xl text-center mb-6">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Cognitive</div>
                    <div className="text-xs font-extrabold text-slate-800 mt-1">
                      {selectedDayBreakdown?.cognitive !== undefined ? selectedDayBreakdown.cognitive : "—"}{" "}
                      <span className="text-[10px] text-slate-400 font-normal">/350</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Competence</div>
                    <div className="text-xs font-extrabold text-slate-800 mt-1">
                      {selectedDayBreakdown?.competence !== undefined ? selectedDayBreakdown.competence : "—"}{" "}
                      <span className="text-[10px] text-slate-400 font-normal">/400</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Communication</div>
                    <div className="text-xs font-extrabold text-slate-800 mt-1">
                      {selectedDayBreakdown?.communication !== undefined ? selectedDayBreakdown.communication : "—"}{" "}
                      <span className="text-[10px] text-slate-400 font-normal">/250</span>
                    </div>
                  </div>
                </div>

                {/* Selected Day Activity List */}
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider font-semibold">Placement Activities</p>
                  
                  {selectedDayActivities.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDayActivities.map((act, idx) => {
                        const ActIcon = getActivityIcon(act.type);
                        return (
                          <div key={idx} className="flex items-center justify-between p-3 border border-slate-100 hover:border-teal-200 rounded-xl hover:shadow-sm transition-all duration-200">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${getIconColor(act.type)}`}>
                                <ActIcon className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-800">{act.name}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide font-medium">{act.type} test completed</p>
                              </div>
                            </div>
                            
                            {act.type === "resume" ? (
                              <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">Baseline Score</span>
                            ) : act.positive ? (
                              <span className="text-xs font-bold text-teal-600 flex items-center bg-teal-50/50 px-2.5 py-1 rounded-lg border border-teal-100/50">
                                +{act.value} score points
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-red-500 flex items-center bg-red-50/50 px-2.5 py-1 rounded-lg border border-red-100/50">
                                -{act.value} score points
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 bg-slate-50/40">
                      <Clock className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-xs text-slate-500 font-medium">No placement activities logged on this day.</p>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-[280px]">Complete a mock interview, aptitude test, or group discussion to boost your scores!</p>
                      
                      <div className="flex gap-2 mt-4">
                        <Link href="/aptitude" className="text-[10px] font-bold text-white bg-[#0D9488] hover:bg-[#0F766E] px-3.5 py-1.5 rounded-xl transition-colors shadow-sm">
                          Aptitude Test
                        </Link>
                        <Link href="/smart-interview" className="text-[10px] font-bold text-[#0D9488] bg-teal-50 border border-teal-100 hover:bg-teal-100 px-3.5 py-1.5 rounded-xl transition-colors">
                          Mock Interview
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        )}

      </div>
    </AppShell>
  );
}
