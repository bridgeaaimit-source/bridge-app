import { adminDb, admin } from '@/lib/firebase-admin';

// GET — list drives for a college
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const collegeId = searchParams.get('collegeId');

  if (!collegeId) {
    return Response.json({ error: 'collegeId required' }, { status: 400 });
  }

  try {
    if (!adminDb) return Response.json({ error: 'Firebase Admin not initialized' }, { status: 500 });

    const drivesSnap = await adminDb.collection('drives')
      .where('collegeId', '==', collegeId)
      .orderBy('driveDate', 'desc')
      .get();

    const drives = [];
    drivesSnap.forEach(doc => {
      drives.push({ driveId: doc.id, ...doc.data() });
    });

    return Response.json({ drives });
  } catch (error) {
    console.error('Drives GET error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST — create a new drive + notify eligible students
export async function POST(request) {
  try {
    if (!adminDb) return Response.json({ error: 'Firebase Admin not initialized' }, { status: 500 });

    const body = await request.json();
    const {
      collegeId, company, companyDomain, role, package: pkg,
      location, eligibility, driveDate, lastApplyDate,
      rounds, superset_link, tpoName, collegeName,
    } = body;

    if (!collegeId || !company || !role) {
      return Response.json({ error: 'collegeId, company, and role are required' }, { status: 400 });
    }

    // Create drive doc
    const driveRef = await adminDb.collection('drives').add({
      collegeId,
      company,
      companyDomain: companyDomain || '',
      role,
      package: pkg || '',
      location: location || '',
      eligibility: eligibility || {},
      driveDate: driveDate ? admin.firestore.Timestamp.fromDate(new Date(driveDate)) : null,
      lastApplyDate: lastApplyDate ? admin.firestore.Timestamp.fromDate(new Date(lastApplyDate)) : null,
      rounds: rounds || [],
      status: 'upcoming',
      superset_link: superset_link || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const driveId = driveRef.id;

    // Notify eligible students
    let notifiedCount = 0;
    try {
      const studentsSnap = await adminDb.collection('users')
        .where('collegeId', '==', collegeId)
        .where('role', '==', 'student')
        .get();

      const batch = adminDb.batch();
      const driveDateFormatted = driveDate
        ? new Date(driveDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        : 'TBD';

      studentsSnap.forEach(doc => {
        const student = doc.data();
        const elig = eligibility || {};

        // Check eligibility
        let eligible = true;
        if (elig.minCGPA && (student.cgpa || 0) < elig.minCGPA) eligible = false;
        if (elig.branches && elig.branches.length > 0 && student.branch) {
          if (!elig.branches.includes(student.branch)) eligible = false;
        }
        if (elig.year && student.year && elig.year !== student.year) eligible = false;

        if (eligible) {
          const notifRef = adminDb.collection('users').doc(doc.id)
            .collection('notifications').doc();
          batch.set(notifRef, {
            type: 'new_drive',
            company,
            role,
            package: pkg || '',
            driveDate: driveDate || null,
            driveId,
            read: false,
            message: `🏢 ${company} is hiring! You're eligible for ${role} - ${pkg || 'Package TBD'}. Drive on ${driveDateFormatted}. Check your readiness now.`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          notifiedCount++;
        }
      });

      if (notifiedCount > 0) await batch.commit();
    } catch (notifErr) {
      console.warn('Notification send failed:', notifErr.message);
    }

    return Response.json({ driveId, notifiedCount });
  } catch (error) {
    console.error('Drives POST error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PUT — update an existing drive
export async function PUT(request) {
  try {
    if (!adminDb) return Response.json({ error: 'Firebase Admin not initialized' }, { status: 500 });

    const body = await request.json();
    const { driveId, ...updates } = body;

    if (!driveId) return Response.json({ error: 'driveId required' }, { status: 400 });

    // Convert date strings to Firestore timestamps
    if (updates.driveDate) {
      updates.driveDate = admin.firestore.Timestamp.fromDate(new Date(updates.driveDate));
    }
    if (updates.lastApplyDate) {
      updates.lastApplyDate = admin.firestore.Timestamp.fromDate(new Date(updates.lastApplyDate));
    }

    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await adminDb.collection('drives').doc(driveId).update(updates);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Drives PUT error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — remove a drive
export async function DELETE(request) {
  try {
    if (!adminDb) return Response.json({ error: 'Firebase Admin not initialized' }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const driveId = searchParams.get('driveId');

    if (!driveId) return Response.json({ error: 'driveId required' }, { status: 400 });

    await adminDb.collection('drives').doc(driveId).delete();
    return Response.json({ success: true });
  } catch (error) {
    console.error('Drives DELETE error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
