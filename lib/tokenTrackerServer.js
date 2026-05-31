import * as admin from 'firebase-admin';

let db = null;

function initAdminDb() {
  if (db) return db;
  try {
    if (!admin.apps.length) {
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

      if (clientEmail && privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: projectId,
            clientEmail: clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n')
          })
        });
        db = admin.firestore();
      } else {
        console.warn('⚠️ Firebase Admin credentials missing, token tracking will be disabled.');
      }
    } else {
      db = admin.firestore();
    }
  } catch (error) {
    console.error('❌ Firebase Admin init failed:', error.message);
  }
  return db;
}

function normalizeFeatureKey(feature) {
  if (!feature) return 'other';
  const f = feature.toLowerCase().trim();
  if (f.startsWith('smart-interview')) return 'smart-interview';
  if (f.startsWith('interview') || f === 'mock-interview') return 'interview';
  if (f.startsWith('gd') || f.startsWith('group-discussion')) return 'gd';
  if (f.startsWith('coach') || f === 'answer-coach') return 'coach';
  if (f.startsWith('pdf') || f === 'pdf-chat' || f === 'pdf-reader') return 'pdf-chat';
  if (f.startsWith('career-intel') || f === 'career-intelligence' || f === 'personalize') return 'career-intel';
  if (f.startsWith('news') || f === 'pulse') return 'news';
  if (f.startsWith('recruiter')) return 'recruiter';
  if (f.startsWith('resume') || f === 'parse-resume') return 'resume';
  if (f.startsWith('jobs') || f.startsWith('internships')) return 'jobs';
  if (f.startsWith('aptitude')) return 'aptitude';
  return f;
}

/**
 * Log token usage for a user/feature on the server using Firebase Admin SDK
 * @param {string} userId - User ID (Firebase UID) or 'system' / 'anonymous'
 * @param {string} feature - Raw feature name
 * @param {number} inputTokens - Claude input tokens
 * @param {number} outputTokens - Claude output tokens
 */
export async function trackTokensServer(userId, feature, inputTokens, outputTokens) {
  const adminDb = initAdminDb();
  if (!adminDb) return;

  const total = (inputTokens || 0) + (outputTokens || 0);
  if (total <= 0) return;

  const today = new Date().toISOString().split('T')[0];
  const uid = userId || 'anonymous';
  const normFeature = normalizeFeatureKey(feature);

  try {
    await adminDb.collection('tokenUsage').doc('daily').collection(today).doc(uid).set({
      userId: uid,
      date: today,
      [normFeature]: admin.firestore.FieldValue.increment(total),
      total: admin.firestore.FieldValue.increment(total),
      lastUsed: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`📊 [TokenTracker] ${uid} | ${normFeature} (${feature}): ${total} tokens`);
  } catch (e) {
    console.error('❌ Token tracking failed:', e.message);
  }
}
