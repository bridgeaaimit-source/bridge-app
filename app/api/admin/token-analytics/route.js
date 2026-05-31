import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export async function POST(request) {
  try {
    const body = await request.json();
    const { secretKey, days = 30 } = body;

    // Validate admin secret
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminDb) {
      return Response.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    const dailyData = [];
    const userMap = new Map();
    const featureMap = new Map();
    const hourlyMap = new Map(); // hour -> tokens
    const today = new Date().toISOString().split('T')[0];

    // Iterate over each day
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      try {
        const snapshot = await adminDb.collection('tokenUsage').doc('daily').collection(dateStr).get();

        let dayTotal = 0;
        let dayInput = 0;
        let dayOutput = 0;
        const dayUsers = new Set();

        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          const uid = docSnap.id;
          const total = data.total || 0;

          dayTotal += total;
          dayUsers.add(uid);

          // Build user map
          if (!userMap.has(uid)) {
            userMap.set(uid, {
              userId: uid,
              name: uid,
              email: '',
              total: 0,
              features: {},
              days: new Set(),
              firstSeen: dateStr,
              lastSeen: dateStr,
              requestCount: 0,
            });
          }
          const u = userMap.get(uid);
          u.total += total;
          u.days.add(dateStr);
          u.lastSeen = i === 0 ? dateStr : u.lastSeen;
          if (dateStr < u.firstSeen) u.firstSeen = dateStr;

          // Extract feature-level data
          Object.entries(data).forEach(([key, val]) => {
            if (!['userId', 'date', 'total', 'totalTokens', 'lastUsed', 'lastUpdated'].includes(key) && typeof val === 'number') {
              u.features[key] = (u.features[key] || 0) + val;
              featureMap.set(key, (featureMap.get(key) || 0) + val);
              u.requestCount++;
            }
          });
        });

        dailyData.push({
          date: dateStr,
          total: dayTotal,
          users: dayUsers.size,
          isToday: dateStr === today,
        });
      } catch (err) {
        console.error(`Error fetching data for ${dateStr}:`, err.message);
        dailyData.push({ date: dateStr, total: 0, users: 0, isToday: dateStr === today });
      }
    }

    // Fetch real user names from Firestore
    const uids = Array.from(userMap.keys());
    const batchSize = 10;
    for (let i = 0; i < uids.length; i += batchSize) {
      const batch = uids.slice(i, i + batchSize);
      await Promise.all(batch.map(async (uid) => {
        try {
          const snap = await adminDb.collection('users').doc(uid).get();
          if (snap.exists) {
            const d = snap.data();
            const u = userMap.get(uid);
            u.name = d.name || d.displayName || d.email || uid;
            u.email = d.email || '';
          }
        } catch {}
      }));
    }

    // Prepare sorted arrays
    const sortedUsers = Array.from(userMap.values())
      .map(u => ({ ...u, days: u.days.size }))
      .sort((a, b) => b.total - a.total);

    const reversedDaily = dailyData.reverse();
    const totalTokens = reversedDaily.reduce((s, d) => s + d.total, 0);
    const todayEntry = reversedDaily.find(d => d.isToday);

    // Feature breakdown sorted
    const featureBreakdown = Object.entries(Object.fromEntries(featureMap))
      .map(([key, tokens]) => ({
        feature: key,
        tokens,
        percentage: totalTokens > 0 ? ((tokens / totalTokens) * 100).toFixed(1) : '0.0',
        costINR: (tokens * 0.00075).toFixed(2),
      }))
      .sort((a, b) => b.tokens - a.tokens);

    // Compute alerts
    const alerts = [];
    const avgDaily = totalTokens / Math.max(days, 1);
    if (todayEntry && todayEntry.total > avgDaily * 2) {
      alerts.push({ type: 'warning', message: `Today's usage (${todayEntry.total.toLocaleString()}) is ${(todayEntry.total / avgDaily).toFixed(1)}x the daily average` });
    }
    // Top user alert
    if (sortedUsers.length > 0 && sortedUsers[0].total > totalTokens * 0.4) {
      alerts.push({ type: 'warning', message: `${sortedUsers[0].name} accounts for ${((sortedUsers[0].total / totalTokens) * 100).toFixed(0)}% of all usage` });
    }
    // Cost alert
    const totalCostINR = totalTokens * 0.00075;
    if (totalCostINR > 500) {
      alerts.push({ type: 'caution', message: `Total estimated cost ₹${totalCostINR.toFixed(0)} in ${days} days` });
    }

    return Response.json({
      summary: {
        totalTokens,
        totalUsers: sortedUsers.length,
        avgPerUser: sortedUsers.length > 0 ? Math.round(totalTokens / sortedUsers.length) : 0,
        todayTokens: todayEntry?.total || 0,
        totalCostINR: totalCostINR.toFixed(2),
        avgDailyTokens: Math.round(avgDaily),
        period: days,
      },
      daily: reversedDaily,
      users: sortedUsers.slice(0, 50),
      features: featureBreakdown,
      alerts,
    });
  } catch (error) {
    console.error('Token analytics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
