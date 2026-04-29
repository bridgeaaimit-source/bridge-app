import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AssemblyAI API key not configured' }, { status: 500 });
    }

    const res = await fetch('https://api.assemblyai.com/v2/realtime/token', {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ expires_in: 3600 }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('AssemblyAI token error:', text);
      return NextResponse.json({ error: 'Failed to get token' }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ token: data.token }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('AssemblyAI token route error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
