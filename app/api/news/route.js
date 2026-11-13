import { after } from 'next/server';
import { adminDb, admin } from '@/lib/firebase-admin';
import { getLatestNews, getCategory, NEWS_CATEGORIES } from '@/lib/newsFeeds';
import { buildBrief, cleanBrief } from '@/lib/newsBrief';

// The AI brief is built in the background after the response is sent.
export const maxDuration = 120;

// Token budget: the AI brief is shared by every student and rebuilt at most
// once per STALE_MS per category (about ₹10 per rebuild). Students' Refresh
// only reloads the free RSS headlines; only an admin can force a rebuild.
const STALE_MS = 8 * 60 * 60 * 1000;      // morning, afternoon, night
const ADMIN_REFRESH_MIN_MS = 10 * 60 * 1000;
const BUILD_LOCK_MS = 110 * 1000;         // one build at a time per category
const FAIL_BACKOFF_MS = 5 * 60 * 1000;    // after a failed build, wait before retrying

const memory = new Map(); // used when Firestore admin is not configured (local dev)

async function readState(category) {
  if (!adminDb) return memory.get(category) || null;
  try {
    const snap = await adminDb.collection('news_briefs').doc(category).get();
    return snap.exists ? snap.data() : null;
  } catch (err) {
    console.warn('[news] brief read failed:', err.message);
    return memory.get(category) || null;
  }
}

// replace=true overwrites the whole doc (a new brief must not merge its
// nested source map into the old one).
async function writeState(category, patch, { replace = false } = {}) {
  memory.set(category, replace ? patch : { ...(memory.get(category) || {}), ...patch });
  if (!adminDb) return;
  try {
    await adminDb.collection('news_briefs').doc(category).set(patch, replace ? {} : { merge: true });
  } catch (err) {
    console.warn('[news] brief write failed:', err.message);
  }
}

// Admin check from a verified Firebase ID token (Authorization: Bearer ...)
async function isAdminRequest(request) {
  try {
    const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (!token || !adminDb || !admin?.auth) return false;
    const decoded = await admin.auth().verifyIdToken(token);
    const snap = await adminDb.collection('users').doc(decoded.uid).get();
    return snap.exists && snap.data()?.role === 'admin';
  } catch {
    return false;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = getCategory(searchParams.get('category') || 'All').id;
  const refresh = searchParams.get('refresh') === '1';        // reload headlines (free)
  const rebuildAsked = searchParams.get('rebuild') === '1';   // rebuild AI brief (admin only)
  const poll = searchParams.get('poll') === '1';
  const userId = searchParams.get('userId') || searchParams.get('uid') || null;

  const [articles, state, isAdmin] = await Promise.all([
    getLatestNews(category, { fresh: refresh || rebuildAsked }),
    readState(category),
    rebuildAsked ? isAdminRequest(request) : Promise.resolve(false),
  ]);
  if (rebuildAsked && !isAdmin) {
    return Response.json({ error: 'Only admins can rebuild the AI analysis.' }, { status: 403 });
  }
  const forceRebuild = rebuildAsked && isAdmin;

  const now = Date.now();
  const brief = cleanBrief(state?.brief || null);
  const age = brief?.builtAt ? now - new Date(brief.builtAt).getTime() : Infinity;
  const building = (state?.buildingUntil || 0) > now;
  const recentlyFailed = state?.failedAt && now - new Date(state.failedAt).getTime() < FAIL_BACKOFF_MS;
  const needsBuild = age > STALE_MS || (forceRebuild && age > ADMIN_REFRESH_MIN_MS);

  let buildStarted = false;
  if (needsBuild && !building && !poll && articles.length >= 5 && !(recentlyFailed && !forceRebuild)) {
    buildStarted = true;
    await writeState(category, { buildingUntil: now + BUILD_LOCK_MS });
    after(async () => {
      try {
        const fresh = await buildBrief(category, articles, userId);
        await writeState(category, { brief: fresh, buildingUntil: 0, failedAt: null, lastError: null }, { replace: true });
      } catch (err) {
        console.error(`[news] brief build failed for ${category}:`, err.message);
        await writeState(category, { buildingUntil: 0, failedAt: new Date().toISOString(), lastError: String(err.message).slice(0, 200) });
      }
    });
  }

  // ready: brief is current · updating: showing the last brief while a new
  // one is built · building: first brief on its way · unavailable: none yet
  const inProgress = buildStarted || building;
  const status = inProgress ? (brief ? 'updating' : 'building') : (brief ? 'ready' : 'unavailable');

  if (!articles.length && !brief) {
    return Response.json(
      { error: 'News sources are not reachable right now. Please try again in a few minutes.', category },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  return Response.json({
    category,
    categories: NEWS_CATEGORIES.map(({ id, label }) => ({ id, label })),
    articles,
    brief,
    briefStatus: status,
    nextUpdateAt: brief?.builtAt ? new Date(new Date(brief.builtAt).getTime() + STALE_MS).toISOString() : null,
    fetchedAt: new Date().toISOString(),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
