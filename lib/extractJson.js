// Pulls the JSON object out of a model reply that may include code fences
// or a sentence before/after the JSON. Throws if no valid object is found.
export function extractJson(text) {
  const cleaned = String(text || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('Reply did not contain a JSON object');
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}
