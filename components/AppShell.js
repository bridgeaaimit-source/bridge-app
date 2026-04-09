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
  GraduationCap, 
  Trophy, 
  Users, 
  User, 
  Bell, 
  Search, 
  TrendingUp,
  ChevronRight,
  LogOut,
  Sparkles,
  Menu,
  Moon,
  Sun
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthBypass } from '@/hooks/useAuthBypass';
import { useTheme } from '@/contexts/ThemeContext';

export default function AppShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(3);
  
  const { isBypassed, mockUserData } = useAuthBypass();
  const { theme, toggleTheme } = useTheme();

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
    { href: '/pulse', icon: Zap, label: 'PULSE' },
    { href: '/gd', icon: MessageSquare, label: 'GD Practice' },
    { href: '/jobs', icon: Briefcase, label: 'Jobs' },
    { href: '/coach', icon: GraduationCap, label: 'Coach' },
    { href: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { href: '/recruiter', icon: Users, label: 'Recruiter' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  const isActive = (href) => pathname === href;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Mobile Menu Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-14 md:h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-40 transition-colors">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            {/* Left Side - Logo and Mobile Menu */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Mobile Menu Button - Show on screens < 768px */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
              
              {/* Logo */}
              <div className="flex items-center">
                <Link href="/dashboard" className="flex items-center gap-2 dark:text-white">
                  <img src="/bridgeai-logo.png" alt="BRIDGE" className="h-8 w-auto" />
                </Link>
              </div>
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
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              {/* Notifications */}
              <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* User Avatar */}
              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden md:block text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {userProfile?.name || 'User'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {userProfile?.college || 'Student'}
                  </div>
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base">
                  {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transition-all duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* User Profile Mini Card */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {userProfile?.photo ? (
                <img 
                  src={userProfile.photo} 
                  alt={userProfile.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center text-white font-bold">
                  {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {userProfile?.name || 'User'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {userProfile?.college || 'Add College'}
                </div>
              </div>
            </div>
          </div>

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
                      ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-l-4 border-purple-600 dark:border-purple-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
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
              className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">{isBypassed ? 'Reset Bypass' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 pt-14 md:pt-16 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        {children}
      </main>
    </div>
  );
}
