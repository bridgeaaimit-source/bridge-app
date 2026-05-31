import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { section, company, difficulty, exclude = [] } = await request.json();

    if (!section || !company) {
      return NextResponse.json({ error: 'Missing section or company' }, { status: 400 });
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const diffLabel = difficulty === 1 ? 'Easy' : difficulty === 3 ? 'Hard' : 'Medium';

    const prompt = `You are an expert Aptitude Test designer for Indian placements (similar to TCS iON, AMCAT, Cocubes, and Unstop).
Generate exactly 5 unique multiple-choice questions for the following requirements:
- Section: ${section.toUpperCase()} (one of: quant, lr, verbal, di, ga)
- Difficulty: ${diffLabel} (Level ${difficulty} out of 3)
- Target Company: ${company.toUpperCase()}

Avoid the following already-seen questions to prevent duplicates:
${exclude.map((q, idx) => `${idx + 1}. "${q}"`).join('\n')}

Each question must be challenging, realistic, and free of placeholders. Provide 4 distinct options and a clear step-by-step explanation.

Return ONLY a valid JSON array of objects (no markdown, no backticks, no comments, no intro/outro). The JSON must match this schema:
[
  {
    "question": "The question text...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0, // index of correct option (0 to 3)
    "explanation": "Detailed explanation of how to solve this...",
    "topic": "Specific topic name, e.g. Percentage, Profit and Loss, Syllogism, Blood Relations, Synonyms, etc."
  }
]`;

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = message.content[0].text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error from Claude:', text);
      return NextResponse.json({ error: 'Invalid JSON response from Claude' }, { status: 500 });
    }

    if (!Array.isArray(parsedQuestions)) {
      return NextResponse.json({ error: 'Response from Claude is not an array' }, { status: 500 });
    }

    // Return formatted questions for the client to save
    const formattedQuestions = parsedQuestions.map(q => ({
      section: section.toLowerCase(),
      difficulty: Number(difficulty) || 2,
      companies: [company.toLowerCase()],
      question: q.question,
      options: q.options,
      correct: Number(q.correct) ?? 0,
      explanation: q.explanation,
      topic: q.topic || 'General',
      timesSeen: 0,
      timesCorrect: 0
    }));

    return NextResponse.json({ questions: formattedQuestions });

  } catch (error) {
    console.error('Generate Questions API Error:', error);
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
  }
}
