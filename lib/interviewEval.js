// Normalises the AI's answer evaluation into one fixed shape.
// The model sometimes returns lists as plain strings ("NONE FOUND", "a, b") or
// filler_words as an object; the UI must never have to guess.

const clampScore = (value, fallback = 5) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(10, Math.max(0, Math.round(n * 10) / 10));
};

const toList = (value) => {
  if (Array.isArray(value)) {
    return value.map((v) => (typeof v === 'string' ? v.trim() : String(v ?? '').trim())).filter(Boolean);
  }
  if (typeof value === 'string') {
    const s = value.trim();
    if (!s || /^none( found)?$/i.test(s) || /^n\/?a$/i.test(s)) return [];
    return [s];
  }
  return [];
};

const toText = (value, fallback = '') => (typeof value === 'string' ? value.trim() : fallback);

export function normalizeFillerWords(value, detected = []) {
  if (Array.isArray(value)) {
    const found = toList(value);
    return { found, count: found.length, examples: found.join(', ') };
  }
  if (value && typeof value === 'object') {
    const found = toList(value.found);
    const count = Number.isFinite(Number(value.count)) ? Number(value.count) : found.length;
    return { found, count, examples: toText(value.examples, found.join(', ')) };
  }
  const found = toList(detected);
  return { found, count: found.length, examples: found.join(', ') };
}

export function normalizeEvaluation(raw, { detectedFillers = [], wordCount = 0 } = {}) {
  const a = raw && typeof raw === 'object' ? raw : {};
  const score = clampScore(a.score);
  const structure = a.structure && typeof a.structure === 'object' ? a.structure : {};
  return {
    score,
    clarity: clampScore(a.clarity, score),
    confidence: clampScore(a.confidence, score),
    content: clampScore(a.content, score),
    communication: clampScore(a.communication, score),
    word_count: Number.isFinite(Number(a.word_count)) ? Number(a.word_count) : wordCount,
    filler_words: normalizeFillerWords(a.filler_words, detectedFillers),
    structure: {
      has_opening: Boolean(structure.has_opening),
      has_examples: Boolean(structure.has_examples),
      has_conclusion: Boolean(structure.has_conclusion),
      rating: toText(structure.rating, 'Average'),
    },
    weak_language: toList(a.weak_language),
    strong_language: toList(a.strong_language),
    strengths: toList(a.strengths),
    improvements: toList(a.improvements),
    filler_feedback: toText(a.filler_feedback),
    structure_feedback: toText(a.structure_feedback),
    better_answer: toText(a.better_answer),
  };
}
