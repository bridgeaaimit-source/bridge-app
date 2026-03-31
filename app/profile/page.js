"use client";

import { useEffect, useState } from "react";
import { Home, Mic, Zap, Trophy, User, Edit3, Target, Award, TrendingUp, Calendar, Mail, Phone, MapPin, GraduationCap, Briefcase } from "lucide-react";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

  useEffect(() => {
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
            // Merge Firestore data with base data
            const data = userSnap.data();
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

  const handleSave = async () => {
    if (!currentUser) {
      toast.error('User not authenticated');
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
          bridgeScore: 500,
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
            <div className="w-8 h-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent mx-auto mb-4"></div>
            <div className="text-gray-600">Loading profile...</div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0891B2] to-[#0D9488] p-8">
            <div className="flex items-center gap-6">
              {userData.photo ? (
                <img src={userData.photo} alt={userData.name} className="w-24 h-24 rounded-full object-cover border-4 border-white" />
              ) : (
                <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <User className="w-12 h-12 text-white" />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">{userData.name || 'User'}</h1>
                <p className="text-cyan-100 mb-1">{userData.email}</p>
                <div className="flex items-center gap-4 text-cyan-100 text-sm">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-4 h-4" />
                    {userData.college || 'Add College'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {userData.domain || 'Add Domain'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 border-b border-gray-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-600 mb-1">{userData.bridgeScore}</div>
              <div className="text-sm text-gray-600">BRIDGE Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-600 mb-1">{userData.interviewsDone}</div>
              <div className="text-sm text-gray-600">Interviews</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">{userData.avgScore.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Avg Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-1">{userData.streak}</div>
              <div className="text-sm text-gray-600">Day Streak</div>
            </div>
          </div>

          {/* Form */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">College</label>
                <input
                  type="text"
                  value={userData.college}
                  onChange={(e) => setUserData({...userData, college: e.target.value})}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter your college"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Degree</label>
                <input
                  type="text"
                  value={userData.degree}
                  onChange={(e) => setUserData({...userData, degree: e.target.value})}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter your degree"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
                <select
                  value={userData.domain}
                  onChange={(e) => setUserData({...userData, domain: e.target.value})}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">Select Domain</option>
                  {domainOptions.map(domain => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={userData.location}
                  onChange={(e) => setUserData({...userData, location: e.target.value})}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter your location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Looking For</label>
                <select
                  value={userData.lookingFor}
                  onChange={(e) => setUserData({...userData, lookingFor: e.target.value})}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                >
                  {lookingForOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={userData.phone}
                  onChange={(e) => setUserData({...userData, phone: e.target.value})}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea
                value={userData.bio}
                onChange={(e) => setUserData({...userData, bio: e.target.value})}
                disabled={!isEditing}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Tell us about yourself..."
              />
            </div>

            {isEditing && (
              <div className="mt-6 flex justify-end gap-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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

          {/* Achievements */}
          <div className="p-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {achievements.map(achievement => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border text-center ${
                    achievement.earned
                      ? 'bg-cyan-50 border-cyan-200'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="text-2xl mb-2">{achievement.icon}</div>
                  <div className={`text-sm font-medium ${
                    achievement.earned ? 'text-cyan-700' : 'text-gray-500'
                  }`}>
                    {achievement.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
