import * as admin from 'firebase-admin';
import { calcLLMCost, calcTTSCostINR, USD_TO_INR } from './modelPricing';

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
 *   'career-intelligence' — /api/career-intelligence (claude-sonnet-4-5)
 * They use different models and must NOT be merged.
 */
function normalizeFeatureKey(feature) {
  if (!feature) return 'other';
  const f = feature.toLowerCase().trim();
  if (f === 'smart-interview' || f.startsWith('smart-interview')) return 'smart-interview';
  if (f === 'interview' || f === 'mock-interview') return 'interview';
  // Split GD Pulse / GD Practice into discussion turns (gd) and evaluations (gd_eval)
  if (f === 'gd_ai_eval' || f === 'gd-eval' || f === 'gd_eval') return 'gd_eval';
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

// Usage days follow India time so "today" on the dashboard matches the
// students' day (a UTC key would roll over at 5:30 am IST).
export function istDateKey(date = new Date()) {
  return new Date(date.getTime() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];
}

// Firestore field names cannot contain '.', '/', '[', ']' or '*'.
function safeKey(value) {
  return String(value || 'unknown').replace(/[.\/\[\]*~]/g, '_');
}

/**
 * Work out who made the call. Routes pass the uid from the request body when
 * they have it; otherwise fall back to the x-bridge-uid header that the app's
 * browser code adds to every /api request (components/ApiIdentity.js).
 */
async function resolveUid(userId) {
  if (userId && userId !== 'anonymous' && userId !== 'system') return userId;
  if (userId === 'system') return 'system';
  try {
    const { headers } = await import('next/headers');
    const h = await headers();
    const fromHeader = (h.get('x-bridge-uid') || '').trim();
    if (fromHeader && /^[A-Za-z0-9_-]{6,128}$/.test(fromHeader)) return fromHeader;
  } catch {
    // Not inside a request (cron, scripts) — fall through.
  }
  return 'anonymous';
}

/**
 * Log token usage for a user/feature on the server using Firebase Admin SDK.
 *
 * Writes two things:
 *  1. Daily totals: tokenUsage/daily/{IST date}/{uid} — tokens, calls and
 *     exact USD cost per feature (cost is worked out per call with the real
 *     model, so a feature that mixes Haiku and Sonnet is priced correctly).
 *  2. One row per call in apiUsageLog — for the "API calls" log on the
 *     admin usage dashboard.
 *
 * @param {string} userId       - Firebase UID, 'system', or 'anonymous'
 * @param {string} feature      - Raw feature name (will be normalised)
 * @param {number} inputTokens  - LLM input tokens (prompt)
 * @param {number} outputTokens - LLM output tokens (completion)
 * @param {string} [modelSlug]  - Exact model string from the API call (e.g. 'claude-haiku-4-5-20251001')
 */
export async function trackTokensServer(userId, feature, inputTokens, outputTokens, modelSlug) {
  const inp = inputTokens || 0;
  const out = outputTokens || 0;
  const total = inp + out;
  if (total <= 0) return;

  // Read the request header before any other await so it is still in scope.
  const uid = await resolveUid(userId);

  const adminDb = initAdminDb();
  if (!adminDb) return;

  const today = istDateKey();
  const normFeature = normalizeFeatureKey(feature);
  const model = modelSlug || 'unknown';
  const { costUSD, isEstimated } = calcLLMCost(inp, out, modelSlug);
  const inc = admin.firestore.FieldValue.increment;

  try {
    const updatePayload = {
      userId: uid,
      date: today,
      // ── Backward-compatible total fields ──────────────────────────────────
      [normFeature]: inc(total),
      total: inc(total),
      // ── Model-aware split fields ───────────────────────────────────────────
      [`${normFeature}_input`]: inc(inp),
      [`${normFeature}_output`]: inc(out),
      // ── Exact cost and call counts (added Nov 2026) ────────────────────────
      [`${normFeature}_calls`]: inc(1),
      [`${normFeature}_cost_usd`]: inc(costUSD),
      [`${normFeature}_models`]: admin.firestore.FieldValue.arrayUnion(model),
      calls: inc(1),
      cost_usd: inc(costUSD),
      lastUsed: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (modelSlug) updatePayload[`${normFeature}_model`] = modelSlug;

    await Promise.all([
      adminDb
        .collection('tokenUsage')
        .doc('daily')
        .collection(today)
        .doc(uid)
        .set(updatePayload, { merge: true }),
      adminDb.collection('apiUsageLog').add({
        kind: 'llm',
        userId: uid,
        feature: normFeature,
        rawFeature: feature || '',
        model,
        inputTokens: inp,
        outputTokens: out,
        costUSD,
        costINR: costUSD * USD_TO_INR,
        priceEstimated: isEstimated,
        date: today,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }),
    ]);

    console.log(
      `📊 [TokenTracker] ${uid} | ${normFeature} (${feature})` +
      ` | in:${inp} out:${out} | ${model} | $${costUSD.toFixed(5)}`
    );
  } catch (e) {
    console.error('❌ Token tracking failed:', e.message);
  }
}

/**
 * Log one text-to-speech generation (voice of the AI interviewer / GD panel).
 *
 * @param {string} userId
 * @param {object} info
 * @param {number} info.chars     - characters spoken
 * @param {string} info.provider  - 'gemini' | 'elevenlabs' | 'cache'
 * @param {string} [info.feature] - e.g. 'interview-voice', 'gd-voice'
 */
export async function trackVoiceServer(userId, { chars = 0, provider = 'gemini', feature = 'voice' } = {}) {
  if (!chars) return;
  const uid = await resolveUid(userId);
  const adminDb = initAdminDb();
  if (!adminDb) return;

  const today = istDateKey();
  const { costINR, costUSD, modelSlug } = calcTTSCostINR(chars, provider);
  const inc = admin.firestore.FieldValue.increment;

  try {
    await Promise.all([
      adminDb.collection('tokenUsage').doc('voice').collection(today).doc(uid).set(
        provider === 'cache'
          // Replays of already-generated audio are free; count them separately.
          ? { userId: uid, date: today, tts_cache_hits: inc(1), lastUsed: admin.firestore.FieldValue.serverTimestamp() }
          : {
              userId: uid,
              date: today,
              tts_chars: inc(chars),
              tts_cost_inr: inc(costINR),
              tts_calls: inc(1),
              [`tts_${safeKey(provider)}_chars`]: inc(chars),
              lastUsed: admin.firestore.FieldValue.serverTimestamp(),
            },
        { merge: true }
      ),
      // Cache hits cost nothing; only log real generations.
      provider === 'cache' ? null : adminDb.collection('apiUsageLog').add({
        kind: 'tts',
        userId: uid,
        feature,
        model: modelSlug,
        chars,
        costUSD,
        costINR,
        priceEstimated: true,
        date: today,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }),
    ]);
  } catch (e) {
    console.error('❌ Voice tracking failed:', e.message);
  }
}
