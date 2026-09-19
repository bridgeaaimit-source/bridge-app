import { NextResponse } from "next/server";
import {
  generateCopilotAnswerAI,
  generateBriefingAI,
  analyzeAndRewriteJDAI,
} from "@/lib/team-pulse/ai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { prompt, history = [] } = await req.json();
    const l = (prompt || "").toLowerCase();

    // 1. If it's a morning briefing rewrite request
    if (l.includes("morning briefing") || l.includes("daily briefing") || l.includes("crisp morning briefing")) {
      const summaryContext =
        "Company: Arcadia Softworks Pvt Ltd (Bengaluru). Headcount: 64. Open Roles: 6 (Backend Engineer 52 days open). High Flight Risk: 11 employees (Vikram Malhotra 84, Neha Gupta 79). Overdue POSH: 14 employees. eNPS: +18. Happiness: 70/100 (Engineering down to 57 due to weekend on-call).";
      const reply = await generateBriefingAI(summaryContext);
      return NextResponse.json({ reply });
    }

    // 2. If it's a JD Studio inclusive rewrite request
    if (l.includes("rewrite this job description") || l.includes("inclusive, unbiased")) {
      const reply = await analyzeAndRewriteJDAI("Senior Data Analyst", "Data & Analytics", prompt);
      return NextResponse.json({ reply });
    }

    // 3. General HR Copilot Question or Document Drafting
    const orgContext = `COMPANY: Arcadia Softworks Pvt Ltd, Bengaluru (64 employees, 6 open roles).
KEY EMPLOYEES:
- Vikram Malhotra (Senior Frontend Dev, Level 3, CTC 18L, Market 23L, Perf 4->4, Risk 84/100 - Below market pay)
- Neha Gupta (Product Designer, Level 2, CTC 14L, Market 17L, Perf 4->4, Risk 79/100 - Overtime burnout)
- Rohan Mehta (Backend Engineer, Level 3, CTC 19L, Market 22L, Perf 3->3, Risk 76/100)
- Arjun Nair (Senior SDE II, Level 4, CTC 32L, Perf 4.8/5, Goals 95%, Promotion-ready to Staff SDE, Suggested hike 18%)
- Kavita Krishnan (Product Manager, Level 3, CTC 26L, Perf 4.7/5, Promotion-ready to Lead PM, Suggested hike 16%)
- Sneha Kulkarni (Top candidate for Senior Data Analyst, 6 yrs exp, Current 18L, Expc 22L, Fit 94/100, Notice 30d)
COMPLIANCE: 14 employees overdue on POSH training. Fire drill 18 days overdue. Fire NOC expires in 21 days.
ENGAGEMENT: Happiness Index 70/100, eNPS +18. Engineering mood is 57 due to on-call schedules.`;

    const reply = await generateCopilotAnswerAI(prompt, history, orgContext);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Copilot chat route error:", err);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
