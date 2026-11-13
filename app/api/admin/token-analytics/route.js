import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import {
  calcLLMCost,
  estimateHistoricalCostINR,
  FEATURE_DEFAULT_MODEL,
  getModelPricing,
  USD_TO_INR,
} from '@/lib/modelPricing';

// Keys on a daily usage doc that are not feature token counters.
const META_KEYS = new Set(['userId', 'date', 'total', 'totalTokens', 'lastUsed', 'lastUpdated', 'calls', 'cost_usd']);
const SUFFIXES = ['_input', '_output', '_model', '_models', '_calls', '_cost_usd'];

function isFeatureKey(key, val) {
  return typeof val === 'number' && !META_KEYS.has(key) && !SUFFIXES.some(s => key.endsWith(s));
}

// Same day key as lib/tokenTrackerServer.js (India time).
function istDateKey(date = new Date()) {
  return new Date(date.getTime() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];
}

function buildDateList({ days, startDate, endDate }) {
  const list = [];
  const valid = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
  if (valid(startDate) && valid(endDate) && startDate <= endDate) {
    const d = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);
    while (d <= end && list.length < 366) {
      list.push(d.toISOString().split('T')[0]);
      d.setUTCDate(d.getUTCDate() + 1);
    }
  }
  if (list.length === 0) {
    const n = Math.min(Math.max(parseInt(days, 10) || 30, 1), 366);
    const today = new Date(`${istDateKey()}T00:00:00Z`);
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      list.push(d.toISOString().split('T')[0]);
    }
  }
  return list;
}

async function inChunks(items, size, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  }
  return out;
}

const round = (n, dp = 2) => Number((n || 0).toFixed(dp));

export async function POST(request) {
  try {
    const body = await request.json();
    const { secretKey, days = 30, startDate, endDate } = body;

    // Validate admin secret
    const envKey = (process.env.ADMIN_SECRET_KEY || '').replace(/^["']|["']$/g, '').trim();
    const providedKey = (secretKey || '').trim();
    if (!envKey || providedKey !== envKey) {
      return Response.json({ error: 'Unauthorized — invalid secret key' }, { status: 401 });
    }
    if (!adminDb) {
      return Response.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    const datesToFetch = buildDateList({ days, startDate, endDate });
    const rangeStart = datesToFetch[0];
    const rangeEnd = datesToFetch[datesToFetch.length - 1];
    const today = istDateKey();

    // ── 1. Read all days in parallel (LLM + voice) ──────────────────────────
    const dayResults = await inChunks(datesToFetch, 20, async (dateStr) => {
      const [llm, voice] = await Promise.all([
        adminDb.collection('tokenUsage').doc('daily').collection(dateStr).get()
          .catch(err => { console.error(`LLM usage read failed for ${dateStr}:`, err.message); return null; }),
        adminDb.collection('tokenUsage').doc('voice').collection(dateStr).get()
          .catch(err => { console.error(`Voice usage read failed for ${dateStr}:`, err.message); return null; }),
      ]);
      return { dateStr, llm, voice };
    });

    const userMap = new Map();
    const featureMap = new Map();
    const dailyData = [];
    let totalTokens = 0, totalCalls = 0, totalLLMCostINR = 0;
    let totalTTSChars = 0, totalTTSCostINR = 0, totalTTSCalls = 0;
    let exactDaysCount = 0, estimatedDaysCount = 0;

    const getUser = (uid, dateStr) => {
      if (!userMap.has(uid)) {
        userMap.set(uid, {
          userId: uid, name: uid, email: '', college: '', role: '',
          total: 0, calls: 0, llmCostINR: 0, voiceCostINR: 0, voiceChars: 0,
          features: {}, featureDetail: {}, days: new Set(),
          firstSeen: dateStr, lastSeen: dateStr,
        });
      }
      const u = userMap.get(uid);
      u.days.add(dateStr);
      if (dateStr > u.lastSeen) u.lastSeen = dateStr;
      if (dateStr < u.firstSeen) u.firstSeen = dateStr;
      return u;
    };

    for (const { dateStr, llm, voice } of dayResults) {
      let dayTokens = 0, dayCalls = 0, dayLLM = 0, dayTTS = 0;
      let dayExact = false, dayEstimated = false;
      const dayUsers = new Set();

      llm?.forEach(docSnap => {
        const data = docSnap.data();
        const uid = docSnap.id;
        dayUsers.add(uid);
        const u = getUser(uid, dateStr);

        for (const [key, val] of Object.entries(data)) {
          if (!isFeatureKey(key, val) || val <= 0) continue;
          const tokens = val;
          const inputTokens = data[`${key}_input`] || 0;
          const outputTokens = data[`${key}_output`] || 0;
          const calls = data[`${key}_calls`] || 0;
          const models = Array.isArray(data[`${key}_models`]) && data[`${key}_models`].length
            ? data[`${key}_models`]
            : [data[`${key}_model`] || FEATURE_DEFAULT_MODEL[key] || 'claude-sonnet-4-5'];

          let costINR, estimated;
          if (typeof data[`${key}_cost_usd`] === 'number') {
            // Exact: priced per call with the real model when it was logged.
            costINR = data[`${key}_cost_usd`] * USD_TO_INR;
            estimated = false;
          } else if (inputTokens > 0 || outputTokens > 0) {
            const c = calcLLMCost(inputTokens, outputTokens, models[models.length - 1]);
            costINR = c.costINR;
            estimated = c.isEstimated;
          } else {
            costINR = estimateHistoricalCostINR(tokens, key).costINR;
            estimated = true;
          }
          if (estimated) dayEstimated = true; else dayExact = true;

          dayTokens += tokens;
          dayCalls += calls;
          dayLLM += costINR;

          u.total += tokens;
          u.calls += calls;
          u.llmCostINR += costINR;
          u.features[key] = (u.features[key] || 0) + tokens;
          const fd = u.featureDetail[key] || (u.featureDetail[key] = { tokens: 0, calls: 0, costINR: 0 });
          fd.tokens += tokens;
          fd.calls += calls;
          fd.costINR += costINR;

          let feat = featureMap.get(key);
          if (!feat) {
            feat = { feature: key, tokens: 0, inputTokens: 0, outputTokens: 0, calls: 0, costINR: 0, models: new Set(), users: new Set(), isEstimated: false };
            featureMap.set(key, feat);
          }
          feat.tokens += tokens;
          feat.inputTokens += inputTokens || Math.round(tokens * 0.7);
          feat.outputTokens += outputTokens || Math.round(tokens * 0.3);
          feat.calls += calls;
          feat.costINR += costINR;
          feat.users.add(uid);
          models.forEach(m => feat.models.add(m));
          if (estimated) feat.isEstimated = true;
        }
      });

      voice?.forEach(docSnap => {
        const data = docSnap.data();
        const uid = docSnap.id;
        const chars = data.tts_chars || 0;
        const cost = data.tts_cost_inr || 0;
        if (!chars && !cost) return;
        dayUsers.add(uid);
        const u = getUser(uid, dateStr);
        u.voiceCostINR += cost;
        u.voiceChars += chars;
        u.calls += data.tts_calls || 0;
        dayTTS += cost;
        dayCalls += data.tts_calls || 0;
        totalTTSChars += chars;
        totalTTSCalls += data.tts_calls || 0;
      });

      totalTokens += dayTokens;
      totalCalls += dayCalls;
      totalLLMCostINR += dayLLM;
      totalTTSCostINR += dayTTS;
      if (dayExact) exactDaysCount++;
      else if (dayEstimated) estimatedDaysCount++;

      dailyData.push({
        date: dateStr,
        total: dayTokens,
        calls: dayCalls,
        users: dayUsers.size,
        llmCostINR: dayLLM,
        ttsCostINR: dayTTS,
        sttCostINR: 0,
        totalCostINR: dayLLM + dayTTS,
        isToday: dateStr === today,
      });
    }

    // ── 2. Names and emails for everyone in the period ──────────────────────
    const realUids = Array.from(userMap.keys()).filter(uid => !['anonymous', 'system'].includes(uid));
    const profiles = new Map();
    for (let i = 0; i < realUids.length; i += 100) {
      const refs = realUids.slice(i, i + 100).map(uid => adminDb.collection('users').doc(uid));
      try {
        const snaps = await adminDb.getAll(...refs);
        snaps.forEach(s => { if (s.exists) profiles.set(s.id, s.data()); });
      } catch (err) {
        console.error('User profile lookup failed:', err.message);
      }
    }
    const nameFor = (uid) => {
      if (uid === 'anonymous') return 'Unknown (not signed in)';
      if (uid === 'system') return 'System (scheduled jobs)';
      const p = profiles.get(uid);
      return p?.name || p?.displayName || p?.fullName || p?.email || uid;
    };
    for (const [uid, u] of userMap) {
      const p = profiles.get(uid);
      u.name = nameFor(uid);
      u.email = p?.email || '';
      u.college = p?.college || p?.collegeName || p?.institution || '';
      u.role = p?.role || '';
    }

    // ── 3. Call-by-call log (from the new tracker onwards) ──────────────────
    let recentCalls = [];
    try {
      const startTs = admin.firestore.Timestamp.fromDate(new Date(`${rangeStart}T00:00:00+05:30`));
      const endTs = admin.firestore.Timestamp.fromDate(new Date(`${rangeEnd}T23:59:59.999+05:30`));
      const snap = await adminDb.collection('apiUsageLog')
        .where('createdAt', '>=', startTs)
        .where('createdAt', '<=', endTs)
        .orderBy('createdAt', 'desc')
        .limit(500)
        .get();
      recentCalls = snap.docs.map(d => {
        const c = d.data();
        return {
          id: d.id,
          time: c.createdAt?.toDate?.().toISOString() || null,
          userId: c.userId,
          name: nameFor(c.userId),
          email: profiles.get(c.userId)?.email || '',
          kind: c.kind || 'llm',
          feature: c.feature,
          model: c.model,
          inputTokens: c.inputTokens || 0,
          outputTokens: c.outputTokens || 0,
          chars: c.chars || 0,
          costINR: round(c.costINR, 4),
          costUSD: round(c.costUSD, 5),
        };
      });
      // Names for log entries outside the daily docs (rare)
      const missing = [...new Set(recentCalls.map(c => c.userId))]
        .filter(uid => uid && !profiles.has(uid) && !['anonymous', 'system'].includes(uid));
      if (missing.length) {
        const snaps = await adminDb.getAll(...missing.slice(0, 100).map(uid => adminDb.collection('users').doc(uid)));
        snaps.forEach(s => { if (s.exists) profiles.set(s.id, s.data()); });
        recentCalls.forEach(c => { c.name = nameFor(c.userId); c.email = profiles.get(c.userId)?.email || ''; });
      }
    } catch (err) {
      console.error('API call log read failed:', err.message);
    }

    // ── 4. Shape the response ────────────────────────────────────────────────
    const combinedTotalCost = totalLLMCostINR + totalTTSCostINR;
    const users = Array.from(userMap.values())
      .map(u => {
        const cost = u.llmCostINR + u.voiceCostINR;
        return {
          ...u,
          days: u.days.size,
          llmCostINR: round(u.llmCostINR, 2),
          voiceCostINR: round(u.voiceCostINR, 2),
          totalCostINR: cost.toFixed(2),
          totalCostUSD: round(cost / USD_TO_INR, 3),
          featureDetail: Object.fromEntries(Object.entries(u.featureDetail).map(([k, v]) => [k, { ...v, costINR: round(v.costINR, 2) }])),
        };
      })
      .sort((a, b) =>
        // Named students first; unknown/system rows at the bottom
        (['anonymous', 'system'].includes(a.userId) - ['anonymous', 'system'].includes(b.userId)) ||
        parseFloat(b.totalCostINR) - parseFloat(a.totalCostINR) || b.total - a.total);

    const features = Array.from(featureMap.values())
      .map(f => {
        const models = Array.from(f.models);
        const mainModel = models[models.length - 1];
        return {
          feature: f.feature,
          tokens: f.tokens,
          inputTokens: f.inputTokens,
          outputTokens: f.outputTokens,
          calls: f.calls,
          users: f.users.size,
          models,
          modelSlug: models.join(', '),
          vendor: getModelPricing(mainModel)?.vendor || 'Anthropic',
          isEstimated: f.isEstimated,
          percentage: totalTokens > 0 ? ((f.tokens / totalTokens) * 100).toFixed(1) : '0.0',
          costINR: f.costINR.toFixed(2),
          costUSD: round(f.costINR / USD_TO_INR, 3),
          costPerCallINR: f.calls > 0 ? round(f.costINR / f.calls, 3) : null,
        };
      })
      .sort((a, b) => parseFloat(b.costINR) - parseFloat(a.costINR));

    const todayEntry = dailyData.find(d => d.isToday);
    const avgDaily = totalTokens / Math.max(datesToFetch.length, 1);
    const anonymous = userMap.get('anonymous');

    const alerts = [];
    if (todayEntry && avgDaily > 0 && todayEntry.total > avgDaily * 2) {
      alerts.push({ type: 'warning', message: `Today's AI usage (${todayEntry.total.toLocaleString()} tokens) is ${(todayEntry.total / avgDaily).toFixed(1)}x the daily average` });
    }
    const topUser = users.find(u => u.userId !== 'anonymous');
    if (topUser && combinedTotalCost > 0 && parseFloat(topUser.totalCostINR) > combinedTotalCost * 0.4) {
      alerts.push({ type: 'warning', message: `${topUser.name} accounts for ${((parseFloat(topUser.totalCostINR) / combinedTotalCost) * 100).toFixed(0)}% of all AI cost` });
    }
    if (combinedTotalCost > 500) {
      alerts.push({ type: 'caution', message: `Total AI cost is ₹${combinedTotalCost.toFixed(0)} in ${datesToFetch.length} days` });
    }

    return Response.json({
      summary: {
        totalTokens,
        totalCalls,
        totalUsers: users.filter(u => u.userId !== 'anonymous').length,
        avgPerUser: users.length > 0 ? Math.round(totalTokens / users.length) : 0,
        todayTokens: todayEntry?.total || 0,
        todayCostINR: round(todayEntry?.totalCostINR || 0, 2),
        avgDailyTokens: Math.round(avgDaily),
        period: datesToFetch.length,
        dateRange: { start: rangeStart, end: rangeEnd, days: datesToFetch.length },
        totalLLMCostINR: totalLLMCostINR.toFixed(2),
        totalTTSCostINR: totalTTSCostINR.toFixed(2),
        totalSTTCostINR: '0.00',
        totalCostINR: combinedTotalCost.toFixed(2),
        totalCostUSD: round(combinedTotalCost / USD_TO_INR, 2),
        anonymousCostINR: round((anonymous?.llmCostINR || 0) + (anonymous?.voiceCostINR || 0), 2),
        exactDaysCount,
        estimatedDaysCount,
        usdToInr: USD_TO_INR,
      },
      daily: dailyData,
      users,
      features,
      recentCalls,
      voiceSummary: {
        ttsChars: totalTTSChars,
        ttsCalls: totalTTSCalls,
        ttsCostINR: totalTTSCostINR,
        sttSeconds: 0,
        sttCostINR: 0,
      },
      alerts,
    });
  } catch (error) {
    console.error('Token analytics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
