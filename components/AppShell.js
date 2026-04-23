"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  Mic, 
  FileText, 
  Zap, 
  MessageSquare, 
  Briefcase, 
  Trophy, 
  Users, 
  User, 
  Bell, 
  Search, 
  LogOut,
  Sparkles,
  Menu,
  BarChart3,
  BookOpen
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthBypass } from '@/hooks/useAuthBypass';

export default function AppShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(3);
  
  const { isBypassed, mockUserData } = useAuthBypass();

  useEffect(() => {
    // Use mock user if bypass is enabled
    if (isBypassed && mockUserData) {
      setUserProfile(mockUserData.user);
      return;
    }

    // Load real user data from Firebase
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setUserProfile({
              name: userData.name || user.displayName || 'User',
              email: userData.email || user.email || '',
              photo: userData.photo || user.photoURL || '',
              college: userData.college || 'Student',
              role: userData.role || 'student'
            });
          } else {
            setUserProfile({
              name: user.displayName,
              college: 'Add College',
              bridgeScore: 0,
              photo: user.photoURL
            });
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
          setUserProfile({
            name: user.displayName,
            college: 'Add College',
            bridgeScore: 0,
            photo: user.photoURL
          });
        }
      }
    });
  }, []);

  const navigation = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/career-intelligence', icon: Sparkles, label: 'Career Intelligence' },
    { href: '/interview', icon: Mic, label: 'Mock Interview' },
    { href: '/smart-interview', icon: FileText, label: 'Smart Interview' },
    { href: '/pdf-reader', icon: BookOpen, label: 'PDF Reader' },
    { href: '/pulse', icon: Zap, label: 'PULSE' },
    { href: '/gd', icon: MessageSquare, label: 'GD Practice' },
    { href: '/jobs', icon: Briefcase, label: 'Jobs' },
    { href: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { href: '/recruiter', icon: Users, label: 'Recruiter' },
    { href: '/profile', icon: User, label: 'Profile' },
    { href: '/admin/token-dashboard', icon: BarChart3, label: 'Token Analytics' },
  ];

  const isActive = (href) => pathname === href;

  return (
    <div className="min-h-screen bg-[#F0FDFA]">
      {/* Mobile Menu Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-14 md:h-16 bg-white border-b border-gray-200 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            {/* Left Side - Logo */}
            <div className="flex items-center gap-3 h-full">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
              
              {/* Logo - Full height of navbar */}
              <Link href="/dashboard" className="flex items-center h-full py-1">
                <img 
                  src="/images/bridgeai-logo.png" 
                  alt="BridgeAI" 
                  className="h-full w-auto object-contain"
                />
              </Link>
            </div>

            {/* Center - Search (Hidden on Mobile) */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search features, topics, or help..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Right Side - Profile + Name + Bell */}
            <div className="flex items-center gap-3">
              {/* Profile Pic */}
              {userProfile?.photo ? (
                <img 
                  src={userProfile.photo} 
                  alt={userProfile.name}
                  className="w-9 h-9 rounded-full object-cover border-2 border-[#0D9488]"
                />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br from-[#0D9488] to-[#14B8A6]">
                  {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              
              {/* Name - hidden on small screens */}
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-[#0D0D1A] truncate max-w-[120px]">
                  {userProfile?.name || 'User'}
                </p>
              </div>

              {/* Bell */}
              <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ml-2">
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-14 md:top-16 h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 z-50 transition-all duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-[#F0FDFA] text-[#0D9488] border-l-4 border-[#0D9488]'
                      : 'text-gray-700 hover:bg-[#F0FDFA] hover:text-[#0D9488]'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                if (isBypassed) {
                  // In bypass mode, just reload the page
                  window.location.reload();
                } else {
                  auth.signOut();
                  router.push('/login');
                }
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">{isBypassed ? 'Reset Bypass' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 pt-14 md:pt-16 min-h-screen bg-[#F0FDFA]">
        {children}
      </main>
    </div>
  );
}
