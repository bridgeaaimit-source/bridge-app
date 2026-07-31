import { adminDb } from '@/lib/firebase-admin';
import { calculateBridgeScore } from '@/lib/bridgeScoreEngine';
import { calculateCurrentStreak } from '@/lib/refreshBridgeScore';
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
      const mockResult = calculateBridgeScore({
        aptitudeRecords: [],
        interviewRecords: [],
        gdRecords: [],
        historicalBridgeScores: []
      });
      return NextResponse.json({
        ...mockResult,
        streak: 0
      });
    }

    // Safely query Aptitude Records from root collection (with fallback for missing composite index)
    let aptitudeRecords = [];
    try {
      let snap;
      try {
        snap = await adminDb
          .collection('aptitudeScores')
          .where('uid', '==', userId)
          .orderBy('completedAt', 'desc')
          .limit(5)
          .get();
      } catch (queryErr) {
        snap = await adminDb
          .collection('aptitudeScores')
          .where('uid', '==', userId)
          .get();
      }
      if (snap && snap.docs) {
        const sortedDocs = [...snap.docs].sort((a, b) => {
          const tA = a.data().completedAt ? new Date(a.data().completedAt.toDate ? a.data().completedAt.toDate() : a.data().completedAt).getTime() : 0;
          const tB = b.data().completedAt ? new Date(b.data().completedAt.toDate ? b.data().completedAt.toDate() : b.data().completedAt).getTime() : 0;
          return tB - tA;
        }).slice(0, 5);

        aptitudeRecords = sortedDocs.map(d => {
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
      }
    } catch (e) {
      console.warn('[BridgeScore API] Aptitude fetch warning:', e.message);
    }

    // Safely query Smart Interview Records
    let interviewRecords = [];
    try {
      let snap;
      try {
        snap = await adminDb
          .collection('users')
          .doc(userId)
          .collection('interview_feedback')
          .orderBy('createdAt', 'desc')
          .limit(5)
          .get();
      } catch (queryErr) {
        snap = await adminDb
          .collection('users')
          .doc(userId)
          .collection('interview_feedback')
          .get();
      }
      if (snap && snap.docs) {
        const sortedDocs = [...snap.docs].sort((a, b) => {
          const getT = (docData) => {
            const c = docData.createdAt;
            if (!c) return 0;
            if (typeof c === 'number') return c;
            if (c.toDate) return c.toDate().getTime();
            return new Date(c).getTime() || 0;
          };
          return getT(b.data()) - getT(a.data());
        }).slice(0, 5);

        interviewRecords = sortedDocs.map(d => {
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
      }
    } catch (e) {
      console.warn('[BridgeScore API] Interview fetch warning:', e.message);
    }

    // Safely query GD Records
    let gdRecords = [];
    try {
      let snap;
      try {
        snap = await adminDb
          .collection('users')
          .doc(userId)
          .collection('gd_sessions')
          .orderBy('createdAt', 'desc')
          .limit(5)
          .get();
      } catch (queryErr) {
        snap = await adminDb
          .collection('users')
          .doc(userId)
          .collection('gd_sessions')
          .get();
      }
      if (snap && snap.docs) {
        gdRecords = snap.docs.map(d => d.data()).reverse();
      }
    } catch (e) {
      console.warn('[BridgeScore API] GD fetch warning:', e.message);
    }

    // Safely query Historical Bridge Scores
    let historicalBridgeScores = [];
    try {
      let snap;
      try {
        snap = await adminDb
          .collection('users')
          .doc(userId)
          .collection('bridge_scores')
          .orderBy('createdAt', 'desc')
          .limit(5)
          .get();
      } catch (queryErr) {
        snap = await adminDb
          .collection('users')
          .doc(userId)
          .collection('bridge_scores')
          .get();
      }
      if (snap && snap.docs) {
        historicalBridgeScores = snap.docs.map(d => d.data()?.score).filter(val => typeof val === 'number').reverse();
      }
    } catch (e) {
      console.warn('[BridgeScore API] Historical scores fetch warning:', e.message);
    }

    const candidateData = {
      aptitudeRecords,
      interviewRecords,
      gdRecords,
      historicalBridgeScores
    };

    const bridgeScoreResult = calculateBridgeScore(candidateData);
    
    let calculatedStreak = 0;
    try {
      calculatedStreak = await calculateCurrentStreak(userId, adminDb);
    } catch (e) {
      console.warn('[BridgeScore API] Streak calculation warning:', e.message);
    }

    // Save the new score calculation asynchronously (fire and forget)
    // Only save if it's a valid calculated score (not null from empty data)
    if (bridgeScoreResult.score !== null) {
      const userRef = adminDb.collection('users').doc(userId);
      Promise.all([
        userRef.collection('bridge_scores').add({
          ...bridgeScoreResult,
          createdAt: new Date()
        }),
        userRef.set({
          bridgeScore: bridgeScoreResult.score,
          breakdown: bridgeScoreResult.breakdown,
          streak: calculatedStreak
        }, { merge: true })
      ]).catch(console.error);
    }

    return NextResponse.json({
      ...bridgeScoreResult,
      streak: calculatedStreak
    });

  } catch (error) {
    console.error('Error calculating Bridge Score:', error);
    return NextResponse.json({
      score: null,
      breakdown: { cognitive: null, competence: null, communication: null },
      streak: 0,
      error: 'Failed to calculate Bridge Score'
    }, { status: 200 });
  }
}
