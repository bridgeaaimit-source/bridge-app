"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Home, Mic, Zap, Trophy, User, Edit, Languages, Lightbulb, Wand2 } from "lucide-react";

export default function CoachPage() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [rawAnswer, setRawAnswer] = useState("");
  const [improvedAnswer, setImprovedAnswer] = useState("");
  const [hinglishText, setHinglishText] = useState("");
  const [englishText, setEnglishText] = useState("");
  const [isLoadingRewrite, setIsLoadingRewrite] = useState(false);
  const [isLoadingConvert, setIsLoadingConvert] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

  const improveWithAI = async () => {
    if (!rawAnswer.trim()) return;
    setErrorMessage("");
    setIsLoadingRewrite(true);
    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "rewrite", text: rawAnswer }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Could not improve answer right now.");
      }
      setImprovedAnswer(data.output || "");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setErrorMessage(message);
    } finally {
      setIsLoadingRewrite(false);
    }
  };

  const convertHinglish = async () => {
    if (!hinglishText.trim()) return;
    setErrorMessage("");
    setIsLoadingConvert(true);
    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "hinglish_to_english", text: hinglishText }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Could not convert text right now.");
      }
      setEnglishText(data.output || "");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setErrorMessage(message);
    } finally {
      setIsLoadingConvert(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-500 mx-auto mb-4"></div>
          <div className="text-purple-400 font-semibold">Loading coach...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="max-w-md mx-auto px-6 py-6">
        
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-2xl font-bold">Coach</h1>
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-sm">🎯</span>
            </div>
          </div>
          <p className="text-gray-400 text-sm">Your AI communication assistant</p>
        </header>

        {/* Today's Score Card */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-4 mb-6" style={{ boxShadow: '0 10px 25px rgba(108, 99, 255, 0.3)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">Today's Score</span>
            <span className="text-2xl font-bold">8.5/10</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-xs text-purple-200">Clarity</div>
              <div className="text-sm font-bold">9/10</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-purple-200">Fluency</div>
              <div className="text-sm font-bold">8/10</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-purple-200">Structure</div>
              <div className="text-sm font-bold">8.5/10</div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="space-y-4 mb-20">
          {/* Answer Rewriter */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Edit className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Answer Rewriter</h3>
                <p className="text-xs text-gray-400">AI improves your interview answers</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <textarea
                value={rawAnswer}
                onChange={(e) => setRawAnswer(e.target.value)}
                placeholder="Paste your interview answer here..."
                className="w-full min-h-[120px] bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
              />
              
              <button
                onClick={improveWithAI}
                disabled={isLoadingRewrite}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl font-semibold shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ boxShadow: '0 10px 25px rgba(108, 99, 255, 0.3)' }}
              >
                {isLoadingRewrite ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                    Improving...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Improve with AI
                  </>
                )}
              </button>
              
              {improvedAnswer && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                  <div className="text-xs font-semibold text-green-400 mb-2">Improved Version</div>
                  <div className="text-sm text-gray-300">{improvedAnswer}</div>
                </div>
              )}
            </div>
          </div>

          {/* Hinglish to English */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-coral-500 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FF6B6B' }}>
                <Languages className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Hinglish → English</h3>
                <p className="text-xs text-gray-400">Convert to professional English</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <textarea
                value={hinglishText}
                onChange={(e) => setHinglishText(e.target.value)}
                placeholder="Type Hinglish text here..."
                className="w-full min-h-[120px] bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
              />
              
              <button
                onClick={convertHinglish}
                disabled={isLoadingConvert}
                className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl font-semibold shadow-lg hover:shadow-red-500/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)' }}
              >
                {isLoadingConvert ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                    Converting...
                  </>
                ) : (
                  <>
                    <Languages className="w-4 h-4" />
                    Convert
                  </>
                )}
              </button>
              
              {englishText && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                  <div className="text-xs font-semibold text-blue-400 mb-2">Professional English</div>
                  <div className="text-sm text-gray-300">{englishText}</div>
                </div>
              )}
            </div>
          </div>

          {/* Speaking Tips */}
          <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-2xl p-4 border border-green-500/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Speaking Tips</h3>
                <p className="text-xs text-gray-400">Daily communication tips</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-300">Use STAR format for structured answers</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-300">Add numbers and metrics for credibility</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-300">Practice with 2-minute time limits</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="fixed top-6 left-6 right-6 bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm text-center z-50">
            {errorMessage}
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
              <a href="/pulse" className="flex flex-col items-center gap-1 text-gray-400">
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
