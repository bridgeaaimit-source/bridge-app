/**
 * refreshBridgeScore — Reusable server-side Bridge Score recalculation pipeline.
 *
 * Call this after any assessment completion (GD, Interview, Aptitude, Resume, etc.)
 * to keep the Bridge Score up-to-date. Designed as fire-and-forget: callers should
 * not await the return value before responding to the user.
 *
 * Usage (fire-and-forget):
 *   refreshBridgeScore(uid).catch(() => {});
 *
 * @param {string} uid - Firebase user ID
 * @returns {Promise<{score: number, breakdown: object} | null>}
 */

import { adminDb } from '@/lib/firebase-admin';
import { calculateBridgeScore } from '@/lib/bridgeScoreEngine';

export async function refreshBridgeScore(uid) {
  if (!uid || uid === 'unknown' || !adminDb) return null;

  try {
    const userRef = adminDb.collection('users').doc(uid);

    // Fetch required assessment records with fallback for missing indexes
    const safeGet = async (queryFn, fallbackFn) => {
      try {
        return await queryFn();
      } catch (err) {
        if (fallbackFn) {
          try { return await fallbackFn(); } catch (fErr) {}
        }
        return { docs: [] };
      }
    };

    const [aptSnap, intSnap, gdSnap, scoreSnap] = await Promise.all([
      safeGet(
        () => adminDb.collection('aptitudeScores').where('uid', '==', uid).orderBy('completedAt', 'desc').limit(5).get(),
        () => adminDb.collection('aptitudeScores').where('uid', '==', uid).get()
      ),
      safeGet(
        () => userRef.collection('interview_feedback').orderBy('createdAt', 'desc').limit(5).get(),
        () => userRef.collection('interview_feedback').get()
      ),
      safeGet(
        () => userRef.collection('gd_sessions').where('status', '==', 'REPORT_READY').orderBy('createdAt', 'desc').limit(5).get(),
        () => userRef.collection('gd_sessions').get()
      ),
      safeGet(
        () => userRef.collection('bridge_scores').orderBy('createdAt', 'desc').limit(5).get(),
        () => userRef.collection('bridge_scores').get()
      ),
    ]);

    const aptitudeRecords = (aptSnap.docs || []).map(d => {
      const data = d.data();
      return {
        sectionScores: {
          quant: data.score || data.accuracy || 75,
          logical: data.score || data.accuracy || 75,
          verbal: data.score || data.accuracy || 75
        },
        level: 'medium',
        createdAt: data.completedAt ? (data.completedAt.toDate ? data.completedAt.toDate() : new Date(data.completedAt)) : new Date()
      };
    }).reverse();

    const interviewRecords = (intSnap.docs || []).map(d => {
      const data = d.data();
      const feedback = data.feedback || {};
      const scores = feedback.scores || data.scores || {};
      return {
        scores: {
          technical_knowledge: scores.technical_knowledge || scores.technical || 0,
          problem_solving: scores.problem_solving || 0,
          communication: scores.communication || 0,
          answer_quality: scores.answer_quality || feedback.overall_score || 0
        },
        type: data.round || data.type || 'standard',
        contradictions: feedback.contradictions || data.contradictions || [],
        behavior_flags: feedback.behavior_flags || data.behavior_flags || [],
        tab_switches: data.tab_switches || feedback.tab_switches || 0,
        createdAt: data.createdAt || Date.now()
      };
    }).reverse();

    const gdRecords              = (gdSnap.docs || []).map(d => d.data()).reverse();
    const historicalBridgeScores = (scoreSnap.docs || []).map(d => d.data().score).filter(val => typeof val === 'number').reverse();

    const result = calculateBridgeScore({
      aptitudeRecords,
      interviewRecords,
      gdRecords,
      historicalBridgeScores,
    });

    const calculatedStreak = await calculateCurrentStreak(uid, adminDb);

    if (result.score !== null) {
      await Promise.all([
        userRef.collection('bridge_scores').add({
          ...result,
          trigger: 'auto_refresh',
          createdAt: new Date(),
        }),
        userRef.set({
          bridgeScore: result.score,
          breakdown: result.breakdown,
          streak: calculatedStreak
        }, { merge: true })
      ]);
      console.log(`[BridgeScore] [User: ${uid}] Refreshed → ${result.score} (Streak: ${calculatedStreak})`);
    }

    return { ...result, streak: calculatedStreak };
  } catch (err) {
    console.error(`[BridgeScore] [User: ${uid}] Refresh failed:`, err.message);
    return null;
  }
}

// Converts Firestore Timestamps, millisecond numbers, ISO strings or Dates to a Date.
function toDateSafe(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// Calendar day in India time (students are in IST; the server runs in UTC).
function istDayKey(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export async function calculateCurrentStreak(userId, dbAdmin) {
  if (!userId || !dbAdmin) return 0;

  try {
    // Three queries in parallel, fetching only the date fields (the full documents
    // include long transcripts and made this slow).
    const userRef = dbAdmin.collection('users').doc(userId);
    const [aptSnap, intSnap, gdSnap] = await Promise.all([
      dbAdmin.collection('aptitudeScores').where('uid', '==', userId).select('completedAt').get(),
      userRef.collection('interview_feedback').select('createdAt', 'timestamp').get(),
      userRef.collection('gd_sessions').where('status', '==', 'REPORT_READY').select('createdAt', 'timestamp').get(),
    ]);

    const datesSet = new Set();
    const addDate = (value) => {
      const d = toDateSafe(value);
      if (d) datesSet.add(istDayKey(d));
    };
    aptSnap.docs.forEach((doc) => addDate(doc.data().completedAt));
    intSnap.docs.forEach((doc) => { const d = doc.data(); addDate(d.createdAt || d.timestamp); });
    gdSnap.docs.forEach((doc) => { const d = doc.data(); addDate(d.createdAt || d.timestamp); });

    if (datesSet.size === 0) return 0;

    const now = new Date();
    const todayKey = istDayKey(now);
    const yesterdayKey = istDayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
    if (!datesSet.has(todayKey) && !datesSet.has(yesterdayKey)) return 0;

    // Count consecutive days backwards from the latest active day
    let streak = 0;
    let cursor = datesSet.has(todayKey) ? now : new Date(now.getTime() - 24 * 60 * 60 * 1000);
    while (datesSet.has(istDayKey(cursor))) {
      streak++;
      cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
    }
    return streak;
  } catch (err) {
    console.warn('[Streak] calculation failed:', err.message);
    return 0;
  }
}
