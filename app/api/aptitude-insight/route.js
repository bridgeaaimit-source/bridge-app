import Anthropic from '@anthropic-ai/sdk';
import { trackTokensServer } from '@/lib/tokenTrackerServer';

export async function POST(request) {
  try {
    const { sectionScores, accuracy, level, userId, uid } = await request.json();

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const scoresText = Object.entries(sectionScores || {})
      .map(([sec, val]) => `${sec}: ${val}%`)
      .join(', ');

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `You are a placement coach for Indian MBA/engineering students. Based on these aptitude test results: ${scoresText}, overall accuracy: ${accuracy}%, level: ${level}. Give exactly 2 sentences: first sentence identifies the weakest section and gives a specific tip, second sentence encourages the student with what they did well. Be direct, specific, motivating. No fluff.`
      }]
    });

    // Track token usage
    await trackTokensServer(uid || userId || 'anonymous', 'aptitude', message.usage?.input_tokens, message.usage?.output_tokens, 'claude-sonnet-4-5');

    const insight = message.content[0].text.trim();
    return Response.json({ insight });
  } catch (error) {
    console.error('Aptitude insight error:', error);
    return Response.json(
      { insight: 'Great effort on this test! Review the sections where you scored lowest and practice daily to see rapid improvement.' },
      { status: 200 }
    );
  }
}
