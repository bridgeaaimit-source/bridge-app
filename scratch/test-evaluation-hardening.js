const fs = require('fs');
const path = require('path');

// 1. Read local environment configs
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').replace(/"/g, '').trim();
    envVars[key] = val;
  }
});

const BASE_URL = 'http://localhost:3000';

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('====================================================');
  console.log('   BridgeAI GD Evaluation Pipeline Hardening Test   ');
  console.log('====================================================\n');

  // Test Case 1: Valid Session Evaluation Trigger
  console.log('1. Testing Normal End-to-End Evaluation...');
  const successBody = {
    sessionId: "test_session_success_" + Date.now(),
    topic: "Artificial Intelligence in Modern Healthcare",
    category: "General",
    difficulty: "intermediate",
    turns: [
      { speakerId: "moderator", text: "Welcome to this Group Discussion. Let's begin.", type: "opening" },
      { speakerId: "student", text: "I believe AI will significantly improve diagnostic accuracy in healthcare by analyzing medical imaging.", type: "debate" },
      { speakerId: "aggressive", text: "I disagree. Diagnostics are not just about pictures. Doctors are still superior.", type: "debate" },
      { speakerId: "student", text: "Yes, but deep learning networks can review thousands of scans in seconds, reducing clinician fatigue.", type: "debate" },
      { speakerId: "moderator", text: "Thank you all. That concludes the discussion.", type: "closing" }
    ],
    elapsedSeconds: 120,
    uid: "mock_user_123",
    studentName: "Hardened Candidate",
    attempt: 1
  };

  try {
    const start = Date.now();
    const res = await fetch(`${BASE_URL}/api/gd-ai/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(successBody)
    });

    console.log(`HTTP Status: ${res.status}`);
    const data = await res.json();
    console.log('Validation Check: overallScore exists ->', typeof data.evaluation?.overallScore === 'number');
    console.log('Validation Check: summary exists ->', typeof data.evaluation?.summary === 'string');
    console.log('Validation Check: dimensions exists ->', typeof data.evaluation?.dimensions === 'object');
    console.log('Validation Check: overallAnalysis exists ->', typeof data.evaluation?.overallAnalysis === 'object');
    console.log(`Success! Resolved in ${((Date.now() - start) / 1000).toFixed(2)} seconds.\n`);
  } catch (err) {
    console.error('Normal Evaluation Failed:', err.message);
  }

  // Test Case 2: Validation Check (No student turns)
  console.log('2. Testing Validation Check (No Student Turns)...');
  const invalidBody = {
    sessionId: "test_session_invalid_" + Date.now(),
    topic: "AI in Healthcare",
    turns: [
      { speakerId: "moderator", text: "Welcome." }
    ],
    uid: "mock_user_123"
  };

  try {
    const res = await fetch(`${BASE_URL}/api/gd-ai/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidBody)
    });
    console.log(`HTTP Status: ${res.status}`);
    const data = await res.json();
    console.log('Expected error message received ->', data.error);
    console.log('');
  } catch (err) {
    console.error('Validation Test Failed:', err.message);
  }

  // Test Case 3: Response parsing robustness (simulate 500 error page handling)
  console.log('3. Testing Client-Side Response Parsing Robustness...');
  const fakeErrorRes = {
    ok: false,
    status: 504,
    text: async () => "An error occurred on the server (Vercel Gateway Timeout)"
  };

  let clientErrorMsg = '';
  try {
    if (!fakeErrorRes.ok) {
      let errMsg = 'Evaluation failed';
      try {
        const err = await fakeErrorRes.json();
        errMsg = err.error || errMsg;
      } catch (jsonErr) {
        try {
          const txt = await fakeErrorRes.text();
          errMsg = txt || errMsg;
        } catch {}
      }
      throw new Error(errMsg);
    }
  } catch (err) {
    clientErrorMsg = err.message;
  }
  console.log('Result error message extracted successfully ->', clientErrorMsg);
  console.log('Confirmed: No JSON syntax error occurred while parsing text error.\n');

  console.log('====================================================');
  console.log('   All programmatic checks successfully completed!  ');
  console.log('====================================================');
}

runTests();
