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

    // Fetch Aptitude Records
    const aptitudeSnap = await adminDb
      .collection('users')
      .doc(userId)
      .collection('aptitude')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    const aptitudeRecords = aptitudeSnap.docs.map(d => d.data()).reverse();

    // Fetch Smart Interview Records
    const interviewSnap = await adminDb
      .collection('users')
      .doc(userId)
      .collection('interviews')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    const interviewRecords = interviewSnap.docs.map(d => d.data()).reverse();

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
      adminDb.collection('users').doc(userId).collection('bridge_scores').add({
        ...bridgeScoreResult,
        createdAt: new Date()
      }).catch(console.error);
    }

    return NextResponse.json(bridgeScoreResult);

  } catch (error) {
    console.error('Error calculating Bridge Score:', error);
    return NextResponse.json({ error: 'Failed to calculate Bridge Score' }, { status: 500 });
  }
}
