"use client";

import { useMemo, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Home, Mic, Zap, Trophy, User, Plus, Filter, TrendingUp, X } from "lucide-react";

const tabs = ["All", "TCS", "Infosys", "Wipro", "Amazon"];

const mockExperiences = [
  {
    id: 1,
    company: "TCS",
    role: "Assistant System Engineer",
    roundType: "Technical",
    difficulty: "Medium",
    helpful: 21,
    trending: true,
    questions: [
      "Explain OOP principles with examples.",
      "Difference between REST and SOAP APIs?",
      "How would you optimize SQL query performance?",
    ],
  },
  {
    id: 2,
    company: "Infosys",
    role: "Systems Engineer",
    roundType: "HR",
    difficulty: "Easy",
    helpful: 13,
    trending: false,
    questions: [
      "Tell me about yourself.",
      "Why Infosys?",
      "How do you handle feedback from seniors?",
    ],
  },
  {
    id: 3,
    company: "Wipro",
    role: "Project Engineer",
    roundType: "GD",
    difficulty: "Hard",
    helpful: 28,
    trending: true,
    questions: [
      "GD topic: AI replacing jobs.",
      "How do you convince a teammate in disagreement?",
    ],
  },
  {
    id: 4,
    company: "Amazon",
    role: "SDE Intern",
    roundType: "Technical",
    difficulty: "Hard",
    helpful: 35,
    trending: true,
    questions: [
      "Design a URL shortener system.",
      "Find the longest palindrome substring.",
      "Explain TCP vs UDP.",
    ],
  },
  {
    id: 5,
    company: "Accenture",
    role: "Associate Software Engineer",
    roundType: "Technical",
    difficulty: "Medium",
    helpful: 17,
    trending: false,
    questions: [
      "Difference between stack and queue.",
      "What is normalization in DBMS?",
      "Explain one challenging project from college.",
    ],
  },
];

function badgeStyle(difficulty) {
  if (difficulty === "Easy") return "bg-green-500/20 border-green-500/30 text-green-400";
  if (difficulty === "Hard") return "bg-red-500/20 border-red-500/30 text-red-400";
  return "bg-yellow-500/20 border-yellow-500/30 text-yellow-400";
}

export default function PulsePage() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState(mockExperiences);
  const [form, setForm] = useState({
    company: "",
    role: "",
    roundType: "HR",
    questions: "",
    difficulty: "Medium",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        document.cookie = "bridge_auth=; path=/; max-age=0; samesite=lax";
        window.location.replace("/login");
        return;
      }
      document.cookie = "bridge_auth=1; path=/; max-age=2592000; samesite=lax";
      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredItems = useMemo(() => {
    if (activeTab === "All") return items;
    return items.filter((item) => item.company === activeTab);
  }, [activeTab, items]);

  const submitExperience = () => {
    if (!form.company.trim() || !form.role.trim() || !form.questions.trim()) return;

    const newItem = {
      id: Date.now(),
      company: form.company.trim(),
      role: form.role.trim(),
      roundType: form.roundType,
      difficulty: form.difficulty,
      helpful: 0,
      trending: false,
      questions: form.questions
        .split("\n")
        .map((q) => q.trim())
        .filter(Boolean)
        .slice(0, 5),
    };

    setItems((prev) => [newItem, ...prev]);
    setForm({
      company: "",
      role: "",
      roundType: "HR",
      questions: "",
      difficulty: "Medium",
    });
    setIsOpen(false);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-500 mx-auto mb-4"></div>
          <div className="text-purple-400 font-semibold">Loading PULSE...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="max-w-md mx-auto px-6 py-6">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">PULSE</h1>
            <Zap className="w-6 h-6 text-purple-400" />
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <button className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </header>

        {/* AI Insight Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-4 mb-6" style={{ boxShadow: '0 10px 25px rgba(108, 99, 255, 0.3)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-xs">🤖</span>
            </div>
            <span className="text-sm font-semibold">AI Insight</span>
          </div>
          <p className="text-sm text-purple-200">
            TCS asking more HR questions this week based on 12 recent experiences
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                  : "bg-white/10 border border-white/20 text-gray-400 hover:bg-white/20"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Experience Cards */}
        <div className="space-y-4 mb-20">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {item.company.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-semibold">{item.company}</div>
                    <div className="text-sm text-gray-400">{item.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.trending && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <TrendingUp className="w-3 h-3 text-red-400" />
                      <span className="text-xs text-red-400">Trending</span>
                    </div>
                  )}
                  <div className={`px-3 py-1 rounded-lg text-xs font-semibold border ${badgeStyle(item.difficulty)}`}>
                    {item.difficulty}
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-xs font-semibold text-gray-400 mb-2">Questions Asked</div>
                <ul className="space-y-2">
                  {item.questions.slice(0, 3).map((q, idx) => (
                    <li key={`${item.id}-${idx}`} className="text-sm flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-300">{q}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between">
                <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                  <span className="text-xs text-gray-400">{item.roundType} Round</span>
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded-lg border border-white/20 hover:bg-white/20 transition-colors">
                    <span className="text-sm">👍</span>
                    <span className="text-xs text-gray-400">{item.helpful}</span>
                  </button>
                  <button className="px-3 py-1 bg-purple-500 rounded-lg text-xs font-semibold hover:bg-purple-600 transition-colors">
                    Read More
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAB Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 z-20 w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-110"
          style={{ boxShadow: '0 10px 25px rgba(108, 99, 255, 0.3)' }}
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Add Experience Modal */}
        {isOpen && (
          <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm flex items-end">
            <div className="bg-[#0A0A0F] rounded-t-3xl w-full max-w-md mx-auto p-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Add Experience</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <input
                  value={form.company}
                  onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
                  placeholder="Company name"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                />
                <input
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                  placeholder="Role"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                />
                <select
                  value={form.roundType}
                  onChange={(e) => setForm((prev) => ({ ...prev, roundType: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                >
                  <option value="HR" className="bg-[#0A0A0F]">HR</option>
                  <option value="Technical" className="bg-[#0A0A0F]">Technical</option>
                  <option value="GD" className="bg-[#0A0A0F]">GD</option>
                </select>
                <textarea
                  value={form.questions}
                  onChange={(e) => setForm((prev) => ({ ...prev, questions: e.target.value }))}
                  placeholder="Questions asked (one per line)"
                  className="min-h-[100px] w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                />
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm((prev) => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                >
                  <option value="Easy" className="bg-[#0A0A0F]">Easy</option>
                  <option value="Medium" className="bg-[#0A0A0F]">Medium</option>
                  <option value="Hard" className="bg-[#0A0A0F]">Hard</option>
                </select>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-3 bg-white/10 border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitExperience}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl font-semibold shadow-lg hover:shadow-purple-500/25 transition-all"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
              <a href="/pulse" className="flex flex-col items-center gap-1 text-purple-400">
                <Zap className="w-5 h-5" />
                <span className="text-xs">PULSE</span>
              </a>
              <a href="/leaderboard" className="flex flex-col items-center gap-1 text-gray-400">
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
    </div>
  );
}
