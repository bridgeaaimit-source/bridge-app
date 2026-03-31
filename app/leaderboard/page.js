"use client";

import { useState, useEffect } from "react";
import { Home, Mic, Zap, Trophy, User, Crown, Flame, Star, Medal, Award } from "lucide-react";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function LeaderboardPage() {
  const [students, setStudents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all");

  useEffect(() => {
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

        // Get current user
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            setCurrentUser(user);
            
            // Check if current user is in leaderboard
            const currentUserIndex = usersData.findIndex(s => s.uid === user.uid);
            if (currentUserIndex === -1) {
              // Add current user at the end if not in top 50
              const userRef = usersData.find(doc => doc.id === user.uid);
              if (userRef) {
                usersData.push({
                  ...userRef,
                  rank: usersData.length + 1,
                  isCurrentUser: true
                });
              }
            } else {
              usersData[currentUserIndex].isCurrentUser = true;
            }
          }
        });

        // Fill with placeholders if less than 10 students
        while (students.length < 10) {
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
            <div className="w-8 h-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent mx-auto mb-4"></div>
            <div className="text-gray-600">Loading leaderboard...</div>
          </div>
        </div>
      </AppShell>
    );
  }

  const top3 = students.slice(0, 3);
  const restOfStudents = students.slice(3);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
            <Trophy className="w-8 h-8 text-yellow-500" />
          </div>
          <p className="text-gray-600">India's brightest placement prep stars</p>
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {top3.map((student, index) => {
            const badge = getBadge(student.rank);
            const BadgeIcon = badge.icon;
            
            return (
              <div
                key={student.uid || `placeholder-${index}`}
                className={`relative bg-white rounded-2xl border-2 ${
                  student.isCurrentUser ? 'border-cyan-500 shadow-lg' : 'border-gray-200'
                } p-6 text-center ${
                  index === 0 ? 'md:transform md:-translate-y-4' : index === 2 ? 'md:transform md:translate-y-2' : ''
                }`}
              >
                {student.isCurrentUser && (
                  <div className="absolute -top-2 -right-2 bg-cyan-500 text-white text-xs px-2 py-1 rounded-full">
                    YOU
                  </div>
                )}
                
                <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  student.isPlaceholder ? 'bg-gray-100' : 'bg-gradient-to-r from-[#0891B2] to-[#0D9488]'
                }`}>
                  {student.photo && !student.isPlaceholder ? (
                    <img src={student.photo} alt={student.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white">
                      {student.isPlaceholder ? '🚀' : student.name?.charAt(0)?.toUpperCase()}
                    </span>
                  )}
                </div>
                
                <div className="mb-2">
                  <BadgeIcon className={`w-6 h-6 mx-auto ${badge.color.split(' ')[0]}`} />
                </div>
                
                <h3 className="font-bold text-gray-900 mb-1">{student.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{student.college}</p>
                
                <div className="space-y-2">
                  <div className={`text-3xl font-bold ${getScoreColor(student.score)}`}>
                    {student.score}
                  </div>
                  <div className="text-xs text-gray-500">BRIDGE Score</div>
                  
                  <div className="flex justify-center gap-4 text-xs text-gray-500">
                    <span>{student.interviewsDone} interviews</span>
                    <span>{student.streak} day streak</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rest of Students */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">All Rankings</h2>
            <div className="space-y-2">
              {restOfStudents.map((student) => (
                <div
                  key={student.uid || `placeholder-${student.rank}`}
                  className={`flex items-center gap-4 p-4 rounded-lg ${
                    student.isCurrentUser ? 'bg-cyan-50 border border-cyan-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 text-center">
                    <span className={`font-bold ${
                      student.rank <= 3 ? 'text-lg' : 'text-sm'
                    } ${
                      student.rank === 1 ? 'text-yellow-600' :
                      student.rank === 2 ? 'text-gray-600' :
                      student.rank === 3 ? 'text-orange-600' :
                      'text-gray-500'
                    }`}>
                      {student.rank}
                    </span>
                  </div>
                  
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100">
                    {student.photo && !student.isPlaceholder ? (
                      <img src={student.photo} alt={student.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-gray-600">
                        {student.isPlaceholder ? '🚀' : student.name?.charAt(0)?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{student.name}</h4>
                      {student.isCurrentUser && (
                        <span className="bg-cyan-500 text-white text-xs px-2 py-1 rounded-full">YOU</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{student.college}</p>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-bold ${getScoreColor(student.score)}`}>
                      {student.score}
                    </div>
                    <div className="text-xs text-gray-500">Score</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Crown className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{students[0]?.score || 0}</div>
            <div className="text-sm text-gray-600">Highest Score</div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-cyan-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {students.filter(s => !s.isPlaceholder).length}
            </div>
            <div className="text-sm text-gray-600">Active Students</div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Flame className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {Math.max(...students.filter(s => !s.isPlaceholder).map(s => s.streak), 0)}
            </div>
            <div className="text-sm text-gray-600">Longest Streak</div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
