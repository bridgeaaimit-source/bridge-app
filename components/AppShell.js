"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Bell, 
  LogOut, 
  Upload, 
  CheckCircle, 
  Rocket, 
  MessageSquare,
  Menu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import {
  SmartInterviewIcon,
  GDPulseIcon,
  AptitudeArenaIcon,
  CareerIntelligenceIcon,
  JobsIcon,
  RecruitersIcon,
  PlacementReadinessIcon,
  BridgeScoreIcon,
  TrophyIcon,
  ShieldIcon
} from '@/components/DesignSystem';

const HomeIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const UserIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const DrivesIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="10" width="20" height="12" rx="2" />
    <path d="m12 2 8 8H4z" />
  </svg>
);

const AdminIcon = ShieldIcon;
const SupportIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthBypass } from '@/hooks/useAuthBypass';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import ProductTour from '@/components/onboarding/ProductTour';
import HelpButton from '@/components/onboarding/HelpButton';

export default function AppShell({ children, hideNavigation = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [resumeUploaded, setResumeUploaded] = useState(null); // null = loading
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [openTicketsCount, setOpenTicketsCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bridge_sidebar_collapsed') === 'true';
      setCollapsed(saved);
    }
  }, []);

  const toggleSidebar = () => {
    const newVal = !collapsed;
    setCollapsed(newVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bridge_sidebar_collapsed', String(newVal));
    }
  };
  
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
            // Only show onboarding AFTER resume is uploaded
            if (userData.resumeUploaded && !userData.onboardingCompleted) setShowModal(true);
          } else {
            setUserProfile({ name: user.displayName, college: 'Add College', bridgeScore: 0, photo: user.photoURL });
            setResumeUploaded(false);
            // Don't show modal yet — resume gate comes first
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
          setUserProfile({ name: user.displayName, college: 'Add College', bridgeScore: 0, photo: user.photoURL });
            setResumeUploaded(false);
        }
      }
    });
  }, [isBypassed]);

  useEffect(() => {
    if (userProfile?.role !== 'admin') return;

    const q = query(collection(db, 'tickets'), where('status', '==', 'open'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOpenTicketsCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [userProfile?.role]);

  // Listen for unread notifications
  useEffect(() => {
    if (!currentUser || isBypassed) return;
    const q = query(
      collection(db, 'users', currentUser.uid, 'notifications'),
      where('read', '==', false)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadNotifCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [currentUser, isBypassed]);

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

  const [resumeScore, setResumeScore] = useState(null);

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
      // Read as data URL (includes base64 prefix)
      const dataUrl = await new Promise((res, rej) => {
        const r = new FileReader(); r.readAsDataURL(file);
        r.onload = () => res(r.result); r.onerror = rej;
      });
      // Strip prefix for API
      const base64 = dataUrl.split(',')[1];
      // Score resume via AI
      let bridgeScore = 0;
      let scoreData = null;
      try {
        const scoreRes = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'score_resume', resume_base64: base64 })
        });
        if (scoreRes.ok) {
          scoreData = await scoreRes.json();
          bridgeScore = scoreData.bridge_score || 0;
          setResumeScore(scoreData);
        }
      } catch (scoreErr) { console.error('Resume scoring failed', scoreErr); }
      const updateData = { resumeUploaded: true, resumeFileName: file.name, resumeBase64: dataUrl, bridgeScore, resumeScore: scoreData, updatedAt: new Date().toISOString() };
      if (snap.exists()) {
        await updateDoc(userRef, updateData);
      } else {
        await setDoc(userRef, { uid: currentUser.uid, name: currentUser.displayName || '', email: currentUser.email || '', photo: currentUser.photoURL || '', role: 'student', interviewsDone: 0, avgScore: 0, streak: 0, createdAt: new Date().toISOString(), ...updateData });
      }
      setResumeUploaded(true);
      // Now trigger onboarding if not done
      const updatedSnap = await getDoc(userRef);
      if (!updatedSnap.data()?.onboardingCompleted) {
        setTimeout(() => setShowModal(true), 800);
      }
    } catch (e) { console.error('Resume save error', e); alert('Failed to save resume. Try again.'); }
    finally { setUploadingResume(false); }
  };

  const userRole = userProfile?.role || 'student';
  const isAdmin = userRole === 'admin';
  const isRecruiter = userRole === 'recruiter' || isAdmin;

  const categorizedNav = [
    {
      title: 'PLACEMENT PREP',
      items: [
        { href: '/dashboard', icon: HomeIcon, label: 'Home', group: ['/dashboard'], tour: 'dashboard' },
        { href: '/smart-interview', icon: SmartInterviewIcon, label: 'Smart Interview', group: ['/smart-interview', '/interview', '/device-test'], tour: 'smart-interview' },
        { href: '/pulse', icon: GDPulseIcon, label: 'GD Pulse', group: ['/pulse', '/gd', '/coach'], tour: 'gd-practice' },
        { href: '/aptitude', icon: AptitudeArenaIcon, label: 'Aptitude Arena', group: ['/aptitude'] }
      ]
    },
    {
      title: 'CAREER',
      items: [
        { href: '/career-gps', icon: PlacementReadinessIcon, label: 'Career GPS', group: ['/career-gps'] },
        { href: '/career-intelligence', icon: CareerIntelligenceIcon, label: 'Career Intelligence', group: ['/career-intelligence'] },
        { href: '/jobs', icon: JobsIcon, label: 'Jobs', group: ['/jobs'], tour: 'jobs' }
      ]
    },
    {
      title: 'PROGRESS',
      items: [
        { href: '/leaderboard', icon: TrophyIcon, label: 'Leaderboard', group: ['/leaderboard'], tour: 'leaderboard' },
        { href: '/profile', icon: UserIcon, label: 'Profile', group: ['/profile'], tour: 'profile' },
        { href: '/dashboard/bridge-score', icon: BridgeScoreIcon, label: 'Bridge Score', group: ['/dashboard/bridge-score'] }
      ]
    },
    {
      title: 'RECRUITMENT',
      items: [
        ...(isRecruiter ? [{ href: '/recruiter', icon: RecruitersIcon, label: 'Recruiter', group: ['/recruiter'] }] : []),
        { href: '/drives', icon: DrivesIcon, label: 'Drives', group: ['/drives'] },
        ...(isAdmin ? [{ href: '/admin', icon: AdminIcon, label: 'Admin Dashboard', group: ['/admin'] }] : []),
        ...(isAdmin ? [{ href: '/admin/support', icon: SupportIcon, label: 'Support', group: ['/admin/support'], badge: openTicketsCount }] : [])
      ]
    }
  ];

  const mobileNav = [
    { href: '/dashboard', icon: HomeIcon, label: 'Home', group: ['/dashboard'] },
    { href: '/smart-interview', icon: SmartInterviewIcon, label: 'Interview', group: ['/smart-interview', '/interview', '/device-test'] },
    { href: '/pulse', icon: GDPulseIcon, label: 'GD Pulse', group: ['/pulse', '/gd', '/coach'] },
    { href: '/leaderboard', icon: TrophyIcon, label: 'Rank', group: ['/leaderboard'] },
    { href: '/profile', icon: UserIcon, label: 'Me', group: ['/profile'] },
  ];

  const isGroupActive = (group) => group.some(p => pathname === p || pathname.startsWith(p + '/'));

  return (
    <div className="min-h-screen bg-[#fcf8ff] flex flex-col md:flex-row">

      {/* ── Mobile Top App Bar ── */}
      {!hideNavigation && (
        <header className="md:hidden flex justify-between items-center w-full px-6 h-16 bg-white shadow-sm fixed top-0 z-40">
        <Link href="/dashboard">
          <img src="/images/logo_navbar_48h.png" alt="BridgeAI" className="h-8 w-auto" />
        </Link>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-[#CCFBF1]/30 transition-colors text-gray-500 relative">
            <Bell className="w-5 h-5" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadNotifCount > 9 ? '9+' : unreadNotifCount}</span>
            )}
          </button>
          <div className="relative">
            <button onClick={() => setShowProfileDropdown(!showProfileDropdown)} className="focus:outline-none flex items-center">
              {userProfile?.photo ? (
                <img src={userProfile.photo} alt={userProfile.name} className="w-8 h-8 rounded-full object-cover border-2 border-[#008378]" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#CCFBF1] flex items-center justify-center text-[#00685f] font-bold text-sm">
                  {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </button>
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2">
                <Link href="/profile" onClick={() => setShowProfileDropdown(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <User className="w-4 h-4" /> Profile
                </Link>
                <button onClick={() => { auth.signOut(); router.push('/login'); setShowProfileDropdown(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
        </header>
      )}

      {/* ── Desktop Sidebar ── */}
      {!hideNavigation && (
        <nav 
          className={`hidden md:flex flex-col h-screen fixed left-0 top-0 bg-[#F8FAFC] border-r border-[#E2E8F0] z-50 transition-all duration-300 ${
            collapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Logo & Toggle Header */}
          <div className="px-4 py-5 border-b border-[#E2E8F0] flex items-center justify-between">
            {!collapsed ? (
              <Link href="/dashboard" className="flex items-center gap-2 font-bold text-slate-855 text-sm">
                <div className="w-8 h-8 bg-[#14B8A6] rounded-lg flex items-center justify-center text-white font-extrabold text-sm shrink-0">B</div>
                <span className="font-bold text-slate-800 text-base">BridgeAI</span>
              </Link>
            ) : (
              <Link href="/dashboard" className="w-8 h-8 bg-[#14B8A6] rounded-lg flex items-center justify-center text-white font-extrabold text-sm mx-auto">
                B
              </Link>
            )}
            <button 
              onClick={toggleSidebar} 
              className="p-1.5 rounded-lg hover:bg-slate-200/50 text-slate-500 transition-colors"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Categorized Nav List */}
          <div className="flex-1 flex flex-col gap-5 py-4 px-3 overflow-y-auto">
            {categorizedNav.map((category) => (
              <div key={category.title} className="flex flex-col gap-1">
                {/* Category Title (hidden when collapsed) */}
                {!collapsed && (
                  <h4 className="text-[10px] font-bold text-slate-400 tracking-wider px-3 mb-1.5 uppercase">
                    {category.title}
                  </h4>
                )}
                {category.items.map((item) => {
                  const Icon = item.icon;
                  const active = isGroupActive(item.group);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      data-tour={item.tour}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group relative ${
                        active
                          ? 'text-[#0D9488] bg-[#CCFBF1]/40 border-l-4 border-[#14B8A6]'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-105 ${active ? 'text-[#14B8A6]' : 'text-slate-500'}`} />
                        {!collapsed && <span>{item.label}</span>}
                      </div>
                      {item.badge !== undefined && item.badge > 0 && !collapsed && (
                        <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer CTAs */}
          <div className="p-4 border-t border-[#E2E8F0] flex flex-col gap-2.5">
            {!collapsed ? (
              <Link
                href="/smart-interview"
                className="w-full flex items-center justify-center gap-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white py-3 rounded-xl font-bold text-xs shadow-sm transition-all"
              >
                <Rocket className="w-3.5 h-3.5" /> Start Practice
              </Link>
            ) : (
              <Link
                href="/smart-interview"
                title="Start Practice"
                className="w-10 h-10 mx-auto flex items-center justify-center bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded-xl shadow-sm transition-all"
              >
                <Rocket className="w-4 h-4" />
              </Link>
            )}
            <button
              onClick={() => {
                if (isBypassed) { window.location.reload(); }
                else { auth.signOut(); router.push('/login'); }
              }}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50/50 rounded-xl text-xs font-semibold transition-colors ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              <LogOut className="w-4 h-4" />
              {!collapsed && (isBypassed ? 'Reset Bypass' : 'Sign Out')}
            </button>
          </div>
        </nav>
      )}

      {/* ── Resume Gate ── */}
      {!isBypassed && resumeUploaded === false && currentUser && (
        <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <h1 className="text-2xl font-extrabold text-[#14B8A6] mb-8" style={{fontFamily:'Syne,sans-serif'}}>BridgeAI</h1>
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 p-8">
              <div className="w-16 h-16 bg-[#CCFBF1]/50 rounded-full flex items-center justify-center mx-auto mb-5">
                <Upload className="w-7 h-7 text-[#14B8A6]" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Upload Your Resume First</h2>
              <p className="text-slate-600 text-sm mb-6">
                Hey {currentUser?.displayName?.split(' ')[0] || 'there'} 👋 — upload your resume to get your <strong className="text-[#14B8A6]">personalised Bridge Score</strong> and unlock all AI features.
              </p>
              <div className="text-left space-y-2 mb-7 bg-[#F8FAFC] rounded-xl p-4 border border-slate-100">
                {['Upload your resume (PDF/DOC)', 'Complete your profile', 'Start AI mock interviews'].map((s, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs text-slate-700 font-medium">
                    <div className="w-5 h-5 rounded-full bg-[#14B8A6] text-white flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</div>
                    {s}
                  </div>
                ))}
              </div>
              <label className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white cursor-pointer transition-all ${uploadingResume ? 'bg-slate-300 cursor-not-allowed' : 'bg-[#14B8A6] hover:bg-[#0D9488]'}`}>
                {uploadingResume ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Analysing resume...</>
                ) : resumeFile ? (
                  <><CheckCircle className="w-4 h-4" /> {resumeFile.name}</>
                ) : (
                  <><Upload className="w-4 h-4" /> Choose Resume (PDF / DOC)</>
                )}
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeGateUpload} disabled={uploadingResume} />
              </label>
              {uploadingResume && <p className="text-xs text-[#14B8A6] mt-3 font-semibold">AI is scoring your resume — this takes ~10 seconds...</p>}
              {!uploadingResume && <p className="text-xs text-slate-400 mt-3">Max 5MB · PDF, DOC, or DOCX</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop Top Right Profile ── */}
      {!hideNavigation && (
        <div className="hidden md:flex fixed top-4 right-6 z-40 items-center gap-4">
        <button className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500 bg-white shadow-sm border border-slate-200 relative">
          <Bell className="w-4 h-4" />
          {unreadNotifCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">{unreadNotifCount > 9 ? '9+' : unreadNotifCount}</span>
          )}
        </button>
        <div className="relative">
          <button onClick={() => setShowProfileDropdown(!showProfileDropdown)} className="focus:outline-none flex items-center">
            {userProfile?.photo ? (
              <img src={userProfile.photo} alt={userProfile.name} className="w-8 h-8 rounded-full object-cover border-2 border-[#14B8A6] shadow-sm" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#CCFBF1]/50 flex items-center justify-center text-[#0D9488] font-bold text-xs shadow-sm border border-[#14B8A6]">
                {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </button>
          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2">
              <div className="px-4 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-900 truncate">{userProfile?.name || 'User'}</p>
                <p className="text-[10px] text-slate-500 truncate">{userProfile?.email || 'Student'}</p>
              </div>
              <Link href="/profile" onClick={() => setShowProfileDropdown(false)} className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50">
                <UserIcon className="w-3.5 h-3.5" /> Profile
              </Link>
              <button onClick={() => { auth.signOut(); router.push('/login'); setShowProfileDropdown(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50">
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          )}
        </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className={`flex-1 min-h-screen bg-white ${
        hideNavigation 
          ? "w-full pt-0 pb-0 ml-0" 
          : `${collapsed ? 'md:ml-20' : 'md:ml-64'} pt-16 md:pt-0 pb-24 md:pb-0`
      }`}>
        {children}
      </main>

      {/* ── Mobile Bottom Nav ── */}
      {!hideNavigation && (
        <nav className="md:hidden fixed bottom-0 w-full z-50 rounded-t-2xl bg-white shadow-[0_-4px_20px_rgba(0,104,95,0.1)] flex justify-around items-center h-20 px-4 border-t border-gray-100">
        {mobileNav.map((item) => {
          const Icon = item.icon;
          const active = isGroupActive(item.group);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all ${
                active ? 'text-[#00685f]' : 'text-gray-400 hover:text-[#00685f]'
              }`}
            >
              {active ? (
                <div className="w-10 h-10 rounded-full bg-[#008378] flex items-center justify-center text-white -mt-1 shadow-sm">
                  <Icon className="w-5 h-5" />
                </div>
              ) : (
                <Icon className="w-5 h-5" />
              )}
              <span className="text-[10px] font-semibold" >{item.label}</span>
            </Link>
          );
        })}
        </nav>
      )}

      {/* ── Onboarding Modal ── */}
      <OnboardingModal
        isOpen={showModal}
        userName={userProfile?.name || ''}
        onComplete={handleModalComplete}
        onSkip={handleModalSkip}
      />

      {/* ── Product Tour ── */}
      <ProductTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
      />

      {/* ── Floating Help Button ── */}
      {!hideNavigation && (
        <HelpButton onStartTour={() => { setShowTour(false); setTimeout(() => setShowTour(true), 100); }} />
      )}
    </div>
  );
}
