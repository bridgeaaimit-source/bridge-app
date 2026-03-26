import Anthropic from '@anthropic-ai/sdk';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin/credential';

if (!getApps().length) {
  initializeApp({
    credential: credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY
        ?.replace(/\\n/g, '\n')
    })
  });
}

const db = getFirestore();

export async function POST(request) {
  const { article_title, article_description, 
    placement_insight } = await request.json();

  // Create unique key from article title
  const cacheKey = article_title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .substring(0, 50);

  try {
    // Check if GD already exists for this article
    const docRef = db.collection('gd_from_articles')
      .doc(cacheKey);
    const doc = await docRef.get();

    if (doc.exists) {
      console.log('Serving cached GD for:', cacheKey);
      return Response.json({
        ...doc.data(),
        cached: true
      });
    }

    // Generate fresh GD content with Claude
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const prompt = `You are a GD expert for Indian 
college students preparing for placements.

Based on this news article, create a complete 
GD practice session:

Article: ${article_title}
Summary: ${article_description}
Placement Relevance: ${placement_insight}

Create a structured GD practice guide.

Return ONLY valid JSON, no markdown:
{
  "gd_topic": "Clear GD topic derived from article",
  "why_relevant": "Why this is important for placements",
  "background": "2-3 sentences of context to know",
  "pros": [
    "Strong argument FOR with example",
    "Strong argument FOR with example",
    "Strong argument FOR with example"
  ],
  "cons": [
    "Strong argument AGAINST with example",
    "Strong argument AGAINST with example",
    "Strong argument AGAINST with example"
  ],
  "key_facts": [
    "Important fact/statistic to use",
    "Important fact/statistic to use"
  ],
  "how_to_start": "Exact opening line to use in GD",
  "power_phrases": [
    "Impressive phrase 1 to use",
    "Impressive phrase 2 to use"
  ],
  "example_argument": "Complete 3-4 sentence argument",
  "counter_argument": "How to counter the opposite side",
  "conclusion_line": "How to conclude your point",
  "difficulty": "Easy/Medium/Hard",
  "time_suggested": "10/15/20 minutes",
  "interview_connection": "How interviewer might ask about this"
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = message.content[0].text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const gdContent = JSON.parse(text);

    // Cache in Firestore permanently
    await docRef.set({
      ...gdContent,
      article_title,
      generated_at: new Date().toISOString(),
      cache_key: cacheKey
    });

    console.log('Fresh GD generated for:', cacheKey);

    return Response.json({
      ...gdContent,
      cached: false
    });

  } catch (error) {
    console.error('GD from article error:', error);
    return Response.json({
      gd_topic: article_title,
      why_relevant: placement_insight,
      background: article_description,
      pros: [
        "This development creates new opportunities",
        "Early adoption gives competitive advantage",
        "Improves efficiency and productivity"
      ],
      cons: [
        "Poses challenges for traditional roles",
        "Requires significant upskilling",
        "Implementation challenges remain"
      ],
      key_facts: [
        "Industry growing rapidly in India",
        "Students need to adapt quickly"
      ],
      how_to_start: "I'd like to begin by providing some context on why this topic is crucial for our generation...",
      power_phrases: [
        "The data clearly suggests...",
        "From a strategic perspective..."
      ],
      example_argument: "While this presents challenges, the opportunities far outweigh the risks for prepared professionals.",
      counter_argument: "Although the opposing view has merit, we must consider the long-term implications...",
      conclusion_line: "To conclude, adapting proactively is the only sustainable path forward.",
      difficulty: "Medium",
      time_suggested: "15 minutes",
      interview_connection: "Interviewers may ask your views on this topic",
      cached: false
    });
  }
}
