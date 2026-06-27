import Anthropic from '@anthropic-ai/sdk';
import { trackTokensServer } from '@/lib/tokenTrackerServer';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      batchStats, topImprovers, upcomingDrives, previousWeekStats, collegeName, userId
    } = body;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'Anthropic API key not configured' }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const prompt = `You are an expert placement coordinator generating a professional weekly batch performance report for ${collegeName || 'the college'}.

CURRENT WEEK BATCH STATS:
${JSON.stringify(batchStats, null, 2)}

PREVIOUS WEEK STATS (for comparison):
${JSON.stringify(previousWeekStats || {}, null, 2)}

TOP IMPROVERS THIS WEEK (students with biggest BRIDGE Score increase):
${JSON.stringify(topImprovers || [], null, 2)}

UPCOMING DRIVES:
${JSON.stringify(upcomingDrives || [], null, 2)}

Generate a 1-page professional weekly report with these sections:

1. **📊 Batch Performance Summary** — This week vs last week comparison. Key metrics with arrows (↑↓). Highlight concerning drops.

2. **🌟 Top Improvers** — Celebrate the students who improved the most. Mention names and score changes.

3. **🏢 Upcoming Drives & Readiness** — For each upcoming drive, assess batch readiness. Flag drives where batch is underprepared.

4. **⚠️ Areas of Concern** — Low-performing topics, at-risk students count, engagement drops.

5. **✅ Recommended Actions for TPO** — 3-5 specific, actionable recommendations the TPO should take this week.

Format as clean markdown with headers, bullet points, and bold text for emphasis. Be specific with numbers. Keep it professional but engaging. Maximum 800 words.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    await trackTokensServer(
      userId || 'system',
      'tpo',
      message.usage?.input_tokens,
      message.usage?.output_tokens,
      'claude-sonnet-4-5'
    );

    const report = message.content[0].text;

    return Response.json({
      report,
      generatedAt: new Date().toISOString(),
      tokensUsed: (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0),
    });
  } catch (error) {
    console.error('Weekly report error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
