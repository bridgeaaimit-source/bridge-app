"use client";

import { useEffect, useState } from "react";
import { Home, Mic, Zap, Trophy, User, Edit3, Target, Award, TrendingUp, Calendar, Mail, Phone, MapPin, GraduationCap, Briefcase, Upload, CheckCircle, FileText } from "lucide-react";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthBypass } from "@/hooks/useAuthBypass";

const domainOptions = ["IT", "Marketing", "Finance", "HR", "Analytics", "Consulting", "Operations"];
const lookingForOptions = ["Full-time", "Internship", "Both"];

export default function ProfilePage() {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    photo: '',
    college: '',
    degree: '',
    domain: '',
    location: '',
    lookingFor: 'Full-time',
    bridgeScore: 0,
    interviewsDone: 0,
    avgScore: 0,
    streak: 0,
    phone: '',
    bio: ''
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeUploading, setResumeUploading] = useState(false);

  const { isBypassed, mockUserData } = useAuthBypass();

  useEffect(() => {
    // Auth bypass for testing
    if (isBypassed && mockUserData) {
      console.log('🔓 Profile - Auth bypass enabled');
      setUserData({
        name: mockUserData.user.name,
        email: mockUserData.user.email,
        photo: mockUserData.user.photo,
        college: mockUserData.user.college,
        degree: 'B.Tech Computer Science',
        domain: 'IT',
        location: 'Bangalore, India',
        lookingFor: 'Full-time',
        bridgeScore: mockUserData.stats.bridgeScore,
        interviewsDone: mockUserData.stats.interviewsDone,
        avgScore: mockUserData.stats.avgScore,
        streak: mockUserData.stats.currentStreak,
        phone: '+91 9876543210',
        bio: 'Passionate about AI and machine learning. Looking for opportunities in software development and data science.'
      });
      setCurrentUser({ uid: 'test-user-123' });
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          // Always set base user data from Firebase auth
          const baseUserData = {
            name: user.displayName || '',
            email: user.email || '',
            photo: user.photoURL || '',
            college: '',
            degree: '',
            domain: '',
            location: '',
            lookingFor: 'Full-time',
            bridgeScore: 0,
            interviewsDone: 0,
            avgScore: 0,
            streak: 0,
            phone: '',
            bio: ''
          };
          
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.resumeFileName) setResumeFileName(data.resumeFileName);
            setUserData({
              ...baseUserData,
              college: data.college || '',
              degree: data.degree || '',
              domain: data.domain || '',
              location: data.location || '',
              lookingFor: data.lookingFor || 'Full-time',
              bridgeScore: data.bridgeScore || 0,
              interviewsDone: data.interviewsDone || 0,
              avgScore: data.avgScore || 0,
              streak: data.streak || 0,
              phone: data.phone || '',
              bio: data.bio || ''
            });
          } else {
            // Use only base data from Firebase auth
            setUserData(baseUserData);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          toast.error('Failed to load profile data');
          // Still set basic data from auth even on error
          setUserData({
            name: user.displayName || '',
            email: user.email || '',
            photo: user.photoURL || '',
            college: '',
            degree: '',
            domain: '',
            location: '',
            lookingFor: 'Full-time',
            bridgeScore: 0,
            interviewsDone: 0,
            avgScore: 0,
            streak: 0,
            phone: '',
            bio: ''
          });
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleResumeChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('Please upload a PDF file for accurate reading. Convert to PDF and try again.'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('File too large (max 5MB)'); return; }
    setResumeUploading(true);
    const toastId = toast.loading('Uploading and analysing resume...');
    try {
      const dataUrl = await new Promise((res, rej) => {
        const r = new FileReader(); r.readAsDataURL(file);
        r.onload = () => res(r.result); r.onerror = rej;
      });
      const base64 = dataUrl.split(',')[1];
      let bridgeScore = userData.bridgeScore;
      try {
        const scoreRes = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'score_resume', resume_base64: base64 })
        });
        if (scoreRes.ok) {
          const scoreData = await scoreRes.json();
          bridgeScore = scoreData.bridge_score || bridgeScore;
        }
      } catch {}
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { resumeUploaded: true, resumeFileName: file.name, resumeBase64: dataUrl, bridgeScore, updatedAt: new Date().toISOString() });
      setResumeFileName(file.name);
      setUserData(prev => ({ ...prev, bridgeScore }));
      toast.success(`Resume updated! New Bridge Score: ${bridgeScore}`, { id: toastId });
    } catch (err) {
      toast.error('Failed to update resume', { id: toastId });
    } finally {
      setResumeUploading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      toast.error('User not authenticated');
      return;
    }
    
    // In bypass mode, just update local state and show success
    if (isBypassed) {
      toast.success("Profile updated successfully! (Bypass mode - no Firebase write)");
      setIsEditing(false);
      return;
    }
    
    setSaving(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      const updateData = {
        college: userData.college,
        degree: userData.degree,
        domain: userData.domain,
        location: userData.location,
        lookingFor: userData.lookingFor,
        phone: userData.phone,
        bio: userData.bio,
        updatedAt: new Date().toISOString()
      };
      
      if (userSnap.exists()) {
        // Update existing document
        await updateDoc(userRef, updateData);
      } else {
        // Create new document with user info
        await setDoc(userRef, {
          uid: currentUser.uid,
          name: currentUser.displayName || '',
          email: currentUser.email || '',
          photo: currentUser.photoURL || '',
          role: 'student',
          approved: true,
          bridgeScore: 0,
          interviewsDone: 0,
          avgScore: 0,
          streak: 0,
          domains: [],
          skills: [],
          createdAt: new Date().toISOString(),
          ...updateData
        });
      }
      
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(`Failed to update profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const achievements = [
    { id: 1, name: "First Interview", icon: "🎯", earned: userData.interviewsDone > 0 },
    { id: 2, name: "Week Warrior", icon: "🔥", earned: userData.streak >= 7 },
    { id: 3, name: "Score Master", icon: "⭐", earned: userData.bridgeScore >= 800 },
    { id: 4, name: "Streak Champion", icon: "🏆", earned: userData.streak >= 30 },
    { id: 5, name: "Perfect 10", icon: "💯", earned: userData.avgScore >= 9 },
    { id: 6, name: "AI Expert", icon: "🤖", earned: userData.interviewsDone >= 10 },
  ];

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-8 h-8 animate-spin rounded-full border-2 border-[#0D9488]/30 border-t-[#0D9488] mx-auto mb-4"></div>
            <div className="text-gray-500 text-sm">Loading profile...</div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-8">

        {/* Hero Header */}
        <div className="bg-gradient-to-br from-[#0D9488] to-[#14B8A6] rounded-3xl p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {userData.photo ? (
              <img src={userData.photo} alt={userData.name} className="w-24 h-24 rounded-2xl object-cover border-4 border-white/30 shadow-xl flex-shrink-0" />
            ) : (
              <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <User className="w-12 h-12 text-white" />
              </div>
            )}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold text-white mb-1" style={{fontFamily:'Syne,sans-serif'}}>{userData.name || 'User'}</h1>
              <p className="text-[#CCFBF1] text-sm mb-3">{userData.email}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 text-sm">
                <span className="flex items-center gap-1.5 bg-white/15 text-white px-3 py-1 rounded-full text-xs">
                  <GraduationCap className="w-3.5 h-3.5" />{userData.college || 'Add College'}
                </span>
                <span className="flex items-center gap-1.5 bg-white/15 text-white px-3 py-1 rounded-full text-xs">
                  <Briefcase className="w-3.5 h-3.5" />{userData.domain || 'Add Domain'}
                </span>
                {userData.location && (
                  <span className="flex items-center gap-1.5 bg-white/15 text-white px-3 py-1 rounded-full text-xs">
                    <MapPin className="w-3.5 h-3.5" />{userData.location}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-white text-[#0D9488] px-5 py-2.5 rounded-full font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2 flex-shrink-0"
            >
              <Edit3 className="w-4 h-4" />
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            {label:'BRIDGE Score', value:userData.bridgeScore, color:'text-[#0D9488]'},
            {label:'Interviews', value:userData.interviewsDone, color:'text-[#0D9488]'},
            {label:'Avg Score', value:userData.avgScore?.toFixed(1), color:'text-green-600'},
            {label:'Day Streak', value:userData.streak, color:'text-orange-500'},
          ].map((s,i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_4px_20px_rgba(13,148,136,0.06)] text-center">
              <div className={`text-3xl font-bold mb-1 ${s.color}`} style={{fontFamily:'Syne,sans-serif'}}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(13,148,136,0.06)] overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900" style={{fontFamily:'Syne,sans-serif'}}>Profile Details</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                {label:'College', key:'college', type:'text', placeholder:'Enter your college'},
                {label:'Degree', key:'degree', type:'text', placeholder:'Enter your degree'},
                {label:'Phone', key:'phone', type:'tel', placeholder:'Enter your phone number'},
                {label:'Location', key:'location', type:'text', placeholder:'Enter your location'},
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{f.label}</label>
                  <input
                    type={f.type}
                    value={userData[f.key]}
                    onChange={(e) => setUserData({...userData, [f.key]: e.target.value})}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] disabled:bg-gray-50 disabled:text-gray-500 text-sm transition-colors"
                    placeholder={f.placeholder}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Domain</label>
                <select
                  value={userData.domain}
                  onChange={(e) => setUserData({...userData, domain: e.target.value})}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] disabled:bg-gray-50 disabled:text-gray-500 text-sm transition-colors"
                >
                  <option value="">Select Domain</option>
                  {domainOptions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Looking For</label>
                <select
                  value={userData.lookingFor}
                  onChange={(e) => setUserData({...userData, lookingFor: e.target.value})}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] disabled:bg-gray-50 disabled:text-gray-500 text-sm transition-colors"
                >
                  {lookingForOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-5">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bio</label>
              <textarea
                value={userData.bio}
                onChange={(e) => setUserData({...userData, bio: e.target.value})}
                disabled={!isEditing}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] disabled:bg-gray-50 disabled:text-gray-500 text-sm transition-colors resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>

            {/* Resume */}
            <div className="mt-5 p-4 bg-[#F0FDFA] rounded-xl border border-[#CCFBF1]">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#CCFBF1] rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#0D9488]" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Resume</div>
                    <div className="text-xs text-gray-500">{resumeFileName || 'No resume uploaded'}</div>
                  </div>
                  {resumeFileName && <CheckCircle className="w-4 h-4 text-green-500" />}
                </div>
                <label className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all ${
                  resumeUploading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#0D9488] text-white hover:bg-[#0F766E]'
                }`}>
                  {resumeUploading ? (
                    <><div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> Analysing...</>
                  ) : (
                    <><Upload className="w-4 h-4" />{resumeFileName ? 'Change Resume' : 'Upload Resume'}</>
                  )}
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeChange} disabled={resumeUploading} />
                </label>
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-full text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white rounded-full text-sm font-semibold shadow hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Achievements */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(13,148,136,0.06)] overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900" style={{fontFamily:'Syne,sans-serif'}}>Achievements</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {achievements.map(a => (
                <div key={a.id} className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${
                  a.earned ? 'bg-[#F0FDFA] border-[#CCFBF1]' : 'bg-gray-50 border-gray-100 opacity-40 grayscale'
                }`}>
                  <div className="text-3xl mb-2">{a.icon}</div>
                  <div className={`text-xs font-semibold text-center leading-tight ${a.earned ? 'text-[#0D9488]' : 'text-gray-400'}`}>{a.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Restart Tour */}
        <div className="pb-8 text-center">
          <button
            onClick={async () => {
              const user = auth.currentUser;
              if (user) {
                try { await updateDoc(doc(db, 'users', user.uid), { tourCompleted: false }); } catch (e) { console.error(e); }
              } else {
                typeof window !== 'undefined' && localStorage.removeItem('bridge_tour_done');
              }
              window.location.href = '/dashboard';
            }}
            className="text-sm text-[#0D9488] underline underline-offset-2 hover:text-[#0F766E] transition-colors"
          >
            🎯 Restart Product Tour
          </button>
        </div>

      </div>
    </AppShell>
  );
}
