import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { trackTokensServer } from '@/lib/tokenTrackerServer';

export async function POST(request) {
  try {
    const { topic, argument, userId, uid } = await request.json();

    if (!topic || !argument) {
      return NextResponse.json({ error: 'Missing topic or argument' }, { status: 400 });
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const prompt = `You are an expert Group Discussion evaluator for Indian placements.
Evaluate this student's argument on the topic: "${topic}".

Student's Argument: "${argument}"

Score it based on:
1. Clarity (0-10): How well-articulated and easy to understand is the point?
2. Relevance (0-10): How relevant is it to the specific topic?
3. Depth (0-10): Does it show critical thinking, data points, or unique perspectives?

Return ONLY valid JSON format, without any markdown formatting or extra text:
{
  "clarity": number,
  "relevance": number,
  "depth": number,
  "feedback": "One strong, constructive sentence of feedback."
}`;

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    });

    // Track token usage
    trackTokensServer(uid || userId || 'anonymous', 'gd', message.usage?.input_tokens, message.usage?.output_tokens, 'claude-3-5-sonnet-20241022').catch(() => {});

    const text = message.content[0].text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    let evaluation;
    try {
      evaluation = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error from Claude:', text);
      throw new Error('Invalid JSON from Claude');
    }

    // Calculate an overall score out of 100
    const totalScore = Math.round(((evaluation.clarity + evaluation.relevance + evaluation.depth) / 30) * 100);

    return NextResponse.json({
      ...evaluation,
      overallScore: totalScore
    });

  } catch (error) {
    console.error('GD Score API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to score argument',
      // Fallback response so app doesn't break
      clarity: 7,
      relevance: 7,
      depth: 7,
      overallScore: 70,
      feedback: "Good point, but try to add more specific examples to strengthen your argument."
    }, { status: 500 });
  }
}
