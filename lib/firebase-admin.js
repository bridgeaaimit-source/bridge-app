import * as admin from 'firebase-admin';

let adminDb = null;

try {
  if (!admin.apps.length) {
    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      });
      console.log('Firebase Admin initialized successfully.');
    } else {
      console.warn('Firebase Admin credentials missing. Admin SDK will not be initialized.');
    }
  }
  
  if (admin.apps.length > 0) {
    adminDb = admin.firestore();
  }
} catch (error) {
  console.warn('Firebase Admin initialization failed:', error.message);
}

export { adminDb };

export async function trackTokens(userId, feature, inputTokens, outputTokens) {
  if (!adminDb || !userId) {
    return;
  }
  
  const total = (inputTokens || 0) + (outputTokens || 0);
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Daily tracking
    await adminDb.collection('tokenUsage').doc('daily').collection(today).doc(userId).set({
      userId,
      [feature]: admin.firestore.FieldValue.increment(total),
      total: admin.firestore.FieldValue.increment(total),
      lastUsed: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log(`📊 Token usage tracked: ${userId} | ${feature} | ${total} tokens`);
  } catch (error) {
    console.error('Failed to track token usage:', error);
  }
}
