"use client";

import { useState, useEffect } from "react";
import { Home, Mic, Zap, Trophy, User, Crown, Flame, Star } from "lucide-react";

const mockStudents = [
  { rank: 1, name: "Priya Sharma", college: "IIT Madras", score: 945, badge: "👑 Interview King", streak: 45, avatar: "PS" },
  { rank: 2, name: "Akhil Kumar", college: "VIT Vellore", score: 912, badge: "⚡ Speed Demon", streak: 32, avatar: "AK" },
  { rank: 3, name: "Neha Patel", college: "NIT Trichy", score: 898, badge: "🔥 On Fire", streak: 28, avatar: "NP" },
  { rank: 4, name: "Raj Verma", college: "IIIT Hyderabad", score: 876, badge: "🎯 Sharp Shooter", streak: 21, avatar: "RV" },
  { rank: 5, name: "Ananya Reddy", college: "SRM Chennai", score: 854, badge: "🚀 Rising Star", streak: 19, avatar: "AR" },
  { rank: 6, name: "Vikram Singh", college: "Manipal", score: 832, badge: "💪 Consistent", streak: 15, avatar: "VS" },
  { rank: 7, name: "Kavya Nair", college: "RVCE Bangalore", score: 821, badge: "📚 Knowledge Hub", streak: 12, avatar: "KN" },
  { rank: 8, name: "Arjun Mehta", college: "DTU Delhi", score: 809, badge: "🌟 Bright Mind", streak: 10, avatar: "AM" },
  { rank: 9, name: "Divya Goyal", college: "JNU Delhi", score: 798, badge: "🎯 Goal Getter", streak: 8, avatar: "DG" },
  { rank: 10, name: "You", college: "Your College", score: 742, badge: "🔥 On Fire", streak: 5, avatar: "YU", isCurrentUser: true },
];

export default function LeaderboardPage() {
  const [timeFilter, setTimeFilter] = useState("week");
  const [scopeFilter, setScopeFilter] = useState("all");

  const top3 = mockStudents.slice(0, 3);
  const restOfStudents = mockStudents.slice(3);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="max-w-md mx-auto px-6 py-6">
        
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
            Top Crackers
            <Trophy className="w-6 h-6 text-yellow-400" />
          </h1>
          <p className="text-gray-400 text-sm">India's brightest placement prep stars</p>
        </header>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
            <button
              onClick={() => setTimeFilter("week")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                timeFilter === "week" ? "bg-purple-500 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeFilter("month")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                timeFilter === "month" ? "bg-purple-500 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeFilter("all")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                timeFilter === "all" ? "bg-purple-500 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              All Time
            </button>
          </div>

          <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
            <button
              onClick={() => setScopeFilter("college")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                scopeFilter === "college" ? "bg-purple-500 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              My College
            </button>
            <button
              onClick={() => setScopeFilter("all")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                scopeFilter === "all" ? "bg-purple-500 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              All India
            </button>
          </div>
        </div>

        {/* Podium - Top 3 */}
        <div className="mb-8">
          <div className="flex items-end justify-center gap-4 mb-6">
            {/* 2nd Place */}
            <div className="flex flex-col items-center animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2 shadow-lg">
                  {top3[1].avatar}
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-xs font-bold">2</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center w-20" style={{ boxShadow: '0 10px 25px rgba(156, 163, 175, 0.2)' }}>
                <div className="text-xs font-semibold truncate">{top3[1].name}</div>
                <div className="text-lg font-bold text-gray-300">{top3[1].score}</div>
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center animate-fade-up">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2 shadow-lg" style={{ boxShadow: '0 0 30px rgba(251, 191, 36, 0.5)' }}>
                  {top3[0].avatar}
                </div>
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center text-sm font-bold text-yellow-900">1</div>
                <Crown className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-6 h-6 text-yellow-400" />
              </div>
              <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl p-4 border border-yellow-400/30 text-center w-24" style={{ boxShadow: '0 20px 40px rgba(251, 191, 36, 0.3)' }}>
                <div className="text-sm font-semibold truncate">{top3[0].name}</div>
                <div className="text-xl font-bold text-yellow-400">{top3[0].score}</div>
                <div className="text-xs text-yellow-300 mt-1">{top3[0].badge}</div>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center animate-fade-up" style={{ animationDelay: '0.4s' }}>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-orange-800 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2 shadow-lg">
                  {top3[2].avatar}
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center w-20" style={{ boxShadow: '0 10px 25px rgba(234, 88, 12, 0.2)' }}>
                <div className="text-xs font-semibold truncate">{top3[2].name}</div>
                <div className="text-lg font-bold text-orange-400">{top3[2].score}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Rest of Leaderboard */}
        <div className="space-y-3 mb-20">
          {restOfStudents.map((student, index) => (
            <div
              key={student.rank}
              className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 border transition-all duration-300 hover:bg-white/20 ${
                student.isCurrentUser 
                  ? "border-purple-400 shadow-lg shadow-purple-500/25" 
                  : "border-white/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm font-bold">
                  {student.rank}
                </div>
                
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {student.avatar}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-semibold text-sm truncate">{student.name}</div>
                    {student.isCurrentUser && (
                      <div className="px-2 py-0.5 bg-purple-500/20 border border-purple-400/30 rounded text-xs font-semibold text-purple-400">
                        You
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 truncate">{student.college}</div>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-lg">{student.score}</div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Flame className="w-3 h-3 text-orange-500" />
                    {student.streak}
                  </div>
                </div>
              </div>
              
              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs bg-purple-500/20 px-2 py-1 rounded text-purple-300">
                  {student.badge}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400" />
                  <Star className="w-3 h-3 text-yellow-400" />
                  <Star className="w-3 h-3 text-yellow-400" />
                  <Star className="w-3 h-3 text-yellow-400" />
                  <Star className="w-3 h-3 text-gray-600" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0F]/90 backdrop-blur-xl border-t border-white/10">
          <div className="max-w-md mx-auto px-6 py-3">
            <div className="grid grid-cols-5 gap-4">
              <a href="/dashboard" className="flex flex-col items-center gap-1 text-gray-400">
                <Home className="w-5 h-5" />
                <span className="text-xs">Home</span>
              </a>
              <a href="/interview" className="flex flex-col items-center gap-1 text-gray-400">
                <Mic className="w-5 h-5" />
                <span className="text-xs">Practice</span>
              </a>
              <a href="/pulse" className="flex flex-col items-center gap-1 text-gray-400">
                <Zap className="w-5 h-5" />
                <span className="text-xs">PULSE</span>
              </a>
              <a href="/leaderboard" className="flex flex-col items-center gap-1 text-purple-400">
                <Trophy className="w-5 h-5" />
                <span className="text-xs">Trophy</span>
              </a>
              <a href="/profile" className="flex flex-col items-center gap-1 text-gray-400">
                <User className="w-5 h-5" />
                <span className="text-xs">Profile</span>
              </a>
            </div>
          </div>
        </nav>
      </div>

      <style jsx global>{`
        .animate-fade-up {
          animation: fadeUp 500ms ease both;
        }
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
