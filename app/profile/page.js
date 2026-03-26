"use client";

import { useEffect, useState } from "react";
import { Home, Mic, Zap, Trophy, User, Edit3, LogOut, Target, Award, TrendingUp, Calendar, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";

const domainOptions = ["IT", "Marketing", "Finance", "MBA"];
const companyOptions = ["TCS", "Infosys", "Wipro", "Accenture", "Capgemini", "Deloitte"];
const achievements = [
  { id: 1, name: "First Interview", icon: "🎯", earned: true },
  { id: 2, name: "Week Warrior", icon: "🔥", earned: true },
  { id: 3, name: "Score Master", icon: "⭐", earned: true },
  { id: 4, name: "Streak Champion", icon: "🏆", earned: false },
  { id: 5, name: "Perfect 10", icon: "💯", earned: false },
  { id: 6, name: "AI Expert", icon: "🤖", earned: false },
];

export default function ProfilePage() {
  const [collegeName, setCollegeName] = useState("VIT Vellore");
  const [domain, setDomain] = useState("IT");
  const [targets, setTargets] = useState(["TCS", "Infosys", "Amazon"]);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    setIsEditing(false);
    toast.success("Profile updated successfully!");
  };

  const toggleTarget = (company) => {
    setTargets((prev) => (prev.includes(company) ? prev.filter((c) => c !== company) : [...prev, company]));
  };

  const skills = [
    { name: "Technical", level: 85 },
    { name: "Communication", level: 70 },
    { name: "Problem Solving", level: 90 },
    { name: "Aptitude", level: 75 },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="max-w-md mx-auto px-6 py-6">
        
        {/* Header */}
        <header className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => window.history.back()}
            className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-purple-400" />
            <h1 className="text-2xl font-bold">Profile</h1>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors ml-auto"
          >
            <Edit3 className="w-5 h-5" />
          </button>
        </header>

        {/* User Info */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                U
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs">
                
              </div>
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-lg">BRIDGE User</h2>
              <p className="text-sm text-gray-400">user@bridge.app</p>
              <div className="mt-2">
                <span className="text-xs bg-purple-500/20 px-2 py-1 rounded-lg text-purple-300">
                  BRIDGE Score: {null || "---"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center">
            <div className="text-2xl font-bold text-purple-400">12</div>
            <div className="text-xs text-gray-400">Interviews</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center">
            <div className="text-2xl font-bold text-green-400">7.4</div>
            <div className="text-xs text-gray-400">Avg Score</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center">
            <div className="text-2xl font-bold text-orange-400">5</div>
            <div className="text-xs text-gray-400">Day Streak</div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Achievements
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`text-center p-3 rounded-xl border transition-all ${
                  achievement.earned
                    ? "bg-yellow-500/20 border-yellow-500/30"
                    : "bg-white/5 border-white/10 opacity-50"
                }`}
              >
                <div className="text-2xl mb-1">{achievement.icon}</div>
                <div className="text-xs font-semibold">{achievement.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Skills Progress */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Skills Progress
          </h3>
          <div className="space-y-3">
            {skills.map((skill) => (
              <div key={skill.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{skill.name}</span>
                  <span className="text-gray-400">{skill.level}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-1000"
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editable Profile Info */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 mb-6">
          <h3 className="font-semibold mb-4">Profile Information</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">College Name</label>
              <input
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                disabled={!isEditing}
                placeholder="Enter your college name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Domain</label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                disabled={!isEditing}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 disabled:opacity-50"
              >
                {domainOptions.map((option) => (
                  <option key={option} value={option} className="bg-[#0A0A0F]">
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Target Companies</label>
              <div className="flex flex-wrap gap-2">
                {companyOptions.map((company) => (
                  <button
                    key={company}
                    onClick={() => isEditing && toggleTarget(company)}
                    disabled={!isEditing}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      targets.includes(company)
                        ? "bg-purple-500 text-white"
                        : "bg-white/10 border border-white/20 text-gray-400"
                    } ${!isEditing ? "cursor-not-allowed opacity-70" : "hover:bg-purple-600"}`}
                  >
                    {company}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Calendar */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 mb-20">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Activity This Month
          </h3>
          <div className="grid grid-cols-7 gap-1 text-xs">
            {Array.from({ length: 28 }, (_, i) => (
              <div
                key={i}
                className={`aspect-square rounded flex items-center justify-center ${
                  i % 3 === 0 ? "bg-purple-500" : i % 5 === 0 ? "bg-purple-500/50" : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => {
            localStorage.removeItem('bridge_user');
            toast.success('Logged out successfully');
            window.location.href = '/login';
          }}
          className="w-full py-3 bg-red-500/20 border border-red-500/30 rounded-xl font-semibold text-red-400 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 mb-20"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>

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
              <a href="/leaderboard" className="flex flex-col items-center gap-1 text-gray-400">
                <Trophy className="w-5 h-5" />
                <span className="text-xs">Trophy</span>
              </a>
              <a href="/profile" className="flex flex-col items-center gap-1 text-purple-400">
                <User className="w-5 h-5" />
                <span className="text-xs">Profile</span>
              </a>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
