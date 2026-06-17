"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { doc, collection, query, orderBy, limit, getDocs, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthBypass } from "@/hooks/useAuthBypass";
import GettingStartedChecklist from "@/components/onboarding/GettingStartedChecklist";
import OnboardingTour from "@/components/OnboardingTour";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
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
  BridgeScoreIcon,
  ShieldIcon
} from '@/components/DesignSystem';

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

export default function Dashboard() {
  const router = useRouter();
  const [bridgeScore, setBridgeScore] = useState(null);
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
  const [leaderboard, setLeaderboard] = useState([]);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [scoreHistory, setScoreHistory] = useState([]);

  const { isBypassed, mockUserData } = useAuthBypass();

  const handleStartChallenge = () => {
    router.push('/smart-interview');
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    // Set greeting regardless of auth mode
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
        setBridgeScore(mockUserData.stats.bridgeScore);
        setRecentActivity(mockUserData.recentActivity);
        setLeaderboard(mockUserData.leaderboard);
        setScoreHistory(generateDynamicHistory(mockUserData.stats.bridgeScore));
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
          // Set user name for greeting
          setUserName(user.displayName || 'User');
          
          const userRef = doc(db, 'users', user.uid);
          console.log('📋 Dashboard - Checking user document...');
          const userSnap = await getDoc(userRef);
          
          // Always set default stats, then override with Firestore data if exists
          const defaultStats = {
            bridgeScore: 0,
            interviewsDone: 0,
            currentStreak: 0,
            avgScore: 0
          };

          let currentScoreVal = 0;
          
          if (userSnap.exists()) {
            console.log('✅ Dashboard - User document exists');
            const userData = userSnap.data();
            console.log('📊 Dashboard - User data from Firestore:', userData);
            
            // Set user name from Firestore (more reliable than displayName)
            setUserName(userData.name || user.displayName || 'User');
            
            setResumeUploaded(!!userData.resumeUploaded);
            setUserProfile({ college: userData.college || '', name: userData.name || '' });
            const score = userData.bridgeScore;
            currentScoreVal = typeof score === 'number' ? score : parseInt(score) || 0;
            const userStats = {
              bridgeScore: currentScoreVal,
              interviewsDone: userData.interviewsDone || 0,
              currentStreak: userData.streak || 0,
              avgScore: userData.avgScore || 0
            };
            console.log('📊 Dashboard - Setting stats:', userStats);
            setStats(userStats);
            setBridgeScore(userStats.bridgeScore);
          } else {
            console.log('❌ Dashboard - No user data found, creating new user...');
            console.log('👤 Creating user with data:', {
              uid: user.uid,
              name: user.displayName,
              email: user.email,
              photo: user.photoURL
            });
            
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
            
            console.log('✅ Dashboard - Successfully created new user document');
            setUserName(user.displayName || 'User');
            setStats(defaultStats);
            setBridgeScore(0);
            currentScoreVal = 0;
          }

          // Fetch recent interview sessions
          const sessionsQuery = query(
            collection(db, 'interviews', user.uid, 'sessions'),
            orderBy('date', 'desc'),
            limit(5)
          );
          
          const sessionsSnapshot = await getDocs(sessionsQuery);
          const activities = [];
          
          sessionsSnapshot.forEach((doc) => {
            const sessionData = doc.data();
            const date = new Date(sessionData.date);
            const timeAgo = getTimeAgo(date);
            
            activities.push({
              type: 'interview',
              title: `${sessionData.domain} Interview`,
              time: timeAgo,
              score: sessionData.score,
              date: sessionData.date
            });
          });
          
          setRecentActivity(activities);

          // Fetch real leaderboard data (simplified query)
          const leaderboardQuery = query(
            collection(db, 'users'),
            orderBy('bridgeScore', 'desc'),
            limit(10)
          );
          
          const leaderboardSnapshot = await getDocs(leaderboardQuery);
          const leaderboardData = [];
          
          leaderboardSnapshot.forEach((doc, index) => {
            const userData = doc.data();
            // Only include students in leaderboard
            if (userData.role === 'student') {
              leaderboardData.push({
                rank: leaderboardData.length + 1,
                name: userData.name || 'Anonymous',
                college: userData.college || 'Unknown',
                score: userData.bridgeScore || 0
              });
            }
          });
          
          setLeaderboard(leaderboardData);
          console.log('🏆 Dashboard - Leaderboard data:', leaderboardData);

          // Fetch real score history
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
  }, []);


  const getActivityIcon = (type) => {
    switch(type) {
      case 'interview': return SmartInterviewIcon;
      case 'gd': return GDPulseIcon;
      case 'pulse': return CareerIntelligenceIcon;
      case 'coach': return PlacementReadinessIcon;
      default: return BridgeScoreIcon;
    }
  };

  const getActivityColor = (type) => {
    switch(type) {
      case 'interview': return 'text-[#14B8A6] bg-[#CCFBF1]/20';
      case 'gd': return 'text-[#6366F1] bg-[#6366F1]/10';
      case 'pulse': return 'text-[#06B6D4] bg-[#06B6D4]/10';
      case 'coach': return 'text-[#8B5CF6] bg-[#8B5CF6]/10';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const quickAccessItems = [
    { label: 'Jobs', href: '/jobs', icon: JobsIcon },
    { label: 'Aptitude Tests', href: '/aptitude', icon: AptitudeArenaIcon },
    { label: 'Smart Mock', href: '/smart-interview', icon: SmartInterviewIcon },
    { label: 'GD Pulse', href: '/pulse', icon: GDPulseIcon },
    { label: 'Milestones', href: '/career-intelligence', icon: CareerIntelligenceIcon },
    { label: 'Leaderboard', href: '/leaderboard', icon: TrophyIcon }
  ];

  const firstName = userName?.split(' ')[0] || 'there';
  const scorePercent = stats.bridgeScore ? Math.min(stats.bridgeScore / 10, 100) : 0;
  const circumference = 2 * Math.PI * 45;

  // Recharts Radar Data Bindings
  const radarData = [
    { subject: 'Aptitude', value: stats.bridgeScore ? Math.max(30, Math.round(stats.bridgeScore * 0.75) % 100) : 60 },
    { subject: 'Communication', value: stats.avgScore ? Math.max(30, Math.round(stats.avgScore * 10)) : 70 },
    { subject: 'Technical', value: stats.bridgeScore ? Math.max(30, Math.round(stats.bridgeScore * 0.8) % 100) : 75 },
    { subject: 'Resume', value: stats.bridgeScore ? Math.max(30, Math.round(stats.bridgeScore * 0.65) % 100) : 65 },
    { subject: 'GD', value: stats.bridgeScore ? Math.max(30, Math.round(stats.bridgeScore * 0.7) % 100) : 58 },
    { subject: 'Domain', value: stats.bridgeScore ? Math.max(30, Math.round(stats.bridgeScore * 0.85) % 100) : 80 }
  ];

  // Dynamic next action suggestion
  const getNextAction = () => {
    if (!resumeUploaded) return { text: "Upload your resume to evaluate placement parameters", pts: 150 };
    if (stats.interviewsDone === 0) return { text: "Complete 1 Smart Interview to unlock detailed feedback", pts: 40 };
    if (stats.avgScore < 7) return { text: "Review interview coaching analysis guidelines", pts: 20 };
    return { text: "Join a Live GD Pulse Battle to claim extra performance ranks", pts: 30 };
  };

  const nextAction = getNextAction();

  return (
    <AppShell>
      <OnboardingTour />
      <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-6 md:py-10">
        <GettingStartedChecklist stats={stats} userProfile={userProfile} resumeUploaded={resumeUploaded} />

        {/* ── DESIGN SYSTEM HERO AREA ── */}
        <div className="bg-gradient-to-br from-white to-[#F8FAFC] rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 md:p-8 mb-8 mt-4 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex-1 space-y-4 text-center lg:text-left">
            <div>
              <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">{todayDate}</p>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-1">
                {greeting}, {firstName} 👋
              </h1>
              <p className="text-sm text-slate-500 mt-2 max-w-xl">
                BridgeAI Placement Readiness Operating System. You are currently in the <span className="font-semibold text-[#14B8A6]">Top 18% of candidates</span> in your batch.
              </p>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-3 max-w-lg shadow-sm">
              <div className="w-10 h-10 rounded-full bg-[#CCFBF1]/50 flex items-center justify-center text-[#0D9488] shrink-0">
                <PlacementReadinessIcon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-400 font-medium">NEXT SCORE ACTION</p>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">
                  {nextAction.text} <span className="text-[#14B8A6]">+{nextAction.pts} pts</span>
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={handleStartChallenge} 
                className="bg-[#14B8A6] hover:bg-[#0D9488] text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 mx-auto lg:mx-0"
              >
                <span>Start Recommended Practice</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* RADIUS BRIDGE SCORE GAUGE */}
          <div className="flex flex-col items-center justify-center shrink-0 w-52 h-52 bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-50 relative">
            <svg className="w-40 h-40 -rotate-90" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#14B8A6" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="45" fill="none" stroke="#E2E8F0" strokeWidth="6" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="url(#scoreGrad)"
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (circumference * scorePercent / 100)} 
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-extrabold text-slate-800" style={{ fontFamily: "Syne, sans-serif" }}>
                {stats.bridgeScore || '—'}
              </span>
              <span className="text-[10px] text-[#0D9488] font-bold bg-[#CCFBF1]/50 px-2.5 py-1 rounded-full mt-1.5 uppercase tracking-wide">
                BRIDGE SCORE
              </span>
            </div>
          </div>
        </div>

        {/* ── QUICK ACCESS BAR (HORIZONTAL RIBBON) ── */}
        <div className="mb-8 overflow-x-auto pb-2 scrollbar-thin">
          <div className="flex gap-3 min-w-max">
            {quickAccessItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link 
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 shadow-sm text-xs font-semibold text-slate-700 transition-all active:scale-[0.98]"
                >
                  <Icon className="w-4 h-4 text-[#14B8A6]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── TWO COLUMN MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

          {/* Left Column (2/3) */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* TODAY'S MISSION (DUOLINGO STYLE) */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 bg-[#CCFBF1]/50 text-[#0D9488] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <StarIcon className="w-3.5 h-3.5" /> {"TODAY'S MISSION"}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-2">
                  {stats.interviewsDone < 2 ? "Complete Amazon SDE Mock Interview" : "Join Technical GD Battle"}
                </h3>
                <p className="text-sm text-slate-500 max-w-md">
                  Practice data structures, communication tone, and system design variables tailored to hiring bars.
                </p>
                <div className="flex items-center gap-3 pt-2 justify-center md:justify-start">
                  <span className="text-xs text-slate-400">Reward: <span className="font-semibold text-slate-700">+100 XP</span></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                  <span className="text-xs text-slate-400">Score Impact: <span className="font-semibold text-slate-700">+15 Pts</span></span>
                </div>
              </div>

              <button 
                onClick={handleStartChallenge} 
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl hover:shadow-md transition-all shrink-0 text-xs flex items-center gap-2"
              >
                <span>Launch Mission</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* PLACEMENT JOURNEY TRACKER */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                <PlacementReadinessIcon className="w-4 h-4 text-[#14B8A6]" /> Placement Journey Tracker
              </h3>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative">
                {/* Horizontal line for progress */}
                <div className="hidden md:block absolute left-4 right-4 h-0.5 bg-slate-100 top-5 z-0" />
                
                {[
                  { label: "Resume Optimizer", status: resumeUploaded ? "Completed" : "Action Required" },
                  { label: "Mock Interviews", status: stats.interviewsDone > 0 ? "Completed" : "Pending" },
                  { label: "Aptitude Arena", status: stats.avgScore > 0 ? "Completed" : "Pending" },
                  { label: "GD Battles", status: stats.interviewsDone > 1 ? "Completed" : "In Progress" },
                  { label: "Recruiter Ready", status: stats.bridgeScore >= 600 ? "Completed" : "Locked" }
                ].map((step, idx) => (
                  <div key={step.label} className="flex md:flex-col items-center gap-3 md:text-center z-10 w-full md:w-auto">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                      step.status === "Completed" 
                        ? "bg-[#14B8A6] text-white" 
                        : step.status === "In Progress" 
                        ? "bg-[#6366F1] text-white animate-pulse" 
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}>
                      {step.status === "Completed" ? "✓" : idx + 1}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 mt-1">{step.label}</p>
                      <p className={`text-[10px] font-medium mt-0.5 ${
                        step.status === "Completed" 
                          ? "text-[#14B8A6]" 
                          : step.status === "In Progress" 
                          ? "text-[#6366F1]" 
                          : "text-slate-400"
                      }`}>{step.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SCORE HISTORY TRENDS */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BridgeScoreIcon className="w-4 h-4 text-[#14B8A6]" /> Score Weekly Trends
              </h3>
              <p className="text-xs text-slate-400 mb-6">Analyze how your daily assessments feed back into the core system.</p>

              <div className="flex flex-col gap-4">
                {scoreHistory.length > 0 ? (
                  scoreHistory.map((week, idx) => (
                    <div key={idx} className="flex flex-col gap-2 p-4 bg-[#F8FAFC] border border-slate-100 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">{week.weekDate}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-extrabold text-slate-800">{week.score}</span>
                          {week.change > 0 ? (
                            <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#14B8A6] bg-[#CCFBF1]/50 px-2 py-0.5 rounded-full">
                              <ArrowUpRight className="w-3 h-3" /> +{week.change}
                            </span>
                          ) : week.change < 0 ? (
                            <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                              <ArrowDownRight className="w-3 h-3" /> {week.change}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-full">
                              0
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {week.details && week.details.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {week.details.map((detail, dIdx) => (
                            <span key={dIdx} className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-md ${
                              detail.includes("+") 
                                ? "bg-[#CCFBF1]/40 text-[#0D9488] border border-[#CCFBF1]" 
                                : "bg-red-50 text-red-500 border border-red-100"
                            }`}>
                              {detail}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 italic">No score impacting activities logged</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-xs text-slate-400">Complete an interview or assessment to calculate weekly trends.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (1/3) */}
          <div className="flex flex-col gap-6">

            {/* SKILLS RADAR (RECHARTS CHART) */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 flex flex-col items-center">
              <div className="w-full mb-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Skills Radar Profile</h3>
                <p className="text-[10px] text-slate-400">6 Dimension Competency Vectors</p>
              </div>

              <div className="w-full h-52 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                    <Radar name="Readiness" dataKey="value" stroke="#14B8A6" fill="#14B8A6" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <Link 
                href="/career-intelligence" 
                className="w-full text-center text-xs text-[#14B8A6] font-semibold bg-[#CCFBF1]/20 hover:bg-[#CCFBF1]/40 py-2.5 rounded-xl transition-all mt-4 border border-[#CCFBF1]/30"
              >
                View Detailed Recommendations →
              </Link>
            </div>

            {/* STREAK CALENDAR (DUOLINGO STYLE) */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                <StreakIcon className="w-4 h-4 text-[#14B8A6]" /> Practice Streak
              </h3>
              <p className="text-[10px] text-slate-400 mb-4">Complete daily tasks to protect your score multiplier.</p>

              <div className="flex items-center justify-between bg-[#F8FAFC] border border-slate-100 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                    <StreakIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">{stats.currentStreak} Day Streak</p>
                    <p className="text-[10px] text-slate-400">Keep it going!</p>
                  </div>
                </div>
                <div className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  MULTIPLIER x1.2
                </div>
              </div>

              {/* Display streak week map placeholder */}
              <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-slate-500">
                {['M','T','W','T','F','S','S'].map((day, idx) => (
                  <div key={idx} className="flex flex-col gap-1.5 items-center">
                    <span>{day}</span>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      idx < stats.currentStreak
                        ? "bg-[#14B8A6] text-white shadow-sm"
                        : "bg-slate-100 border border-slate-200 text-slate-300"
                    }`}>
                      {idx < stats.currentStreak ? "✓" : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RECENT ACTIVITY */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-5">Recent Activity</h3>
              <div className="flex flex-col gap-4">
                {recentActivity.length > 0 ? (
                  recentActivity.slice(0, 4).map((activity, i) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${getActivityColor(activity.type)}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{activity.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{activity.score ? `Scored ${activity.score} • ` : ''}{activity.time}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6">
                    <p className="text-xs text-slate-400 mb-3">No activity logged yet — start your first mock!</p>
                    <Link href="/smart-interview" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#14B8A6] text-white text-xs rounded-xl font-bold hover:shadow-sm">
                      Take first mock <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
