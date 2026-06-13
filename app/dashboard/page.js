"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Mic, 
  Zap, 
  Trophy, 
  Flame, 
  MessageSquare, 
  Target, 
  Brain, 
  Star,
  ChevronRight
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { doc, collection, query, orderBy, limit, getDocs, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthBypass } from "@/hooks/useAuthBypass";
import GettingStartedChecklist from "@/components/onboarding/GettingStartedChecklist";
import OnboardingTour from "@/components/OnboardingTour";

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
    if (hour < 12) {
      setGreeting("Good Morning");
    } else if (hour < 17) {
      setGreeting("Good Afternoon");
    } else {
      setGreeting("Good Evening");
    }

    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setTodayDate(today.toLocaleDateString('en-US', options));

    // Auth bypass for testing
    if (isBypassed && mockUserData) {
      console.log('🔓 Auth bypass enabled - using test user');
      setUserName(mockUserData.user.name);
      setStats(mockUserData.stats);
      setBridgeScore(mockUserData.stats.bridgeScore);
      setRecentActivity(mockUserData.recentActivity);
      setLeaderboard(mockUserData.leaderboard);
      return;
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
          
          if (userSnap.exists()) {
            console.log('✅ Dashboard - User document exists');
            const userData = userSnap.data();
            console.log('📊 Dashboard - User data from Firestore:', userData);
            
            // Set user name from Firestore (more reliable than displayName)
            setUserName(userData.name || user.displayName || 'User');
            
            setResumeUploaded(!!userData.resumeUploaded);
            setUserProfile({ college: userData.college || '', name: userData.name || '' });
            const score = userData.bridgeScore;
            const userStats = {
              bridgeScore: typeof score === 'number' ? score : parseInt(score) || 0,
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
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);


  const features = [
    {
      icon: Mic,
      title: 'AI Mock Interview',
      description: 'Practice with real questions from top companies',
      href: '/interview',
      color: 'purple'
    },
    {
      icon: Zap,
      title: 'PULSE Feed',
      description: 'Stay updated with latest company insights',
      href: '/pulse',
      color: 'purple'
    },
    {
      icon: Brain,
      title: 'Smart Interview',
      description: 'Personalized interviews based on your resume',
      href: '/smart-interview',
      color: 'sky'
    }
  ];

  const getActivityIcon = (type) => {
    switch(type) {
      case 'interview': return Mic;
      case 'gd': return MessageSquare;
      case 'pulse': return Zap;
      case 'coach': return Brain;
      default: return Target;
    }
  };

  const getActivityColor = (type) => {
    switch(type) {
      case 'interview': return 'text-[#0D9488] bg-[#F0FDFA]';
      case 'gd': return 'text-green-600 bg-green-50';
      case 'pulse': return 'text-yellow-600 bg-yellow-50';
      case 'coach': return 'text-[#0D9488] bg-[#F0FDFA]';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const firstName = userName?.split(' ')[0] || 'there';
  const scorePercent = stats.bridgeScore ? Math.min(stats.bridgeScore / 10, 100) : 0;
  const circumference = 2 * Math.PI * 45;

  return (
    <AppShell>
      <OnboardingTour />
      <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-6 md:py-10">
        <GettingStartedChecklist stats={stats} userProfile={userProfile} resumeUploaded={resumeUploaded} />

        {/* Greeting */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-10 gap-3 mt-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1" >{todayDate}</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900" >{greeting}, {firstName} 👋</h2>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-10">
          {[
            { icon: Trophy, label: 'BRIDGE Score', value: stats.bridgeScore, bg: 'bg-[#CCFBF1]', color: 'text-[#0D9488]' },
            { icon: Mic,    label: 'Interviews',   value: stats.interviewsDone, bg: 'bg-blue-100', color: 'text-blue-600' },
            { icon: Flame,  label: 'Day Streak',   value: stats.currentStreak, bg: 'bg-orange-100', color: 'text-orange-500' },
            { icon: Star,   label: 'Avg Score',    value: stats.avgScore?.toFixed(1) ?? '0.0', bg: 'bg-green-100', color: 'text-green-600' },
          ].map(({ icon: Icon, label, value, bg, color }) => (
            <div key={label} className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(13,148,136,0.08)] border border-gray-100 flex flex-col items-center text-center hover:shadow-[0_4px_20px_rgba(13,148,136,0.16)] transition-shadow">
              <div className={`w-12 h-12 ${bg} rounded-full flex items-center justify-center mb-3`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <p className="text-xs text-gray-400 mb-1" >{label}</p>
              <p className="text-2xl md:text-3xl font-bold text-[#00685f]" >{value}</p>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

          {/* Left 2/3 */}
          <div className="lg:col-span-2 flex flex-col gap-8">

            {/* Today's Challenge Banner */}
            <div className="bg-gradient-to-r from-[#0D9488] to-[#14B8A6] rounded-2xl p-8 text-white relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6" data-tour="start-challenge">
              <div className="relative z-10">
                <span className="inline-block bg-white/20 text-white text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-white/30 mb-3">⚡ Today's Challenge</span>
                <h3 className="text-xl font-bold mb-2" >Complete Amazon SDE technical interview</h3>
                <p className="text-[#CCFBF1] text-sm max-w-md">Practice data structures and system design questions tailored to Amazon's hiring bar.</p>
              </div>
              <button onClick={handleStartChallenge} className="relative z-10 bg-white text-[#0D9488] font-bold px-6 py-3 rounded-full hover:bg-[#F0FDFA] transition-colors shrink-0 shadow-sm flex items-center gap-2 text-sm">
                Start Now <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute -right-6 -bottom-10 text-[140px] text-white/10 font-bold pointer-events-none select-none" >AI</div>
            </div>

            {/* Keep the Momentum */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-5" >Keep the momentum 🔥</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, i) => {
                  const Icon = feature.icon;
                  return (
                    <Link key={i} href={feature.href}
                      className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_4px_20px_rgba(13,148,136,0.05)] hover:shadow-[0_4px_20px_rgba(13,148,136,0.15)] hover:border-[#CCFBF1] transition-all group cursor-pointer">
                      <div className="w-10 h-10 bg-[#CCFBF1] rounded-xl flex items-center justify-center mb-4 text-[#0D9488] group-hover:bg-[#0D9488] group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-gray-900 mb-1" >{feature.title}</h4>
                      <p className="text-sm text-gray-500 mb-4">{feature.description}</p>
                      <div className="flex items-center gap-1 text-[#0D9488] text-xs font-bold">
                        <span>Continue</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right 1/3 */}
          <div className="flex flex-col gap-6">

            {/* Readiness Score Ring */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_4px_20px_rgba(13,148,136,0.08)] flex flex-col items-center" data-tour="bridge-score-card">
              <div className="w-full mb-4">
                <h3 className="font-bold text-gray-800" >Readiness Score</h3>
                <p className="text-xs text-gray-400">Top 15% of candidates</p>
              </div>
              <div className="relative w-44 h-44 flex items-center justify-center mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0D9488" />
                      <stop offset="100%" stopColor="#14B8A6" />
                    </linearGradient>
                  </defs>
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#CCFBF1" strokeWidth="8" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="url(#scoreGrad)"
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (circumference * scorePercent / 100)} />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold text-[#0D9488]" >
                    {stats.bridgeScore || '—'}
                  </span>
                  <span className="text-[10px] font-bold text-[#0D9488] bg-[#CCFBF1] px-2 py-0.5 rounded-full mt-1">
                    {stats.bridgeScore > 0 ? '+12 this week' : 'Start a mock'}
                  </span>
                </div>
              </div>
              <Link href="/interview" className="w-full text-center text-sm text-[#0D9488] font-semibold hover:bg-[#CCFBF1]/50 py-2 rounded-xl transition-colors">
                View detailed analysis →
              </Link>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_4px_20px_rgba(13,148,136,0.05)]">
              <h3 className="font-bold text-gray-800 mb-5" >Recent Activity</h3>
              <div className="flex flex-col gap-4">
                {recentActivity.length > 0 ? (
                  recentActivity.slice(0, 4).map((activity, i) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getActivityColor(activity.type)}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{activity.title}</p>
                          <p className="text-xs text-gray-400">{activity.score ? `Scored ${activity.score} • ` : ''}{activity.time}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 mb-3">No activity yet — start your first mock!</p>
                    <Link href="/interview" className="inline-flex items-center gap-1 px-4 py-2 bg-[#0D9488] text-white text-sm rounded-xl font-semibold hover:opacity-90 transition-opacity">
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
