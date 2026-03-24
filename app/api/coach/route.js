import Anthropic from '@anthropic-ai/sdk';
const MODEL = "claude-sonnet-4-20250514";

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

async function callClaudeJSON({ systemPrompt, userPrompt }) {
  console.log('=== COACH API CALLED ===');
  console.log('Has API key:', !!process.env.ANTHROPIC_API_KEY);
  console.log('API Key first 10 chars:', process.env.ANTHROPIC_API_KEY?.substring(0, 10));
  
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is missing in coach API');
    throw new Error("Missing ANTHROPIC_API_KEY");
  }

  const client = new Anthropic({
    apiKey: apiKey,
    defaultHeaders: {
      'anthropic-version': '2023-06-01'
    }
  });

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    });
    
    const responseText = message.content[0].text;
    console.log('Coach API Raw Response:', responseText);
    
    // Strip markdown blocks if present
    const cleanResponse = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    
    console.log('Coach API Cleaned Response:', cleanResponse);
    
    const result = JSON.parse(cleanResponse);
    return result;
  } catch (error) {
    console.error('Coach API Error:', error);
    throw error;
  }
}

function getMockOutput(mode, text) {
  if (mode === "rewrite") {
    const improvedAnswers = [
      "I approach challenges by first analyzing the requirements, then developing a structured plan, and finally executing with measurable outcomes. I ensure clear communication with stakeholders throughout the process.",
      "My methodology involves breaking down complex problems into manageable components, prioritizing tasks based on impact and urgency, and delivering results through systematic execution.",
      "I handle situations by assessing the context, identifying key objectives, collaborating with team members effectively, and maintaining transparent communication with all stakeholders."
    ];
    return improvedAnswers[Math.floor(Math.random() * improvedAnswers.length)];
  }

  if (mode === "hinglish_to_english") {
    const hinglishExamples = {
      "main aapka point samjha": "I understand your point clearly.",
      "mujhe iska solution pata hai": "I know the solution to this problem.",
      "humne kaam complete kar diya": "We have completed the work successfully.",
      "ye bahut accha idea hai": "This is an excellent idea.",
      "main ready hoon interview ke liye": "I am prepared for the interview."
    };
    
    // Check if it's a common hinglish phrase
    const lowerText = text.toLowerCase();
    for (const [hinglish, english] of Object.entries(hinglishExamples)) {
      if (lowerText.includes(hinglish)) {
        return english;
      }
    }
    
    return "I am confident in my abilities and ready to take on new challenges. I can communicate effectively and work well in a team environment.";
  }

  return "I successfully completed the assigned task and delivered the expected results on time.";
}

export async function POST(request) {
  const body = await readJsonBody(request);
  if (!body || typeof body !== "object") {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const mode = typeof body.mode === "string" ? body.mode.trim() : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!mode || !text) {
    return jsonResponse({ error: "mode and text are required" }, 400);
  }

  try {
    if (mode === "rewrite") {
      const result = await callClaudeJSON({
        systemPrompt: "You are an expert interview coach. Rewrite interview answers to be more professional, structured, and impactful. Use clear language, add specific examples where appropriate, and maintain original intent. Return strict JSON with 'output' field only.",
        userPrompt: `Rewrite this interview answer to make it more professional and impactful:

${text}

Guidelines:
- Use professional language
- Add structure (STAR format if applicable)
- Include specific examples or metrics
- Keep it concise but comprehensive
- Maintain original meaning

Return JSON:
{"output":"...rewritten professional answer..."}`,
      });
      return jsonResponse({ output: typeof result?.output === "string" ? result.output : getMockOutput(mode, text) });
    }

    if (mode === "hinglish_to_english") {
      const result = await callClaudeJSON({
        systemPrompt: "You are a language expert specializing in converting Hinglish (Hindi + English) to professional English. Maintain meaning while improving grammar, vocabulary, and professionalism. Return strict JSON with 'output' field only.",
        userPrompt: `Convert this Hinglish text to fluent professional English:

${text}

Guidelines:
- Convert to proper English grammar
- Use professional vocabulary
- Maintain original meaning
- Make it suitable for formal/communication contexts
- Keep it natural and fluent

Return JSON:
{"output":"...converted professional English text..."}`,
      });
      return jsonResponse({ output: typeof result?.output === "string" ? result.output : getMockOutput(mode, text) });
    }

    return jsonResponse({ error: "Unsupported mode. Use 'rewrite' or 'hinglish_to_english'" }, 400);
  } catch (error) {
    console.error('Coach API Error:', error);
    return jsonResponse({ output: getMockOutput(mode, text), source: "mock" });
  }
}
