import { adminDb, admin } from '@/lib/firebase-admin';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const collegeId = searchParams.get('collegeId');

  if (!collegeId) {
    return Response.json({ error: 'collegeId required' }, { status: 400 });
  }

  try {
    if (!adminDb) {
      return Response.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    // Query all students in this college
    const usersSnap = await adminDb.collection('users')
      .where('collegeId', '==', collegeId)
      .where('role', '==', 'student')
      .get();

    const students = [];
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

    usersSnap.forEach(doc => {
      const data = doc.data();
      students.push({ uid: doc.id, ...data });
    });

    const totalStudents = students.length;

    if (totalStudents === 0) {
      return Response.json({
        totalStudents: 0,
        placementReady: { count: 0, percentage: 0 },
        atRisk: { count: 0 },
        averageBridgeScore: 0,
        predictedPlacements: 0,
        batchReadiness: 0,
        trend: { change: 0, direction: 'neutral' },
        students,
      });
    }

    // Compute stats
    let totalScore = 0;
    let placementReadyCount = 0;
    let atRiskCount = 0;
    let predictedPlacements = 0;
    const atRiskStudents = [];

    for (const s of students) {
      const score = s.bridgeScore || 0;
      totalScore += score;

      if (score >= 700) placementReadyCount++;
      if (score >= 600) predictedPlacements++;

      const lastActive = s.lastActive || s.updatedAt || s.createdAt;
      const lastActiveMs = lastActive
        ? (typeof lastActive === 'string' ? new Date(lastActive).getTime() : (lastActive._seconds ? lastActive._seconds * 1000 : 0))
        : 0;
      const isInactive = lastActiveMs < sevenDaysAgo;

      if (score < 400 || isInactive) {
        atRiskCount++;
        atRiskStudents.push({
          uid: s.uid,
          name: s.name || 'Unknown',
          email: s.email || '',
          photo: s.photo || '',
          bridgeScore: score,
          lastActive: lastActive || null,
          isInactive,
          college: s.college || '',
        });
      }
    }

    const averageBridgeScore = Math.round(totalScore / totalStudents);
    const batchReadiness = Math.round((totalScore / (totalStudents * 1000)) * 100);

    // Fetch previous month snapshot for trend
    const now_date = new Date();
    const prevMonth = new Date(now_date.getFullYear(), now_date.getMonth() - 1, 1);
    const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

    let trend = { change: 0, direction: 'neutral' };

    try {
      const snapshotDoc = await adminDb.collection('batchSnapshots')
        .doc(`${collegeId}_${prevMonthKey}`)
        .get();

      if (snapshotDoc.exists) {
        const prevReadiness = snapshotDoc.data().batchReadiness || 0;
        const change = batchReadiness - prevReadiness;
        trend = {
          change: Math.abs(change),
          direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
        };
      }
    } catch (e) {
      console.warn('Snapshot fetch failed:', e.message);
    }

    // Save current month snapshot
    const currentMonthKey = `${now_date.getFullYear()}-${String(now_date.getMonth() + 1).padStart(2, '0')}`;
    try {
      await adminDb.collection('batchSnapshots')
        .doc(`${collegeId}_${currentMonthKey}`)
        .set({
          collegeId,
          month: currentMonthKey,
          totalStudents,
          averageBridgeScore,
          batchReadiness,
          placementReadyCount,
          atRiskCount,
          predictedPlacements,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    } catch (e) {
      console.warn('Snapshot save failed:', e.message);
    }

    return Response.json({
      totalStudents,
      placementReady: {
        count: placementReadyCount,
        percentage: Math.round((placementReadyCount / totalStudents) * 100),
      },
      atRisk: { count: atRiskCount, students: atRiskStudents },
      averageBridgeScore,
      predictedPlacements,
      batchReadiness,
      trend,
      students,
    });
  } catch (error) {
    console.error('Batch stats error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
