const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o";

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

async function callOpenAIJSON({ systemPrompt, userPrompt }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned empty response");
  }

  return JSON.parse(content);
}

function getMockOutput(mode, text) {
  if (mode === "rewrite") {
    return `I would approach this situation by first clarifying the objective, then aligning with stakeholders, and finally executing with measurable milestones. ${text ? "I also ensure regular updates and proactive risk mitigation." : ""}`;
  }

  return "I completed the task on time and presented the results confidently. I can collaborate effectively with my team and communicate clearly with stakeholders.";
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
      const result = await callOpenAIJSON({
        systemPrompt: "You rewrite interview answers in clear, concise professional English. Return strict JSON.",
        userPrompt: `Rewrite this answer professionally, keeping original intent:
${text}

Return JSON:
{"output":"...rewritten answer..."}`,
      });
      return jsonResponse({ output: typeof result?.output === "string" ? result.output : getMockOutput(mode, text) });
    }

    if (mode === "hinglish_to_english") {
      const result = await callOpenAIJSON({
        systemPrompt: "You convert Hinglish to fluent professional English. Return strict JSON.",
        userPrompt: `Convert this Hinglish text into professional English:
${text}

Return JSON:
{"output":"...converted text..."}`,
      });
      return jsonResponse({ output: typeof result?.output === "string" ? result.output : getMockOutput(mode, text) });
    }

    return jsonResponse({ error: "Unsupported mode" }, 400);
  } catch {
    return jsonResponse({ output: getMockOutput(mode, text), source: "mock" });
  }
}
