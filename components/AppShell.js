"use client";

import { useState, useEffect, useCallback } from 'react';
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
  BookOpen,
  Upload,
  CheckCircle
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthBypass } from '@/hooks/useAuthBypass';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import ProductTour from '@/components/onboarding/ProductTour';
import HelpButton from '@/components/onboarding/HelpButton';

export default function AppShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(3);
  const [showModal, setShowModal] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [resumeUploaded, setResumeUploaded] = useState(null); // null = loading
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  
  const { isBypassed, mockUserData } = useAuthBypass();

  useEffect(() => {
    if (isBypassed && mockUserData) {
      setUserProfile(mockUserData.user);
      // Check localStorage for bypass onboarding state
      const done = typeof window !== 'undefined' && localStorage.getItem('bridge_onboarding_done') === 'true';
      if (!done) setShowModal(true);
      return;
    }

    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
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
            setResumeUploaded(!!userData.resumeUploaded);
            // Show onboarding if not completed
            if (!userData.onboardingCompleted) setShowModal(true);
          } else {
            setUserProfile({ name: user.displayName, college: 'Add College', bridgeScore: 0, photo: user.photoURL });
            setResumeUploaded(false);
            setShowModal(true);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
          setUserProfile({ name: user.displayName, college: 'Add College', bridgeScore: 0, photo: user.photoURL });
            setResumeUploaded(false);
        }
      }
    });
  }, [isBypassed]);

  const handleOnboardingComplete = useCallback(async ({ goal, companies }) => {
    if (isBypassed) {
      typeof window !== 'undefined' && localStorage.setItem('bridge_onboarding_done', 'true');
    } else if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          onboardingCompleted: true,
          onboardingCompletedAt: new Date().toISOString(),
          ...(goal && { goal }),
          ...(companies?.length && { targetCompanies: companies }),
        });
      } catch (e) {
        console.error('Onboarding save error:', e);
      }
    }
  }, [isBypassed, currentUser]);

  const handleModalComplete = useCallback(async (data) => {
    await handleOnboardingComplete(data);
    setShowModal(false);
    // Start tour after short delay
    setTimeout(() => setShowTour(true), 600);
  }, [handleOnboardingComplete]);

  const handleModalSkip = useCallback(async () => {
    if (isBypassed) {
      typeof window !== 'undefined' && localStorage.setItem('bridge_onboarding_done', 'true');
    } else if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, { onboardingCompleted: true, onboardingSkipped: true });
      } catch {}
    }
    setShowModal(false);
  }, [isBypassed, currentUser]);

  const handleResumeGateUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) { alert('Please upload a PDF, DOC, or DOCX file'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('File too large (max 5MB)'); return; }
    setResumeFile(file);
    setUploadingResume(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const snap = await getDoc(userRef);
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader(); r.readAsDataURL(file);
        r.onload = () => res(r.result); r.onerror = rej;
      });
      const updateData = { resumeUploaded: true, resumeFileName: file.name, resumeBase64: base64, updatedAt: new Date().toISOString() };
      if (snap.exists()) {
        await updateDoc(userRef, updateData);
      } else {
        await setDoc(userRef, { uid: currentUser.uid, name: currentUser.displayName || '', email: currentUser.email || '', photo: currentUser.photoURL || '', role: 'student', bridgeScore: 0, interviewsDone: 0, avgScore: 0, streak: 0, createdAt: new Date().toISOString(), ...updateData });
      }
      setResumeUploaded(true);
    } catch (e) { console.error('Resume save error', e); alert('Failed to save resume. Try again.'); }
    finally { setUploadingResume(false); }
  };

  const userRole = userProfile?.role || 'student';
  const isAdmin = userRole === 'admin';
  const isRecruiter = userRole === 'recruiter' || isAdmin;

  const navigation = [
    { href: '/dashboard', icon: Home, label: 'Dashboard', tour: null },
    { href: '/career-intelligence', icon: Sparkles, label: 'Career Intelligence', tour: 'nav-career' },
    { href: '/interview', icon: Mic, label: 'Mock Interview', tour: 'nav-interview' },
    { href: '/smart-interview', icon: FileText, label: 'Smart Interview', tour: null },
    { href: '/pulse', icon: Zap, label: 'PULSE', tour: null },
    { href: '/gd', icon: MessageSquare, label: 'GD Practice', tour: 'nav-gd' },
    { href: '/jobs', icon: Briefcase, label: 'Jobs', tour: null },
    { href: '/leaderboard', icon: Trophy, label: 'Leaderboard', tour: 'nav-leaderboard' },
    { href: '/profile', icon: User, label: 'Profile', tour: 'nav-profile' },
    // Admin/Recruiter only
    ...(isRecruiter ? [{ href: '/recruiter', icon: Users, label: 'Recruiter', tour: null }] : []),
    ...(isAdmin ? [{ href: '/admin/token-dashboard', icon: BarChart3, label: 'Token Analytics', tour: null }] : []),
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
              
              {/* Logo - larger and always visible */}
              <Link href="/dashboard" className="flex items-center h-full">
                <img 
                  src="/images/logo_navbar_64h.png" 
                  alt="BridgeAI" 
                  style={{height:'36px',width:'auto'}}
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
                <img data-tour="profile-avatar"
                  src={userProfile.photo} 
                  alt={userProfile.name}
                  className="w-9 h-9 rounded-full object-cover border-2 border-[#0D9488]"
                />
              ) : (
                <div data-tour="profile-avatar" className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br from-[#0D9488] to-[#14B8A6]">
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
              <button data-tour="bell" className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ml-2">
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
                  {...(item.tour ? { 'data-tour': item.tour } : {})}
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

      {/* Resume Gate — blocks all content until resume uploaded */}
      {!isBypassed && resumeUploaded === false && currentUser && (
        <div className="fixed inset-0 z-[100] bg-[#F0FDFA] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            {/* Logo */}
            <img src="/images/logo_navbar_64h.png" alt="BridgeAI" className="h-10 mx-auto mb-8" />

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="w-16 h-16 bg-[#F0FDFA] rounded-full flex items-center justify-center mx-auto mb-5">
                <Upload className="w-8 h-8 text-[#0D9488]" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Resume First</h2>
              <p className="text-gray-500 text-sm mb-6">
                Hey {currentUser?.displayName?.split(' ')[0] || 'there'} 👋 — to personalise your experience and enable AI-powered interviews, please upload your resume before getting started.
              </p>

              {/* Steps */}
              <div className="text-left space-y-2 mb-7 bg-gray-50 rounded-xl p-4">
                {['Upload your resume (PDF/DOC)', 'Complete your profile', 'Start AI mock interviews'].map((s, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="w-5 h-5 rounded-full bg-[#0D9488] text-white flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                    {s}
                  </div>
                ))}
              </div>

              {/* Upload button */}
              <label className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white cursor-pointer transition-all ${uploadingResume ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#0D9488] hover:bg-[#0F766E]'}`}>
                {uploadingResume ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</>
                ) : resumeFile ? (
                  <><CheckCircle className="w-4 h-4" /> {resumeFile.name}</>
                ) : (
                  <><Upload className="w-4 h-4" /> Choose Resume (PDF / DOC)</>
                )}
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeGateUpload} disabled={uploadingResume} />
              </label>

              <p className="text-xs text-gray-400 mt-3">Max 5MB · PDF, DOC, or DOCX</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="md:ml-64 pt-14 md:pt-16 min-h-screen bg-[#F0FDFA]">
        {children}
      </main>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showModal}
        userName={userProfile?.name || ''}
        onComplete={handleModalComplete}
        onSkip={handleModalSkip}
      />

      {/* Product Tour */}
      <ProductTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
      />

      {/* Floating Help Button */}
      <HelpButton onStartTour={() => { setShowTour(false); setTimeout(() => setShowTour(true), 100); }} />
    </div>
  );
}
