"use client";
import { useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function TestFeedbackPage() {
  const [status, setStatus] = useState("Ready to test");
  const [results, setResults] = useState([]);

  const testStatsUpdate = async () => {
    setStatus("Testing stats update...");
    setResults([]);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        setStatus("Please login first");
        return;
      }

      // Get current user data
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setResults(prev => [...prev, { 
          type: '✅ Current User Data', 
          data: {
            name: userData.name,
            interviewsDone: userData.interviewsDone,
            bridgeScore: userData.bridgeScore,
            avgScore: userData.avgScore
          }
        }]);

        // Simulate interview completion
        const newInterviewsDone = (userData.interviewsDone || 0) + 1;
        const mockScore = 8; // Mock interview score
        const newAvgScore = ((userData.avgScore || 0) * (userData.interviewsDone || 0) + mockScore) / newInterviewsDone;
        const newBridgeScore = Math.min(1000, (userData.bridgeScore || 500) + (mockScore * 10));
        
        const updateData = {
          interviewsDone: newInterviewsDone,
          avgScore: Math.round(newAvgScore * 10) / 10,
          bridgeScore: newBridgeScore,
          streak: (userData.streak || 0) + 1,
          lastSeen: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setResults(prev => [...prev, { 
          type: '📈 Updating With', 
          data: updateData
        }]);

        await updateDoc(userRef, updateData);
        
        setResults(prev => [...prev, { 
          type: '✅ Update Successful', 
          data: 'Stats updated successfully!'
        }]);

        // Verify the update
        const updatedSnap = await getDoc(userRef);
        const updatedData = updatedSnap.data();
        
        setResults(prev => [...prev, { 
          type: '✅ Verified New Data', 
          data: {
            interviewsDone: updatedData.interviewsDone,
            bridgeScore: updatedData.bridgeScore,
            avgScore: updatedData.avgScore
          }
        }]);

        setStatus("✅ Test completed successfully!");
        
      } else {
        setResults(prev => [...prev, { 
          type: '❌ No User Document', 
          data: 'User document not found'
        }]);
        setStatus("❌ No user document found");
      }
      
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
      setResults(prev => [...prev, { 
        type: '❌ Error', 
        data: error.message
      }]);
    }
  };

  const testAPI = async () => {
    setStatus("Testing smart interview API...");
    setResults([]);
    
    try {
      // Test the API with mock data
      const mockData = {
        action: 'evaluate',
        resume_base64: '',
        job_role: 'Software Engineer',
        jd: 'Test job description',
        round: 'Technical Round',
        conversation_history: [
          { question: 'Tell me about yourself', answer: 'I am a software developer...' },
          { question: 'What is your experience with React?', answer: 'I have 2 years of experience...' }
        ]
      };

      setResults(prev => [...prev, { 
        type: '📤 Sending API Request', 
        data: mockData
      }]);

      const response = await fetch('/api/smart-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockData)
      });

      setResults(prev => [...prev, { 
        type: '📥 API Response Status', 
        data: `Status: ${response.status}`
      }]);

      const responseText = await response.text();
      setResults(prev => [...prev, { 
        type: '📥 API Response Text', 
        data: responseText.substring(0, 500) + '...'
      }]);

      if (response.ok) {
        try {
          const data = JSON.parse(responseText);
          setResults(prev => [...prev, { 
            type: '✅ Parsed API Response', 
            data: {
              placement_chance: data.placement_chance,
              overall_score: data.overall_score,
              verdict: data.verdict
            }
          }]);
          setStatus("✅ API test successful!");
        } catch (parseError) {
          setResults(prev => [...prev, { 
            type: '❌ JSON Parse Error', 
            data: parseError.message
          }]);
          setStatus("❌ JSON parse error");
        }
      } else {
        setResults(prev => [...prev, { 
          type: '❌ API Error', 
          data: `HTTP ${response.status}`
        }]);
        setStatus(`❌ API error: ${response.status}`);
      }
      
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
      setResults(prev => [...prev, { 
        type: '❌ Network Error', 
        data: error.message
      }]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Feedback System</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <p className="text-gray-700 mb-4">{status}</p>
          
          <div className="flex gap-4">
            <button
              onClick={testStatsUpdate}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Test Stats Update
            </button>
            
            <button
              onClick={testAPI}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Test API
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          {results.length === 0 ? (
            <p className="text-gray-500">Click a test button to see results.</p>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className={`border rounded p-4 ${
                  result.type.startsWith('✅') ? 'border-green-200 bg-green-50' : 
                  result.type.startsWith('❌') ? 'border-red-200 bg-red-50' : 
                  'border-blue-200 bg-blue-50'
                }`}>
                  <h3 className="font-semibold text-lg mb-2">{result.type}</h3>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {typeof result.data === 'object' ? JSON.stringify(result.data, null, 2) : result.data}
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
