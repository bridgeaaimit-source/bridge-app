import Anthropic from '@anthropic-ai/sdk';

export async function POST(request) {
  try {
    const body = await request.json();
    const { question, answer, domain, count } = body;
    
    console.log('=== API ROUTE HIT ===');
    console.log('Body:', { question, answer, domain, count });
    console.log('Has API key:', !!process.env.ANTHROPIC_API_KEY);
    console.log('API Key first 10 chars:', process.env.ANTHROPIC_API_KEY?.substring(0, 10));

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is missing');
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      // Add default headers to ensure proper authentication
      defaultHeaders: {
        'anthropic-version': '2023-06-01'
      }
    });

    // Generate questions
    if (count && domain && !answer) {
      const prompt = `Generate ${count} realistic interview questions 
      for ${domain} role at Indian companies like TCS, Infosys, Wipro.
      Mix HR and technical questions for freshers.
      Return ONLY this JSON, no markdown, no extra text:
      {"questions": ["q1", "q2", "q3", "q4", "q5"]}`;

      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      });

      const text = message.content[0].text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      console.log('Questions response:', text);
      return Response.json(JSON.parse(text));
    }

    // Analyze answer
    if (question && answer) {
      // Count fillers in code
      const fillerList = ['so', 'basically', 'you know', 
        'like', 'umm', 'uhh', 'actually', 'i think', 
        'maybe', 'i guess', "i don't know", 'kind of',
        'sort of', 'i mean', 'right', 'literally'];
      
      const answerLower = answer.toLowerCase();
      const foundFillers = fillerList.filter(f => 
        answerLower.includes(f));
      const wordCount = answer.trim().split(/\s+/).length;

      const prompt = `You are a strict interview coach for Indian students.
Analyze this EXACT answer honestly.

Question: ${question}
Domain: ${domain}
Student Answer: "${answer}"
Word Count: ${wordCount}
Filler words found by system: ${foundFillers.join(', ') || 'none'}

STRICT SCORING RULES:
- Under 20 words: max score 3/10
- No examples: content max 5/10
- Says "I don't know": max score 2/10
- Full of fillers: confidence max 4/10
- Generic answer: content max 5/10

You MUST reference the ACTUAL answer in feedback.
Do NOT give generic feedback.
Do NOT praise bad answers.

Return ONLY valid JSON, no markdown, no extra text:
{
  "score": (be strict and honest),
  "clarity": (1-10),
  "confidence": (1-10),
  "content": (1-10),
  "communication": (1-10),
  "word_count": ${wordCount},
  "filler_words": {
    "found": ${JSON.stringify(foundFillers)},
    "count": ${foundFillers.length},
    "examples": "${foundFillers.join(', ')}"
  },
  "structure": {
    "has_opening": (true/false based on actual answer),
    "has_examples": (true/false based on actual answer),
    "has_conclusion": (true/false based on actual answer),
    "rating": "Poor/Average/Good/Excellent"
  },
  "weak_language": (find in actual answer),
  "strong_language": (find in actual answer),
  "strengths": [
    "specific strength quoting actual answer words"
  ],
  "improvements": [
    "specific improvement referencing actual answer",
    "specific improvement referencing actual answer",
    "specific improvement referencing actual answer"
  ],
  "filler_feedback": "specific filler feedback for this answer",
  "structure_feedback": "specific structure feedback",
  "better_answer": "model answer for ${question} in ${domain} context, 
    150 words, professional, Indian fresher context"
}`;

      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });

      const text = message.content[0].text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      console.log('Analysis response:', text);
      return Response.json(JSON.parse(text));
    }

    return Response.json({ error: 'Invalid request' }, 
      { status: 400 });

  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
