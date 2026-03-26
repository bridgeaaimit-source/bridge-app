"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, Mic, Zap, Trophy, User, Bell, Flame, Briefcase, MessageSquare, TrendingUp, Target, Brain } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import toast from "react-hot-toast";

const actionCards = [
  {
    icon: Brain,
    title: "Smart Interview",
    subtitle: "Upload resume, get personalized interview",
    href: "/smart-interview",
    color: "purple",
    badge: "NEW"
  },
  {
    icon: Mic,
    title: "Mock Interview",
    subtitle: "AI-powered practice",
    href: "/interview",
    color: "purple"
  },
  {
    icon: MessageSquare,
    title: "GD Battle",
    subtitle: "Group discussions",
    href: "/gd",
    color: "coral"
  },
  {
    icon: Zap,
    title: "PULSE Feed",
    subtitle: "Company insights",
    href: "/pulse",
    color: "green"
  },
  {
    icon: Trophy,
    title: "Leaderboard",
    subtitle: "Top performers",
    href: "/leaderboard",
    color: "gold"
  },
];

export default function Dashboard() {
  const [bridgeScore, setBridgeScore] = useState(742);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning! 🌅");
    } else if (hour < 17) {
      setGreeting("Good afternoon! ☀️");
    } else {
      setGreeting("Good evening! 🌙");
    }
  }, []);

  const scorePercentage = (bridgeScore / 1000) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (scorePercentage / 100) * circumference;

  return (
    <PageLayout>
      <div className="px-6 py-6">
        
        {/* Top bar */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">{greeting}</h1>
            <p className="text-gray-400">Ready to ace your placement?</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            U
          </div>
        </header>

        {/* BRIDGE SCORE Card */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl p-6 mb-6 relative overflow-hidden" style={{ boxShadow: '0 20px 40px rgba(108, 99, 255, 0.3)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">BRIDGE SCORE</h2>
                <p className="text-purple-200 text-sm">Interview Ready �</p>
              </div>
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="45"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="45"
                    stroke="white"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{bridgeScore}</div>
                    <div className="text-xs text-purple-200">/1000</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center">
            <div className="flex justify-center mb-1">
              <Briefcase className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-lg font-bold">12</div>
            <div className="text-xs text-gray-400">Practices</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center">
            <div className="flex justify-center mb-1">
              <Target className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-lg font-bold">7.4</div>
            <div className="text-xs text-gray-400">Avg Score</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center">
            <div className="flex justify-center mb-1">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-lg font-bold">5</div>
            <div className="text-xs text-gray-400">Day Streak</div>
          </div>
        </div>

        {/* Continue where you left off */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 mb-6">
          <h3 className="font-semibold mb-2">Continue Where You Left Off</h3>
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Technical Interview</p>
                <p className="text-xs text-gray-400">Completed 3/5 questions</p>
              </div>
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">60%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {actionCards.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-[1.02] relative"
            >
              {item.badge && (
                <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                  {item.badge}
                </div>
              )}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                item.color === 'purple' ? 'bg-purple-500' :
                item.color === 'coral' ? 'bg-red-500' :
                item.color === 'green' ? 'bg-green-500' :
                'bg-yellow-500'
              }`}>
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
              <p className="text-xs text-gray-400">{item.subtitle}</p>
            </Link>
          ))}
        </div>

        {/* Daily Challenge */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 mb-20" style={{ boxShadow: '0 10px 25px rgba(255, 107, 107, 0.3)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Daily Challenge</h3>
              <p className="text-xs text-red-100 mt-1">Record 60s self-introduction</p>
            </div>
            <div className="bg-white/20 rounded-lg px-3 py-1">
              <span className="text-xs font-semibold">+50 pts</span>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
