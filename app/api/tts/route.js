export const dynamic = "force-dynamic";

// Cached Indian HR voice ID (resolved once per cold start)
let cachedVoiceId = null;

// Known fallback voices in priority order (Indian accents + professional female/male)
const FALLBACK_VOICES = [
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily" },         // warm professional
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },        // calm professional
];

async function getIndianHRVoice(apiKey) {
  if (cachedVoiceId) return cachedVoiceId;

  try {
    // Search ElevenLabs shared voice library for Indian English voices
    const res = await fetch(
      "https://api.elevenlabs.io/v1/shared-voices?accent=indian&gender=female&page_size=5&sort=trending",
      { headers: { "xi-api-key": apiKey } }
    );

    if (res.ok) {
      const data = await res.json();
      const voices = data.voices || [];
      if (voices.length > 0) {
        console.log("🎤 Found Indian voice:", voices[0].name, voices[0].voice_id);
        cachedVoiceId = voices[0].voice_id;
        return cachedVoiceId;
      }
    }

    // Try without gender filter
    const res2 = await fetch(
      "https://api.elevenlabs.io/v1/shared-voices?accent=indian&page_size=5&sort=trending",
      { headers: { "xi-api-key": apiKey } }
    );

    if (res2.ok) {
      const data2 = await res2.json();
      const voices2 = data2.voices || [];
      if (voices2.length > 0) {
        console.log("🎤 Found Indian voice (any gender):", voices2[0].name, voices2[0].voice_id);
        cachedVoiceId = voices2[0].voice_id;
        return cachedVoiceId;
      }
    }
  } catch (e) {
    console.warn("Voice search failed:", e.message);
  }

  // Use hardcoded fallback
  console.log("🎤 Using fallback voice: Rachel");
  cachedVoiceId = FALLBACK_VOICES[1].id;
  return cachedVoiceId;
}

export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "No text provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ElevenLabs API key not configured" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const voiceId = await getIndianHRVoice(apiKey);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_flash_v2_5",
          voice_settings: {
            stability: 0.60,
            similarity_boost: 0.80,
            style: 0.25,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("ElevenLabs TTS error:", response.status, errText);
      // Reset cache so next request retries voice lookup
      cachedVoiceId = null;
      return new Response(JSON.stringify({ error: "ElevenLabs API error", detail: errText }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("TTS route error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// GET endpoint to preview what voice is being used
export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: "No API key" }), { status: 503 });
  const voiceId = await getIndianHRVoice(apiKey);
  return new Response(JSON.stringify({ voiceId, cached: !!cachedVoiceId }), {
    headers: { "Content-Type": "application/json" },
  });
}
