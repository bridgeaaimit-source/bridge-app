/**
 * String utility functions shared across the BridgeAI codebase.
 */

/**
 * Computes the Levenshtein edit distance between two strings.
 * Used for voice accuracy checking in smart-interview and device-test pages.
 * @param {string} a
 * @param {string} b
 * @returns {number} edit distance
 */
export function levenshtein(a, b) {
  const m = [], al = a.length, bl = b.length;
  for (let i = 0; i <= al; i++) m[i] = [i];
  for (let j = 0; j <= bl; j++) m[0][j] = j;
  for (let i = 1; i <= al; i++)
    for (let j = 1; j <= bl; j++)
      m[i][j] = a[i-1] === b[j-1] ? m[i-1][j-1] : Math.min(m[i-1][j-1]+1, m[i][j-1]+1, m[i-1][j]+1);
  return m[al][bl];
}
