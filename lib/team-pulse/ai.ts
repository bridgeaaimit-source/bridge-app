import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";
import { getCached, setCached, CacheKeys } from "./cache";

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

let anthropicClient: Anthropic | null = null;
if (ANTHROPIC_KEY && !ANTHROPIC_KEY.includes("your_")) {
  try {
    anthropicClient = new Anthropic({ apiKey: ANTHROPIC_KEY });
  } catch (e) {
    console.warn("Failed to initialize Anthropic client:", e);
  }
}

/**
 * Executes a prompt through the multi-tier AI pipeline:
 * Tier 1: Anthropic Claude (claude-3-5-haiku-20241022 / claude-3-7-sonnet-20250219)
 * Tier 2: Google Gemini (gemini-3.6-flash via GEMINI_API_KEY)
 * Tier 3: Deterministic Domain Fallback Generator
 */
export async function runMultiTierAI(
  prompt: string,
  systemPrompt: string,
  fallbackGenerator: () => string,
  options: { modelPreference?: "fast" | "deep"; maxTokens?: number } = {}
): Promise<string> {
  const cacheHash = crypto
    .createHash("sha256")
    .update(`${systemPrompt}:::${prompt}`)
    .digest("hex");

  const cached = getCached<string>(CacheKeys.aiResponse(cacheHash));
  if (cached) {
    return cached;
  }

  // Tier 1: Anthropic Claude
  if (anthropicClient) {
    try {
      const model =
        options.modelPreference === "deep"
          ? "claude-3-7-sonnet-20250219"
          : "claude-3-5-haiku-20241022";

      const message = await Promise.race([
        anthropicClient.messages.create({
          model,
          max_tokens: options.maxTokens || 1024,
          system: systemPrompt,
          messages: [{ role: "user", content: prompt }],
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Claude timeout")), 12000)
        ),
      ]);

      const text = message.content
        .filter((c: any) => c.type === "text")
        .map((c: any) => c.text)
        .join("\n");

      if (text && text.trim()) {
        setCached(CacheKeys.aiResponse(cacheHash), text, 300); // 5 min TTL
        return text;
      }
    } catch (err: any) {
      console.warn("Anthropic Claude tier failed/timed out, trying Gemini fallback:", err?.message);
    }
  }

  // Tier 2: Google Gemini API (gemini-3.6-flash)
  if (GEMINI_KEY && !GEMINI_KEY.includes("your_")) {
    try {
      const geminiRes = await Promise.race([
        fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: systemPrompt
                        ? `System Context: ${systemPrompt}\n\nTask: ${prompt}`
                        : prompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                maxOutputTokens: options.maxTokens || 1024,
                temperature: 0.3,
              },
            }),
          }
        ),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error("Gemini timeout")), 10000)
        ),
      ]);

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const geminiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (geminiText && geminiText.trim()) {
          setCached(CacheKeys.aiResponse(cacheHash), geminiText, 300);
          return geminiText;
        }
      }
    } catch (err: any) {
      console.warn("Google Gemini fallback failed/timed out:", err?.message);
    }
  }

  // Tier 3: Deterministic Domain Fallback
  const fallbackText = fallbackGenerator();
  setCached(CacheKeys.aiResponse(cacheHash), fallbackText, 60);
  return fallbackText;
}

/* =========================================================================
   SPECIALIZED DOMAIN AI GENERATORS
   ========================================================================= */

export async function generateBriefingAI(contextSummary: string): Promise<string> {
  const systemPrompt =
    "You are an executive HR AI assistant for Rocket India / Arcadia Softworks. Write a crisp, executive morning briefing (exactly 4-5 bullet points) highlighting headcount, open roles, high flight risk retention, overdue POSH compliance, and employee sentiment. Use bold text for key metrics and names.";

  const fallback = () =>
    `• **Headcount & Open Requisitions:** Current headcount is **64 employees** with **6 open roles** (Backend Engineer open 52 days requires immediate sourcing push).\n• **High Flight Risk:** **11 employees** flagged as high flight risk (total replacement risk ₹48.2L). Pay correction of ₹8.4L recommended for top 5 key staff.\n• **Internal Mobility:** 3 self-nominations pending review for Senior Data Analyst & Customer Success.\n• **Statutory Compliance:** **14 employees overdue on POSH training**; Bangalore fire drill overdue 18 days.\n• **Team Sentiment:** Overall Happiness Index is **70/100** (eNPS +18), with Engineering on-call burnout needing manager intervention.`;

  return runMultiTierAI(contextSummary, systemPrompt, fallback, { modelPreference: "fast" });
}

export async function analyzeAndRewriteJDAI(title: string, dept: string, text: string): Promise<string> {
  const systemPrompt =
    "You are an expert inclusive talent recruiter. Rewrite the provided Job Description to be completely gender-neutral, clear, and structured. Include: Role Overview, Key Responsibilities, Required Skills, Compensation & Benefits (₹18-24 LPA band), and Hybrid Work Policy (Bengaluru, 3 days in office).";

  const prompt = `Role Title: ${title}\nDepartment: ${dept}\nOriginal JD Text:\n${text}`;

  const fallback = () =>
    `# Senior Data Analyst — Arcadia Softworks\n\n**Location:** Bengaluru (Hybrid — 3 anchor days in office)\n**Compensation:** ₹18.0 L – ₹24.0 L CTC + Performance Bonus + Benefits\n**Department:** Data & Analytics\n\n### About the Role\nWe are looking for a Senior Data Analyst to partner with our Product and Engineering teams. You will turn complex product engagement telemetry and customer behavior metrics into actionable growth decisions.\n\n### Responsibilities\n- Design, maintain, and automate core executive dashboards in Looker/Tableau.\n- Write production-grade SQL queries and build dimensional models in Snowflake/dbt.\n- Collaborate cross-functionally with Product Managers to evaluate feature A/B test results.\n- Mentor junior analysts and champion data governance best practices.\n\n### Requirements\n- 4+ years of hands-on data analytics experience in B2B SaaS or consumer tech.\n- Advanced SQL proficiency (window functions, query optimization, CTEs).\n- Solid Python experience for exploratory data analysis (Pandas, NumPy).\n- Strong cross-functional communication and stakeholder management skills.\n\n### Benefits & Culture\n- Comprehensive health insurance for family.\n- ₹10,000 annual home-office and learning stipend.\n- Predictable on-call and flexible collaboration core hours (11am – 4pm IST).`;

  return runMultiTierAI(prompt, systemPrompt, fallback, { modelPreference: "deep" });
}

export async function generateCopilotAnswerAI(
  prompt: string,
  history: Array<{ role: string; content: string }>,
  orgContext: string
): Promise<string> {
  const systemPrompt = `You are HR Copilot inside the TalentPulse portal for Arcadia Softworks Pvt Ltd. Answer the HR team's questions using the organization data context provided below. Be concise (under 200 words unless drafting a formal policy or letter), use markdown bullets and bold for names and numbers, and format all compensation in INR Lakhs (₹LPA). Never make decisions on gender, age, or MBTI. If asked to draft a letter or policy, draft it completely and professionally.\n\n${orgContext}`;

  const historyContext = history
    .slice(-4)
    .map((h) => `${h.role === "user" ? "User" : "Copilot"}: ${h.content}`)
    .join("\n\n");

  const fullPrompt = `${historyContext ? historyContext + "\n\n" : ""}User: ${prompt}`;

  const fallback = () => {
    const l = prompt.toLowerCase();
    if (/candidate|shortlist|best fit|top 3|hire for/.test(l)) {
      return `**Top 3 Candidates for Senior Data Analyst**\n1. **Sneha Kulkarni**: Fit score **94/100**, 6 yrs experience at AnalyticsCo, current CTC ₹18.0 L, expected ₹22.0 L, 30-day notice period.\n2. **Rahul Varma**: Fit score **88/100**, 5 yrs experience at TechCorp, current ₹16.5 L, expected ₹20.0 L, 60-day notice period.\n3. **Ananya Sharma**: Fit score **82/100**, 4 yrs experience at DataGrid, current ₹15.0 L, expected ₹18.5 L, 45-day notice period.\n\n**Recommended Offer for Sneha Kulkarni:**\n- **Base CTC:** **₹21.5 L** (19.4% hike, aligned within the ₹18–24L band).\n- **Joining Bonus:** **₹1.5 L** (to secure acceptance against competing offers).`;
    }
    if (/attrition|leave|flight|risk|quit/.test(l)) {
      return `**Highest Flight Risk Employees (Top 5)**\n- **Vikram Malhotra** (Senior SDE): Flight Risk **84/100** — *Below market pay (-22%), 3.2 yrs in role.*\n- **Neha Gupta** (Product Designer): Flight Risk **79/100** — *Below market pay (-18%), high overtime.*\n- **Rohan Mehta** (Backend Engineer): Flight Risk **76/100** — *Manager transition, below market pay.*\n- **Priya Sundaram** (QA Lead): Flight Risk **71/100** — *Stagnant promotion score.*\n- **Amitabh Sen** (DevOps): Flight Risk **68/100** — *Below market pay (-12%).*\n\n**Financial Impact:** Correcting pay costs **₹8.4 L/yr**, compared to **₹48.2 L** to replace all five.`;
    }
    if (/promot/.test(l)) {
      return `**Promotion-Ready Employees (Cycle 2026)**\n- **Arjun Nair** (Senior SDE II → Staff SDE): Rating 4.8/5, suggested hike 18% (₹37.8L).\n- **Kavita Krishnan** (Product Manager → Lead PM): Rating 4.7/5, suggested hike 16% (₹30.1L).\n- **Sanjay Rao** (Data Scientist → Senior Data Scientist): Rating 4.6/5, suggested hike 15% (₹25.3L).`;
    }
    if (/posh|complian|fire|training|overdue/.test(l)) {
      return `**Statutory Compliance Snapshot**\n- **14 employees overdue on POSH training** (88% company completion).\n- Fire drill **18 days overdue**; Fire NOC expires in 21 days (Bengaluru office).\n- Open **Compliance Center** to trigger single-click reminders.`;
    }
    if (/offer letter/.test(l)) {
      return `**Arcadia Softworks Pvt Ltd — Formal Offer of Employment**\n\nDear **Sneha Kulkarni**,\n\nWe are pleased to offer you the role of **Senior Data Analyst** at **Arcadia Softworks Pvt Ltd**, reporting to the Director of Analytics.\n\n- **Annual Total CTC:** **₹21,50,000** (90% Fixed Base + 10% Annual Variable)\n- **Joining Bonus:** **₹1,50,000**\n- **Location:** Bengaluru (Hybrid — 3 anchor days in office)\n- **Joining Date:** Within 30 days\n\nPlease confirm acceptance by signing within 5 working days.\n\nWarm regards,\n**HR Team**`;
    }
    return `Here is what I can assist with based on your workforce data:\n- **Hiring:** Top candidates, salary benchmarks, and offer recommendations.\n- **Attrition Radar:** Flight risk scores, drivers, and pay correction costs.\n- **Appraisals:** Promotion readiness and PIP watchlist checks.\n- **Compliance:** POSH and fire safety status.\n- **Documents:** Instant generation of offer letters, rejection emails, hybrid policies, and warning letters.`;
  };

  return runMultiTierAI(fullPrompt, systemPrompt, fallback, { modelPreference: "deep" });
}
