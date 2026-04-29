import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AssemblyAI API key not configured' }, { status: 500 });
    }

    const formData = await req.formData();
    const audio = formData.get('audio');
    if (!audio) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const arrayBuffer = await audio.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload audio to AssemblyAI
    const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: { authorization: apiKey, 'content-type': 'application/octet-stream' },
      body: buffer,
    });

    if (!uploadRes.ok) throw new Error('Upload failed');
    const { upload_url } = await uploadRes.json();

    // Request transcription
    const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: { authorization: apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        audio_url: upload_url,
        speech_model: 'best',
        language_code: 'en',
        punctuate: true,
        format_text: true,
        disfluencies: false,
        filter_profanity: false,
        word_boost: ['React','JavaScript','Python','Node','MongoDB','SQL','MySQL','PostgreSQL','AWS','GCP','GitHub','TypeScript','Infosys','TCS','Wipro'],
        boost_param: 'high',
      }),
    });

    if (!transcriptRes.ok) throw new Error('Transcript request failed');
    const { id } = await transcriptRes.json();

    // Poll for result (max 60s)
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const poll = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
        headers: { authorization: apiKey },
      });
      const result = await poll.json();
      if (result.status === 'completed') {
        return NextResponse.json({ text: result.text, words: result.words, confidence: result.confidence });
      }
      if (result.status === 'error') throw new Error(result.error);
    }

    throw new Error('Transcription timed out');
  } catch (err) {
    console.error('Transcription error:', err);
    return NextResponse.json({ error: err.message || 'Transcription failed' }, { status: 500 });
  }
}
