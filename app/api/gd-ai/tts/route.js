/**
 * GD AI Multi-Voice TTS Endpoint
 * 
 * POST /api/gd-ai/tts
 * 
 * Extends the existing lib/ttsGenerator.js with per-persona voice selection.
 * Maps voiceRole → Gemini prebuilt voice name, then uses existing generation + caching pipeline.
 * 
 * Voice mapping (Gemini Neural2 prebuilt voices):
 *   moderator  → Kore   (clear, authoritative female)
 *   aggressive → Charon (deep, assertive male)
 *   analytical → Fenrir (measured, calm male)
 *   contrarian → Aoede  (crisp, articulate female)
 *   balanced   → Puck   (warm, approachable neutral)
 */

import crypto from 'crypto';
import { pcmToWav } from '@/lib/wavGenerator';
import { adminStorage, adminDb, admin } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

// Voice assignments per persona role
const VOICE_MAP = {
  moderator:  'Kore',
  aggressive: 'Charon',
  analytical: 'Fenrir',
  contrarian: 'Aoede',
  balanced:   'Puck',
};

const DEFAULT_VOICE = 'Aoede';

async function generateGeminiTTS(text, voiceName) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const body = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1alpha/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));

  const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!inlineData) throw new Error('No audio data from Gemini TTS');

  const pcmBuffer = Buffer.from(inlineData.data, 'base64');
  return pcmToWav(pcmBuffer);
}

async function generateElevenLabsTTS(text) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
  if (!apiKey) throw new Error('ElevenLabs API key not configured');

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: { stability: 0.6, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs error: ${res.status} ${err}`);
  }

  const buf = await res.arrayBuffer();
  return { buffer: Buffer.from(buf), contentType: 'audio/mpeg' };
}

export async function POST(request) {
  try {
    const { text, voiceRole = 'balanced', uid = 'anonymous' } = await request.json();

    if (!text || !text.trim()) {
      return new Response(JSON.stringify({ error: 'No text provided' }), { status: 400 });
    }

    const voiceName = VOICE_MAP[voiceRole] || DEFAULT_VOICE;
    const cacheKey = crypto.createHash('sha256').update(text + voiceName).digest('hex');

    // Check in-memory cache (shared with existing ttsGenerator)
    global.ttsMemoryCache = global.ttsMemoryCache || new Map();
    if (global.ttsMemoryCache.has(cacheKey)) {
      const cached = global.ttsMemoryCache.get(cacheKey);
      return new Response(cached.buffer, {
        headers: { 'Content-Type': cached.contentType, 'Cache-Control': 'public, max-age=86400', 'X-Cache': 'HIT' },
      });
    }

    // Check Firebase Storage cache
    const fileName = `tts-cache/gd-ai/${cacheKey}.wav`;
    const bucket = adminStorage?.bucket();
    if (bucket) {
      const file = bucket.file(fileName);
      const [exists] = await file.exists().catch(() => [false]);
      if (exists) {
        const [data] = await file.download();
        global.ttsMemoryCache.set(cacheKey, { buffer: data, contentType: 'audio/wav' });
        return new Response(data, {
          headers: { 'Content-Type': 'audio/wav', 'Cache-Control': 'public, max-age=86400', 'X-Cache': 'HIT' },
        });
      }
    }

    // Generate fresh audio
    let audioBuffer, contentType;
    try {
      audioBuffer = await generateGeminiTTS(text, voiceName);
      contentType = 'audio/wav';
    } catch (geminiErr) {
      console.warn(`[gd-ai/tts] Gemini failed for voice ${voiceName}, trying ElevenLabs:`, geminiErr.message);
      try {
        const result = await generateElevenLabsTTS(text);
        audioBuffer = result.buffer;
        contentType = result.contentType;
      } catch (elErr) {
        console.error('[gd-ai/tts] Both TTS providers failed:', elErr.message);
        return new Response(JSON.stringify({ error: 'TTS unavailable' }), { status: 503 });
      }
    }

    // Cache the audio
    global.ttsMemoryCache.set(cacheKey, { buffer: audioBuffer, contentType });
    if (bucket) {
      bucket.file(fileName).save(audioBuffer, { metadata: { contentType } }).catch(err =>
        console.error('[gd-ai/tts] Storage cache save failed:', err)
      );
    }

    // Log usage to analytics
    if (adminDb) {
      adminDb.collection('tts_analytics').add({
        textLength: text.length,
        voiceRole,
        voiceName,
        isCacheHit: false,
        source: 'gd_ai',
        userId: uid,
        timestamp: admin?.firestore?.FieldValue?.serverTimestamp?.() || new Date(),
      }).catch(() => {});
    }

    return new Response(audioBuffer, {
      headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=86400', 'X-Cache': 'MISS' },
    });

  } catch (error) {
    console.error('[gd-ai/tts] fatal error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
