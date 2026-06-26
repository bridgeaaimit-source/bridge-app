/**
 * GD AI Session CRUD
 * 
 * POST /api/gd-ai/session  — Create or update a session record
 * GET  /api/gd-ai/session?sessionId=xxx&uid=xxx — Fetch session by ID
 * GET  /api/gd-ai/session?uid=xxx&list=true — Fetch last 10 sessions for user
 */

import { adminDb, admin } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { uid, sessionData } = await request.json();

    if (!uid || !sessionData) {
      return NextResponse.json({ error: 'uid and sessionData required' }, { status: 400 });
    }

    if (!adminDb) {
      // Local dev without Firebase Admin — return mock success
      return NextResponse.json({ success: true, sessionId: sessionData.sessionId || `local_${Date.now()}` });
    }

    const sessionId = sessionData.sessionId || `gd_ai_${Date.now()}`;
    const record = {
      ...sessionData,
      sessionId,
      createdAt: admin?.firestore?.FieldValue?.serverTimestamp?.() || new Date(),
    };

    await adminDb
      .collection('users')
      .doc(uid)
      .collection('gd_sessions')
      .doc(sessionId)
      .set(record, { merge: true });

    return NextResponse.json({ success: true, sessionId });

  } catch (error) {
    console.error('[gd-ai/session POST] error:', error);
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const sessionId = searchParams.get('sessionId');
    const list = searchParams.get('list');

    if (!uid) {
      return NextResponse.json({ error: 'uid is required' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ sessions: [], session: null });
    }

    // List last 10 sessions
    if (list === 'true') {
      const snap = await adminDb
        .collection('users')
        .doc(uid)
        .collection('gd_sessions')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

      const sessions = snap.docs.map(d => {
        const data = d.data();
        return {
          sessionId: d.id,
          topic: data.topic,
          category: data.category,
          difficulty: data.difficulty,
          overallScore: data.overallScore || data.overallAnalysis?.totalScore || 0,
          durationSeconds: data.durationSeconds,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      });

      return NextResponse.json({ sessions });
    }

    // Fetch single session
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required for single fetch' }, { status: 400 });
    }

    const doc = await adminDb
      .collection('users')
      .doc(uid)
      .collection('gd_sessions')
      .doc(sessionId)
      .get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const data = doc.data();
    return NextResponse.json({
      session: {
        ...data,
        sessionId: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('[gd-ai/session GET] error:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}
