import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { trackTokensServer } from '@/lib/tokenTrackerServer';

export async function POST(request) {
  try {
    const { topic, points, userId, uid } = await request.json();

    if (!topic || !points || !Array.isArray(points) || points.length === 0) {
      return NextResponse.json({ error: 'Missing topic or points' }, { status: 400 });
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const pointsList = points.map((p, i) => `Point ${i + 1}: "${p}"`).join('\n');

    const prompt = `You are an expert Group Discussion (GD) evaluator for Indian MBA and engineering placement interviews.

TOPIC: "${topic}"

A candidate made the following ${points.length} point(s) during the GD:
${pointsList}

Evaluate EACH point individually AND give an overall assessment. Be REALISTIC and STRICT — most students score between 4-7 out of 10 on individual metrics. Only exceptional arguments deserve 8+. Weak or vague points should score 3-5.

IMPORTANT RULES:
- Each point MUST get a DIFFERENT score based on its actual quality. Do NOT give the same score to every point.
- A generic statement like "AI is good" should score low (3-4). A specific point with data/examples should score higher (7-8).
- Be constructive but honest. Students need real feedback to improve.
- Consider: Does the student build on previous points? Do they contradict themselves? Do they show progression?

Return ONLY valid JSON, no markdown:
{
  "pointAnalysis": [
    {
      "pointNumber": 1,
      "originalPoint": "the exact point text",
      "clarity": number (0-10),
      "relevance": number (0-10),
      "depth": number (0-10),
      "pointScore": number (0-100, calculated from the 3 metrics),
      "strength": "What was good about this specific point",
      "weakness": "What was weak or missing",
      "improvement": "How to make this specific point stronger"
    }
  ],
  "overallAnalysis": {
    "totalScore": number (0-100),
    "communication": number (0-10),
    "logicalFlow": number (0-10),
    "contentQuality": number (0-10),
    "persuasiveness": number (0-10),
    "summary": "2-3 sentence overall assessment of the candidate's GD performance",
    "topStrength": "The candidate's biggest strength in this GD",
    "topWeakness": "The candidate's biggest area for improvement",
    "actionItems": ["specific thing to practice 1", "specific thing to practice 2", "specific thing to practice 3"]
  }
}`;

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    // Track token usage
    trackTokensServer(uid || userId || 'anonymous', 'gd', message.usage?.input_tokens, message.usage?.output_tokens, 'claude-3-5-sonnet-20241022').catch(() => {});

    const text = message.content[0].text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch (parseError) {
      console.error('GD Analysis JSON parse error:', text);
      throw new Error('Invalid JSON from Claude');
    }

    return NextResponse.json(analysis);

  } catch (error) {
    console.error('GD Analysis API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze GD performance',
      pointAnalysis: [],
      overallAnalysis: {
        totalScore: 0,
        communication: 0,
        logicalFlow: 0,
        contentQuality: 0,
        persuasiveness: 0,
        summary: "We couldn't analyze your GD at this time. Please try again.",
        topStrength: "N/A",
        topWeakness: "N/A",
        actionItems: ["Try again later"]
      }
    }, { status: 500 });
  }
}
