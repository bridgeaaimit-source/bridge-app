"use client";
import { useState } from "react";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function Page() {
  const [status, setStatus] = useState("Ready to migrate");
  const [results, setResults] = useState([]);

  const migrateHistoricalFeedback = async () => {
    setStatus("Migrating historical feedback data to lenient scoring...");
    setResults([]);

    try {
      const user = auth.currentUser;
      if (!user) {
        setStatus("Please login first");
        return;
      }

      // Get all feedback documents for this user
      const feedbackRef = collection(db, 'users', user.uid, 'interview_feedback');
      const feedbackSnapshot = await getDocs(feedbackRef);

      setResults(prev => [...prev, {
        type: '📊 Found',
        data: `${feedbackSnapshot.size} feedback documents to migrate`
      }]);

      let updated = 0;
      let skipped = 0;

      for (const docSnapshot of feedbackSnapshot.docs) {
        const feedbackData = docSnapshot.data();
        const feedbackRef = docSnapshot.ref;

        // Check if already migrated (has lenient scores >= 6)
        if (feedbackData.feedback?.overall_score >= 6) {
          skipped++;
          continue;
        }

        const oldFeedback = feedbackData.feedback || {};
        const oldScores = oldFeedback.scores || {};

        // Multiply scores by 2 (if out of 5), cap at 10
        const newScores = {};
        Object.keys(oldScores).forEach(key => {
          const oldVal = oldScores[key] || 5;
          newScores[key] = Math.min(10, Math.round(oldVal * 2));
        });

        // Increase placement chance significantly (2x multiplier for more lenient scoring)
        const oldPlacement = oldFeedback.placement_chance || 50;
        const newPlacement = Math.min(90, Math.round(oldPlacement * 2));

        // Update verdict to be more positive
        const oldVerdict = oldFeedback.verdict || 'Weak Maybe';
        let newVerdict = oldVerdict;
        if (oldVerdict === 'Not Hire') newVerdict = 'Weak Maybe';
        if (oldVerdict === 'Weak Maybe') newVerdict = 'Strong Maybe';
        if (oldVerdict === 'Strong Maybe') newVerdict = 'Hire';

        // Update feedback
        const updatedFeedback = {
          ...oldFeedback,
          placement_chance: newPlacement,
          verdict: newVerdict,
          overall_score: Math.min(10, Math.round((oldFeedback.overall_score || 5) * 1.5)),
          scores: newScores
        };

        await updateDoc(feedbackRef, { feedback: updatedFeedback });
        updated++;

        setResults(prev => [...prev, {
          type: '✅ Updated',
          data: {
            id: docSnapshot.id,
            oldPlacement: `${oldPlacement}%`,
            newPlacement: `${newPlacement}%`,
            oldVerdict,
            newVerdict
          }
        }]);
      }

      setResults(prev => [...prev, {
        type: '✅ Migration Complete',
        data: {
          updated,
          skipped,
          total: feedbackSnapshot.size
        }
      }]);

      setStatus(`✅ Migration complete! Updated ${updated} records.`);

    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
      setResults(prev => [...prev, {
        type: '❌ Error',
        data: error.message
      }]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Migrate Historical Feedback</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <p className="text-gray-700 mb-4">{status}</p>

          <button
            onClick={migrateHistoricalFeedback}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Migrate Historical Feedback
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          {results.length === 0 ? (
            <p className="text-gray-500">Click the button to migrate historical feedback data.</p>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className={`border rounded p-4 ${
                  result.type.startsWith('✅') ? 'border-green-200 bg-green-50' :
                  result.type.startsWith('❌') ? 'border-red-200 bg-red-50' :
                  'border-cyan-200 bg-blue-50'
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
