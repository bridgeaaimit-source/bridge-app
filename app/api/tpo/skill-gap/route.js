import { adminDb } from '@/lib/firebase-admin';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const collegeId = searchParams.get('collegeId');

  if (!collegeId) {
    return Response.json({ error: 'collegeId required' }, { status: 400 });
  }

  try {
    if (!adminDb) return Response.json({ error: 'Firebase Admin not initialized' }, { status: 500 });

    // Get all student UIDs in this college
    const usersSnap = await adminDb.collection('users')
      .where('collegeId', '==', collegeId)
      .where('role', '==', 'student')
      .get();

    const studentUids = [];
    usersSnap.forEach(doc => studentUids.push(doc.id));

    if (studentUids.length === 0) {
      return Response.json({ heatmap: [], insights: [] });
    }

    // Aggregate aptitude scores by topic across all students
    // We query each student's aptitude sessions and aggregate
    const topicAccuracies = {};

    // Process in batches of 10 (Firestore 'in' limit)
    for (let i = 0; i < studentUids.length; i += 10) {
      const batchUids = studentUids.slice(i, i + 10);

      for (const uid of batchUids) {
        try {
          const scoresSnap = await adminDb.collection('aptitudeScores')
            .where('userId', '==', uid)
            .orderBy('timestamp', 'desc')
            .limit(5)
            .get();

          scoresSnap.forEach(doc => {
            const data = doc.data();
            const sectionScores = data.sectionScores || data.topicScores || {};

            for (const [topic, score] of Object.entries(sectionScores)) {
              if (!topicAccuracies[topic]) {
                topicAccuracies[topic] = { total: 0, count: 0, studentUids: new Set() };
              }
              topicAccuracies[topic].total += (typeof score === 'number' ? score : 0);
              topicAccuracies[topic].count++;
              topicAccuracies[topic].studentUids.add(uid);
            }
          });
        } catch (e) {
          // Skip students with no aptitude data
        }
      }
    }

    // Build heatmap data
    const heatmap = Object.entries(topicAccuracies).map(([topic, data]) => {
      const avgAccuracy = Math.round(data.total / data.count);
      const studentCount = data.studentUids.size;
      const needsWorkPercent = Math.round(
        (studentCount / studentUids.length) * (avgAccuracy < 70 ? 100 : 0)
      );

      return {
        topic,
        avgAccuracy,
        studentCount,
        totalStudents: studentUids.length,
        level: avgAccuracy < 50 ? 'red' : avgAccuracy < 70 ? 'amber' : 'green',
        needsWorkPercent,
      };
    }).sort((a, b) => a.avgAccuracy - b.avgAccuracy);

    // Generate insights
    const insights = heatmap
      .filter(h => h.level !== 'green')
      .slice(0, 3)
      .map(h => ({
        topic: h.topic,
        message: `${h.studentCount} of ${h.totalStudents} students (${Math.round(h.studentCount / h.totalStudents * 100)}%) need work on ${h.topic} (avg: ${h.avgAccuracy}%)`,
        level: h.level,
      }));

    return Response.json({ heatmap, insights });
  } catch (error) {
    console.error('Skill gap error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
