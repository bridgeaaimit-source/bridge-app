"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function TestFirestore() {
  const [status, setStatus] = useState("Loading...");
  const [user, setUser] = useState(null);
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        runTests(currentUser);
      } else {
        setStatus("Please login to test Firestore");
      }
    });

    return () => unsubscribe();
  }, []);

  const runTests = async (currentUser) => {
    const results = [];
    
    try {
      // Test 1: Check if we can access the users collection
      setStatus("Testing Firestore access...");
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      results.push({
        test: "Collection Access",
        status: "✅ Success",
        details: `Found ${usersSnapshot.size} users in collection`
      });

      // Test 2: Try to read current user document
      setStatus("Testing user document read...");
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        results.push({
          test: "User Document Read",
          status: "✅ Success",
          details: `User data found: ${JSON.stringify(userDoc.data(), null, 2)}`
        });
      } else {
        results.push({
          test: "User Document Read",
          status: "⚠️ Not Found",
          details: "User document doesn't exist - will be created on first login"
        });
      }

      // Test 3: Try to create/update a test document
      setStatus("Testing document write...");
      const testData = {
        test: true,
        timestamp: new Date().toISOString(),
        uid: currentUser.uid
      };
      
      await setDoc(userRef, testData, { merge: true });
      results.push({
        test: "Document Write",
        status: "✅ Success",
        details: "Successfully wrote/updated user document"
      });

      // Test 4: Verify the write worked
      setStatus("Verifying write...");
      const updatedDoc = await getDoc(userRef);
      results.push({
        test: "Write Verification",
        status: "✅ Success",
        details: `Document exists: ${updatedDoc.exists()}, Data: ${JSON.stringify(updatedDoc.data(), null, 2)}`
      });

      setStatus("All tests completed!");
      
    } catch (error) {
      results.push({
        test: "Error",
        status: "❌ Failed",
        details: error.message
      });
      setStatus("Test failed!");
    }
    
    setTestResults(results);
  };

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Firestore Connection Test</h1>
        
        {/* User Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Status</h2>
          {user ? (
            <div>
              <p className="text-green-600">✅ Logged in as: {user.email}</p>
              <p className="text-sm text-gray-600">UID: {user.uid}</p>
              <button
                onClick={handleLogout}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          ) : (
            <div>
              <p className="text-red-600">❌ Not logged in</p>
              <button
                onClick={handleLogin}
                className="mt-4 px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
              >
                Login with Google
              </button>
            </div>
          )}
        </div>

        {/* Test Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Status</h2>
          <p className="text-lg">{status}</p>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{result.test}</h3>
                    <span className={`text-sm font-medium ${
                      result.status.includes('✅') ? 'text-green-600' :
                      result.status.includes('⚠️') ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                  <pre className="text-sm text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
                    {result.details}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Firebase Config Check */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Firebase Configuration</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Project ID:</strong> {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}</p>
            <p><strong>Auth Domain:</strong> {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}</p>
            <p><strong>App ID:</strong> {process.env.NEXT_PUBLIC_FIREBASE_APP_ID}</p>
            <p><strong>API Key:</strong> {process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10)}...</p>
          </div>
        </div>

        {/* Manual Actions */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Manual Actions</h2>
          <div className="space-y-4">
            <button
              onClick={() => window.open('https://console.firebase.google.com/project/bridge-app-79f36/firestore', '_blank')}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 mr-4"
            >
              Open Firebase Console
            </button>
            {user && (
              <button
                onClick={() => runTests(user)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Re-run Tests
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
