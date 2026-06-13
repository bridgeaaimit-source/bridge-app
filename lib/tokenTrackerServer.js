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

/**
 * Normalise a raw feature name to its canonical Firestore field key.
 *
 * IMPORTANT: 'career-intel' is intentionally split into two separate keys:
 *   'personalize'         — /api/personalize  (claude-haiku-4-5)
 *   'career-intelligence' — /api/career-intelligence (claude-sonnet-4-20250514)
 * They use different models and must NOT be merged.
 */
function normalizeFeatureKey(feature) {
  if (!feature) return 'other';
  const f = feature.toLowerCase().trim();
  if (f === 'smart-interview' || f.startsWith('smart-interview')) return 'smart-interview';
  if (f === 'interview' || f === 'mock-interview') return 'interview';
  if (f.startsWith('gd') || f.startsWith('group-discussion')) return 'gd';
  if (f === 'coach' || f === 'answer-coach') return 'coach';
  if (f === 'pdf-chat' || f === 'pdf-reader') return 'pdf-chat';
  // Deliberate split — do NOT merge these two:
  if (f === 'personalize') return 'personalize';
  if (f === 'career-intelligence' || f === 'career-intel') return 'career-intelligence';
  if (f.startsWith('news') || f === 'pulse') return 'news';
  if (f.startsWith('recruiter')) return 'recruiter';
  if (f === 'resume' || f === 'parse-resume') return 'resume';
  if (f.startsWith('jobs') || f.startsWith('internships')) return 'jobs';
  if (f.startsWith('aptitude')) return 'aptitude';
  if (f === 'tpo') return 'tpo';
  if (f === 'cron') return 'cron';
  return f;
}

/**
 * Log token usage for a user/feature on the server using Firebase Admin SDK.
 *
 * @param {string} userId       - Firebase UID, 'system', or 'anonymous'
 * @param {string} feature      - Raw feature name (will be normalised)
 * @param {number} inputTokens  - LLM input tokens (prompt)
 * @param {number} outputTokens - LLM output tokens (completion)
 * @param {string} [modelSlug]  - Exact model string from the API call (e.g. 'claude-haiku-4-5-20251001')
 */
export async function trackTokensServer(userId, feature, inputTokens, outputTokens, modelSlug) {
  const adminDb = initAdminDb();
  if (!adminDb) return;

  const inp = inputTokens || 0;
  const out = outputTokens || 0;
  const total = inp + out;
  if (total <= 0) return;

  const today = new Date().toISOString().split('T')[0];
  const uid = userId || 'anonymous';
  const normFeature = normalizeFeatureKey(feature);

  try {
    const updatePayload = {
      userId: uid,
      date: today,
      // ── Backward-compatible total fields ──────────────────────────────────
      [normFeature]: admin.firestore.FieldValue.increment(total),
      total: admin.firestore.FieldValue.increment(total),
      // ── New model-aware split fields ───────────────────────────────────────
      [`${normFeature}_input`]: admin.firestore.FieldValue.increment(inp),
      [`${normFeature}_output`]: admin.firestore.FieldValue.increment(out),
      lastUsed: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Only write model slug if provided (avoids overwriting with undefined)
    if (modelSlug) {
      // Last-write-wins is acceptable: all calls for a feature in one day use the same model
      updatePayload[`${normFeature}_model`] = modelSlug;
    }

    await adminDb
      .collection('tokenUsage')
      .doc('daily')
      .collection(today)
      .doc(uid)
      .set(updatePayload, { merge: true });

    console.log(
      `📊 [TokenTracker] ${uid} | ${normFeature} (${feature})` +
      ` | in:${inp} out:${out} total:${total}` +
      (modelSlug ? ` | model:${modelSlug}` : '')
    );
  } catch (e) {
    console.error('❌ Token tracking failed:', e.message);
  }
}
