import { db } from '@/lib/firebase';
import { doc, setDoc, increment, collection, serverTimestamp } from 'firebase/firestore';

/**
 * Track token usage for a specific user
 * @param {string} userId - The user ID
 * @param {string} feature - Feature name (e.g., 'smart-interview', 'recruiter-match')
 * @param {object} usage - Token usage from Anthropic response { input_tokens, output_tokens }
 */
export async function trackTokenUsage(userId, feature, usage) {
  if (!userId || !usage) return;

  const totalTokens = (usage.input_tokens || 0) + (usage.output_tokens || 0);
  
  try {
    // Daily tracking
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dailyRef = doc(db, 'tokenUsage', 'daily', today, userId);
    
    await setDoc(dailyRef, {
      userId,
      date: today,
      [feature]: increment(totalTokens),
      totalTokens: increment(totalTokens),
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // User total tracking
    const userRef = doc(db, 'tokenUsage', 'users', userId, 'stats');
    await setDoc(userRef, {
      userId,
      [feature]: increment(totalTokens),
      totalTokens: increment(totalTokens),
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // Feature total tracking
    const featureRef = doc(db, 'tokenUsage', 'features', feature, 'stats');
    await setDoc(featureRef, {
      feature,
      totalTokens: increment(totalTokens),
      requestCount: increment(1),
      lastUpdated: serverTimestamp()
    }, { merge: true });

    console.log(`📊 Token usage tracked: ${userId} | ${feature} | ${totalTokens} tokens`);
  } catch (error) {
    console.error('Failed to track token usage:', error);
  }
}

/**
 * Get top token consumers
 * @param {string} period - 'daily', 'weekly', 'monthly', 'all'
 * @param {number} limit - Number of results
 */
export async function getTopTokenConsumers(period = 'all', limit = 10) {
  // This would require an admin SDK or backend function
  // For now, this is a placeholder for the logic
  console.log(`Fetching top ${limit} consumers for period: ${period}`);
}
