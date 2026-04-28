import { NextRequest, NextResponse } from 'next/server';

// Deepgram API configuration
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const DEEPGRAM_API_URL = 'wss://api.deepgram.com/v1/listen';

export async function POST(req) {
  try {
    console.log('🔑 DEEPGRAM_API_KEY exists:', !!DEEPGRAM_API_KEY);
    console.log('🔑 DEEPGRAM_API_KEY length:', DEEPGRAM_API_KEY?.length);
    console.log('🔑 DEEPGRAM_API_KEY prefix:', DEEPGRAM_API_KEY?.substring(0, 10));

    if (!DEEPGRAM_API_KEY) {
      return NextResponse.json(
        { error: 'Deepgram API key not configured' },
        { status: 500 }
      );
    }

    // This is a placeholder - in a real implementation, you'd use a WebSocket server
    // For Vercel/serverless, we'll return the Deepgram API URL and let the client connect directly
    const response = NextResponse.json({
      deepgramUrl: DEEPGRAM_API_URL,
      apiKey: DEEPGRAM_API_KEY,
      // Recommended settings for interview transcription
      options: {
        model: 'nova-2',
        language: 'en-US',
        smart_format: true,
        punctuate: true,
        profanity_filter: true,
        diarize: false, // Set to true for speaker diarization
        interim_results: true,
        vad_events: true,
        endpointing: 0, // Disable endpointing for continuous streaming
      }
    });

    console.log('✅ Transcription config response sent');
    return response;
  } catch (error) {
    console.error('❌ Transcription API error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize transcription' },
      { status: 500 }
    );
  }
}
