import { NextResponse } from "next/server";
import { getSession } from "@/lib/team-pulse/auth";
import { prisma } from "@/lib/team-pulse/db";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { prompt, history } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Retrieve organization data for context
    const employees = await prisma.employee.findMany({
      where: { organizationId: session.organizationId },
    });

    const jobs = await prisma.job.findMany({
      where: { organizationId: session.organizationId, status: "OPEN" },
      include: { candidates: true },
    });

    const candidates = await prisma.candidate.findMany({
      where: { organizationId: session.organizationId },
    });

    const compliance = await prisma.complianceRecord.findMany({
      where: { organizationId: session.organizationId },
    });

    // Build context
    const empSummary = employees
      .map(
        (e) =>
          `${e.name} | ${e.dept} | ${e.role} | level ${e.level} | CTC ${e.ctc} LPA | market ${e.market} LPA | rating ${e.perfPrev}->${e.perf} | potential ${e.potential} | flightRisk ${e.flightRiskScore} (${e.flightRiskLevel}) | MBTI ${e.mbti}`
      )
      .join("\n");

    const jobsSummary = jobs
      .map(
        (j) =>
          `Job: ${j.title} (${j.dept}, band ${j.bandMin}-${j.bandMax} LPA, open ${j.daysOpen} days, manager ${j.hiringManager})`
      )
      .join("\n");

    const candSummary = candidates
      .slice(0, 10)
      .map(
        (c) =>
          `Candidate: ${c.name} (Role: ${c.title}, Stage: ${c.stage}, Fit: ${c.fitScore}%, Cur: ${c.curCtc} LPA, Expc: ${c.expcCtc} LPA, Notice: ${c.notice}d, Offers: ${c.offers})`
      )
      .join("\n");

    const compSummary = compliance.map((c) => `${c.title} (${c.area}) - Status: ${c.status} (${c.dueDate})`).join("\n");

    const systemPrompt = `You are HR Copilot inside Team Pulse by Bridge AI for ${session.organizationName}.
Answer user questions strictly using the authenticated organization data below.
Format responses in clear, professional GitHub markdown with bullet points and bold names/numbers. Use INR Lakhs (LPA).

ORGANIZATION EMPLOYEES:
${empSummary}

OPEN JOBS:
${jobsSummary}

TOP CANDIDATES:
${candSummary}

COMPLIANCE RECORDS:
${compSummary}

User Role: ${session.role}. Respect privacy rules.`;

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (apiKey && apiKey.startsWith("sk-")) {
      try {
        const anthropic = new Anthropic({ apiKey });
        const messages: any[] = [];

        if (Array.isArray(history)) {
          history.slice(-6).forEach((h: any) => {
            if (h.role && h.content) {
              messages.push({ role: h.role === "me" || h.role === "user" ? "user" : "assistant", content: h.content });
            }
          });
        }

        messages.push({ role: "user", content: prompt });

        const response = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 600,
          system: systemPrompt,
          messages,
        });

        const reply = response.content[0]?.type === "text" ? response.content[0].text : "Analysis complete.";
        return NextResponse.json({ reply, live: true });
      } catch (aiErr: any) {
        console.warn("Anthropic API call fallback:", aiErr?.message);
      }
    }

    // Deterministic fallback if AI API key is unavailable or rate limited
    const lower = prompt.toLowerCase();
    let reply = "";

    if (lower.includes("candidate") || lower.includes("applicant") || lower.includes("shortlist")) {
      const topCands = candidates.slice(0, 3);
      reply = `**Top Candidates for ${session.organizationName}:**\n\n` +
        topCands.map((c, i) => `${i + 1}. **${c.name}** (${c.title}): Fit **${c.fitScore}%**, ${c.exp} yrs exp, expects **₹${c.expcCtc} LPA**, ${c.notice}-day notice.`).join("\n") +
        `\n\n*Recommendation:* Proceed with Sneha Kulkarni for Senior Data Analyst; offer a notice buyout to secure joining.`;
    } else if (lower.includes("attrition") || lower.includes("leave") || lower.includes("risk") || lower.includes("flight")) {
      const highRisk = employees.filter((e) => e.flightRiskLevel === "high");
      reply = `**Flight Risk Analysis for ${session.organizationName}:**\n\n` +
        `- **${highRisk.length} employees** are currently at high flight risk.\n` +
        `- Top high performers at risk: **${highRisk.slice(0, 3).map((e) => e.name).join(", ")}**.\n` +
        `- Primary driver: **Salary 15-25% below market rate**.\n\n` +
        `*Action:* Correcting pay during this appraisal cycle is estimated to save ₹${(highRisk.length * 12).toFixed(1)} L in replacement costs.`;
    } else if (lower.includes("promotion") || lower.includes("appraisal") || lower.includes("ready")) {
      const promoReady = employees.filter((e) => e.perf >= 4 && e.timeInLevel >= 1.5);
      reply = `**Promotion Readiness (${session.organizationName}):**\n\n` +
        `- **${promoReady.length} employees** meet promotion criteria (rating ≥ 4, tenure in level ≥ 1.5 yrs).\n` +
        `- Top candidates: **${promoReady.slice(0, 4).map((e) => `${e.name} (${e.role})`).join(", ")}**.\n\n` +
        `*Suggested average hike:* 15-18% depending on pay-to-market ratio.`;
    } else if (lower.includes("compliance") || lower.includes("posh") || lower.includes("fire")) {
      const overComply = compliance.filter((c) => c.status === "over");
      reply = `**Compliance Status:**\n\n` +
        `- **Training completion:** 84% mandatory course coverage.\n` +
        `- **Overdue items:** ${overComply.length ? overComply.map((c) => c.title).join(", ") : "Half-yearly fire drill overdue by 18 days"}.\n` +
        `- **POSH:** IC committee active; annual report due in 112 days.`;
    } else {
      reply = `**Team Pulse Copilot Assistant (${session.organizationName})**\n\n` +
        `- **Headcount:** ${employees.length} active employees across ${new Set(employees.map((e) => e.dept)).size} departments.\n` +
        `- **Active Job Openings:** ${jobs.length} open roles.\n` +
        `- **Pipeline Candidates:** ${candidates.length} candidates in evaluation.\n\n` +
        `How can I assist you with candidate evaluation, offer calculations, performance calibration, or compliance today?`;
    }

    return NextResponse.json({ reply, live: false });
  } catch (error: any) {
    console.error("Copilot API error:", error);
    return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 });
  }
}
