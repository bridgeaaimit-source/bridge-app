"use client";

import { useState, useEffect } from "react";
import { Crown, Flame, Star, Medal, Award, Users } from "lucide-react";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";
import { auth } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthBypass } from "@/hooks/useAuthBypass";

export default function LeaderboardPage() {
  const [students, setStudents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all");

  const { isBypassed, mockUserData, mockLeaderboard } = useAuthBypass();

  useEffect(() => {
    // Auth bypass for testing
    if (isBypassed && mockUserData) {
      console.log('🔓 Leaderboard - Auth bypass enabled');
      setCurrentUser({ uid: 'test-user-123' });
      
      // Use mock leaderboard data with current user highlighted
      const leaderboardWithRanks = mockLeaderboard.map((student, index) => ({
        ...student,
        uid: student.name.toLowerCase().replace(/\s+/g, '-'),
        isCurrentUser: student.name === 'Test Student',
        photo: null,
        interviewsDone: Math.floor(student.score / 100),
        avgScore: (student.score / 100).toFixed(1),
        streak: Math.floor(student.score / 200)
      }));
      
      setStudents(leaderboardWithRanks);
      setLoading(false);
      return;
    }

    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        
        // Fetch all users from Firestore
        const usersQuery = query(
          collection(db, 'users'),
          orderBy('bridgeScore', 'desc'),
          limit(50)
        );
        
        const querySnapshot = await getDocs(usersQuery);
        const usersData = [];
        
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          // Only include students with bridgeScore > 0
          if (userData.role === 'student' && userData.bridgeScore > 0) {
            usersData.push({
              uid: doc.id,
              name: userData.name || 'Anonymous Student',
              college: userData.college || 'Unknown College',
              score: userData.bridgeScore,
              interviewsDone: userData.interviewsDone || 0,
              avgScore: userData.avgScore || 0,
              streak: userData.streak || 0,
              photo: userData.photo || null
            });
          }
        });

        console.log('🏆 Leaderboard - Fetched users:', usersData.length);

        // Sort by score and add rank
        usersData.sort((a, b) => b.score - a.score);
        usersData.forEach((student, index) => {
          student.rank = index + 1;
        });

        // Mark current user — use auth.currentUser directly (no subscription leak)
        const user = auth.currentUser;
        if (user) {
          setCurrentUser(user);
          const currentUserIndex = usersData.findIndex(s => s.uid === user.uid);
          if (currentUserIndex !== -1) {
            usersData[currentUserIndex].isCurrentUser = true;
          }
        }

        // Fill with placeholders if less than 10 students (check usersData, NOT state)
        while (usersData.length < 10) {
          usersData.push({
            rank: usersData.length + 1,
            name: "Be the first! 🚀",
            college: "Start practicing to appear here",
            score: 0,
            interviewsDone: 0,
            avgScore: 0,
            streak: 0,
            isPlaceholder: true
          });
        }

        setStudents(usersData);
      } catch (error) {
        console.error('🏆 Leaderboard - Error fetching data:', error);
        toast.error('Failed to load leaderboard');
        
        // Fallback data
        setStudents([
          { rank: 1, name: "Be the first! 🚀", college: "Start practicing to appear here", score: 0, isPlaceholder: true },
          { rank: 2, name: "Be the first! 🚀", college: "Start practicing to appear here", score: 0, isPlaceholder: true },
          { rank: 3, name: "Be the first! 🚀", college: "Start practicing to appear here", score: 0, isPlaceholder: true },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeFilter]);

  const getBadge = (rank) => {
    switch(rank) {
      case 1: return { icon: Crown, text: "Champion", color: "text-yellow-600 bg-yellow-50" };
      case 2: return { icon: Medal, text: "Runner-up", color: "text-gray-600 bg-gray-50" };
      case 3: return { icon: Award, text: "Third Place", color: "text-orange-600 bg-orange-50" };
      default: return { icon: Star, text: `Top ${rank}`, color: "text-cyan-600 bg-cyan-50" };
    }
  };

  const getScoreColor = (score) => {
    if (score >= 900) return "text-purple-500";
    if (score >= 800) return "text-cyan-600";
    if (score >= 700) return "text-cyan-600";
    if (score >= 600) return "text-green-600";
    if (score >= 500) return "text-yellow-600";
    return "text-gray-600";
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-8 h-8 animate-spin rounded-full border-2 border-[#0D9488] border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-500 text-sm">Loading leaderboard…</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const top3 = students.slice(0, 3);
  const restOfStudents = students.slice(3);
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  const podiumConfig = [
    { heightClass: 'h-44', avatarSize: 'w-16 h-16 md:w-20 md:h-20', nameSize: 'text-sm', scoreSize: 'text-lg' },
    { heightClass: 'h-56', avatarSize: 'w-20 h-20 md:w-24 md:h-24', nameSize: 'text-base', scoreSize: 'text-2xl' },
    { heightClass: 'h-36', avatarSize: 'w-14 h-14 md:w-18 md:h-18', nameSize: 'text-sm', scoreSize: 'text-base' },
  ];

  return (
    <AppShell>
      <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-6 md:py-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#0D9488]" style={{fontFamily:'Syne,sans-serif'}}>Leaderboard</h1>
            <p className="text-gray-500 text-sm mt-1">See how you stack up against top performers.</p>
          </div>
          <div className="flex bg-gray-100 rounded-full p-1 shadow-inner">
            {['Weekly','Monthly','All Time'].map((f) => (
              <button key={f} onClick={() => setTimeFilter(f.toLowerCase().replace(' ','-'))}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  timeFilter === f.toLowerCase().replace(' ','-') || (f === 'All Time' && timeFilter === 'all')
                    ? 'bg-[#0D9488] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}>{f}</button>
            ))}
          </div>
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-3 md:gap-6 mb-12 mt-16 md:mt-24 px-4">
          {podiumOrder.map((student, i) => {
            if (!student) return null;
            const isFirst = student.rank === 1;
            const cfg = podiumConfig[i];
            return (
              <div key={student.uid || i} className="flex flex-col items-center relative flex-1 max-w-[160px]">
                {/* Avatar above */}
                <div className="absolute -top-16 md:-top-20 flex flex-col items-center">
                  {isFirst && <Crown className="w-6 h-6 text-yellow-500 mb-1 drop-shadow" />}
                  <div className={`${cfg.avatarSize} rounded-full border-4 ${isFirst ? 'border-[#0D9488] shadow-lg' : 'border-white shadow-md'} bg-gradient-to-br from-[#0D9488] to-[#14B8A6] flex items-center justify-center text-white font-bold text-xl overflow-hidden`}>
                    {student.photo && !student.isPlaceholder
                      ? <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                      : <span>{student.isPlaceholder ? '🚀' : student.name?.charAt(0)?.toUpperCase()}</span>
                    }
                  </div>
                  <span className={`text-xs font-bold px-3 py-0.5 rounded-full -mt-3 z-10 border-2 border-white shadow-sm ${isFirst ? 'bg-[#0D9488] text-white' : 'bg-gray-100 text-gray-600'}`}>
                    #{student.rank}
                  </span>
                </div>
                {/* Podium block */}
                <div className={`w-full ${cfg.heightClass} rounded-t-xl ${isFirst ? 'bg-gradient-to-b from-[#CCFBF1] to-white shadow-[0_4px_20px_rgba(13,148,136,0.15)] border border-[#0D9488]/20' : 'bg-gray-100 border border-gray-200'} flex flex-col items-center justify-end pb-4 pt-12`}>
                  <p className={`font-bold text-gray-800 text-center px-2 truncate w-full ${cfg.nameSize}`}>{student.name}</p>
                  <p className="text-xs text-gray-400 mb-2">{student.college}</p>
                  <p className={`font-bold text-[#0D9488] ${cfg.scoreSize}`}>{student.score}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ranked List */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(13,148,136,0.06)] border border-gray-100 overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wide">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-4">Student</div>
            <div className="col-span-3">College</div>
            <div className="col-span-2 text-center">Interviews</div>
            <div className="col-span-2 text-right">BRIDGE Score</div>
          </div>

          <div className="divide-y divide-gray-50">
            {restOfStudents.map((student) => (
              <div key={student.uid || `ph-${student.rank}`}
                className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors ${
                  student.isCurrentUser
                    ? 'bg-[#CCFBF1] border-l-4 border-[#0D9488]'
                    : 'hover:bg-gray-50'
                }`}>
                <div className="col-span-2 md:col-span-1 text-center font-bold text-gray-500 text-sm">{student.rank}</div>
                <div className="col-span-7 md:col-span-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${student.isPlaceholder ? 'bg-gray-200 text-gray-500' : 'bg-gradient-to-br from-[#0D9488] to-[#14B8A6]'}`}>
                    {student.photo && !student.isPlaceholder
                      ? <img src={student.photo} alt={student.name} className="w-full h-full rounded-full object-cover" />
                      : <span>{student.isPlaceholder ? '🚀' : student.name?.charAt(0)?.toUpperCase()}</span>
                    }
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{student.name} {student.isCurrentUser && <span className="text-[10px] bg-[#0D9488] text-white px-2 py-0.5 rounded-full ml-1">YOU</span>}</p>
                    <p className="text-xs text-gray-400 md:hidden">{student.college}</p>
                  </div>
                </div>
                <div className="hidden md:block col-span-3 text-sm text-gray-500">{student.college}</div>
                <div className="hidden md:flex col-span-2 justify-center items-center gap-1 text-sm text-gray-500">
                  <span>{student.interviewsDone}</span>
                  <Flame className="w-3 h-3 text-orange-400" />
                </div>
                <div className="col-span-3 md:col-span-2 text-right font-bold text-[#0D9488]">{student.score}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-3 gap-4 md:gap-6 mt-8">
          {[
            { icon: Crown, label: 'Highest Score', value: students[0]?.score || 0, bg: 'bg-yellow-50', color: 'text-yellow-600' },
            { icon: Users, label: 'Active Students', value: students.filter(s => !s.isPlaceholder).length, bg: 'bg-[#CCFBF1]', color: 'text-[#0D9488]' },
            { icon: Flame, label: 'Longest Streak', value: Math.max(...students.filter(s => !s.isPlaceholder).map(s => s.streak || 0), 0), bg: 'bg-orange-50', color: 'text-orange-500' },
          ].map(({icon:Icon,label,value,bg,color}) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(13,148,136,0.05)] p-5 text-center">
              <div className={`w-11 h-11 ${bg} rounded-full flex items-center justify-center mx-auto mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-xl font-bold text-gray-900 mb-1" style={{fontFamily:'Syne,sans-serif'}}>{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
