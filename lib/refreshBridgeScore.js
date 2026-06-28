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

    // Fetch required assessment records in parallel
    const [aptSnap, intSnap, gdSnap, scoreSnap] = await Promise.all([
      userRef.collection('aptitude').orderBy('createdAt', 'desc').limit(5).get(),
      userRef.collection('interviews').orderBy('createdAt', 'desc').limit(5).get(),
      userRef.collection('gd_sessions')
        .where('status', '==', 'REPORT_READY')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get(),
      userRef.collection('bridge_scores').orderBy('createdAt', 'desc').limit(5).get(),
    ]);

    const aptitudeRecords        = aptSnap.docs.map(d => d.data()).reverse();
    const interviewRecords       = intSnap.docs.map(d => d.data()).reverse();
    const gdRecords              = gdSnap.docs.map(d => d.data()).reverse();
    const historicalBridgeScores = scoreSnap.docs.map(d => d.data().score).reverse();

    const result = calculateBridgeScore({
      aptitudeRecords,
      interviewRecords,
      gdRecords,
      historicalBridgeScores,
    });

    if (result.score !== null) {
      await userRef.collection('bridge_scores').add({
        ...result,
        trigger: 'auto_refresh',
        createdAt: new Date(),
      });
      console.log(`[BridgeScore] [User: ${uid}] Refreshed → ${result.score}`);
    }

    return result;
  } catch (err) {
    console.error(`[BridgeScore] [User: ${uid}] Refresh failed:`, err.message);
    return null;
  }
}
