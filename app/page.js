"use client";

import { useState, useEffect } from 'react';
import { ArrowRight, Trophy, Zap, Target, Flame, Star, Users, Briefcase, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Home() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [counters, setCounters] = useState({ students: 0, interviews: 0, confidence: 0 });
  const [floatingBadges, setFloatingBadges] = useState([
    { id: 1, icon: '🏆', x: 10, y: 20, delay: 0 },
    { id: 2, icon: '⚡', x: 85, y: 15, delay: 1 },
    { id: 3, icon: '🎯', x: 15, y: 70, delay: 2 },
    { id: 4, icon: '🔥', x: 80, y: 75, delay: 3 }
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        document.cookie = "bridge_auth=1; path=/; max-age=2592000; samesite=lax";
        router.replace("/dashboard");
        return;
      }
      document.cookie = "bridge_auth=; path=/; max-age=0; samesite=lax";
      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (isCheckingAuth) return;
    
    const timer = setInterval(() => {
      setCounters(prev => ({
        students: Math.min(prev.students + 150, 25000),
        interviews: Math.min(prev.interviews + 3, 500),
        confidence: Math.min(prev.confidence + 1, 98)
      }));
    }, 50);

    return () => clearInterval(timer);
  }, [isCheckingAuth]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-500 mx-auto mb-4"></div>
          <div className="text-purple-400 font-semibold">Checking your session...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white overflow-hidden relative">
      {/* Animated particle dots background */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Floating achievement badges */}
      {floatingBadges.map(badge => (
        <div
          key={badge.id}
          className="absolute text-4xl animate-bounce"
          style={{
            left: `${badge.x}%`,
            top: `${badge.y}%`,
            animationDelay: `${badge.delay}s`,
            animationDuration: '3s'
          }}
        >
          {badge.icon}
        </div>
      ))}

      {/* Main content */}
      <div className="relative z-10 px-6 py-12 max-w-md mx-auto">
        {/* Logo and badge */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-3" style={{ textShadow: '0 0 20px #6C63FF' }}>
            BRIDGE
          </h1>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <span className="text-lg">🇮🇳</span>
            <span className="text-sm">Built for Bharat</span>
          </div>
        </div>

        {/* Hero section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 leading-tight">
            From Tier 2 to Top Companies
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            India's first AI-powered placement intelligence platform
          </p>

          {/* Animated stats */}
          <div className="grid grid-cols-3 gap-4 mb-12">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {Math.floor(counters.students / 1000)}K+
              </div>
              <div className="text-sm text-gray-400">Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {counters.interviews}+
              </div>
              <div className="text-sm text-gray-400">Interviews</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {counters.confidence}%
              </div>
              <div className="text-sm text-gray-400">Confidence</div>
            </div>
          </div>

          {/* Feature preview cards */}
          <div className="space-y-4 mb-12">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">AI Mock Interviews</div>
                  <div className="text-sm text-gray-400">Practice with real questions</div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FF6B6B' }}>
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">GD Battles</div>
                  <div className="text-sm text-gray-400">Master group discussions</div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#00D9A3' }}>
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">BRIDGE Score</div>
                  <div className="text-sm text-gray-400">Track your progress</div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Link href="/login">
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full font-semibold text-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105" style={{ boxShadow: '0 0 30px rgba(108, 99, 255, 0.3)' }}>
              Start Your Journey Free
              <ArrowRight className="w-5 h-5" />
            </div>
          </Link>

          {/* Recruiter Link */}
          <div className="mt-4">
            <Link href="/recruiter" className="text-gray-400 hover:text-white text-sm transition-colors">
              Are you a recruiter? Find talent here →
            </Link>
          </div>
        </div>

        {/* Social proof */}
        <div className="mt-16 space-y-4">
          <div className="text-center text-gray-400 mb-6">Join thousands of successful students</div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-sm font-bold">A</div>
              <div className="flex-1">
                <div className="font-semibold text-sm">Akhil from VIT</div>
                <div className="text-xs text-gray-400">Placed at Amazon</div>
              </div>
              <div className="flex text-yellow-400 text-xs">⭐⭐⭐⭐⭐</div>
            </div>
            <p className="text-sm text-gray-300">"BRIDGE helped me crack Amazon interview. The AI feedback was game-changing!"</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-sm font-bold">P</div>
              <div className="flex-1">
                <div className="font-semibold text-sm">Priya from PSG</div>
                <div className="text-xs text-gray-400">Placed at Infosys</div>
              </div>
              <div className="flex text-yellow-400 text-xs">⭐⭐⭐⭐⭐</div>
            </div>
            <p className="text-sm text-gray-300">"The GD battles made me so confident. Now I'm not afraid of any interview!"</p>
          </div>
        </div>
      </div>
    </div>
  );
}
