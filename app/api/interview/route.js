import Anthropic from '@anthropic-ai/sdk';
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin for token tracking
let adminDb = null;
try {
  if (!admin.apps.length && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });
  }
  adminDb = admin.firestore();
} catch (error) {
  console.warn('Firebase Admin init failed:', error.message);
}

// Track token usage
async function trackTokens(userId, feature, inputTokens, outputTokens) {
  if (!adminDb || !userId) return;
  const total = (inputTokens || 0) + (outputTokens || 0);
  const today = new Date().toISOString().split('T')[0];
  
  try {
    await adminDb.collection('tokenUsage').doc('daily').collection(today).doc(userId).set({
      userId,
      [feature]: admin.firestore.FieldValue.increment(total),
      total: admin.firestore.FieldValue.increment(total),
      lastUsed: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log(`📊 ${userId} | ${feature}: ${total} tokens`);
  } catch (e) {
    console.error('Token tracking failed:', e);
  }
}

export async function POST(request) {
  try {
    console.log('ANTHROPIC KEY:', process.env.ANTHROPIC_API_KEY?.substring(0, 15));
    
    const body = await request.json();
    const { question, answer, domain, count, uid, sessionId } = body;
    
    console.log('=== API ROUTE HIT ===');
    console.log('Body:', { question, answer, domain, count });
    console.log('Has API key:', !!process.env.ANTHROPIC_API_KEY);
    console.log('API Key first 10 chars:', process.env.ANTHROPIC_API_KEY?.substring(0, 10));
    console.log('Raw env var:', process.env.ANTHROPIC_API_KEY);
    console.log('NewsAPI key exists:', !!process.env.NEWS_API_KEY);

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is missing');
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    // Generate questions
    if (count && domain && !answer) {
      const prompt = `Generate ${count} realistic interview questions 
for ${domain} role at Indian companies like TCS, Infosys, Wipro.
Mix HR and technical questions for freshers.

IMPORTANT: Return ONLY valid JSON format. No markdown, no extra text.
Format exactly like this:
{"questions": ["question1", "question2", "question3", "question4", "question5"]}

Examples of good questions:
- "Tell me about yourself"
- "What are your strengths and weaknesses?"
- "Why do you want to work for our company?"
- "Describe a challenging situation you faced"
- "Where do you see yourself in 5 years?"

Now generate the questions:`;

      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      });

      // Track token usage
      await trackTokens(uid || 'anonymous', 'interview-generate', message.usage?.input_tokens, message.usage?.output_tokens);

      const text = message.content[0].text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      console.log('Questions response:', text);
      
      try {
        const parsed = JSON.parse(text);
        return Response.json(parsed);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Raw text:', text);
        
        // Fallback: try to extract questions manually
        const questionMatch = text.match(/"questions":\s*\[(.*?)\]/s);
        if (questionMatch) {
          try {
            const questionsText = questionMatch[1];
            const questions = questionsText
              .split('"')
              .filter(q => q.trim() && !q.includes(','))
              .map(q => q.trim().replace(/^,|,$/g, ''))
              .filter(q => q.length > 0);
            
            return Response.json({ questions });
          } catch (fallbackError) {
            console.error('Fallback parsing failed:', fallbackError);
          }
        }
        
        return Response.json({ 
          error: 'Failed to parse AI response. Please try again.',
          rawResponse: text
        }, { status: 500 });
      }
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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });

      const text = message.content[0].text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      console.log('Analysis response:', text);
      
      let analysis;
      try {
        analysis = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error for analysis:', parseError);
        console.error('Raw text:', text);
        
        // Fallback: create a basic analysis object
        analysis = {
          score: 5,
          confidence: 5,
          content: 5,
          clarity: 5,
          overall_feedback: "AI analysis temporarily unavailable. Please try again.",
          strengths: ["Answer provided"],
          improvements: ["Try again with more details"],
          filler_feedback: "No filler analysis available",
          structure_feedback: "No structure analysis available",
          better_answer: "A comprehensive answer would include specific examples and details."
        };
      }
      
      // Save interview results to Firestore if uid provided
      if (uid && sessionId) {
        try {
          // Save session data
          const sessionRef = doc(db, 'interviews', uid, 'sessions', sessionId);
          await setDoc(sessionRef, {
            domain,
            score: analysis.score,
            date: new Date().toISOString(),
            questionsCount: 1,
            fillerWords: analysis.filler_words.count,
            feedback: analysis.better_answer
          });
          
          // Update user document
          const userRef = doc(db, 'users', uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const scoreIncrease = analysis.score * 10;
            const newBridgeScore = Math.min(1000, 
              Math.max(0, 
                (userData.bridgeScore || 500) + scoreIncrease
              )
            );
            const newInterviewsDone = (userData.interviewsDone || 0) + 1;
            const newAvgScore = ((userData.avgScore || 0) * (userData.interviewsDone || 0) + analysis.score) / newInterviewsDone;
            
            await updateDoc(userRef, {
              bridgeScore: Math.round(newBridgeScore),
              interviewsDone: newInterviewsDone,
              avgScore: newAvgScore,
              streak: (userData.streak || 0) + 1
            });
          }
        } catch (firestoreError) {
          console.error('Error saving to Firestore:', firestoreError);
          // Don't fail the API response if Firestore fails
        }
      }
      
      return Response.json(analysis);
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
