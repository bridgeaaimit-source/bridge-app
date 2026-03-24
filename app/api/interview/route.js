const Anthropic = require('@anthropic-ai/sdk');
const MODEL = "claude-sonnet-4-20250514";
const DEFAULT_COUNT = 5;

// Debug API key
console.log('API Key first 10 chars:', 
  process.env.ANTHROPIC_API_KEY?.substring(0, 10));

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
  score: 7.0,
  clarity: 7,
  confidence: 7,
  content: 7,
  communication: 7,
  word_count: 85,
  filler_words: {
    found: ["basically", "you know"],
    count: 3,
    examples: "basically (2x), you know (1x)"
  },
  structure: {
    has_opening: true,
    has_examples: true,
    has_conclusion: false,
    rating: "Average"
  },
  weak_language: ["I think", "maybe"],
  strong_language: ["I achieved", "I led"],
  strengths: [
    "Good use of specific examples",
    "Clear explanation of technical concepts"
  ],
  improvements: [
    "Remove filler words like 'basically' and 'you know'",
    "Add a strong conclusion to summarize your points",
    "Include more quantifiable results and metrics"
  ],
  filler_feedback: "You used basically 2 times and you know 1 time. Replace with: therefore, consequently, or remove them entirely.",
  structure_feedback: "Your answer has a good opening and examples, but lacks a strong conclusion. Try to end with a summary of your key points.",
  better_answer: "I have extensive experience in this area. In my previous role, I led a team of 5 developers to implement a microservices architecture that reduced system latency by 40%. We used Docker for containerization and Kubernetes for orchestration. This project taught me the importance of proper API design and the value of continuous integration. I believe this experience makes me well-suited for this role as I understand both the technical challenges and the business impact of architectural decisions."
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

async function callClaudeJSON({ prompt }) {
  console.log('ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY);
  
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY");
  }

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: prompt
      }]
    });
    
    const responseText = message.content[0].text;
    console.log('Raw Claude response:', responseText);
    
    // Strip markdown blocks if present
    const cleanResponse = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    
    console.log('Cleaned response:', cleanResponse);
    
    const result = JSON.parse(cleanResponse);
    return result;
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
    const prompt = `Generate exactly ${count} realistic interview questions for the "${domain}" domain.
Return JSON in this shape:
{"questions":["question 1","question 2"]}
No extra keys.`;

    const result = await callClaudeJSON({ prompt });

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
  } catch (error) {
    console.error('Question generation error:', error);
    return jsonResponse({ questions: getMockQuestions(domain, count) });
  }
}

async function handleAnalyzeAnswer(body) {
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  const answer = typeof body?.answer === "string" ? body.answer.trim() : "";
  const domain = typeof body?.domain === "string" ? body.domain.trim() : "";

  console.log('=== INTERVIEW API CALLED ===');
  console.log('Question:', question);
  console.log('Answer:', answer);
  console.log('Domain:', domain);
  console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY);

  if (!question || !answer || !domain) {
    return jsonResponse(
      { error: "question, answer, and domain are required" },
      400
    );
  }

  // Calculate actual word count
  const wordCount = answer.trim().split(/\s+/).length;
  console.log('Actual word count:', wordCount);

  // Detect filler words programmatically
  const fillerWords = [
    'so', 'basically', 'you know', 'like', 'umm', 'uhh', 
    'actually', 'literally', 'I mean', 'right', 'na', 'toh', 
    'matlab', 'agar', 'I think', 'maybe', 'I guess', 
    'not sure', 'I don\'t know', 'kind of', 'sort of'
  ];
  
  const foundFillers = fillerWords.filter(f => 
    answer.toLowerCase().includes(f.toLowerCase())
  );
  console.log('Found fillers:', foundFillers);

  // Strict scoring rules
  let maxScore = 10;
  if (wordCount < 30) maxScore = 4;
  if (!answer.toLowerCase().includes('example') && !answer.toLowerCase().includes('project')) maxScore = Math.min(maxScore, 5);
  if (foundFillers.length > 0) maxScore = Math.min(maxScore, 6);
  if (answer.toLowerCase().includes('i don\'t know') || answer.toLowerCase().includes('no idea')) maxScore = 2;

  try {
    const prompt = `You are a strict interview coach for Indian students.
Analyze this interview answer carefully.

Question: ${question}
Domain: ${domain}
Student Answer: "${answer}"
Word Count: ${wordCount}

IMPORTANT: You MUST analyze ONLY this exact answer: "${answer}"
Do NOT give generic feedback.
Every strength and improvement must quote actual answer content.
If answer is poor (like "I don't know"), say it clearly.

DETECTED FILLER WORDS: ${foundFillers.join(', ')}

IMPORTANT: Detect these EXACT filler words if present:
basically, you know, like, umm, uhh, so basically, 
actually, literally, kind of, sort of, I mean, right,
na, toh, matlab, agar, I think, maybe, I guess, not sure

STRICT SCORING RULES:
- Under 30 words = max score 4/10
- No examples given = content max 5/10  
- Fillers found = confidence reduced
- "I don't know" in answer = automatic max score 2/10
- Maximum possible score: ${maxScore}/10

Return ONLY valid JSON, no extra text, no markdown:
{
  "score": (1-${maxScore} strict based on rules above),
  "clarity": (1-10),
  "confidence": (1-10),
  "content": (1-10),
  "communication": (1-10),
  "word_count": ${wordCount},
  "filler_words": {
    "found": [${foundFillers.map(f => `"${f}"`).join(', ')}],
    "count": ${foundFillers.length},
    "examples": "List actual examples from answer"
  },
  "structure": {
    "has_opening": (true/false),
    "has_examples": (true/false),
    "has_conclusion": (true/false),
    "rating": "Poor/Average/Good/Excellent"
  },
  "weak_language": ["list actual weak phrases from answer"],
  "strong_language": ["list actual strong phrases from answer"],
  "strengths": [
    "specific strength from THIS answer",
    "another specific strength"
  ],
  "improvements": [
    "specific improvement with example from answer",
    "specific improvement with example", 
    "specific improvement with example"
  ],
  "filler_feedback": "Specific feedback about actual fillers used",
  "structure_feedback": "specific feedback on actual answer structure",
  "better_answer": "Complete model answer 150-200 words for this exact question"
}`;

    const result = await callClaudeJSON({ prompt });

    return jsonResponse({
      score: Math.min(Number(result?.score ?? 0), maxScore),
      clarity: Number(result?.clarity ?? 0),
      confidence: Number(result?.confidence ?? 0),
      content: Number(result?.content ?? 0),
      communication: Number(result?.communication ?? 0),
      word_count: wordCount,
      filler_words: result?.filler_words || { found: foundFillers, count: foundFillers.length, examples: "" },
      structure: result?.structure || { has_opening: false, has_examples: false, has_conclusion: false, rating: "Poor" },
      weak_language: Array.isArray(result?.weak_language) ? result.weak_language : [],
      strong_language: Array.isArray(result?.strong_language) ? result.strong_language : [],
      strengths: Array.isArray(result?.strengths) ? result.strengths : [],
      improvements: Array.isArray(result?.improvements) ? result.improvements : [],
      filler_feedback: typeof result?.filler_feedback === "string" ? result.filler_feedback : "",
      structure_feedback: typeof result?.structure_feedback === "string" ? result.structure_feedback : "",
      better_answer: typeof result?.better_answer === "string" ? result.better_answer : "",
    });
  } catch (error) {
    console.error('Answer analysis error:', error);
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
