import * as admin from 'firebase-admin';

let adminDb = null;
let adminStorage = null;

try {
  if (!admin.apps.length) {
    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      });
      console.log('Firebase Admin initialized successfully.');
    } else {
      console.warn('Firebase Admin credentials missing. Admin SDK will not be initialized.');
    }
  }
  
  if (admin.apps.length > 0) {
    adminDb = admin.firestore();
    adminStorage = admin.storage();
  }
} catch (error) {
  console.warn('Firebase Admin initialization failed:', error.message);
}

export { adminDb, adminStorage, admin };
