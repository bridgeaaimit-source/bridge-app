"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Home, 
  Mic, 
  Zap, 
  Trophy, 
  User, 
  Bell, 
  Flame, 
  Briefcase, 
  MessageSquare, 
  TrendingUp, 
  Target, 
  Brain, 
  Calendar,
  ArrowUp,
  ArrowDown,
  Clock,
  Award,
  Star,
  ChevronRight
} from "lucide-react";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { doc, collection, query, orderBy, limit, getDocs, getDoc, where, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthBypass } from "@/hooks/useAuthBypass";
import { motion } from "framer-motion";
import GettingStartedChecklist from "@/components/onboarding/GettingStartedChecklist";
import InfoTooltip from "@/components/onboarding/InfoTooltip";

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

  const { isBypassed, mockUserData } = useAuthBypass();

  const handleStartChallenge = () => {
    router.push('/smart-interview');
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
            
            const score = userData.bridgeScore;
            const userStats = {
              bridgeScore: typeof score === 'number' ? score : parseInt(score) || 500,
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
              bridgeScore: 500,
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

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

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

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Getting Started Checklist */}
        <div className="pt-6">
          <GettingStartedChecklist stats={stats} userProfile={null} />
        </div>

        {/* Greeting Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {greeting}, {firstName} 👋
              </h1>
              <p className="text-gray-600">Here's your placement prep summary for today</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">{todayDate}</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 lg:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100"
          data-tour="bridge-score-stat"
          >
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#CCFBF1] rounded-full flex items-center justify-center">
                <Trophy className="w-5 h-5 lg:w-6 lg:h-6 text-[#0D9488]" />
              </div>
              <div className="flex items-center text-green-600 text-xs lg:text-sm hidden sm:flex">
                <ArrowUp className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                <span>+12</span>
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-bold gradient-text mb-1">
              {stats.bridgeScore === 0 ? "—" : stats.bridgeScore}
            </div>
            <div className="text-xs lg:text-sm text-gray-600 flex items-center gap-1">
              {stats.bridgeScore === 0 ? "Complete an interview to get your score" : "BRIDGE Score"}
              <InfoTooltip text="Your overall placement readiness score out of 1000. Every activity pushes it higher." />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Mic className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
              </div>
              <div className="flex items-center text-green-600 text-xs lg:text-sm hidden sm:flex">
                <ArrowUp className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                <span>+3</span>
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-bold text-gray-900  mb-1">{stats.interviewsDone}</div>
            <div className="text-xs lg:text-sm text-gray-600">Interviews Done</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100"
          data-tour="streak-card"
          >
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Flame className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600" />
              </div>
              <div className="flex items-center text-red-600 text-xs lg:text-sm hidden sm:flex">
                <ArrowDown className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                <span>-1</span>
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-bold text-gray-900  mb-1">{stats.currentStreak} <span className="text-lg lg:text-base">🔥</span></div>
            <div className="text-xs lg:text-sm text-gray-600 flex items-center gap-1">
              {stats.currentStreak === 0 ? <span className="text-orange-500">Start your streak today!</span> : "Current Streak"}
              <InfoTooltip text="Consecutive days you've practiced on Bridge. Keep it alive!" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
              </div>
              <div className="flex items-center text-green-600 text-xs lg:text-sm hidden sm:flex">
                <ArrowUp className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                <span>+0.3</span>
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-bold text-gray-900  mb-1">{stats.avgScore.toFixed(1)}</div>
            <div className="text-xs lg:text-sm text-gray-600 flex items-center gap-1">
              Avg Score
              <InfoTooltip text="AI-measured average score from your last 5 mock interviews." />
            </div>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Continue Preparing */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Continue Preparing</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <Link
                      key={index}
                      href={feature.href}
                      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-[#CCFBF1] transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                            feature.color === 'purple' ? 'bg-gradient-to-br from-[#F0FDFA] to-[#CCFBF1]' :
                            'bg-gradient-to-br from-sky-50 to-sky-100'
                          }`}>
                            <Icon className={`w-7 h-7 ${
                              feature.color === 'purple' ? 'text-[#0D9488]' :
                              'text-sky-600'
                            }`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-[#0D9488] transition-colors">
                              {feature.title}
                            </h3>
                            <p className="text-sm text-gray-600">{feature.description}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#0D9488] transition-colors" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Today's Challenge */}
            <div className="bg-gradient-to-r from-[#0D9488] to-[#14B8A6] rounded-2xl p-6 text-white" data-tour="start-challenge">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Today's Challenge</h2>
                <div className="flex items-center gap-2 text-[#CCFBF1]">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">15 min</span>
                </div>
              </div>
              <p className="text-[#CCFBF1] mb-6">
                Complete a full Amazon SDE technical interview with AI feedback
              </p>
              <button onClick={handleStartChallenge} className="bg-white text-[#0D9488] px-6 py-3 rounded-lg font-semibold hover:bg-[#F0FDFA] transition-colors">
                Start Challenge
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* BRIDGE Score Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100" data-tour="bridge-score-card">
              <h3 className="font-semibold text-gray-900 mb-4">BRIDGE Score</h3>
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 mb-4">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#E5E7EB"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="url(#gradient)"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56 * 0.742} ${2 * Math.PI * 56}`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0D9488" />
                        <stop offset="100%" stopColor="#14B8A6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold gradient-text">
                      {stats.bridgeScore === 0 ? "—" : stats.bridgeScore}
                    </div>
                    <div className="text-xs text-gray-500">
                      {stats.bridgeScore === 0 ? "Complete an interview to get your score" : "BRIDGE Score"}
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  {stats.bridgeScore > 0 ? (
                    <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                      <Award className="w-3 h-3 mr-1" />
                      Top 15%
                    </span>
                  ) : (
                    <Link href="/interview" className="text-sm text-[#0D9488] hover:text-[#0F766E] font-medium">
                      Take a mock to unlock your score →
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.slice(0, 5).map((activity, index) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{activity.title}</div>
                          <div className="text-xs text-gray-500">{activity.time}</div>
                        </div>
                        {activity.score && <div className="text-sm font-semibold text-green-600">{activity.score}</div>}
                        {activity.result && <div className="text-xs font-semibold text-green-600">{activity.result}</div>}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6">
                    {/* Simple SVG illustration */}
                    <svg className="w-16 h-16 mx-auto mb-3" viewBox="0 0 64 64" fill="none">
                      <rect x="8" y="20" width="48" height="32" rx="4" fill="#F0FDFA" stroke="#99F6E4" strokeWidth="2"/>
                      <rect x="14" y="12" width="36" height="12" rx="3" fill="#CCFBF1" stroke="#99F6E4" strokeWidth="1.5"/>
                      <circle cx="32" cy="38" r="8" fill="#0D9488" opacity="0.15"/>
                      <path d="M28 38l3 3 5-5" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p className="text-gray-700 font-medium text-sm mb-1">No mocks yet — your journey starts here</p>
                    {stats.currentStreak === 0 && (
                      <p className="text-xs text-orange-500 mb-3">🔥 Start your streak today — take one mock or join a GD</p>
                    )}
                    <Link href="/interview" className="inline-flex items-center gap-1 px-4 py-2 bg-[#0D9488] text-white text-sm rounded-lg hover:bg-[#0F766E] transition-colors font-medium">
                      Take your first mock interview →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Leaderboard Preview */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Leaderboard</h3>
                <Link href="/leaderboard" className="text-[#0D9488] text-sm hover:text-[#0F766E]">
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {leaderboard.map((student) => (
                  <div key={student.rank} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      student.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                      student.rank === 2 ? 'bg-gray-100 text-gray-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {student.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {student.name}
                      </div>
                      <div className="text-xs text-gray-500">{student.college}</div>
                    </div>
                    <div className="text-sm font-bold text-gray-900">{student.score}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
