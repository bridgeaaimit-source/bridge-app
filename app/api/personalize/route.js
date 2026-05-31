import Anthropic from "@anthropic-ai/sdk";
import { trackTokensServer } from "@/lib/tokenTrackerServer";

export async function POST(request) {
  try {
    const { profile, weeklyData, userId, weekOf } = await request.json();
    if (!profile) return Response.json({ error: "Profile required" }, { status: 400 });

    const prompt = `Given this student profile: ${JSON.stringify(profile)}
And this week's Indian job market data: ${JSON.stringify({ stats: weeklyData?.stats, risingSkills: weeklyData?.risingSkills?.slice(0, 5), dyingSkills: weeklyData?.dyingSkills?.slice(0, 3) })}

Generate exactly 3 highly personalized career insights for this specific student.
Return ONLY valid JSON:
{
  "insights": [
    {
      "type": "strength|gap|opportunity",
      "headline": "string (max 15 words, be specific)",
      "detail": "string (max 30 words, mention specific skill/company/number)",
      "actionLabel": "string (max 4 words)",
      "actionUrl": "string (one of: /smart-interview, /jobs, /skillpulse, /career-gps)"
    }
  ]
}
Be brutally specific. Mention their actual skills, city, domain. No generic advice.`;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    // Track token usage
    await trackTokensServer(userId || "anonymous", "career-intel", message.usage?.input_tokens, message.usage?.output_tokens);

    const raw = message.content[0].text.trim();
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const { insights } = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));

    return Response.json({ insights, weekOf, userId });
  } catch (err) {
    console.error("Personalize error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
