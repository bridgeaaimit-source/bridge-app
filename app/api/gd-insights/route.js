import Anthropic from '@anthropic-ai/sdk';

// Simple in-memory daily cache
// Format: { date: "2026-03-25", data: {...} }
let dailyCache = {};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'All';
  
  // Check if we have today's cache
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `${category}_${today}`;
  
  if (dailyCache[cacheKey]) {
    console.log('Serving from daily cache:', cacheKey);
    return Response.json({
      ...dailyCache[cacheKey],
      cached: true,
      cache_date: today
    });
  }

  // Generate fresh insights with Claude
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const prompt = `You are a placement expert for Indian college students.
Today is ${new Date().toLocaleDateString('en-IN', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}.

Generate today's GD Booster for ${category} domain students.

Return ONLY valid JSON, no markdown:
{
  "gd_topic": "One hot GD topic relevant for ${category} today",
  "why_trending": "One line why this topic is relevant today",
  "pros": [
    "Strong pro point 1 with example",
    "Strong pro point 2 with example", 
    "Strong pro point 3 with example"
  ],
  "cons": [
    "Strong con point 1 with example",
    "Strong con point 2 with example",
    "Strong con point 3 with example"
  ],
  "example_argument": "A powerful 2-3 sentence argument to use in GD",
  "key_facts": [
    "Relevant fact or statistic 1",
    "Relevant fact or statistic 2"
  ],
  "how_to_start": "Exactly how to start speaking in this GD",
  "power_phrase": "One impressive phrase to use in GD",
  "interview_connection": "How this topic might come up in interviews",
  "difficulty": "Easy/Medium/Hard",
  "categories": ["${category}"]
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = message.content[0].text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    
    const insights = JSON.parse(text);
    
    // Cache for today
    dailyCache[cacheKey] = insights;
    
    // Clean old cache (keep only today)
    Object.keys(dailyCache).forEach(key => {
      if (!key.includes(today)) {
        delete dailyCache[key];
      }
    });

    console.log('Fresh GD insights generated for:', cacheKey);
    
    return Response.json({
      ...insights,
      cached: false,
      cache_date: today
    });

  } catch (error) {
    console.error('GD insights error:', error);
    return Response.json({
      gd_topic: "Is AI replacing human creativity?",
      why_trending: "AI tools are disrupting creative industries globally",
      pros: [
        "AI enables faster content creation at scale",
        "Reduces costs for businesses significantly",
        "Democratizes creative tools for everyone"
      ],
      cons: [
        "Loss of human emotional depth in creativity",
        "Copyright and ownership issues unresolved",
        "Threatens livelihoods of creative professionals"
      ],
      example_argument: "While AI optimizes reach, it cannot replicate the emotional resonance of human storytelling. Therefore, AI should augment, not replace, human creativity.",
      key_facts: [
        "AI art market grew 300% in 2024",
        "60% of designers use AI tools daily"
      ],
      how_to_start: "I'd like to begin by acknowledging that AI is fundamentally changing creative work...",
      power_phrase: "The question is not whether AI can create, but whether creation without human intent has meaning.",
      interview_connection: "Interviewers may ask your opinion on AI's role in your domain",
      difficulty: "Medium",
      cached: false,
      cache_date: today
    });
  }
}
