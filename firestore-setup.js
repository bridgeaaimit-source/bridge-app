// Complete Firestore Structure for BRIDGE App
// This document outlines all collections and documents needed

import { doc, setDoc, collection, addDoc, updateDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./lib/firebase.js";

// ===================================================================
// FIRESTORE STRUCTURE DESIGN
// ===================================================================

/*
 COLLECTIONS NEEDED:
 
 1. users/{userId} - Main user documents
 2. users/{userId}/interview_feedback/ - Smart interview feedback history
 3. users/{userId}/sessions/ - Regular interview sessions (if needed)
 4. interviews/ - Global interview data (if needed)
 5. leaderboard/ - Cached leaderboard data (optional)
 6. analytics/ - App analytics (optional)
*/

// ===================================================================
// USER DOCUMENT STRUCTURE
// ===================================================================

const createUserDocument = async (userId, userData) => {
  const userRef = doc(db, 'users', userId);
  
  const defaultUserStructure = {
    // Basic Info
    name: userData.name || 'Anonymous User',
    email: userData.email || '',
    photo: userData.photo || null,
    college: userData.college || 'Unknown College',
    phone: userData.phone || '',
    location: userData.location || '',
    lookingFor: userData.lookingFor || 'Full-time',
    
    // Role & Access
    role: userData.role || 'student', // 'student' | 'recruiter' | 'admin'
    approved: userData.approved !== false, // Default to true
    
    // BRIDGE Stats (IMPORTANT for dashboard)
    bridgeScore: userData.bridgeScore || 500, // 0-1000
    interviewsDone: userData.interviewsDone || 0, // Interview count
    avgScore: userData.avgScore || 0, // Average interview score
    streak: userData.streak || 0, // Consecutive days
    
    // Skills & Domains
    skills: userData.skills || [],
    domains: userData.domains || [],
    
    // Timestamps
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastSeen: new Date().toISOString()
  };
  
  await setDoc(userRef, defaultUserStructure);
  console.log('✅ User document created:', userId);
  return defaultUserStructure;
};

// ===================================================================
// INTERVIEW FEEDBACK STRUCTURE
// ===================================================================

const saveInterviewFeedback = async (userId, feedbackData) => {
  const feedbackRef = collection(db, 'users', userId, 'interview_feedback');
  
  const feedbackStructure = {
    // Interview Details
    jobRole: feedbackData.jobRole || 'Unknown Role',
    round: feedbackData.round || 'HR Round',
    
    // Feedback Data (from Claude API)
    feedback: feedbackData.feedback || {
      placement_chance: 50,
      verdict: "Weak Maybe",
      overall_score: 5,
      scores: {
        communication: 5,
        technical_knowledge: 5,
        resume_jd_fit: 5,
        confidence: 5,
        answer_quality: 5
      }
    },
    
    // Conversation History
    conversationHistory: feedbackData.conversationHistory || [],
    
    // Resume Data (for reference)
    resumeBase64: feedbackData.resumeBase64 || '',
    resumeText: feedbackData.resumeText || '',
    jobDescription: feedbackData.jobDescription || '',
    
    // Timestamps
    timestamp: new Date().toISOString(),
    createdAt: Date.now(),
    
    // Metadata
    interviewType: 'smart', // 'smart' | 'regular'
    duration: feedbackData.duration || 0, // in minutes
    completed: true
  };
  
  const docRef = await addDoc(feedbackRef, feedbackStructure);
  console.log('✅ Interview feedback saved:', docRef.id);
  return docRef.id;
};

// ===================================================================
// UPDATE USER STATS AFTER INTERVIEW
// ===================================================================

const updateUserStatsAfterInterview = async (userId, feedbackData) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    console.log('❌ User document not found, creating new one...');
    await createUserDocument(userId, {
      name: feedbackData.userName,
      email: feedbackData.userEmail
    });
    return;
  }
  
  const userData = userSnap.data();
  const overallScore = feedbackData.feedback?.overall_score || 5;
  
  // Calculate new stats
  const newInterviewsDone = (userData.interviewsDone || 0) + 1;
  const newAvgScore = ((userData.avgScore || 0) * (userData.interviewsDone || 0) + overallScore) / newInterviewsDone;
  const newBridgeScore = Math.min(1000, (userData.bridgeScore || 500) + (overallScore * 10));
  const newStreak = (userData.streak || 0) + 1;
  
  const updateData = {
    interviewsDone: newInterviewsDone,
    avgScore: Math.round(newAvgScore * 10) / 10, // Round to 1 decimal
    bridgeScore: newBridgeScore,
    streak: newStreak,
    lastSeen: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  await updateDoc(userRef, updateData);
  console.log('✅ User stats updated:', updateData);
  return updateData;
};

// ===================================================================
// LEADERBOARD QUERY STRUCTURE
// ===================================================================

const getLeaderboardData = async (limit = 10) => {
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('role', '==', 'student'),
    where('approved', '==', true),
    orderBy('bridgeScore', 'desc'),
    orderBy('interviewsDone', 'desc'),
    limit(limit)
  );
  
  const querySnapshot = await getDocs(q);
  const leaderboard = [];
  
  querySnapshot.forEach((doc, index) => {
    const userData = doc.data();
    leaderboard.push({
      rank: index + 1,
      userId: doc.id,
      name: userData.name || 'Anonymous',
      college: userData.college || 'Unknown',
      bridgeScore: userData.bridgeScore || 0,
      interviewsDone: userData.interviewsDone || 0,
      avgScore: userData.avgScore || 0,
      streak: userData.streak || 0,
      photo: userData.photo || null
    });
  });
  
  return leaderboard;
};

// ===================================================================
// MIGRATION: FIND AND IMPORT OLD DATA
// ===================================================================

const migrateOldData = async (userId) => {
  console.log('🔄 Starting migration for user:', userId);
  
  // Check existing user document
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    console.log('❌ No user document found');
    return;
  }
  
  const userData = userSnap.data();
  console.log('📊 Current user data:', userData);
  
  // Check for old feedback data in various locations
  const oldCollections = [
    'interview_feedback',
    'feedback', 
    'interviews',
    'user_feedback',
    'sessions'
  ];
  
  let migratedCount = 0;
  
  for (const collectionName of oldCollections) {
    try {
      // Check subcollection
      const subCollectionRef = collection(db, 'users', userId, collectionName);
      const subQuery = query(subCollectionRef, orderBy('createdAt', 'desc'), limit(10));
      const subSnapshot = await getDocs(subQuery);
      
      if (!subSnapshot.empty) {
        console.log(`📦 Found ${subSnapshot.size} documents in ${collectionName}`);
        subSnapshot.forEach((doc) => {
          console.log(`  - ${doc.id}:`, doc.data());
        });
        migratedCount += subSnapshot.size;
      }
      
      // Check top-level collection
      const topCollectionRef = collection(db, collectionName);
      const topQuery = query(topCollectionRef, where('uid', '==', userId));
      const topSnapshot = await getDocs(topQuery);
      
      if (!topSnapshot.empty) {
        console.log(`📦 Found ${topSnapshot.size} documents in top-level ${collectionName}`);
        topSnapshot.forEach((doc) => {
          console.log(`  - ${doc.id}:`, doc.data());
        });
        migratedCount += topSnapshot.size;
      }
      
    } catch (error) {
      console.log(`⚠️ Error checking ${collectionName}:`, error.message);
    }
  }
  
  console.log(`✅ Migration complete. Found ${migratedCount} total documents`);
  return migratedCount;
};

// ===================================================================
// VALIDATION: CHECK ALL STRUCTURES EXIST
// ===================================================================

const validateFirestoreStructure = async (userId) => {
  console.log('🔍 Validating Firestore structure...');
  
  const checks = [];
  
  // Check user document
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    checks.push({
      name: 'User Document',
      exists: userSnap.exists(),
      data: userSnap.exists() ? userSnap.data() : null
    });
  } catch (error) {
    checks.push({
      name: 'User Document',
      exists: false,
      error: error.message
    });
  }
  
  // Check interview feedback collection
  try {
    const feedbackRef = collection(db, 'users', userId, 'interview_feedback');
    const feedbackQuery = query(feedbackRef, limit(1));
    const feedbackSnapshot = await getDocs(feedbackQuery);
    checks.push({
      name: 'Interview Feedback Collection',
      exists: true,
      count: feedbackSnapshot.size
    });
  } catch (error) {
    checks.push({
      name: 'Interview Feedback Collection',
      exists: false,
      error: error.message
    });
  }
  
  console.log('📋 Validation Results:');
  checks.forEach(check => {
    console.log(`  ${check.name}: ${check.exists ? '✅' : '❌'}`);
    if (check.error) console.log(`    Error: ${check.error}`);
    if (check.data) console.log(`    Data keys: ${Object.keys(check.data)}`);
  });
  
  return checks;
};

// ===================================================================
// EXPORT ALL FUNCTIONS
// ===================================================================

export {
  createUserDocument,
  saveInterviewFeedback,
  updateUserStatsAfterInterview,
  getLeaderboardData,
  migrateOldData,
  validateFirestoreStructure
};

// ===================================================================
// USAGE EXAMPLES
// ===================================================================

/*
// Create user document
await createUserDocument('user123', {
  name: 'Siddhesh Mahurkar',
  email: 'siddhesh@example.com',
  college: 'VIT'
});

// Save interview feedback
await saveInterviewFeedback('user123', {
  jobRole: 'Software Engineer',
  feedback: { placement_chance: 75, overall_score: 8 },
  conversationHistory: [...]
});

// Update user stats
await updateUserStatsAfterInterview('user123', {
  feedback: { overall_score: 8 }
});

// Get leaderboard
const leaderboard = await getLeaderboardData(10);

// Migrate old data
await migrateOldData('user123');

// Validate structure
await validateFirestoreStructure('user123');
*/
