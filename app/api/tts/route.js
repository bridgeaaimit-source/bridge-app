export const dynamic = "force-dynamic";

import { generateAndCacheTTS } from '@/lib/ttsGenerator';

export async function POST(request) {
  try {
    const { text } = await request.json();
    if (!text) {
      return new Response(JSON.stringify({ error: "No text provided" }), { status: 400 });
    }

    const { buffer, contentType } = await generateAndCacheTTS(text);

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });

  } catch (error) {
    console.error("TTS route fatal error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
