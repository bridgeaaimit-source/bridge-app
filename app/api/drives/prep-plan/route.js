import Anthropic from '@anthropic-ai/sdk';

export async function POST(request) {
  try {
    const body = await request.json();
    const { studentScores, company, driveDate, daysRemaining } = body;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'Anthropic API key not configured' }, { status: 500 });
    }

    if (!company || !daysRemaining) {
      return Response.json({ error: 'company and daysRemaining required' }, { status: 400 });
    }

    const client = new Anthropic({ apiKey });

    const prompt = `Create a day-by-day placement prep plan for a student preparing for the ${company} drive in ${daysRemaining} days.

Student's current scores:
- Aptitude: ${studentScores?.aptitude || 0}%
- Communication/Interview: ${studentScores?.communication || 0}%
- Group Discussion: ${studentScores?.gd || 0}%
- BRIDGE Score: ${studentScores?.bridgeScore || 0}/1000

Drive date: ${driveDate || 'upcoming'}
Company: ${company}

Create a focused, realistic plan. Each day should have 2-3 tasks maximum. Tasks should link to these BRIDGE features:
- aptitude → link: "/aptitude"
- interview → link: "/smart-interview"
- gd → link: "/gd"
- pulse → link: "/pulse"
- career-intelligence → link: "/career-intelligence"

Prioritize the student's weakest areas. If they only have ${daysRemaining} days, focus on high-impact items.

Return ONLY valid JSON (no markdown, no explanation):
[
  {
    "day": 1,
    "date": "Day 1",
    "tasks": [
      {
        "title": "Short task title",
        "description": "1-2 sentence description of what to do",
        "feature": "aptitude",
        "link": "/aptitude",
        "estimatedMins": 30
      }
    ]
  }
]

Maximum ${Math.min(daysRemaining, 14)} days. Be specific to ${company}'s known interview patterns.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const cleanText = jsonMatch ? jsonMatch[0] : text;

    try {
      const plan = JSON.parse(cleanText);
      return Response.json({ plan, generatedAt: new Date().toISOString() });
    } catch {
      console.error('Prep plan JSON parse error. Raw:', text.substring(0, 500));
      // Return a generic fallback plan
      const fallback = Array.from({ length: Math.min(daysRemaining, 7) }, (_, i) => ({
        day: i + 1,
        date: `Day ${i + 1}`,
        tasks: [
          {
            title: i % 3 === 0 ? 'Practice Aptitude' : i % 3 === 1 ? 'Mock Interview' : 'GD Practice',
            description: i % 3 === 0
              ? `Complete a full aptitude test focusing on your weak areas for ${company}`
              : i % 3 === 1
              ? `Run a Smart Interview session simulating ${company}'s interview style`
              : `Join a GD battle to improve your communication score`,
            feature: i % 3 === 0 ? 'aptitude' : i % 3 === 1 ? 'interview' : 'gd',
            link: i % 3 === 0 ? '/aptitude' : i % 3 === 1 ? '/smart-interview' : '/gd',
            estimatedMins: 30,
          },
        ],
      }));
      return Response.json({ plan: fallback, generatedAt: new Date().toISOString(), fallback: true });
    }
  } catch (error) {
    console.error('Prep plan error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
