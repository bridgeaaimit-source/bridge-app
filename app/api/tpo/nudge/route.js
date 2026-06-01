import { adminDb, admin } from '@/lib/firebase-admin';

export async function POST(request) {
  try {
    if (!adminDb) return Response.json({ error: 'Firebase Admin not initialized' }, { status: 500 });

    const body = await request.json();
    const { studentIds, tpoName, college, company, driveDate, driveId, collegeId } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return Response.json({ error: 'studentIds array required' }, { status: 400 });
    }

    const driveDateFormatted = driveDate
      ? new Date(driveDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : 'soon';

    const batch = adminDb.batch();
    const nudgedAt = new Date().toISOString();

    for (const uid of studentIds) {
      // Fetch student name for personalised message
      let studentName = 'there';
      try {
        const studentDoc = await adminDb.collection('users').doc(uid).get();
        if (studentDoc.exists) {
          studentName = studentDoc.data().name?.split(' ')[0] || 'there';
        }
      } catch (e) { /* keep default */ }

      const bridgeScore = 0; // Will be filled from student data client-side
      const readiness = 0;

      const message = company
        ? `Hey ${studentName}, ${tpoName || 'Your TPO'} from ${college || 'your college'} wants you to practice before the ${company} drive on ${driveDateFormatted}. Open BRIDGE now and prepare!`
        : `Hey ${studentName}, ${tpoName || 'Your TPO'} from ${college || 'your college'} wants you to step up your preparation. Your batch is counting on you! Open BRIDGE now.`;

      // Save notification to student
      const notifRef = adminDb.collection('users').doc(uid).collection('notifications').doc();
      batch.set(notifRef, {
        type: 'tpo_nudge',
        message,
        tpoName: tpoName || '',
        company: company || '',
        driveDate: driveDate || null,
        driveId: driveId || null,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Save nudge log
      const nudgeRef = adminDb.collection('nudges').doc();
      batch.set(nudgeRef, {
        studentUid: uid,
        collegeId: collegeId || '',
        tpoName: tpoName || '',
        company: company || '',
        driveId: driveId || null,
        nudgedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    return Response.json({
      success: true,
      nudgedCount: studentIds.length,
      nudgedAt,
    });
  } catch (error) {
    console.error('Nudge error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
