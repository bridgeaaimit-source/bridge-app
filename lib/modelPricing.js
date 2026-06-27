/**
 * Model-aware pricing for BridgeAI token accounting.
 *
 * Pricing basis: USD_TO_INR = 95 (fixed conversion rate)
 *
 * Sources:
 *  - Anthropic public pricing page (June 2026)
 *  - Google AI pricing page (June 2026)
 *  - ElevenLabs pricing page (June 2026)
 *  - AssemblyAI pricing page (June 2026)
 *
 * IMPORTANT:
 *  - All model strings are the EXACT strings used in API route code.
 *  - Sonnet 3.5, Sonnet 4, and Sonnet 4-5 are separate entries.
 *  - TTS/STT are character-based / second-based, NOT token-based.
 *    Do NOT convert TTS or STT cost into token equivalents.
 */

export const USD_TO_INR = 95;

// ─── LLM Pricing ──────────────────────────────────────────────────────────────
// All INR per 1,000,000 tokens
export const MODEL_PRICING = {
  // Claude Haiku 3.5
  // Anthropic public: $0.80 input / $4.00 output per 1M tokens
  'claude-haiku-4-5-20251001': {
    vendor: 'Anthropic',
    family: 'Claude Haiku 3.5',
    inputPer1M: 0.80 * USD_TO_INR,   // ₹76 / 1M input
    outputPer1M: 4.00 * USD_TO_INR,  // ₹380 / 1M output
  },
  'claude-haiku-4-5': {
    vendor: 'Anthropic',
    family: 'Claude Haiku 3.5',
    inputPer1M: 0.80 * USD_TO_INR,
    outputPer1M: 4.00 * USD_TO_INR,
  },

  // Claude Sonnet 4-5
  // Anthropic public: $3.00 input / $15.00 output per 1M tokens
  'claude-sonnet-4-5': {
    vendor: 'Anthropic',
    family: 'Claude Sonnet 4.5',
    inputPer1M: 3.00 * USD_TO_INR,   // ₹285 / 1M input
    outputPer1M: 15.00 * USD_TO_INR, // ₹1425 / 1M output
  },

  // Claude Opus 4-5 (used in cron/refresh-skillpulse)
  // Anthropic public: $15.00 input / $75.00 output per 1M tokens
  'claude-opus-4-5': {
    vendor: 'Anthropic',
    family: 'Claude Opus 4',
    inputPer1M: 15.00 * USD_TO_INR,  // ₹1425 / 1M input
    outputPer1M: 75.00 * USD_TO_INR, // ₹7125 / 1M output
  },
};

// ─── TTS Pricing ──────────────────────────────────────────────────────────────
// Character-based — NOT tokens. Do NOT mix with LLM token costs.
export const TTS_PRICING = {
  // Gemini 2.5 Flash TTS — primary provider
  // Google AI: ~$0.50 per 1M characters
  'gemini-2.5-flash-preview-tts': {
    vendor: 'Google',
    family: 'Gemini TTS',
    costPer1MChars: 0.50 * USD_TO_INR, // ₹47.5 / 1M chars
  },
  // ElevenLabs eleven_turbo_v2_5 — fallback provider
  // ElevenLabs: ~$0.50 per 1M characters (Creator plan)
  'eleven_turbo_v2_5': {
    vendor: 'ElevenLabs',
    family: 'ElevenLabs Turbo v2.5',
    costPer1MChars: 0.50 * USD_TO_INR, // ₹47.5 / 1M chars
  },
  // Cache hit — no cost
  'cache': {
    vendor: 'Cache',
    family: 'Storage Cache',
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
  'gd_eval':             'claude-sonnet-4-5',  // GD evaluations default to Sonnet
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
  const pricing = MODEL_PRICING[modelSlug];
  if (!pricing) {
    // Unknown model — fall back to conservative Sonnet 4 pricing
    const fallback = MODEL_PRICING['claude-sonnet-4-5'];
    const cost = ((inputTokens || 0) / 1_000_000) * fallback.inputPer1M
               + ((outputTokens || 0) / 1_000_000) * fallback.outputPer1M;
    return { costINR: cost, isEstimated: true };
  }
  const cost = ((inputTokens || 0) / 1_000_000) * pricing.inputPer1M
             + ((outputTokens || 0) / 1_000_000) * pricing.outputPer1M;
  return { costINR: cost, isEstimated: false };
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
  const pricing = MODEL_PRICING[modelSlug] || MODEL_PRICING['claude-sonnet-4-5'];
  const inputTokens = Math.round((totalTokens || 0) * 0.70);
  const outputTokens = Math.round((totalTokens || 0) * 0.30);
  const cost = (inputTokens / 1_000_000) * pricing.inputPer1M
             + (outputTokens / 1_000_000) * pricing.outputPer1M;
  return { costINR: cost, isEstimated: true };
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
  return { costINR: cost, vendor: pricing.vendor, modelSlug: slug };
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
