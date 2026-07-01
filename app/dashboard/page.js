"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Award,
  Flame,
  Star,
  ClipboardList,
  Lock,
  CheckCircle2,
  BookOpen,
  Share2,
  Calendar,
  Compass,
  Play
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { doc, collection, query, orderBy, limit, getDocs, getDoc, setDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthBypass } from "@/hooks/useAuthBypass";
import GettingStartedChecklist from "@/components/onboarding/GettingStartedChecklist";
import OnboardingTour from "@/components/OnboardingTour";
import { m } from "framer-motion";
import { 
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  AreaChart,
  Area
} from 'recharts';

import {
  TrophyIcon,
  SmartInterviewIcon,
  StreakIcon,
  StarIcon,
  GDPulseIcon,
  AptitudeArenaIcon,
  CareerIntelligenceIcon,
  JobsIcon,
  PlacementReadinessIcon,
  BridgeScoreIcon
} from '@/components/DesignSystem';

// Helper to generate dynamic learning history scores
const generateDynamicHistory = (latestScore) => {
  const scoreVal = typeof latestScore === 'number' ? latestScore : parseInt(latestScore) || 0;
  
  const w1 = Math.max(0, scoreVal - 70);
  const w2 = Math.max(w1, scoreVal - 40);
  const w3 = Math.max(w2, scoreVal - 15);
  const w4 = scoreVal;
  
  const ch4 = w4 - w3;
  const ch3 = w3 - w2;
  const ch2 = w2 - w1;
  
  const detailsW4 = [];
  if (ch4 > 0) {
    detailsW4.push(`Smart Interview +${Math.round(ch4 * 0.7)}`);
    detailsW4.push(`Group Discussion +${ch4 - Math.round(ch4 * 0.7)}`);
  }
  
  const detailsW3 = [];
  if (ch3 > 0) {
    detailsW3.push(`Smart Interview +${Math.round(ch3 * 0.8)}`);
    detailsW3.push(`Group Discussion +${ch3 - Math.round(ch3 * 0.8)}`);
  }

  const detailsW2 = [];
  if (ch2 > 0) {
    detailsW2.push(`Aptitude +${Math.round(ch2 * 0.8)}`);
    detailsW2.push(`Group Discussion +${ch2 - Math.round(ch2 * 0.8)}`);
  }
  
  return [
    {
      weekDate: "Week of June 1",
      score: w4,
      change: ch4,
      details: detailsW4
    },
    {
      weekDate: "Week of May 25",
      score: w3,
      change: ch3,
      details: detailsW3
    },
    {
      weekDate: "Week of May 18",
      score: w2,
      change: ch2,
      details: detailsW2
    }
  ];
};

// Helper to generate Recharts AreaChart data based on timeframe
const generateLineChartData = (currentScore, timeframe) => {
  const scoreVal = typeof currentScore === 'number' ? currentScore : parseInt(currentScore) || 0;
  const points = timeframe === 'week' ? 7 : 30;
  const data = [];
  const today = new Date();
  
  for (let i = points - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    
    // Generate a steady progress curve ending at currentScore
    const progressFactor = 1 - (i / (points - 1)) * 0.25; // Starts at 75% of current score
    const randomNoise = (Math.sin(i * 1.5) * 0.03); // minor wiggle
    const score = Math.max(0, Math.round(scoreVal * (progressFactor + randomNoise)));
    const finalScore = i === 0 ? scoreVal : score;
    
    data.push({
      name: dateStr,
      score: finalScore
    });
  }

  // Calculate day-over-day score differences
  for (let idx = 0; idx < data.length; idx++) {
    const prev = idx > 0 ? data[idx - 1].score : data[idx].score;
    data[idx].change = data[idx].score - prev;
  }
  
  return data;
};

// Shaded Graph Tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const diff = dataPoint.change;
    const diffText = diff >= 0 ? `+${diff}` : `${diff}`;
    
    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-[11px] font-bold shadow-xl border border-slate-800">
        <p className="text-slate-400 font-semibold">{label}</p>
        <p className="mt-1 flex items-center gap-1.5">
          Score: <span className="text-[#00C4A7] font-extrabold">{dataPoint.score}</span>
        </p>
        <p className="text-[10px] text-slate-400 font-medium">
          Change: <span className={diff >= 0 ? "text-[#00C4A7]" : "text-red-400"}>{diffText}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const router = useRouter();
  const [greeting, setGreeting] = useState("");
  const [todayDate, setTodayDate] = useState("");
  const [userName, setUserName] = useState("");
  const [stats, setStats] = useState({
    bridgeScore: 0,
    interviewsDone: 0,
    currentStreak: 0,
    avgScore: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [timeframe, setTimeframe] = useState("week"); // "week" or "month"

  const { isBypassed, mockUserData } = useAuthBypass();

  const handleStartChallenge = () => {
    router.push('/smart-interview');
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    setIsMounted(true);
    const hour = new Date().getHours();
    let computedGreeting = "Good Evening";
    if (hour < 12) {
      computedGreeting = "Good Morning";
    } else if (hour < 17) {
      computedGreeting = "Good Afternoon";
    }

    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const computedDate = today.toLocaleDateString('en-US', options);

    // Defer state updates to avoid React's synchronous render lint warning
    const timer = setTimeout(() => {
      setGreeting(computedGreeting);
      setTodayDate(computedDate);
    }, 0);

    // Auth bypass for testing
    if (isBypassed && mockUserData) {
      console.log('🔓 Auth bypass enabled - using test user');
      const timerBypass = setTimeout(() => {
        setUserName(mockUserData.user.name);
        setStats(mockUserData.stats);
        setRecentActivity(mockUserData.recentActivity);
        setScoreHistory(generateDynamicHistory(mockUserData.stats.bridgeScore));
        setResumeUploaded(true);
      }, 0);
      return () => {
        clearTimeout(timer);
        clearTimeout(timerBypass);
      };
    }

    // Load real user data from Firestore
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('🔑 Dashboard - User authenticated:', user.uid, user.email);
        try {
          setUserName(user.displayName || 'User');
          
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          const defaultStats = {
            bridgeScore: 0,
            interviewsDone: 0,
            currentStreak: 0,
            avgScore: 0
          };

          let currentScoreVal = 0;
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setUserName(userData.name || user.displayName || 'User');
            setResumeUploaded(!!userData.resumeUploaded);
            setUserProfile({ college: userData.college || '', name: userData.name || '' });
            
            const score = userData.bridgeScore;
            let currentScoreVal = typeof score === 'number' ? score : parseInt(score) || 0;

            // Double-safe fetch of latest score from subcollection
            try {
              const scoresRef = collection(db, "users", user.uid, "bridge_scores");
              const scoreQuery = query(scoresRef, orderBy("createdAt", "desc"), limit(1));
              const scoreSnap = await getDocs(scoreQuery);
              if (!scoreSnap.empty) {
                currentScoreVal = scoreSnap.docs[0].data().score || currentScoreVal;
              }
            } catch (err) {
              console.error("Error double-checking latest bridge score:", err);
            }

            const userStats = {
              bridgeScore: currentScoreVal,
              interviewsDone: userData.interviewsDone || 0,
              currentStreak: userData.streak || 0,
              avgScore: userData.avgScore || 0
            };
            setStats(userStats);

            // Trigger background recalculation of Bridge Score & Streak
            fetch(`/api/bridge-score?userId=${user.uid}`)
              .then(res => res.json())
              .then(data => {
                if (data && data.score !== undefined) {
                  setStats(prev => ({
                    ...prev,
                    bridgeScore: data.score || prev.bridgeScore,
                    currentStreak: data.streak !== undefined ? data.streak : prev.currentStreak
                  }));
                }
              })
              .catch(err => console.error("Error refreshing bridge stats on load:", err));
          } else {
            // Create user document if it doesn't exist
            await setDoc(userRef, {
              uid: user.uid,
              name: user.displayName || 'User',
              email: user.email || '',
              photo: user.photoURL || '',
              role: 'student',
              approved: true,
              bridgeScore: 0,
              interviewsDone: 0,
              avgScore: 0,
              streak: 0,
              domains: [],
              skills: [],
              college: '',
              degree: '',
              location: '',
              lookingFor: 'Full-time',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            setUserName(user.displayName || 'User');
            setStats(defaultStats);
            currentScoreVal = 0;
          }

          // Fetch recent completed activities in parallel (Interviews, GDs, Aptitudes)
          const activities = [];
          try {
            const interviewsRef = collection(db, 'users', user.uid, 'interview_feedback');
            const interviewsQuery = query(interviewsRef, orderBy('createdAt', 'desc'), limit(5));
            const gdRef = collection(db, 'users', user.uid, 'gd_sessions');
            const gdQuery = query(gdRef, orderBy('createdAt', 'desc'), limit(5));
            const aptRef = collection(db, 'aptitudeScores');
            const aptQuery = query(aptRef, where('uid', '==', user.uid), orderBy('completedAt', 'desc'), limit(5));

            const [interviewsSnap, gdSnap, aptSnap] = await Promise.all([
              getDocs(interviewsQuery).catch(() => ({ empty: true, docs: [] })),
              getDocs(gdQuery).catch(() => ({ empty: true, docs: [] })),
              getDocs(aptQuery).catch(() => ({ empty: true, docs: [] }))
            ]);

            interviewsSnap.docs?.forEach(doc => {
              const data = doc.data();
              const dateVal = data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : new Date();
              activities.push({
                type: 'interview',
                title: `Mock Interview: ${data.round || data.type || 'Standard'}`,
                time: getTimeAgo(dateVal),
                score: data.feedback?.scores?.answer_quality || data.feedback?.overall_score || data.score || 0,
                date: dateVal
              });
            });

            gdSnap.docs?.forEach(doc => {
              const data = doc.data();
              if (data.status === 'REPORT_READY') {
                const dateVal = data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : new Date();
                activities.push({
                  type: 'gd',
                  title: `Group Discussion: ${data.topic || 'AI Evaluation'}`,
                  time: getTimeAgo(dateVal),
                  score: data.score || 0,
                  date: dateVal
                });
              }
            });

            aptSnap.docs?.forEach(doc => {
              const data = doc.data();
              const dateVal = data.completedAt ? (data.completedAt.toDate ? data.completedAt.toDate() : new Date(data.completedAt)) : new Date();
              activities.push({
                type: 'aptitude',
                title: `Aptitude Test: ${data.section || 'General'}`,
                time: getTimeAgo(dateVal),
                score: data.score || 0,
                date: dateVal
              });
            });

            activities.sort((a, b) => b.date - a.date);
          } catch (err) {
            console.error("Error loading recent activities:", err);
          }
          setRecentActivity(activities.slice(0, 5));

          // Fetch score history
          try {
            const scoreQuery = query(
              collection(db, 'users', user.uid, 'bridge_scores'),
              orderBy('createdAt', 'desc'),
              limit(10)
            );
            const scoreSnap = await getDocs(scoreQuery);
            if (!scoreSnap.empty) {
              const records = scoreSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              const weeksMap = {};
              records.forEach(r => {
                const date = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt || Date.now());
                const startOfWeek = new Date(date);
                const day = startOfWeek.getDay();
                const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
                startOfWeek.setDate(diff);
                startOfWeek.setHours(0, 0, 0, 0);
                const key = startOfWeek.toISOString().split("T")[0];
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

                const details = [];
                if (competenceDiff > 0) details.push(`Smart Interview +${competenceDiff}`);
                else if (competenceDiff < 0) details.push(`Smart Interview ${competenceDiff}`);

                if (cognitiveDiff > 0) details.push(`Aptitude +${cognitiveDiff}`);
                else if (cognitiveDiff < 0) details.push(`Aptitude ${cognitiveDiff}`);

                if (communicationDiff > 0) details.push(`Group Discussion +${communicationDiff}`);
                else if (communicationDiff < 0) details.push(`Group Discussion ${communicationDiff}`);

                const startRange = new Date(key);
                const dateStr = `Week of ${startRange.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

                return {
                  weekDate: dateStr,
                  score: curScore,
                  change: scoreDiff,
                  details
                };
              });
              setScoreHistory(formattedHistory.reverse().slice(0, 3));
            } else {
              setScoreHistory(generateDynamicHistory(currentScoreVal));
            }
          } catch (scoreHistoryErr) {
            console.error('Error fetching score history:', scoreHistoryErr);
            setScoreHistory(generateDynamicHistory(currentScoreVal));
          }

        } catch (error) {
          console.error('Error loading user data:', error);
        }
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBypassed, mockUserData]);

  const getActivityIcon = (type) => {
    switch(type) {
      case 'interview': return SmartInterviewIcon;
      case 'gd': return GDPulseIcon;
      case 'aptitude': return AptitudeArenaIcon;
      default: return BridgeScoreIcon;
    }
  };

  const getActivityColor = (type) => {
    switch(type) {
      case 'interview': return 'text-[#00C4A7] bg-[#00C4A7]/10';
      case 'gd': return 'text-purple-600 bg-purple-50';
      case 'aptitude': return 'text-blue-600 bg-blue-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const firstName = userName?.split(' ')[0] || 'there';
  
  // Bridge score calculations (Always out of 1000)
  const isOutOf1000 = true;
  const scorePercent = stats.bridgeScore 
    ? Math.min(stats.bridgeScore / 10, 100)
    : 0;
  const circumference = 2 * Math.PI * 45;

  const getScoreRating = (score) => {
    const s = isOutOf1000 ? score : score * 10;
    if (s >= 900) return 'Exceptional';
    if (s >= 800) return 'Excellent';
    if (s >= 700) return 'Very Good';
    if (s >= 600) return 'Good';
    return 'Placement Prep';
  };

  // Mappings for stats breakdowns (radar spider web score)
  const radarData = [
    { subject: 'Aptitude', value: stats.bridgeScore ? Math.min(100, Math.round((stats.bridgeScore * 0.75) % 100)) : 94 },
    { subject: 'Communication', value: stats.avgScore ? Math.min(100, Math.round(stats.avgScore * 10)) : 96 },
    { subject: 'Technical', value: stats.bridgeScore ? Math.min(100, Math.round((stats.bridgeScore * 0.8) % 100)) : 92 },
    { subject: 'Problem Solving', value: stats.bridgeScore ? Math.min(100, Math.round((stats.bridgeScore * 0.73) % 100)) : 97 },
    { subject: 'Personality', value: stats.bridgeScore ? Math.min(100, Math.round((stats.bridgeScore * 0.68) % 100)) : 95 }
  ];

  // Line Chart Data
  const lineChartData = generateLineChartData(stats.bridgeScore || 0, timeframe);

  // Suggested Tasks Config (Select exactly 2 based on user stats priority)
  const getRecommendedTasks = () => {
    const tasks = [
      {
        title: "Mock Interview",
        subtitle: "Practice system design & coding questions",
        xp: "+100 XP",
        time: "30 min",
        action: () => router.push('/smart-interview'),
        priority: stats.interviewsDone < 5 ? 3 : 1
      },
      {
        title: "Aptitude Test",
        subtitle: "Quantitative & analytical assessment",
        xp: "+75 XP",
        time: "20 min",
        action: () => router.push('/aptitude'),
        priority: stats.avgScore < 80 ? 3 : 1
      },
      {
        title: "GD Practice",
        subtitle: "Join a live group discussion room",
        xp: "+100 XP",
        time: "45 min",
        action: () => router.push('/gd/ai'),
        priority: stats.interviewsDone < 10 ? 2 : 1
      },
      {
        title: "Read News",
        subtitle: "Stay updated with tech industry trends",
        xp: "+50 XP",
        time: "10 min",
        action: () => router.push('/news-pulse'),
        priority: 1
      }
    ];

    // Sort by priority descending, return any two
    return tasks.sort((a, b) => b.priority - a.priority).slice(0, 2);
  };

  const currentTasks = getRecommendedTasks();

  // Placement roadmap parameters
  const isResumeCompleted = resumeUploaded;
  const isAptitudeCompleted = stats.avgScore > 0;
  const isInterviewCompleted = stats.interviewsDone > 0;
  const isGDCompleted = stats.interviewsDone > 1;

  const showJourneyCard = !(isResumeCompleted && isAptitudeCompleted && isInterviewCompleted && isGDCompleted);

  const journeySteps = [
    { label: "Resume Score", status: isResumeCompleted ? "Completed" : "Action Required" },
    { label: "Aptitude", status: isAptitudeCompleted ? "Completed" : "In Progress" },
    { label: "Interview", status: isInterviewCompleted ? "Completed" : "Pending" },
    { label: "GD Practice", status: isGDCompleted ? "Completed" : "Pending" }
  ];

  const completedCount = journeySteps.filter(s => s.status === "Completed").length;
  const progressPercent = (completedCount / journeySteps.length) * 100;

  // Format Aptitude score nicely
  const getDisplayAptitude = () => {
    if (!stats.avgScore) return 96;
    if (stats.avgScore <= 10) return Math.round(stats.avgScore * 10);
    return Math.round(stats.avgScore);
  };

  return (
    <AppShell>
      <OnboardingTour />
      
      {/* Dynamic ambient glassmesh background */}
      <div className="fixed inset-0 bg-[linear-gradient(135deg,#f0f7ff_0%,#ffffff_100%)] opacity-30 pointer-events-none z-0" />
      <div 
        className="fixed inset-0 bg-cover bg-center opacity-[0.08] pointer-events-none z-0"
        style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBcTzpqwsf9YotP3ZLEVFduk6XgAjdUsqbZFW_IEjra55hRVBf9bOqiHAQvgiIEXkGkx3eUPkQ7npDBhJFmMAGhLsdvMAfagnUdAHqlSt7aPwLTuY9zJWRDe5z-jBbbFcs5bQp-tgnUQIwqEQNstqQ-0WKYfbCm0oWWbD4TTrlC1kjyjlCwvE0okx_AGMu4Oh1bpRtbUQQ5SLI_7t07zb4wq_XaGTbt5IXr8J94RpQdzdG46Et56j9_7yKfE17dZcEWGACl_gChZ3A")' }} 
      />

      <div className="relative max-w-[1240px] mx-auto px-6 py-8 z-10">
        <GettingStartedChecklist stats={stats} userProfile={userProfile} resumeUploaded={resumeUploaded} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
          
          {/* ── LEFT COLUMN (2/3 WIDTH) ── */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Header Greeting */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{todayDate || "TUESDAY, JULY 1, 2025"}</p>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-1">{greeting}, {firstName}!</h2>
              <p className="text-sm text-slate-500 mt-1.5">You're making great progress towards your dream placement. Keep up the consistency!</p>
            </div>

            {/* 4 Stats Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              {/* Card 1: Aptitude Score */}
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Aptitude Score</p>
                    <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{getDisplayAptitude()}</h4>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-[#00C4A7]">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-[10px]">
                  <span className="font-bold text-[#00C4A7]">↑ 4</span>
                  <span className="text-slate-400">this week</span>
                </div>
              </div>

              {/* Card 2: Mocks Taken */}
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mocks Taken</p>
                    <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{stats.interviewsDone || 24}</h4>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-[10px]">
                  <span className="font-bold text-purple-600">↑ 5</span>
                  <span className="text-slate-400">this week</span>
                </div>
              </div>

              {/* Card 3: Days Streak */}
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Days Streak</p>
                    <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{stats.currentStreak || 7}</h4>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                    <Flame className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4 text-[10px]">
                  <span className="font-semibold text-orange-500">Keep it going!</span>
                </div>
              </div>

              {/* Card 4: Batch Rank */}
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Batch Rank</p>
                    <h4 className="text-2xl font-extrabold text-slate-800 mt-1">Top 18%</h4>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                    <Star className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-[10px]">
                  <span className="font-bold text-blue-600">↑ 4%</span>
                  <span className="text-slate-400">this week</span>
                </div>
              </div>

            </div>

            {/* Placement Journey Timeline - Auto-hides when all completed */}
            {showJourneyCard && (
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00C4A7]" /> Placement Journey
                  </h3>
                  <button 
                    onClick={() => router.push('/career-gps')}
                    className="bg-slate-50 border border-slate-200/60 hover:bg-slate-100 text-slate-700 px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all"
                  >
                    View Roadmap
                  </button>
                </div>

                <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 py-2">
                  
                  {/* Horizontal line indicators */}
                  <div className="hidden md:block absolute left-6 right-6 top-[22px] h-[3px] bg-slate-100 z-0" />
                  <div className="hidden md:block absolute left-6 top-[22px] h-[3px] bg-[#00C4A7] z-10 transition-all duration-550"
                       style={{ width: `${Math.max(10, progressPercent - 12.5)}%` }} />

                  {journeySteps.map((step, idx) => {
                    const isCompleted = step.status === "Completed";
                    const isInProgress = step.status === "In Progress" || step.status === "Action Required";
                    const isLocked = step.status === "Locked";
                    
                    return (
                      <div key={idx} className="flex md:flex-col items-center gap-3 md:text-center z-20 w-full md:w-auto relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-all ${
                          isCompleted 
                            ? "bg-[#00C4A7] text-white" 
                            : isInProgress 
                            ? "bg-white border-2 border-[#00C4A7] text-[#00C4A7]"
                            : isLocked
                            ? "bg-slate-100 text-slate-400 border border-slate-200"
                            : "bg-white border border-slate-200 text-slate-500"
                        }`}>
                          {isCompleted ? "✓" : isLocked ? <Lock className="w-3 h-3" /> : idx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{step.label}</p>
                          <p className={`text-[9px] font-bold mt-0.5 uppercase ${
                            isCompleted 
                              ? "text-[#00C4A7]" 
                              : isInProgress 
                              ? "text-orange-500" 
                              : "text-slate-400"
                          }`}>{step.status}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Performance Overview (Shaded Recharts Area Chart) */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Performance Overview</h3>
                  <p className="text-[10px] text-slate-400">Your performance trend over the selected timeframe</p>
                </div>
                <select 
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold px-3 py-1.5 focus:outline-none cursor-pointer"
                >
                  <option value="week">This Week</option>
                  <option value="month">Last Month</option>
                </select>
              </div>

              <div className="w-full h-64 mt-4 relative">
                {isMounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={lineChartData} margin={{ top: 15, right: 15, left: -25, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00C4A7" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#00C4A7" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#f1f5f9" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        domain={isOutOf1000 ? [0, 1000] : [0, 100]} 
                        ticks={isOutOf1000 ? [0, 250, 500, 750, 1000] : [0, 25, 50, 75, 100]}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#00C4A7" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorScore)"
                        dot={{ r: timeframe === 'week' ? 4 : 2, strokeWidth: 2, fill: "#fff" }}
                        activeDot={{ r: 6 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Today's Recommended Tasks (Any Two) */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-[#00C4A7]" /> Today's Recommended Tasks
                </h3>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200/50 px-2.5 py-1 rounded-full uppercase">
                  2 tasks recommended
                </span>
              </div>

              <div className="space-y-3 mt-4">
                {currentTasks.map((task, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#00C4A7]">
                        <Compass className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{task.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{task.subtitle}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-[#00C4A7] bg-teal-50 px-2 py-0.5 rounded-md">{task.xp}</span>
                        <p className="text-[9px] text-slate-400 mt-1 font-semibold">{task.time}</p>
                      </div>
                      <button 
                        onClick={task.action}
                        className="bg-white border border-slate-200/60 hover:border-[#00C4A7] hover:text-[#00C4A7] text-slate-700 px-4 py-2 rounded-xl text-[10px] font-bold shadow-sm transition-all"
                      >
                        Start Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-center">
                <button 
                  onClick={() => router.push('/career-intelligence')}
                  className="text-[11px] font-bold text-[#00C4A7] hover:underline"
                >
                  View All Tasks →
                </button>
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN (1/3 WIDTH) ── */}
          <div className="space-y-6">
            
            {/* Bridge Score Circle Gauge & Spider Web Radar Chart */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col items-center">
              <div className="w-full mb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#00C4A7]" /> Bridge Score
                </h3>
              </div>

              {/* Circular SVG Gauge */}
              <div className="relative w-40 h-40 mt-2 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="7" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#00C4A7"
                    strokeWidth="7" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (circumference * scorePercent / 100)} 
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-extrabold text-slate-800">
                    {stats.bridgeScore !== undefined ? stats.bridgeScore : "—"}
                  </span>
                  <span className="text-[9px] font-bold text-[#00C4A7] bg-teal-50 px-2 py-0.5 rounded-full mt-1.5 uppercase tracking-wide">
                    {getScoreRating(stats.bridgeScore || 0)}
                  </span>
                  <span className="text-[8px] text-slate-400 font-bold mt-1">TOP 18%</span>
                </div>
              </div>

              {/* Spider Web Radar Chart (Aptitude & Other breakdowns) */}
              <div className="w-full mt-6 border-t border-slate-50 pt-4 flex flex-col items-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider self-start mb-2">Skill Profile</p>
                
                <div className="w-full h-52 flex items-center justify-center relative">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                        <PolarGrid stroke="#f1f5f9" />
                        <PolarAngleAxis 
                          dataKey="subject" 
                          tick={{ fill: '#64748b', fontSize: 9, fontWeight: 'bold' }} 
                        />
                        <PolarRadiusAxis 
                          angle={30} 
                          domain={[0, 100]} 
                          tick={false} 
                          axisLine={false} 
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }}
                          itemStyle={{ color: '#00C4A7', fontWeight: 'bold' }}
                        />
                        <Radar 
                          name="Score" 
                          dataKey="value" 
                          stroke="#00C4A7" 
                          fill="#00C4A7" 
                          fillOpacity={0.2} 
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <Link 
                href="/dashboard/bridge-score" 
                className="w-full text-center text-[10px] font-bold text-[#00C4A7] hover:underline mt-4 pt-2 border-t border-slate-50"
              >
                View Detailed Analysis →
              </Link>
            </div>

            {/* Practice Streak */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-orange-500" /> Practice Streak
              </h3>
              <p className="text-[10px] font-extrabold text-slate-700">{stats.currentStreak || 7} Day Streak</p>
              <p className="text-[9px] text-slate-400 mt-0.5">Amazing consistency! Protect your score multiplier.</p>

              {/* Duolingo Calendar Map */}
              <div className="grid grid-cols-7 gap-2 text-center text-[9px] font-bold text-slate-500 mt-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                {['M','T','W','T','F','S','S'].map((day, idx) => {
                  const limitVal = stats.currentStreak || 7;
                  const isChecked = idx < limitVal;
                  
                  return (
                    <div key={idx} className="flex flex-col gap-1.5 items-center">
                      <span>{day}</span>
                      {isChecked ? (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#00C4A7] text-white shadow-sm text-[10px]">
                          ✓
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-300">
                          
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Recent Activity</h3>
                <button className="text-[10px] font-bold text-[#00C4A7] hover:underline">View All</button>
              </div>

              <div className="space-y-4 mt-2">
                {recentActivity.length > 0 ? (
                  recentActivity.slice(0, 3).map((activity, i) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <div key={i} className="flex items-start gap-3 group">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${getActivityColor(activity.type)}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-grow border-b border-slate-50 pb-2">
                          <p className="text-xs font-bold text-slate-850">{activity.title}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            {activity.score ? `Scored ${activity.score} • ` : ''}{activity.time}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex gap-3 group">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-purple-600 bg-purple-50">
                      <SmartInterviewIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-grow border-b border-slate-50 pb-2">
                      <p className="text-xs font-bold text-slate-800">Mock Interview Completed</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">Frontend Developer Role</p>
                      <span className="text-[8px] text-slate-400 font-bold uppercase">2h ago</span>
                    </div>
                  </div>
                )}
                
                {recentActivity.length === 0 && (
                  <>
                    <div className="flex gap-3 group">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-[#00C4A7] bg-[#00C4A7]/10">
                        <GDPulseIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-grow border-b border-slate-50 pb-2">
                        <p className="text-xs font-bold text-slate-800">GD Practice Session</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Technical GD - AI Ethics</p>
                        <span className="text-[8px] text-slate-400 font-bold uppercase">5h ago</span>
                      </div>
                    </div>
                    <div className="flex gap-3 group">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-blue-500 bg-blue-50">
                        <Compass className="w-4 h-4" />
                      </div>
                      <div className="flex-grow pb-2">
                        <p className="text-xs font-bold text-slate-800">Resume Updated</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Software Engineer Resume</p>
                        <span className="text-[8px] text-slate-400 font-bold uppercase">1d ago</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>



          </div>

        </div>
      </div>
    </AppShell>
  );
}
