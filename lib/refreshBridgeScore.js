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
      adminDb.collection('aptitudeScores')
        .where('uid', '==', uid)
        .orderBy('completedAt', 'desc')
        .limit(5)
        .get(),
      userRef.collection('interview_feedback')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get(),
      userRef.collection('gd_sessions')
        .where('status', '==', 'REPORT_READY')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get(),
      userRef.collection('bridge_scores').orderBy('createdAt', 'desc').limit(5).get(),
    ]);

    const aptitudeRecords = aptSnap.docs.map(d => {
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

    const interviewRecords = intSnap.docs.map(d => {
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

    const gdRecords              = gdSnap.docs.map(d => d.data()).reverse();
    const historicalBridgeScores = scoreSnap.docs.map(d => d.data().score).reverse();

    const result = calculateBridgeScore({
      aptitudeRecords,
      interviewRecords,
      gdRecords,
      historicalBridgeScores,
    });

    if (result.score !== null) {
      await Promise.all([
        userRef.collection('bridge_scores').add({
          ...result,
          trigger: 'auto_refresh',
          createdAt: new Date(),
        }),
        userRef.update({
          bridgeScore: result.score,
          breakdown: result.breakdown
        })
      ]);
      console.log(`[BridgeScore] [User: ${uid}] Refreshed → ${result.score}`);
    }

    return result;
  } catch (err) {
    console.error(`[BridgeScore] [User: ${uid}] Refresh failed:`, err.message);
    return null;
  }
}
