"use client";
import { useState } from "react";
import { doc, setDoc, collection, addDoc, updateDoc, getDoc, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function FirestoreSetupPage() {
  const [status, setStatus] = useState("Ready to setup Firestore");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");

  const createUserDocument = async (uid, userData) => {
    const userRef = doc(db, 'users', uid);
    
    const defaultUserStructure = {
      name: userData.name || 'Anonymous User',
      email: userData.email || '',
      photo: userData.photo || null,
      college: userData.college || 'Unknown College',
      phone: userData.phone || '',
      location: userData.location || '',
      lookingFor: userData.lookingFor || 'Full-time',
      
      role: userData.role || 'student',
      approved: userData.approved !== false,
      
      bridgeScore: userData.bridgeScore || 500,
      interviewsDone: userData.interviewsDone || 0,
      avgScore: userData.avgScore || 0,
      streak: userData.streak || 0,
      
      skills: userData.skills || [],
      domains: userData.domains || [],
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };
    
    await setDoc(userRef, defaultUserStructure);
    return defaultUserStructure;
  };

  const saveInterviewFeedback = async (uid, feedbackData) => {
    const feedbackRef = collection(db, 'users', uid, 'interview_feedback');
    
    const feedbackStructure = {
      jobRole: feedbackData.jobRole || 'Software Engineer',
      round: feedbackData.round || 'HR Round',
      
      feedback: feedbackData.feedback || {
        placement_chance: 75,
        verdict: "Strong Maybe",
        overall_score: 8,
        scores: {
          communication: 8,
          technical_knowledge: 7,
          resume_jd_fit: 8,
          confidence: 7,
          answer_quality: 8
        }
      },
      
      conversationHistory: feedbackData.conversationHistory || [],
      resumeBase64: feedbackData.resumeBase64 || '',
      resumeText: feedbackData.resumeText || '',
      jobDescription: feedbackData.jobDescription || '',
      
      timestamp: new Date().toISOString(),
      createdAt: Date.now(),
      interviewType: 'smart',
      duration: 15,
      completed: true
    };
    
    const docRef = await addDoc(feedbackRef, feedbackStructure);
    return docRef.id;
  };

  const updateUserStats = async (uid, feedbackData) => {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await createUserDocument(uid, { name: 'Test User', email: 'test@example.com' });
      return;
    }
    
    const userData = userSnap.data();
    const overallScore = feedbackData.feedback?.overall_score || 8;
    
    const newInterviewsDone = (userData.interviewsDone || 0) + 1;
    const newAvgScore = ((userData.avgScore || 0) * (userData.interviewsDone || 0) + overallScore) / newInterviewsDone;
    const newBridgeScore = Math.min(1000, (userData.bridgeScore || 500) + (overallScore * 10));
    
    const updateData = {
      interviewsDone: newInterviewsDone,
      avgScore: Math.round(newAvgScore * 10) / 10,
      bridgeScore: newBridgeScore,
      streak: (userData.streak || 0) + 1,
      lastSeen: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(userRef, updateData);
    return updateData;
  };

  const setupCompleteFirestore = async () => {
    setLoading(true);
    setStatus("Setting up complete Firestore structure...");
    setResults([]);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        setStatus("Please login first");
        return;
      }
      
      const uid = userId || user.uid;
      setStatus(`Setting up for user: ${uid}`);
      
      // 1. Create/Update User Document
      setStatus("Creating user document...");
      const userData = await createUserDocument(uid, {
        name: 'Siddhesh Mahurkar',
        email: user.email || 'siddhesh@example.com',
        college: 'VIT',
        bridgeScore: 750,
        interviewsDone: 0,
        avgScore: 0,
        streak: 0
      });
      setResults(prev => [...prev, { type: '✅ User Document Created', data: userData }]);
      
      // 2. Create Sample Interview Feedback
      setStatus("Creating sample interview feedback...");
      const sampleFeedback = {
        jobRole: 'Software Engineer',
        round: 'Technical Round',
        feedback: {
          placement_chance: 85,
          verdict: 'Strong Maybe',
          overall_score: 8,
          scores: {
            communication: 8,
            technical_knowledge: 7,
            resume_jd_fit: 8,
            confidence: 7,
            answer_quality: 8
          },
          strengths: [
            'Strong technical foundation in algorithms',
            'Clear communication of complex concepts',
            'Good problem-solving approach'
          ],
          weaknesses: [
            'Could provide more specific examples',
            'Needs more depth in system design'
          ],
          improvement_roadmap: [
            'Practice more system design questions',
            'Prepare specific project examples',
            'Work on explaining technical trade-offs'
          ]
        },
        conversationHistory: [
          { question: 'Tell me about your experience with React', answer: 'I have worked on several React projects...' },
          { question: 'How do you handle state management?', answer: 'I use Redux and Context API...' }
        ]
      };
      
      const feedbackId = await saveInterviewFeedback(uid, sampleFeedback);
      setResults(prev => [...prev, { type: '✅ Sample Feedback Created', data: { id: feedbackId } }]);
      
      // 3. Update User Stats
      setStatus("Updating user stats...");
      const updatedStats = await updateUserStats(uid, sampleFeedback);
      setResults(prev => [...prev, { type: '✅ User Stats Updated', data: updatedStats }]);
      
      // 4. Create Multiple Sample Interviews for Testing
      setStatus("Creating additional sample interviews...");
      for (let i = 2; i <= 5; i++) {
        const moreFeedback = {
          ...sampleFeedback,
          jobRole: `Software Engineer - Round ${i}`,
          feedback: {
            ...sampleFeedback.feedback,
            overall_score: 6 + Math.floor(Math.random() * 4),
            placement_chance: 60 + Math.floor(Math.random() * 30)
          }
        };
        
        await saveInterviewFeedback(uid, moreFeedback);
        await updateUserStats(uid, moreFeedback);
      }
      setResults(prev => [...prev, { type: '✅ Additional Interviews Created', data: { count: 4 } }]);
      
      // 5. Verify Leaderboard Query
      setStatus("Testing leaderboard query...");
      const leaderboardQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student'),
        orderBy('bridgeScore', 'desc'),
        limit(10)
      );
      const leaderboardSnapshot = await getDocs(leaderboardQuery);
      const leaderboardData = [];
      
      leaderboardSnapshot.forEach((doc, index) => {
        const userData = doc.data();
        leaderboardData.push({
          rank: index + 1,
          name: userData.name || 'Anonymous',
          college: userData.college || 'Unknown',
          score: userData.bridgeScore || 0
        });
      });
      
      setResults(prev => [...prev, { type: '✅ Leaderboard Working', data: { count: leaderboardData.length, users: leaderboardData } }]);
      
      setStatus("✅ Complete Firestore setup successful!");
      
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
      setResults(prev => [...prev, { type: '❌ Error', data: error.message }]);
    } finally {
      setLoading(false);
    }
  };

  const validateStructure = async () => {
    setLoading(true);
    setStatus("Validating Firestore structure...");
    setResults([]);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        setStatus("Please login first");
        return;
      }
      
      const uid = userId || user.uid;
      
      // Check user document
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setResults(prev => [...prev, { 
          type: '✅ User Document Found', 
          data: {
            name: userData.name,
            interviewsDone: userData.interviewsDone,
            bridgeScore: userData.bridgeScore,
            avgScore: userData.avgScore
          }
        }]);
      } else {
        setResults(prev => [...prev, { type: '❌ User Document Not Found', data: null }]);
      }
      
      // Check interview feedback collection
      const feedbackRef = collection(db, 'users', uid, 'interview_feedback');
      const feedbackQuery = query(feedbackRef, orderBy('createdAt', 'desc'), limit(5));
      const feedbackSnapshot = await getDocs(feedbackRef);
      
      if (!feedbackSnapshot.empty) {
        const feedbackList = [];
        feedbackSnapshot.forEach((doc) => {
          feedbackList.push({
            id: doc.id,
            jobRole: doc.data().jobRole,
            placement_chance: doc.data().feedback?.placement_chance,
            overall_score: doc.data().feedback?.overall_score
          });
        });
        setResults(prev => [...prev, { type: '✅ Interview Feedback Found', data: { count: feedbackList.length, feedback: feedbackList } }]);
      } else {
        setResults(prev => [...prev, { type: '❌ No Interview Feedback Found', data: null }]);
      }
      
      setStatus("✅ Validation complete");
      
    } catch (error) {
      setStatus(`❌ Validation error: ${error.message}`);
      setResults(prev => [...prev, { type: '❌ Error', data: error.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Firestore Setup & Validation</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <p className="text-gray-700 mb-4">{status}</p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User ID (optional, defaults to current user)
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Leave empty to use current user"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={setupCompleteFirestore}
              disabled={loading}
              className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50"
            >
              {loading ? 'Setting up...' : 'Setup Complete Structure'}
            </button>
            
            <button
              onClick={validateStructure}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Validating...' : 'Validate Structure'}
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          {results.length === 0 ? (
            <p className="text-gray-500">No results yet. Click one of the buttons above.</p>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className={`border rounded p-4 ${
                  result.type.startsWith('✅') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}>
                  <h3 className="font-semibold text-lg mb-2">{result.type}</h3>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
