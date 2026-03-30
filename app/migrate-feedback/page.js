"use client";
import { useState } from "react";
import { collection, query, orderBy, limit, getDocs, doc, setDoc, addDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function MigrateFeedbackPage() {
  const [status, setStatus] = useState("Ready to migrate");
  const [results, setResults] = useState([]);

  const migrateFeedback = async () => {
    setStatus("Starting migration...");
    setResults([]);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        setStatus("Please login first");
        return;
      }

      setStatus("User ID: " + user.uid);
      
      // Check 1: Look for feedback in users collection directly
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setResults(prev => [...prev, { type: 'User Document', data: userData }]);
        
        // Look for any feedback fields in user document
        if (userData.feedback || userData.interviews || userData.recentInterview) {
          setResults(prev => [...prev, { type: 'Found Feedback in User Doc', data: { 
            feedback: userData.feedback, 
            interviews: userData.interviews,
            recentInterview: userData.recentInterview
          }}]);
        }
      }
      
      // Check 2: Look for any existing interview feedback collections
      const collectionsToCheck = [
        'interview_feedback',
        'feedback', 
        'interviews',
        'user_feedback'
      ];
      
      for (const collectionName of collectionsToCheck) {
        try {
          const feedbackRef = collection(db, 'users', user.uid, collectionName);
          const q = query(feedbackRef, orderBy('createdAt', 'desc'), limit(10));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const docs = [];
            querySnapshot.forEach((doc) => {
              docs.push({ id: doc.id, data: doc.data() });
            });
            setResults(prev => [...prev, { type: `Found in ${collectionName}`, data: docs }]);
            setStatus(`Found ${querySnapshot.size} documents in ${collectionName}`);
          }
        } catch (error) {
          setResults(prev => [...prev, { type: `Error in ${collectionName}`, data: error.message }]);
        }
      }
      
      // Check 3: Look for top-level collections
      for (const collectionName of collectionsToCheck) {
        try {
          const feedbackRef = collection(db, collectionName);
          const q = query(feedbackRef, orderBy('createdAt', 'desc'), limit(10));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const userDocs = [];
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              if (data.uid === user.uid) {
                userDocs.push({ id: doc.id, data: data });
              }
            });
            if (userDocs.length > 0) {
              setResults(prev => [...prev, { type: `Found in top-level ${collectionName}`, data: userDocs }]);
            }
          }
        } catch (error) {
          setResults(prev => [...prev, { type: `Error in top-level ${collectionName}`, data: error.message }]);
        }
      }
      
      setStatus("Migration completed - check results below");
      
    } catch (error) {
      setStatus("Migration error: " + error.message);
      setResults(prev => [...prev, { type: 'Error', data: error.message }]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Feedback Migration Tool</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <p className="text-gray-700">{status}</p>
          
          <button
            onClick={migrateFeedback}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Start Migration
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          {results.length === 0 ? (
            <p className="text-gray-500">No results yet. Click "Start Migration" to begin.</p>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded p-4">
                  <h3 className="font-semibold text-lg mb-2">{result.type}</h3>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
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
