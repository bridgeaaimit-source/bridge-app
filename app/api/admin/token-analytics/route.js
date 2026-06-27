import { adminDb } from '@/lib/firebase-admin';
import {
  calcLLMCostINR,
  estimateHistoricalCostINR,
  FEATURE_DEFAULT_MODEL,
  MODEL_PRICING
} from '@/lib/modelPricing';

export async function POST(request) {
  try {
    const body = await request.json();
    const { secretKey, days = 30 } = body;

    // Validate admin secret
    const envKey = (process.env.ADMIN_SECRET_KEY || '').replace(/^["']|["']$/g, '').trim();
    const providedKey = (secretKey || '').trim();
    
    console.log('[TokenAnalytics] Key check:', { envKeyLen: envKey.length, providedKeyLen: providedKey.length, match: envKey === providedKey });
    
    if (!envKey || providedKey !== envKey) {
      return Response.json({ error: 'Unauthorized — invalid secret key' }, { status: 401 });
    }

    if (!adminDb) {
      return Response.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    const dailyData = [];
    const userMap = new Map();
    const featureDetailMap = new Map();
    const today = new Date().toISOString().split('T')[0];

    let totalTokens = 0;
    let totalLLMCostINR = 0;
    let totalTTSChars = 0;
    let totalTTSCostINR = 0;
    let totalSTTSeconds = 0;
    let totalSTTCostINR = 0;
    
    let exactDaysCount = 0;
    let estimatedDaysCount = 0;

    // Iterate over each day
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      let dayTotalTokens = 0;
      let dayLLMCostINR = 0;
      let dayTTSChars = 0;
      let dayTTSCostINR = 0;
      let daySTTSeconds = 0;
      let daySTTCostINR = 0;
      const dayUsers = new Set();
      
      let dayHasExactLLM = false;
      let dayHasEstimatedLLM = false;

      // 1. Fetch LLM token usage
      try {
        const snapshot = await adminDb.collection('tokenUsage').doc('daily').collection(dateStr).get();

        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          const uid = docSnap.id;
          dayUsers.add(uid);

          // Build/update user map
          if (!userMap.has(uid)) {
            userMap.set(uid, {
              userId: uid,
              name: uid,
              email: '',
              total: 0,
              totalCostINR: 0,
              features: {},
              days: new Set(),
              firstSeen: dateStr,
              lastSeen: dateStr,
              requestCount: 0,
            });
          }
          const u = userMap.get(uid);
          u.days.add(dateStr);
          u.lastSeen = i === 0 ? dateStr : u.lastSeen;
          if (dateStr < u.firstSeen) u.firstSeen = dateStr;

          // For each key, if it represents a normalized feature
          Object.entries(data).forEach(([key, val]) => {
            // A feature key is a string representing a number, and isn't special or suffix
            if (
              !['userId', 'date', 'total', 'totalTokens', 'lastUsed', 'lastUpdated'].includes(key) &&
              !key.endsWith('_input') &&
              !key.endsWith('_output') &&
              !key.endsWith('_model') &&
              typeof val === 'number'
            ) {
              const tokens = val;
              const inputTokens = data[`${key}_input`] || 0;
              const outputTokens = data[`${key}_output`] || 0;
              const modelSlug = data[`${key}_model`] || FEATURE_DEFAULT_MODEL[key] || 'claude-sonnet-4-5';

              let costInfo;
              if (inputTokens > 0 || outputTokens > 0) {
                costInfo = calcLLMCostINR(inputTokens, outputTokens, modelSlug);
                dayHasExactLLM = true;
              } else if (tokens > 0) {
                costInfo = estimateHistoricalCostINR(tokens, key);
                dayHasEstimatedLLM = true;
              }

              if (costInfo) {
                dayLLMCostINR += costInfo.costINR;
                u.totalCostINR += costInfo.costINR;
                
                // Aggregate feature breakdown
                let feat = featureDetailMap.get(key);
                if (!feat) {
                  feat = {
                    feature: key,
                    tokens: 0,
                    inputTokens: 0,
                    outputTokens: 0,
                    modelSlug: modelSlug,
                    vendor: MODEL_PRICING[modelSlug]?.vendor || 'Anthropic',
                    costINR: 0,
                    isEstimated: false
                  };
                  featureDetailMap.set(key, feat);
                }
                feat.tokens += tokens;
                feat.inputTokens += inputTokens || Math.round(tokens * 0.7);
                feat.outputTokens += outputTokens || Math.round(tokens * 0.3);
                feat.costINR += costInfo.costINR;
                if (costInfo.isEstimated) {
                  feat.isEstimated = true;
                }
                // Update model slug to a real tracked one if available
                if (data[`${key}_model`]) {
                  feat.modelSlug = modelSlug;
                  feat.vendor = MODEL_PRICING[modelSlug]?.vendor || 'Anthropic';
                }
              }

              u.total += tokens;
              u.features[key] = (u.features[key] || 0) + tokens;
              u.requestCount++;
              dayTotalTokens += tokens;
            }
          });
        });
      } catch (err) {
        console.error(`Error fetching LLM daily usage for ${dateStr}:`, err.message);
      }

      // 2. Fetch TTS/STT usage
      try {
        const voiceSnapshot = await adminDb.collection('tokenUsage').doc('voice').collection(dateStr).get();
        voiceSnapshot.forEach(docSnap => {
          const data = docSnap.data();
          const uid = docSnap.id;
          dayUsers.add(uid);

          const ttsChars = data.tts_chars || 0;
          const ttsCost = data.tts_cost_inr || 0;
          const sttSeconds = data.stt_seconds || 0;
          const sttCost = data.stt_cost_inr || 0;

          dayTTSChars += ttsChars;
          dayTTSCostINR += ttsCost;
          daySTTSeconds += sttSeconds;
          daySTTCostINR += sttCost;

          // Build/update user map for voice
          if (!userMap.has(uid)) {
            userMap.set(uid, {
              userId: uid,
              name: uid,
              email: '',
              total: 0,
              totalCostINR: 0,
              features: {},
              days: new Set(),
              firstSeen: dateStr,
              lastSeen: dateStr,
              requestCount: 0,
            });
          }
          const u = userMap.get(uid);
          u.totalCostINR += ttsCost + sttCost;
          u.days.add(dateStr);
          u.lastSeen = i === 0 ? dateStr : u.lastSeen;
          if (dateStr < u.firstSeen) u.firstSeen = dateStr;
        });
      } catch (err) {
        console.error(`Error fetching voice usage for ${dateStr}:`, err.message);
      }

      totalTokens += dayTotalTokens;
      totalLLMCostINR += dayLLMCostINR;
      totalTTSChars += dayTTSChars;
      totalTTSCostINR += dayTTSCostINR;
      totalSTTSeconds += daySTTSeconds;
      totalSTTCostINR += daySTTCostINR;

      if (dayHasExactLLM) {
        exactDaysCount++;
      } else if (dayHasEstimatedLLM) {
        estimatedDaysCount++;
      }

      dailyData.push({
        date: dateStr,
        total: dayTotalTokens,
        users: dayUsers.size,
        llmCostINR: dayLLMCostINR,
        ttsCostINR: dayTTSCostINR,
        sttCostINR: daySTTCostINR,
        totalCostINR: dayLLMCostINR + dayTTSCostINR + daySTTCostINR,
        isToday: dateStr === today,
      });
    }

    // Fetch user profile info from Firestore (names, emails)
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

    const sortedUsers = Array.from(userMap.values())
      .map(u => ({ ...u, days: u.days.size, totalCostINR: u.totalCostINR.toFixed(2) }))
      .sort((a, b) => b.total - a.total);

    const reversedDaily = dailyData.reverse();
    const todayEntry = reversedDaily.find(d => d.isToday);
    const avgDaily = totalTokens / Math.max(days, 1);

    const featureBreakdown = Array.from(featureDetailMap.values())
      .map(feat => ({
        ...feat,
        percentage: totalTokens > 0 ? ((feat.tokens / totalTokens) * 100).toFixed(1) : '0.0',
        costINR: feat.costINR.toFixed(2),
      }))
      .sort((a, b) => b.tokens - a.tokens);

    // Compute alerts
    const alerts = [];
    if (todayEntry && todayEntry.total > avgDaily * 2) {
      alerts.push({ type: 'warning', message: `Today's LLM usage (${todayEntry.total.toLocaleString()}) is ${(todayEntry.total / avgDaily).toFixed(1)}x the daily average` });
    }
    if (sortedUsers.length > 0 && parseFloat(sortedUsers[0].total) > totalTokens * 0.4) {
      alerts.push({ type: 'warning', message: `${sortedUsers[0].name} accounts for ${((sortedUsers[0].total / totalTokens) * 100).toFixed(0)}% of all LLM usage` });
    }
    const combinedTotalCost = totalLLMCostINR + totalTTSCostINR + totalSTTCostINR;
    if (combinedTotalCost > 500) {
      alerts.push({ type: 'caution', message: `Total system cost is ₹${combinedTotalCost.toFixed(0)} in ${days} days` });
    }

    return Response.json({
      summary: {
        totalTokens,
        totalUsers: sortedUsers.length,
        avgPerUser: sortedUsers.length > 0 ? Math.round(totalTokens / sortedUsers.length) : 0,
        todayTokens: todayEntry?.total || 0,
        avgDailyTokens: Math.round(avgDaily),
        period: days,
        // New model-aware cost summaries
        totalLLMCostINR: totalLLMCostINR.toFixed(2),
        totalTTSCostINR: totalTTSCostINR.toFixed(2),
        totalSTTCostINR: totalSTTCostINR.toFixed(2),
        totalCostINR: combinedTotalCost.toFixed(2),
        exactDaysCount,
        estimatedDaysCount,
      },
      daily: reversedDaily,
      users: sortedUsers.slice(0, 50),
      features: featureBreakdown,
      voiceSummary: {
        ttsChars: totalTTSChars,
        ttsCostINR: totalTTSCostINR,
        sttSeconds: totalSTTSeconds,
        sttCostINR: totalSTTCostINR,
      },
      alerts,
    });
  } catch (error) {
    console.error('Token analytics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
