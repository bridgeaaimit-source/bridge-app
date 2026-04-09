import Anthropic from '@anthropic-ai/sdk';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin only if credentials are available
let db = null;
try {
  if (!admin.apps.length && 
      process.env.FIREBASE_CLIENT_EMAIL && 
      process.env.FIREBASE_PRIVATE_KEY && 
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY
          ?.replace(/\\n/g, '\n')
      })
    });
  }
  db = admin.firestore();
} catch (error) {
  console.warn('Firebase Admin initialization failed:', error.message);
}

// Track token usage
async function trackTokens(userId, feature, inputTokens, outputTokens) {
  if (!db) return;
  const total = (inputTokens || 0) + (outputTokens || 0);
  const today = new Date().toISOString().split('T')[0];
  
  try {
    await db.collection('tokenUsage').doc('daily').collection(today).doc(userId || 'anonymous').set({
      userId: userId || 'anonymous',
      [feature]: admin.firestore.FieldValue.increment(total),
      total: admin.firestore.FieldValue.increment(total),
      lastUsed: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log(`📊 ${userId || 'anonymous'} | ${feature}: ${total} tokens`);
  } catch (e) {
    console.error('Token tracking failed:', e);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { requirements, user_id } = body;
    
    console.log('👤 User ID:', user_id || 'anonymous');

    if (!requirements) {
      return Response.json(
        { error: 'Requirements are required' },
        { status: 400 }
      );
    }

    if (!db) {
      return Response.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    console.log('Matching candidates for requirements:', requirements);

    // Fetch all students from Firestore using Admin SDK
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
    const candidates = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      candidates.push({
        uid: doc.id,
        name: data.name || data.displayName || 'Anonymous',
        email: data.email || '',
        college: data.college || 'Not specified',
        degree: data.degree || 'Not specified',
        domain: data.domain || '',
        domains: data.domains || [data.domain] || [],
        skills: data.skills || [],
        bridgeScore: data.bridgeScore || Math.floor(Math.random() * 400) + 500,
        interviewsDone: data.interviewsDone || 0,
        avgScore: data.avgScore || 0,
        location: data.city || data.location || 'India',
        lookingFor: data.lookingFor || 'Full-time',
        experience: data.experience || 'Fresher',
        bio: data.bio || '',
        phone: data.phone || '',
        photo: data.photo || data.photoURL || null
      });
    });

    console.log(`Found ${candidates.length} candidates in database`);

    // If no candidates, return empty result
    if (candidates.length === 0) {
      return Response.json({
        matches: [],
        insights: {
          total_candidates: 0,
          matched_candidates: 0,
          avg_match_score: 0,
          recommendation: 'No candidates found in database'
        }
      });
    }

    // Prepare candidate data for Claude
    const candidateList = candidates.slice(0, 50).map((c, i) => 
      `${i + 1}. ${c.name}
      College: ${c.college}
      Degree: ${c.degree}
      Domain: ${c.domains.join(', ') || c.domain || 'Not specified'}
      Skills: ${c.skills.join(', ') || 'Not specified'}
      BRIDGE Score: ${c.bridgeScore}
      Interviews Done: ${c.interviewsDone}
      Avg Score: ${c.avgScore}
      Location: ${c.location}
      Looking For: ${c.lookingFor}
      Experience: ${c.experience}
      Bio: ${c.bio || 'Not provided'}`
    ).join('\n\n');

    // Use Claude to match candidates
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const prompt = `You are an expert recruiter AI helping match candidates to job requirements.

RECRUITER'S REQUIREMENTS:
${JSON.stringify(requirements, null, 2)}

AVAILABLE CANDIDATES:
${candidateList}

Analyze each candidate against the requirements and score them.

Return ONLY valid JSON (no markdown):
{
  "matches": [
    {
      "candidate_name": "exact name from list",
      "match_score": (0-100, be realistic and strict),
      "match_reasons": ["specific reason 1", "specific reason 2", "specific reason 3"],
      "gaps": ["specific gap 1", "specific gap 2"],
      "interview_readiness": (0-100),
      "salary_fit": "Expected ₹X-Y LPA based on profile",
      "recommendation": "Strong Match/Good Match/Potential Match/Not Recommended",
      "key_strengths": ["strength 1", "strength 2", "strength 3"],
      "interview_questions": ["Q1 to ask", "Q2 to ask", "Q3 to ask"]
    }
  ],
  "insights": {
    "total_candidates": ${candidates.length},
    "matched_candidates": (number of candidates with score >= 60),
    "avg_match_score": (average score),
    "top_skills_found": ["skill1", "skill2", "skill3"],
    "missing_skills": ["skill1", "skill2"],
    "recommendation": "overall hiring recommendation"
  }
}

IMPORTANT:
- Only include candidates with match_score >= 60
- Be realistic with scores (most should be 60-85, only exceptional matches get 90+)
- Sort by match_score descending
- Include top 10 matches maximum
- Use exact candidate names from the list`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });

    // Track token usage
    await trackTokens(user_id, 'recruiter-match', message.usage?.input_tokens, message.usage?.output_tokens);

    const text = message.content[0].text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const result = JSON.parse(text);

    // Enrich matches with full candidate data
    result.matches = result.matches.map(match => {
      const candidate = candidates.find(c => 
        c.name.toLowerCase() === match.candidate_name.toLowerCase()
      );
      
      return {
        ...match,
        candidate_data: candidate || null
      };
    }).filter(m => m.candidate_data !== null);

    console.log(`Matched ${result.matches.length} candidates`);

    return Response.json(result);

  } catch (error) {
    console.error('Recruiter match error:', error);
    return Response.json(
      { error: 'Failed to match candidates', details: error.message },
      { status: 500 }
    );
  }
}
