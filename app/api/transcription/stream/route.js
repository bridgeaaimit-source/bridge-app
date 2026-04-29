import { NextRequest, NextResponse } from 'next/server';

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;

export async function POST(req) {
  try {
    console.log('🔑 DEEPGRAM_API_KEY exists:', !!DEEPGRAM_API_KEY);
    console.log('🔑 DEEPGRAM_API_KEY length:', DEEPGRAM_API_KEY?.length);
    console.log('🔑 DEEPGRAM_API_KEY prefix:', DEEPGRAM_API_KEY?.substring(0, 10));

    if (!DEEPGRAM_API_KEY) {
      return NextResponse.json({ error: 'Deepgram API key not configured' }, { status: 500 });
    }

    return NextResponse.json({
      apiKey: DEEPGRAM_API_KEY,
    }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    console.error('❌ Transcription API error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize transcription' },
      { status: 500 }
    );
  }
}
