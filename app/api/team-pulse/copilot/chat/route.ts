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
        "Company: Rocket India / Arcadia Softworks Pvt Ltd (Bengaluru). Headcount: 200 employees across 7 departments (Engineering: 70, Sales: 35, Data: 25, Customer Success: 22, Product: 20, Finance: 14, HR: 14). Open Roles: 4 open roles (Backend Engineer 52 days open). High Flight Risk: 13 employees (Kavya Reddy 85, Rohan Mehta 81, Arjun Nair 88). Overdue POSH: 26 employees. Fire drill: 18 days overdue. eNPS: +18. Happiness: 70/100 (Engineering on-call burnout needing manager intervention).";
      const reply = await generateBriefingAI(summaryContext);
      return NextResponse.json({ reply });
    }

    // 2. If it's a JD Studio inclusive rewrite request
    if (l.includes("rewrite this job description") || l.includes("inclusive, unbiased")) {
      const reply = await analyzeAndRewriteJDAI("Senior Data Analyst", "Data & Analytics", prompt);
      return NextResponse.json({ reply });
    }

    // 3. General HR Copilot Question or Document Drafting
    const orgContext = `COMPANY: Rocket India (Arcadia Softworks Pvt Ltd), Bengaluru (200 employees, 4 open roles, 7 departments: Engineering 70, Sales 35, Data 25, Customer Success 22, Product 20, Finance 14, HR 14).
KEY EMPLOYEES:
- Kavya Reddy (Senior Software Engineer, Engineering, CTC 18L, Market 21.5L, Perf 4/5, Risk 85/100 - Below market pay, overtime 48 hrs/wk)
- Rohan Mehta (Senior Data Analyst, Data, CTC 12.4L, Market 15.0L, Perf 5/5, Risk 81/100 - Low engagement, no promo in 3.4 yrs)
- Arjun Nair (Sales Development Rep, Sales, CTC 8.5L, Market 10.4L, Perf 5/5, Risk 88/100 - Paid below market, promotion-ready)
- Pranav Nair (Software Engineer II, Engineering, Level 3, CTC 22L, Perf 5/5, Readiness 132 - Promotion-ready to Senior Software Engineer)
- Sneha Kulkarni (Top candidate for Senior Data Analyst, 5.5 yrs exp, Current 15.3L, Expc 22.0L, Fit 91/100, Notice 90d, 2 competing offers)
COMPLIANCE: 26 employees overdue on POSH training (mostly in Sales). Half-yearly fire drill is 18 days overdue. Fire NOC renewal in progress.
ENGAGEMENT: Overall Happiness Index 70/100, eNPS +18. Engineering averages 48 hrs/week on-call with happiness falling 13 points since April.`;

    const reply = await generateCopilotAnswerAI(prompt, history, orgContext);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Copilot chat route error:", err);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
