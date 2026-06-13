"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Trophy, 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronLeft, 
  Brain, 
  Mic, 
  MessageSquare, 
  Target, 
  CheckCircle,
  TrendingUp,
  Activity,
  Sliders,
  Sparkles
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { useAuthBypass } from "@/hooks/useAuthBypass";

// Curated mock data for week-wise history in bypass mode
const mockWeeklyHistory = [
  {
    weekLabel: "Week 1 (Baseline)",
    dateRange: "May 11 - May 17, 2026",
    score: 680,
    change: 0,
    breakdown: {
      cognitive: 220, // max 350
      competence: 240, // max 400
      communication: 220 // max 250
    },
    activities: [
      { name: "Resume Score Initial Upload", value: 680, type: "resume" }
    ]
  },
  {
    weekLabel: "Week 2",
    dateRange: "May 18 - May 24, 2026",
    score: 710,
    change: 30,
    breakdown: {
      cognitive: 245,
      competence: 240,
      communication: 225
    },
    activities: [
      { name: "Aptitude (Quant & Logical)", value: 25, type: "aptitude", positive: true },
      { name: "Group Discussion Practice", value: 5, type: "gd", positive: true }
    ]
  },
  {
    weekLabel: "Week 3",
    dateRange: "May 25 - May 31, 2026",
    score: 735,
    change: 25,
    breakdown: {
      cognitive: 245,
      competence: 260,
      communication: 230
    },
    activities: [
      { name: "Smart Interview (SDE Mock)", value: 20, type: "interview", positive: true },
      { name: "Group Discussion (Hiring Batch)", value: 5, type: "gd", positive: true }
    ]
  },
  {
    weekLabel: "Week 4 (Current)",
    dateRange: "June 1 - June 7, 2026",
    score: 750,
    change: 15,
    breakdown: {
      cognitive: 245,
      competence: 270,
      communication: 235
    },
    activities: [
      { name: "Smart Interview (HR Practice)", value: 10, type: "interview", positive: true },
      { name: "Group Discussion (Live Battle)", value: 5, type: "gd", positive: true }
    ]
  }
];

export default function BridgeScoreAnalysis() {
  const router = useRouter();
  const { isBypassed, mockUserData } = useAuthBypass();
  const [loading, setLoading] = useState(true);
  const [currentScore, setCurrentScore] = useState(0);
  const [weeklyHistory, setWeeklyHistory] = useState([]);
  const [focusAreas, setFocusAreas] = useState([]);
  const [currentBreakdown, setCurrentBreakdown] = useState({ cognitive: 0, competence: 0, communication: 0 });

  useEffect(() => {
    if (isBypassed && mockUserData) {
      setCurrentScore(mockUserData.stats.bridgeScore || 750);
      setWeeklyHistory(mockWeeklyHistory.reverse());
      
      const latest = mockWeeklyHistory[0]; // Already reversed, so index 0 is Week 4
      setCurrentBreakdown(latest.breakdown);
      calculateRecommendations(latest.breakdown);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch historical calculated bridge scores
          const scoresRef = collection(db, "users", user.uid, "bridge_scores");
          const q = query(scoresRef, orderBy("createdAt", "desc"), limit(20));
          const snap = await getDocs(q);

          if (snap.empty) {
            // Synthesize default mock history based on their current score or defaults
            setCurrentScore(750);
            setWeeklyHistory(mockWeeklyHistory.reverse());
            setCurrentBreakdown(mockWeeklyHistory[0].breakdown);
            calculateRecommendations(mockWeeklyHistory[0].breakdown);
          } else {
            const records = snap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));

            // Group by calendar week (Monday to Sunday)
            const weeksMap = {};
            records.forEach(r => {
              const date = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt || Date.now());
              const startOfWeek = new Date(date);
              const day = startOfWeek.getDay();
              const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
              startOfWeek.setDate(diff);
              startOfWeek.setHours(0, 0, 0, 0);

              const key = startOfWeek.toISOString().split("T")[0];
              // Keep the latest record for each week
              if (!weeksMap[key] || new Date(r.createdAt) > new Date(weeksMap[key].createdAt)) {
                weeksMap[key] = r;
              }
            });

            const sortedKeys = Object.keys(weeksMap).sort();
            const formattedHistory = sortedKeys.map((key, index) => {
              const current = weeksMap[key];
              const prev = index > 0 ? weeksMap[sortedKeys[index - 1]] : null;

              const curScore = current.score || 0;
              const prevScore = prev ? (prev.score || 0) : curScore;
              const scoreDiff = curScore - prevScore;

              const curBreakdown = current.breakdown || { cognitive: 0, competence: 0, communication: 0 };
              const prevBreakdown = prev ? (prev.breakdown || { cognitive: 0, competence: 0, communication: 0 }) : curBreakdown;

              const cognitiveDiff = curBreakdown.cognitive - prevBreakdown.cognitive;
              const competenceDiff = curBreakdown.competence - prevBreakdown.competence;
              const communicationDiff = curBreakdown.communication - prevBreakdown.communication;

              // Synthesize activities from difference
              const activities = [];
              if (cognitiveDiff !== 0) {
                activities.push({
                  name: "Aptitude Arena Performance",
                  value: Math.abs(cognitiveDiff),
                  type: "aptitude",
                  positive: cognitiveDiff > 0
                });
              }
              if (competenceDiff !== 0) {
                activities.push({
                  name: "Smart Interview Session",
                  value: Math.abs(competenceDiff),
                  type: "interview",
                  positive: competenceDiff > 0
                });
              }
              if (communicationDiff !== 0) {
                activities.push({
                  name: "GD Battle Participation",
                  value: Math.abs(communicationDiff),
                  type: "gd",
                  positive: communicationDiff > 0
                });
              }

              // Fallback default for baseline week
              if (activities.length === 0 && index === 0) {
                activities.push({ name: "Initial Score Assessment", value: curScore, type: "resume" });
              }

              const weekNum = index + 1;
              const startRange = new Date(key);
              const endRange = new Date(startRange);
              endRange.setDate(startRange.getDate() + 6);

              const dateStr = `${startRange.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endRange.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

              return {
                weekLabel: `Week ${weekNum}${index === sortedKeys.length - 1 ? " (Current)" : ""}`,
                dateRange: dateStr,
                score: curScore,
                change: scoreDiff,
                breakdown: curBreakdown,
                activities
              };
            });

            // Reverse for newest first
            const finalHistory = formattedHistory.reverse();
            setWeeklyHistory(finalHistory);

            if (finalHistory.length > 0) {
              setCurrentScore(finalHistory[0].score);
              setCurrentBreakdown(finalHistory[0].breakdown);
              calculateRecommendations(finalHistory[0].breakdown);
            }
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
            <p className="text-gray-600 mt-1">Audit your placements readiness index and see weekly score changes.</p>
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
              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(13,148,136,0.06)] p-6 text-center flex flex-col items-center">
                <h3 className="font-bold text-gray-800 text-lg w-full text-left mb-6" style={{ fontFamily: "Syne, sans-serif" }}>
                  Current Index
                </h3>
                <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" fill="none" stroke="#F3F4F6" strokeWidth="8" />
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
                    <div key={label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
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
              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(13,148,136,0.06)] p-6">
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

            {/* Right Column: Weekly Changes Log Timeline */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(13,148,136,0.06)] p-6 h-full">
                <h3 className="font-bold text-gray-800 text-lg mb-8 flex items-center gap-2" style={{ fontFamily: "Syne, sans-serif" }}>
                  <TrendingUp className="w-5 h-5 text-[#0D9488]" /> Weekly Audit Log
                </h3>
                
                <div className="relative pl-6 border-l border-teal-100 space-y-10 py-2">
                  {weeklyHistory.map((week, index) => (
                    <div key={index} className="relative group">
                      
                      {/* Timeline Dot Indicator */}
                      <span className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                        week.change > 0 
                          ? "bg-teal-500 ring-4 ring-teal-50" 
                          : week.change < 0 
                            ? "bg-red-400 ring-4 ring-red-50" 
                            : "bg-gray-400 ring-4 ring-gray-50"
                      }`} />

                      {/* Card Segment */}
                      <div className="bg-white border border-gray-100 hover:border-teal-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                          <div>
                            <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">{week.weekLabel}</span>
                            <h4 className="font-bold text-gray-900 text-base mt-1.5">{week.dateRange}</h4>
                          </div>
                          
                          {/* Score and Change Indicators */}
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-extrabold text-[#0D9488]">{week.score}</span>
                            {week.change > 0 ? (
                              <span className="flex items-center gap-0.5 text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-full border border-teal-100">
                                <ArrowUpRight className="w-3.5 h-3.5" /> +{week.change}
                              </span>
                            ) : week.change < 0 ? (
                              <span className="flex items-center gap-0.5 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">
                                <ArrowDownRight className="w-3.5 h-3.5" /> {week.change}
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                                No Change
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Breakdown Sub-Scores in Card */}
                        <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-gray-50 rounded-lg text-center mb-4">
                          <div>
                            <div className="text-[10px] text-gray-400 uppercase font-bold">Cognitive</div>
                            <div className="text-sm font-bold text-gray-800 mt-0.5">{week.breakdown.cognitive} <span className="text-[10px] text-gray-400 font-normal">/350</span></div>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-400 uppercase font-bold">Competence</div>
                            <div className="text-sm font-bold text-gray-800 mt-0.5">{week.breakdown.competence} <span className="text-[10px] text-gray-400 font-normal">/400</span></div>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-400 uppercase font-bold">Communication</div>
                            <div className="text-sm font-bold text-gray-800 mt-0.5">{week.breakdown.communication} <span className="text-[10px] text-gray-400 font-normal">/250</span></div>
                          </div>
                        </div>

                        {/* Audit Details */}
                        <div>
                          <p className="text-xs font-bold text-gray-500 mb-2.5 uppercase tracking-wider">Placement Audit Summary</p>
                          <div className="space-y-2">
                            {week.activities.map((act, actIdx) => {
                              const ActIcon = getActivityIcon(act.type);
                              return (
                                <div key={actIdx} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-b-0">
                                  <div className="flex items-center gap-2">
                                    <div className={`p-1 rounded-md ${getIconColor(act.type)}`}>
                                      <ActIcon className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="font-semibold text-gray-700">{act.name}</span>
                                  </div>
                                  
                                  {act.type === "resume" ? (
                                    <span className="font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">Baseline Score</span>
                                  ) : act.positive ? (
                                    <span className="font-bold text-teal-600 flex items-center">+{act.value} score points</span>
                                  ) : (
                                    <span className="font-bold text-red-500 flex items-center">-{act.value} score points</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

          </div>
        )}

      </div>
    </AppShell>
  );
}
