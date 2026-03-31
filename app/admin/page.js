"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Users, Trophy, TrendingUp, Calendar, Mail, Phone, MapPin, GraduationCap } from "lucide-react";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInterviews: 0,
    avgScore: 0,
    activeToday: 0
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchData();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all users
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const usersList = [];
      
      let totalInterviews = 0;
      let totalScore = 0;
      let activeTodayCount = 0;
      const today = new Date().toDateString();
      
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        usersList.push({
          uid: doc.id,
          ...userData,
          lastSeen: userData.updatedAt || userData.createdAt
        });
        
        totalInterviews += userData.interviewsDone || 0;
        totalScore += userData.bridgeScore || 0;
        
        // Check if active today (simplified check)
        if (userData.updatedAt && new Date(userData.updatedAt).toDateString() === today) {
          activeTodayCount++;
        }
      });
      
      // Sort by bridge score
      usersList.sort((a, b) => (b.bridgeScore || 0) - (a.bridgeScore || 0));
      
      setUsers(usersList);
      setStats({
        totalUsers: usersList.length,
        totalInterviews,
        avgScore: usersList.length > 0 ? Math.round(totalScore / usersList.length) : 0,
        activeToday: activeTodayCount
      });
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 900) return 'text-purple-500';
    if (score >= 800) return 'text-cyan-600';
    if (score >= 700) return 'text-cyan-600';
    if (score >= 600) return 'text-green-600';
    return 'text-gray-600';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5FAFA] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent mx-auto mb-4"></div>
          <div className="text-gray-600">Loading admin data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5FAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">BRIDGE Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">View all users and system statistics</p>
          {currentUser && (
            <p className="text-sm text-gray-500 mt-1">Logged in as: {currentUser.email}</p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-cyan-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalUsers}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
                <Trophy className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalInterviews}</div>
            <div className="text-sm text-gray-600">Total Interviews</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.avgScore}</div>
            <div className="text-sm text-gray-600">Average Score</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.activeToday}</div>
            <div className="text-sm text-gray-600">Active Today</div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">All Users ({users.length})</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Education</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BRIDGE Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interviews</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.photo ? (
                          <img src={user.photo} alt={user.name} className="w-8 h-8 rounded-full object-cover mr-3" />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-r from-[#0891B2] to-[#0D9488] rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                            {user.name?.charAt(0)?.toUpperCase() || 'A'}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name || 'Anonymous'}</div>
                          <div className="text-sm text-gray-500">{user.lookingFor || 'Not specified'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {user.email}
                          </div>
                        )}
                        {user.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {user.phone}
                          </div>
                        )}
                        {user.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {user.location}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-gray-400" />
                          {user.college || 'Not specified'}
                        </div>
                        <div className="text-xs text-gray-500">{user.degree || 'Not specified'}</div>
                        <div className="text-xs text-gray-500">{user.domain || 'Not specified'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-lg font-bold ${getScoreColor(user.bridgeScore || 0)}`}>
                        {user.bridgeScore || 0}
                      </div>
                      <div className="text-xs text-gray-500">Avg: {(user.avgScore || 0).toFixed(1)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.interviewsDone || 0}</div>
                      <div className="text-xs text-gray-500">Streak: {user.streak || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.lastSeen)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => window.open('https://console.firebase.google.com/', '_blank')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              <Trophy className="w-5 h-5" />
              Open Firebase Console
            </button>
            <button
              onClick={fetchData}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <TrendingUp className="w-5 h-5" />
              Refresh Data
            </button>
            <button
              onClick={() => {
                const csv = [
                  ['Name', 'Email', 'College', 'BRIDGE Score', 'Interviews', 'Last Active'],
                  ...users.map(u => [
                    u.name || 'Anonymous',
                    u.email || '',
                    u.college || '',
                    u.bridgeScore || 0,
                    u.interviewsDone || 0,
                    formatDate(u.lastSeen)
                  ])
                ].map(row => row.join(',')).join('\n');
                
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `bridge_users_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
              }}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Users className="w-5 h-5" />
              Export to CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
