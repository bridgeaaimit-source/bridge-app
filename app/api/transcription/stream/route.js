// Deepgram removed — replaced by AssemblyAI + Web Speech API
import { NextResponse } from 'next/server';
export async function POST() {
  return NextResponse.json({ apiKey: null }, { status: 410 });
}
