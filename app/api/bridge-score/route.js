import { adminDb } from '@/lib/firebase-admin';
import { calculateBridgeScore } from '@/lib/bridgeScoreEngine';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!adminDb) {
      // Return a calculated mock for local testing without Firebase Admin credentials
      return NextResponse.json(calculateBridgeScore({
        aptitudeRecords: [],
        interviewRecords: [],
        gdRecords: [],
        historicalBridgeScores: []
      }));
    }

    // Fetch Aptitude Records from root collection
    const aptitudeSnap = await adminDb
      .collection('aptitudeScores')
      .where('uid', '==', userId)
      .orderBy('completedAt', 'desc')
      .limit(5)
      .get();
    const aptitudeRecords = aptitudeSnap.docs.map(d => {
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

    // Fetch Smart Interview Records from interview_feedback subcollection
    const interviewSnap = await adminDb
      .collection('users')
      .doc(userId)
      .collection('interview_feedback')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    const interviewRecords = interviewSnap.docs.map(d => {
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

    // Fetch GD Records
    const gdSnap = await adminDb
      .collection('users')
      .doc(userId)
      .collection('gd_sessions')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    const gdRecords = gdSnap.docs.map(d => d.data()).reverse();

    // Fetch Historical Bridge Scores (for reliability variance)
    const scoreSnap = await adminDb
      .collection('users')
      .doc(userId)
      .collection('bridge_scores')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    const historicalBridgeScores = scoreSnap.docs.map(d => d.data().score).reverse();

    const candidateData = {
      aptitudeRecords,
      interviewRecords,
      gdRecords,
      historicalBridgeScores
    };

    const bridgeScoreResult = calculateBridgeScore(candidateData);

    // Save the new score calculation asynchronously (fire and forget)
    // Only save if it's a valid calculated score (not null from empty data)
    if (bridgeScoreResult.score !== null) {
      const userRef = adminDb.collection('users').doc(userId);
      Promise.all([
        userRef.collection('bridge_scores').add({
          ...bridgeScoreResult,
          createdAt: new Date()
        }),
        userRef.update({
          bridgeScore: bridgeScoreResult.score,
          breakdown: bridgeScoreResult.breakdown
        })
      ]).catch(console.error);
    }

    return NextResponse.json(bridgeScoreResult);

  } catch (error) {
    console.error('Error calculating Bridge Score:', error);
    return NextResponse.json({ error: 'Failed to calculate Bridge Score' }, { status: 500 });
  }
}
