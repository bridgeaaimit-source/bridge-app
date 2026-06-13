import Anthropic from "@anthropic-ai/sdk";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { trackTokensServer } from "@/lib/tokenTrackerServer";

const WEEKLY_PROMPT = `You are a career market analyst for India's tech job market.
Based on current hiring trends in May 2026, generate a comprehensive weekly market intelligence report for Indian college students.

Return ONLY valid JSON with no markdown, no explanation:
{
  "risingSkills": [
    { "rank": 1, "skill": "string", "demandChange": number, "jobCount": number, "category": "string", "whyRising": "string" }
  ],
  "dyingSkills": [
    { "rank": 1, "skill": "string", "demandChange": number, "jobCount": number, "warning": "string", "alternative": "string" }
  ],
  "liveFeed": [
    { "type": "hiring|trend|salary|warning|opportunity", "headline": "string", "detail": "string", "timeAgo": "string", "actionLabel": "string" }
  ],
  "stats": {
    "skillsInDemand": number,
    "companiesHiring": number,
    "avgPackageLPA": number,
    "hottestSkill": "string",
    "hottestSkillChange": number
  },
  "companySignals": [
    { "company": "string", "signal": "hiring_surge|freeze|stable", "topSkills": ["string"], "openRoles": number }
  ],
  "salaryByCity": [
    { "city": "string", "avgLPA": number }
  ]
}
Include 8 rising skills, 5 dying skills, 8 live feed items, 6 company signals, 6 cities.
Focus on Indian market. Be specific and realistic with actual company names.`;

export async function GET(request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      messages: [{ role: "user", content: WEEKLY_PROMPT }],
    });

    await trackTokensServer(
      "system",
      "cron",
      message.usage?.input_tokens,
      message.usage?.output_tokens,
      "claude-opus-4-5"
    );

    const raw = message.content[0].text.trim();
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));

    const weekOf = new Date().toISOString().split("T")[0];
    await setDoc(doc(db, "skillpulse_weekly", "latest"), {
      ...parsed,
      weekOf,
      updatedAt: serverTimestamp(),
    });

    return Response.json({ ok: true, weekOf, skillCount: parsed.risingSkills?.length });
  } catch (err) {
    console.error("SkillPulse cron error:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
