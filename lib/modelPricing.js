/**
 * Model-aware pricing for BridgeAI usage accounting.
 *
 * Prices are kept in USD (as the vendors bill) and converted to INR with
 * USD_TO_INR. Set the USD_TO_INR environment variable to change the rate
 * without a code change (default 95; the rupee traded at about 94-95 per
 * dollar in November 2026).
 *
 * Sources (checked 14 Nov 2026):
 *  - Anthropic: platform.claude.com/docs/en/about-claude/pricing
 *      Haiku 4.5 $1 / $5, Sonnet 4.5 $3 / $15, Opus 4.5 $5 / $25 per 1M tokens
 *  - Google: ai.google.dev/gemini-api/docs/pricing
 *      Gemini 2.5 Flash TTS: $0.50 per 1M text tokens in, $10 per 1M audio tokens out
 *
 * TTS/STT are character-based / second-based, NOT token-based.
 */

const envRate = Number(process.env.USD_TO_INR || process.env.NEXT_PUBLIC_USD_TO_INR);
export const USD_TO_INR = Number.isFinite(envRate) && envRate > 0 ? envRate : 95;

// ─── LLM Pricing ──────────────────────────────────────────────────────────────
// USD per 1,000,000 tokens. inputPer1M / outputPer1M are the same in INR
// (kept for older callers).
function llm(vendor, family, inUSD, outUSD) {
  return {
    vendor,
    family,
    inputPer1MUSD: inUSD,
    outputPer1MUSD: outUSD,
    inputPer1M: inUSD * USD_TO_INR,
    outputPer1M: outUSD * USD_TO_INR,
  };
}

export const MODEL_PRICING = {
  'claude-haiku-4-5-20251001': llm('Anthropic', 'Claude Haiku 4.5', 1.00, 5.00),
  'claude-haiku-4-5':          llm('Anthropic', 'Claude Haiku 4.5', 1.00, 5.00),
  'claude-sonnet-4-5':         llm('Anthropic', 'Claude Sonnet 4.5', 3.00, 15.00),
  'claude-opus-4-5':           llm('Anthropic', 'Claude Opus 4.5', 5.00, 25.00),
};

/**
 * Find the price entry for a model string. Accepts dated versions
 * (e.g. 'claude-sonnet-4-5-20250929') by matching the longest known prefix.
 */
export function getModelPricing(modelSlug) {
  if (!modelSlug) return null;
  if (MODEL_PRICING[modelSlug]) return MODEL_PRICING[modelSlug];
  const match = Object.keys(MODEL_PRICING)
    .filter(k => modelSlug.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return match ? MODEL_PRICING[match] : null;
}

/**
 * Exact LLM cost in USD and INR for one call.
 * Unknown models are priced as Sonnet 4.5 and flagged as estimated.
 */
export function calcLLMCost(inputTokens, outputTokens, modelSlug) {
  const known = getModelPricing(modelSlug);
  const p = known || MODEL_PRICING['claude-sonnet-4-5'];
  const costUSD = ((inputTokens || 0) / 1_000_000) * p.inputPer1MUSD
                + ((outputTokens || 0) / 1_000_000) * p.outputPer1MUSD;
  return { costUSD, costINR: costUSD * USD_TO_INR, isEstimated: !known };
}

// ─── TTS Pricing ──────────────────────────────────────────────────────────────
// Character-based — NOT tokens. Do NOT mix with LLM token costs.
export const TTS_PRICING = {
  // Gemini 2.5 Flash TTS — primary provider.
  // Billed $0.50 / 1M text tokens + $10 / 1M audio tokens. Per 1M characters
  // that is ~250K text tokens ($0.13) plus ~67K seconds of speech at
  // ~25 audio tokens/sec ≈ 1.67M audio tokens ($16.67) → ≈ $16.80 / 1M chars.
  'gemini-2.5-flash-preview-tts': {
    vendor: 'Google',
    family: 'Gemini TTS',
    costPer1MCharsUSD: 16.80,
    costPer1MChars: 16.80 * USD_TO_INR,
  },
  // ElevenLabs eleven_turbo_v2_5 — existing fallback only (rarely used).
  // Pay-as-you-go API rate is about $0.05 per 1K characters.
  'eleven_turbo_v2_5': {
    vendor: 'ElevenLabs',
    family: 'ElevenLabs Turbo v2.5',
    costPer1MCharsUSD: 50.00,
    costPer1MChars: 50.00 * USD_TO_INR,
  },
  // Cache hit — no cost
  'cache': {
    vendor: 'Cache',
    family: 'Storage Cache',
    costPer1MCharsUSD: 0,
    costPer1MChars: 0,
  },
};

// ─── STT Pricing ──────────────────────────────────────────────────────────────
// Second-based — NOT tokens. Do NOT mix with LLM token costs.
export const STT_PRICING = {
  // AssemblyAI Real-time WebSocket
  // AssemblyAI: $0.0017 per second (~$6.12/hr)
  'assemblyai-realtime': {
    vendor: 'AssemblyAI',
    family: 'AssemblyAI Real-time',
    costPerSecond: 0.0017 * USD_TO_INR, // ₹0.1615 / second
  },
  // AssemblyAI Batch (used in /api/transcribe)
  // AssemblyAI: $0.37 per audio hour = $0.000103/sec
  'assemblyai-batch': {
    vendor: 'AssemblyAI',
    family: 'AssemblyAI Batch',
    costPerSecond: (0.37 / 3600) * USD_TO_INR, // ₹0.00977 / second
  },
  // Web Speech API — browser-native fallback, always free
  'webspeech': {
    vendor: 'Browser',
    family: 'Web Speech API',
    costPerSecond: 0,
  },
};

// ─── Feature → Default Model Mapping ─────────────────────────────────────────
// Used for estimating cost of historical logs that predate model tracking.
// Keys match the normalised feature keys in tokenTrackerServer.js.
export const FEATURE_DEFAULT_MODEL = {
  'smart-interview':     'claude-haiku-4-5-20251001',
  'interview':           'claude-haiku-4-5-20251001',
  'personalize':         'claude-haiku-4-5',            // /api/personalize
  'career-intelligence': 'claude-sonnet-4-5',    // /api/career-intelligence
  'aptitude':            'claude-sonnet-4-5',
  'recruiter':           'claude-sonnet-4-5',
  'pdf-chat':            'claude-sonnet-4-5',
  'resume':              'claude-sonnet-4-5',
  'news':                'claude-sonnet-4-5',
  'jobs':                'claude-sonnet-4-5',
  'gd':                  'claude-haiku-4-5',   // GD discussion turns default to Haiku
  'gd_ai':               'claude-haiku-4-5',   // 1vs4 GD turns
  'gd_eval':             'claude-sonnet-4-5',  // GD evaluations default to Sonnet
  'gd_ai_eval':          'claude-sonnet-4-5',  // 1vs4 GD evaluations
  'coach':               'claude-sonnet-4-5',
  'tpo':               'claude-sonnet-4-5',
  'cron':                'claude-opus-4-5',
};

// ─── Cost Calculation Helpers ─────────────────────────────────────────────────

/**
 * Calculate exact LLM cost in INR from token counts and model slug.
 * @param {number} inputTokens
 * @param {number} outputTokens
 * @param {string} modelSlug — exact model string from API route code
 * @returns {{ costINR: number, isEstimated: false }}
 */
export function calcLLMCostINR(inputTokens, outputTokens, modelSlug) {
  const { costINR, isEstimated } = calcLLMCost(inputTokens, outputTokens, modelSlug);
  return { costINR, isEstimated };
}

/**
 * Estimate cost for historical logs that only have total tokens (no input/output split).
 * Uses a conservative 70/30 input/output ratio and the feature's default model.
 * @param {number} totalTokens
 * @param {string} featureKey — normalised feature key
 * @returns {{ costINR: number, isEstimated: true }}
 */
export function estimateHistoricalCostINR(totalTokens, featureKey) {
  const modelSlug = FEATURE_DEFAULT_MODEL[featureKey] || 'claude-sonnet-4-5';
  const inputTokens = Math.round((totalTokens || 0) * 0.70);
  const outputTokens = Math.round((totalTokens || 0) * 0.30);
  const { costINR } = calcLLMCost(inputTokens, outputTokens, modelSlug);
  return { costINR, isEstimated: true };
}

/**
 * Calculate TTS cost in INR from character count and provider.
 * @param {number} charCount
 * @param {string} provider — 'gemini' | 'elevenlabs' | 'cache'
 * @returns {{ costINR: number, vendor: string }}
 */
export function calcTTSCostINR(charCount, provider) {
  const slugMap = {
    'gemini': 'gemini-2.5-flash-preview-tts',
    'elevenlabs': 'eleven_turbo_v2_5',
    'cache': 'cache',
  };
  const slug = slugMap[provider] || 'gemini-2.5-flash-preview-tts';
  const pricing = TTS_PRICING[slug];
  const cost = ((charCount || 0) / 1_000_000) * pricing.costPer1MChars;
  return { costINR: cost, costUSD: cost / USD_TO_INR, vendor: pricing.vendor, modelSlug: slug };
}

/**
 * Calculate STT cost in INR from audio seconds and provider.
 * @param {number} audioSeconds
 * @param {string} provider — 'assemblyai-realtime' | 'assemblyai-batch' | 'webspeech'
 * @returns {{ costINR: number, vendor: string }}
 */
export function calcSTTCostINR(audioSeconds, provider) {
  const pricing = STT_PRICING[provider] || STT_PRICING['assemblyai-realtime'];
  const cost = (audioSeconds || 0) * pricing.costPerSecond;
  return { costINR: cost, vendor: pricing.vendor };
}
