import Anthropic from '@anthropic-ai/sdk';
import { adminDb } from '@/lib/firebase-admin';
import { trackTokensServer } from '@/lib/tokenTrackerServer';

// In-memory daily cache fallback if Firestore is not available
let dailyCache = {};

function getISTDateKey() {
  const now = new Date();
  // IST is UTC+5:30.
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const istMs = utcMs + 5.5 * 60 * 60 * 1000;
  // Subtract 6 hours so "today" resets at 6 AM IST
  const adjusted = new Date(istMs - 6 * 60 * 60 * 1000);
  const y = adjusted.getFullYear();
  const m = String(adjusted.getMonth() + 1).padStart(2, '0');
  const d = String(adjusted.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'All';
  const userId = searchParams.get('userId');
  const force = searchParams.get('force');
  
  const todayDateKey = getISTDateKey();
  const cacheKey = `${category}_${todayDateKey}`;

  // Admin authentication check if force refresh is requested
  if (force === 'true') {
    const secret = searchParams.get('secret');
    const isValidSecret = secret && secret === process.env.ADMIN_SECRET_KEY;
    
    if (!isValidSecret) {
      if (!userId || !adminDb) {
        return Response.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 });
      }
      try {
        const userDoc = await adminDb.collection('users').doc(userId).get();
        if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
          return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
        }
        console.log(`[GD Insights] Authorized admin force refresh for: ${userId}`);
      } catch (authErr) {
        console.error('[GD Insights] Admin auth error:', authErr);
        return Response.json({ error: 'Failed to verify admin status' }, { status: 500 });
      }
    } else {
      console.log('[GD Insights] Authorized cron/system force refresh using secret key');
    }
  }

  // Try fetching from Firestore first (only if Firestore is available and not forcing a refresh)
  if (adminDb && force !== 'true') {
    try {
      const cachedDoc = await adminDb.collection('gd_daily_booster').doc(category).get();
      if (cachedDoc.exists) {
        const data = cachedDoc.data();
        if (data.dateString === todayDateKey) {
          console.log(`[GD Insights] Serving Firestore cached topic for ${category}`);
          return Response.json({
            ...data,
            cached: true,
            cache_date: todayDateKey
          });
        }
      }
    } catch (dbErr) {
      console.warn('[GD Insights] Firestore read error:', dbErr.message);
    }
  }

  // Fallback to in-memory cache if Firestore is not available and not forcing
  if (!adminDb && force !== 'true' && dailyCache[cacheKey]) {
    console.log('Serving from in-memory daily cache:', cacheKey);
    return Response.json({
      ...dailyCache[cacheKey],
      cached: true,
      cache_date: todayDateKey
    });
  }

  // Retrieve past topics from Firestore to prevent duplication
  let pastTopics = [];
  if (adminDb) {
    try {
      const historyDoc = await adminDb.collection('gd_daily_booster').doc(`${category}_history`).get();
      if (historyDoc.exists) {
        pastTopics = historyDoc.data().past_topics || [];
      }
    } catch (historyErr) {
      console.warn('[GD Insights] Firestore history read error:', historyErr.message);
    }
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

CRITICAL: The topic MUST NOT be similar to or repeat any of these past topics:
${pastTopics.length > 0 ? pastTopics.map(t => `- ${t}`).join('\n') : '(None)'}

Ensure the topic is highly relevant, trending, and distinct.

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
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    // Track token usage
    await trackTokensServer(userId || 'anonymous', 'gd', message.usage?.input_tokens, message.usage?.output_tokens, 'claude-sonnet-4-5');

    const text = message.content[0].text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    
    console.log('GD Insights raw response:', text);
    
    let insights;
    try {
      insights = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw text:', text);
      throw new Error('Invalid JSON response from Claude');
    }
    
    const boosterData = {
      ...insights,
      dateString: todayDateKey,
      createdAt: new Date().toISOString()
    };

    // Cache in Firestore (if available)
    if (adminDb) {
      try {
        await adminDb.collection('gd_daily_booster').doc(category).set(boosterData);
        
        // Update topic history to prevent repetition
        const updatedPast = [...pastTopics, insights.gd_topic].slice(-25); // keep last 25
        await adminDb.collection('gd_daily_booster').doc(`${category}_history`).set({
          past_topics: updatedPast
        });
        console.log(`[GD Insights] Saved fresh topic and history to Firestore for: ${category}`);
      } catch (saveErr) {
        console.error('[GD Insights] Firestore save error:', saveErr);
      }
    } else {
      // In-memory daily cache fallback
      dailyCache[cacheKey] = insights;
      
      // Clean old cache (keep only today)
      Object.keys(dailyCache).forEach(key => {
        if (!key.includes(todayDateKey)) {
          delete dailyCache[key];
        }
      });
    }
    
    return Response.json({
      ...boosterData,
      cached: false,
      cache_date: todayDateKey
    });

  } catch (error) {
    console.error('GD insights error:', error);
    
    const fallbackTopic = {
      gd_topic: "Is AI replacing human creativity?",
      why_trending: "AI tools are disrupting creative industries globally in 2025",
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
      categories: [category],
      dateString: todayDateKey,
      cached: false,
      cache_date: todayDateKey
    };

    return Response.json(fallbackTopic);
  }
}
