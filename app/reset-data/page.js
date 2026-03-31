"use client";

import { useState } from "react";
import { collection, getDocs, doc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Trash2, AlertTriangle, RefreshCw, Users, Database } from "lucide-react";

export default function ResetDataPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [stats, setStats] = useState({ users: 0, interviews: 0, messages: 0 });

  const fetchStats = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const interviewsSnapshot = await getDocs(collection(db, 'interviews'));
      const messagesSnapshot = await getDocs(collection(db, 'messages'));
      
      setStats({
        users: usersSnapshot.size,
        interviews: interviewsSnapshot.size,
        messages: messagesSnapshot.size
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const resetAllData = async () => {
    if (confirmText !== "DELETE ALL DATA") {
      setStatus('Please type "DELETE ALL DATA" exactly to confirm');
      return;
    }

    setLoading(true);
    setStatus('Starting data reset...');

    try {
      // 1. Delete all users
      setStatus('Deleting all users...');
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const batch = writeBatch(db);
      
      usersSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      setStatus(`Deleted ${usersSnapshot.size} users`);

      // 2. Delete all interviews
      setStatus('Deleting all interviews...');
      const interviewsSnapshot = await getDocs(collection(db, 'interviews'));
      const interviewBatch = writeBatch(db);
      
      interviewsSnapshot.forEach((doc) => {
        interviewBatch.delete(doc.ref);
      });
      
      await interviewBatch.commit();
      setStatus(`Deleted ${interviewsSnapshot.size} interview collections`);

      // 3. Delete all messages
      setStatus('Deleting all messages...');
      const messagesSnapshot = await getDocs(collection(db, 'messages'));
      const messageBatch = writeBatch(db);
      
      messagesSnapshot.forEach((doc) => {
        messageBatch.delete(doc.ref);
      });
      
      await messageBatch.commit();
      setStatus(`Deleted ${messagesSnapshot.size} message collections`);

      setStatus('✅ All data deleted successfully! Fresh start ready.');
      
      // Refresh stats
      setTimeout(fetchStats, 1000);

    } catch (error) {
      console.error('Error resetting data:', error);
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
      setConfirmText("");
    }
  };

  useState(() => {
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#F5FAFA] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reset All Data</h1>
              <p className="text-gray-600">⚠️ This will permanently delete ALL user data</p>
            </div>
          </div>
        </div>

        {/* Current Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Data Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-cyan-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.users}</div>
              <div className="text-sm text-gray-600">Users</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Database className="w-6 h-6 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.interviews}</div>
              <div className="text-sm text-gray-600">Interview Collections</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.messages}</div>
              <div className="text-sm text-gray-600">Message Collections</div>
            </div>
          </div>
          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Stats
          </button>
        </div>

        {/* Reset Form */}
        <div className="bg-white rounded-xl border border-red-200 p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-red-600 mb-2">⚠️ Danger Zone</h2>
            <p className="text-gray-600">
              This action will permanently delete ALL data including:
            </p>
            <ul className="mt-3 list-disc list-inside text-gray-600 space-y-1">
              <li>All user profiles and accounts</li>
              <li>All interview sessions and results</li>
              <li>All messages and chats</li>
              <li>All recruiter data and shortlists</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type "DELETE ALL DATA" to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE ALL DATA"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {status && (
              <div className={`p-4 rounded-lg ${
                status.includes('✅') ? 'bg-green-50 text-green-700' :
                status.includes('❌') ? 'bg-red-50 text-red-700' :
                'bg-blue-50 text-cyan-700'
              }`}>
                {status}
              </div>
            )}

            <button
              onClick={resetAllData}
              disabled={loading || confirmText !== "DELETE ALL DATA"}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                loading || confirmText !== "DELETE ALL DATA"
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Resetting...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  Delete All Data
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-xl border border-cyan-200 p-6">
          <h3 className="text-lg font-semibold text-cyan-900 mb-3">After Reset:</h3>
          <ol className="list-decimal list-inside text-cyan-800 space-y-2">
            <li>All users will need to sign in again</li>
            <li>New users will start with 500 BRIDGE score</li>
            <li>All interview history will be cleared</li>
            <li>Leaderboard will be empty until users complete interviews</li>
            <li>Profile data will need to be re-entered</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
