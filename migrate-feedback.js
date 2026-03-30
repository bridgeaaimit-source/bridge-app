// Migration script to find and import existing interview feedback
import { collection, query, orderBy, limit, getDocs, doc, setDoc, addDoc } from 'firebase/firestore';
import { db } from './lib/firebase.js';

async function migrateFeedback() {
  console.log('Starting feedback migration...');
  
  try {
    // Check if user has any existing feedback in various possible locations
    const user = auth.currentUser;
    if (!user) {
      console.log('No user logged in');
      return;
    }

    console.log('User ID:', user.uid);
    
    // Check 1: Look for feedback in users collection directly
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('User data found:', userData);
      
      // Look for any feedback fields in user document
      if (userData.feedback || userData.interviews || userData.recentInterview) {
        console.log('Found existing feedback data in user document');
        console.log('Feedback data:', userData.feedback);
        console.log('Interviews data:', userData.interviews);
        console.log('Recent interview:', userData.recentInterview);
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
          console.log(`Found ${querySnapshot.size} documents in ${collectionName}:`);
          querySnapshot.forEach((doc) => {
            console.log('Document ID:', doc.id);
            console.log('Document data:', doc.data());
          });
        }
      } catch (error) {
        console.log(`Collection ${collectionName} not found or no access:`, error.message);
      }
    }
    
    // Check 3: Look for top-level collections
    for (const collectionName of collectionsToCheck) {
      try {
        const feedbackRef = collection(db, collectionName);
        const q = query(feedbackRef, orderBy('createdAt', 'desc'), limit(10));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          console.log(`Found ${querySnapshot.size} documents in top-level ${collectionName}:`);
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.uid === user.uid) {
              console.log('User document found:', doc.id, data);
            }
          });
        }
      } catch (error) {
        console.log(`Top-level collection ${collectionName} not found:`, error.message);
      }
    }
    
    console.log('Migration completed');
    
  } catch (error) {
    console.error('Migration error:', error);
  }
}

// Export for use in page
export { migrateFeedback };
