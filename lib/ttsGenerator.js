import crypto from 'crypto';
import { pcmToWav } from './wavGenerator';
import { adminStorage, adminDb, admin } from './firebase-admin';

const GEMINI_VOICE = "Aoede";
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

export async function generateAndCacheTTS(text) {
  const startTotal = performance.now();
  let audioSource = 'unknown';
  let generationTimeMs = 0;
  let isCacheHit = false;

  const hash = crypto.createHash('sha256').update(text + GEMINI_VOICE).digest('hex');
  const fileName = `tts-cache/${hash}.wav`;
  const bucket = adminStorage?.bucket();

  if (bucket) {
    const file = bucket.file(fileName);
    const [exists] = await file.exists();
    
    if (exists) {
      isCacheHit = true;
      audioSource = 'cache';
      generationTimeMs = performance.now() - startTotal;
      logAnalytics(text, isCacheHit, generationTimeMs, audioSource);

      const cacheRes = await file.download();
      const cacheBuffer = cacheRes[0];
      return { buffer: cacheBuffer, contentType: 'audio/wav', isCacheHit };
    }
  }

  let finalAudioBuffer = null;
  let contentType = 'audio/wav';

  try {
    const geminiStart = performance.now();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY missing");

    const promptText = `Read the following text exactly as written. Speak clearly, like a professional campus recruiter, and add natural pauses. DO NOT alter the words. TEXT: ${text}`;
    const body = {
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: GEMINI_VOICE } } }
      }
    };

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1alpha/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );

    const data = await geminiRes.json();
    if (!geminiRes.ok) throw new Error(JSON.stringify(data));

    const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!inlineData) throw new Error("No inlineData returned from Gemini");

    const pcmBuffer = Buffer.from(inlineData.data, 'base64');
    finalAudioBuffer = pcmToWav(pcmBuffer);
    audioSource = 'gemini';
    generationTimeMs = performance.now() - geminiStart;

  } catch (geminiError) {
    console.warn("Gemini TTS failed, falling back to ElevenLabs:", geminiError.message);
    const elStart = performance.now();
    const elKey = process.env.ELEVENLABS_API_KEY;
    if (!elKey) throw new Error("ElevenLabs API key missing");

    const elRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": elKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: { stability: 0.60, similarity_boost: 0.80, style: 0.25, use_speaker_boost: true },
        }),
      }
    );

    if (!elRes.ok) {
      const errText = await elRes.text();
      throw new Error(`ElevenLabs error: ${elRes.status} ${errText}`);
    }

    const arrBuf = await elRes.arrayBuffer();
    finalAudioBuffer = Buffer.from(arrBuf);
    contentType = 'audio/mpeg';
    audioSource = 'elevenlabs';
    generationTimeMs = performance.now() - elStart;
  }

  // Cache it (blocking here since we are returning the buffer anyway, 
  // but if called from prefetch, the caller is non-blocking)
  if (bucket && finalAudioBuffer) {
    try {
      await bucket.file(fileName).save(finalAudioBuffer, { metadata: { contentType } });
    } catch (err) {
      console.error("Cache save failed:", err);
    }
  }

  logAnalytics(text, isCacheHit, generationTimeMs, audioSource);
  return { buffer: finalAudioBuffer, contentType, isCacheHit };
}

function logAnalytics(text, isCacheHit, generationTimeMs, audioSource) {
  if (!adminDb) return;
  adminDb.collection('tts_analytics').add({
    textLength: text.length,
    isCacheHit,
    generationTimeMs: Math.round(generationTimeMs),
    audioSource,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    estimatedCostSavings: isCacheHit ? 0.005 : 0
  }).catch(err => console.error("Analytics log failed:", err));
}
