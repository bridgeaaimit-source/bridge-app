const Anthropic = require('@anthropic-ai/sdk');
const MODEL = "claude-sonnet-4-20250514";
const DEFAULT_COUNT = 5;

const MOCK_QUESTIONS_BY_DOMAIN = {
  "Software Engineer": [
    "Tell me about yourself",
    "Explain OOP concepts",
    "What is a REST API?",
    "Describe a challenging project",
    "Where do you see yourself in 5 years?",
  ],
  Marketing: [
    "Tell me about yourself",
    "What is your favorite marketing campaign?",
    "How would you launch a new product?",
    "Describe a time you influenced someone",
    "What is digital marketing to you?",
  ],
  "Data Analyst": [
    "Tell me about yourself",
    "How do you clean and validate messy data?",
    "Which KPIs would you track for a product launch?",
    "Describe a project where your analysis changed a decision",
    "How do you explain technical findings to non-technical teams?",
  ],
  Finance: [
    "Tell me about yourself",
    "How do you evaluate an investment opportunity?",
    "What financial statements do you review first and why?",
    "Describe a time you improved a financial process",
    "How do you manage risk in uncertain markets?",
  ],
  Operations: [
    "Tell me about yourself",
    "How do you identify and remove process bottlenecks?",
    "Describe a time you improved operational efficiency",
    "How do you prioritize competing operational issues?",
    "What metrics do you use to track operational performance?",
  ],
  "MBA General": [
    "Tell me about yourself",
    "Describe a time you led a team through ambiguity",
    "How would you approach a new market entry strategy?",
    "How do you make decisions with limited information?",
    "Where do you see yourself in 5 years?",
  ],
};

const MOCK_FEEDBACK = {
  score: 7.2,
  clarity: 7,
  confidence: 8,
  content: 7,
  strengths: [
    "Good structure in your answer",
    "Showed relevant experience",
  ],
  improvements: [
    "Add more specific examples",
    "Avoid filler words like 'basically'",
  ],
  better_answer:
    "A strong answer would start with a specific situation, explain your action, and end with the result you achieved.",
};

function jsonResponse(data, status = 200) {
  return Response.json(data, { status });
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function callClaudeJSON({ systemPrompt, userPrompt, temperature = 0.7 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY");
  }

  const client = new Anthropic({
    apiKey: apiKey,
  });

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      temperature: temperature,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt }
      ],
    });

    const content = message.content[0]?.text;
    
    if (!content) {
      throw new Error("Claude returned an empty response");
    }

    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Claude returned non-JSON content");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}

function getMockQuestions(domain, count) {
  const domainQuestions = MOCK_QUESTIONS_BY_DOMAIN[domain] || [
    "Tell me about yourself",
    "Why are you interested in this role?",
    "Describe a challenge you solved",
    "What are your key strengths?",
    "Where do you see yourself in 5 years?",
  ];

  const safeCount = Math.max(1, Math.min(10, count || DEFAULT_COUNT));
  if (safeCount <= domainQuestions.length) {
    return domainQuestions.slice(0, safeCount);
  }

  const padded = [...domainQuestions];
  while (padded.length < safeCount) {
    padded.push(domainQuestions[padded.length % domainQuestions.length]);
  }
  return padded;
}

async function handleGenerateQuestions(body) {
  const domain = typeof body?.domain === "string" ? body.domain.trim() : "";
  const countRaw = body?.count ?? 5;
  const count = Number.isInteger(countRaw) ? countRaw : Number.parseInt(countRaw, 10);

  if (!domain) {
    return jsonResponse({ error: "domain is required" }, 400);
  }

  if (!Number.isFinite(count) || count < 1 || count > 10) {
    return jsonResponse({ error: "count must be an integer between 1 and 10" }, 400);
  }

  try {
    const result = await callClaudeJSON({
      systemPrompt:
        "You generate realistic, role-relevant interview questions. Return strict JSON only.",
      userPrompt: `Generate exactly ${count} realistic interview questions for the "${domain}" domain.
Return JSON in this shape:
{"questions":["question 1","question 2"]}
No extra keys.`,
      temperature: 0.8,
    });

    const questions = Array.isArray(result?.questions)
      ? result.questions
          .map((q) => (typeof q === "string" ? q.trim() : ""))
          .filter(Boolean)
          .slice(0, count)
      : [];

    if (!questions.length) {
      throw new Error("Model response did not include valid questions");
    }

    return jsonResponse({ questions });
  } catch {
    return jsonResponse({ questions: getMockQuestions(domain, count) });
  }
}

async function handleAnalyzeAnswer(body) {
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  const answer = typeof body?.answer === "string" ? body.answer.trim() : "";
  const domain = typeof body?.domain === "string" ? body.domain.trim() : "";

  if (!question || !answer || !domain) {
    return jsonResponse(
      { error: "question, answer, and domain are required" },
      400
    );
  }

  try {
    const result = await callClaudeJSON({
      systemPrompt:
        "You evaluate interview answers with clear rubric scoring. Return strict JSON only.",
      userPrompt: `Analyze this interview response in the "${domain}" domain.
Question: ${question}
Answer: ${answer}

Return JSON with exactly these keys:
{
  "score": number (0-10, one decimal allowed),
  "clarity": number (0-10),
  "confidence": number (0-10),
  "content": number (0-10),
  "strengths": ["point 1", "point 2"],
  "improvements": ["point 1", "point 2"],
  "better_answer": "A concise improved sample answer"
}`,
      temperature: 0.5,
    });

    return jsonResponse({
      score: Number(result?.score ?? 0),
      clarity: Number(result?.clarity ?? 0),
      confidence: Number(result?.confidence ?? 0),
      content: Number(result?.content ?? 0),
      strengths: Array.isArray(result?.strengths) ? result.strengths : [],
      improvements: Array.isArray(result?.improvements) ? result.improvements : [],
      better_answer:
        typeof result?.better_answer === "string" ? result.better_answer : "",
    });
  } catch {
    return jsonResponse(MOCK_FEEDBACK);
  }
}

export async function POST(request) {
  const body = await readJsonBody(request);

  if (!body || typeof body !== "object") {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  try {
    // Branch by payload shape:
    // - Generate questions: { domain, count? }
    // - Analyze answer: { question, answer, domain }
    if ("question" in body || "answer" in body) {
      return await handleAnalyzeAnswer(body);
    }

    if ("domain" in body) {
      return await handleGenerateQuestions(body);
    }

    return jsonResponse(
      {
        error:
          "Unsupported payload. Use {domain, count} or {question, answer, domain}.",
      },
      400
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("Missing OPENAI_API_KEY") ? 500 : 502;
    return jsonResponse({ error: message }, status);
  }
}
