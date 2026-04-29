import Anthropic from '@anthropic-ai/sdk';
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
    // Daily user tracking
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

// Retry helper function
async function retryClaudeCall(callFunction, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await callFunction();
      return result;
    } catch (error) {
      console.error(`Claude API call attempt ${attempt} failed:`, error.message);
      
      // If it's not an overload error or we've maxed out retries, throw
      if (error.status !== 529 || attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = delay * Math.pow(2, attempt - 1);
      console.log(`Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

export async function POST(request) {
  const body = await request.json();
  const { action, resume_text, resume_base64, job_role, jd, 
    round, conversation_history, last_answer, user_id } = body;
  
  console.log('👤 User ID:', user_id || 'unknown');

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  // ACTION 1: Initialize - read resume+JD, ask first question
  if (action === 'init') {
    const prompt = `You are a strict senior interviewer at a 
company hiring for: ${job_role}

You have received this candidate's resume and job description.

RESUME:
${resume_text}

JOB DESCRIPTION:
${jd}

ROUND: ${round}

Your task:
1. Carefully analyze the resume against the JD
2. Note: skills match, gaps, interesting projects, 
   experience level, red flags
3. Ask your FIRST interview question

Rules:
- Ask ONE question only
- Make it specific to THEIR resume, not generic
- For HR round: start with background/motivation
- For Technical round: pick a project from resume and probe it
- For Managerial round: ask about leadership/decisions
- Sound like a real interviewer, professional but direct
- Do NOT say "Great resume!" or give compliments

Return ONLY valid JSON:
{
  "question": "Your first interview question here",
  "interviewer_thought": "Brief note on what you noticed 
    in resume that led to this question (hidden from student)",
  "resume_analysis": {
    "strong_points": ["point1", "point2"],
    "weak_points": ["point1", "point2"],
    "skills_match_percent": 72,
    "initial_impression": "Promising/Average/Weak"
  }
}`;

    let message;
    if (resume_base64) {
      // Validate base64 data
      if (!resume_base64 || resume_base64.length < 100) {
        console.error('Invalid base64 data detected');
        return Response.json({ error: 'Invalid resume data provided' }, { status: 400 });
      }
      
      console.log('Base64 data length:', resume_base64.length);
      
      // Handle PDF resume
      message = await retryClaudeCall(() => 
        client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [{
              type: 'text',
              text: prompt
            }, {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: resume_base64
              }
            }]
          }]
        })
      );
    } else {
      // Handle text resume
      message = await retryClaudeCall(() =>
        client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      );
    }

    // Track token usage
    await trackTokens(user_id, 'smart-interview-init', message.usage?.input_tokens, message.usage?.output_tokens);

    const text = message.content[0].text
      .replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      return Response.json(JSON.parse(text));
    } catch (parseError) {
      console.error('JSON parse error in smart-interview init:', parseError);
      console.error('Raw text:', text);
      
      // Fallback response
      return Response.json({
        initial_question: "Tell me about yourself and why you're interested in this role.",
        resume_jd_fit: 70,
        skills_match_percent: 72,
        initial_impression: "Average"
      });
    }
  }

  // ACTION 2: Continue - dynamic follow-up based on answer
  if (action === 'continue') {
    console.log('=== SMART INTERVIEW CONTINUE ===');
    console.log('Conversation history length:', conversation_history.length);
    console.log('Question number:', conversation_history.length + 1);
    console.log('Last answer:', last_answer);
    
    const historyText = conversation_history.map((h, i) => 
      `Q${i+1}: ${h.question}\nA${i+1}: ${h.answer}` 
    ).join('\n\n');
    
    console.log('History text preview:', historyText.substring(0, 200) + '...');

    const prompt = `You are an AI interviewer conducting a Business Development / MBA-level interview.

Your goal is to assess the candidate's real understanding, not to intimidate them.

Follow these principles strictly:

1. Adaptive Difficulty (MOST IMPORTANT)
- After every answer, classify it internally as:
  - Below Average (vague, generic, lacks examples, no numbers)
  - Average (clear but basic, some structure, limited depth)
  - Above Average (specific, structured, includes examples, some metrics or reasoning)

- Based on this:
  → If Below Average:
     - Ask simpler, guiding follow-up questions
     - Break questions into smaller parts
     - Help the candidate think (but don't give answers)
  
  → If Average:
     - Ask moderately deeper questions
     - Push for 1 layer deeper (example, metric, or reasoning)
  
  → If Above Average:
     - Increase difficulty
     - Ask for frameworks, edge cases, trade-offs, or scalability
     - Introduce real-world complexity

2. No Over-Grilling
- Do NOT repeatedly ask for numbers, metrics, and frameworks if the candidate is already struggling
- Avoid making the candidate feel stuck or defensive

3. Conversational Tone
- Keep it natural and human-like
- Avoid robotic or overly formal phrasing
- Occasionally acknowledge effort: "Got it", "Makes sense", "Interesting"

4. One Step at a Time
- Ask only ONE clear question at a time
- Avoid multi-layered or compound questions unless candidate is performing well

5. Focus Areas
Prioritize evaluating:
- Clarity of thought
- Real experience vs memorized answers
- Problem-solving approach
- Ownership mindset

6. Progressive Depth Model
- Start with basic experience questions
- Then move to application (what did you do)
- Then reasoning (why/how)
- Then optimization (how to improve/scale)

7. Recovery Mode
If candidate struggles for 2 consecutive answers:
- Temporarily reduce difficulty
- Ask supportive, simpler questions to rebuild confidence

8. Do NOT reveal evaluation labels (Below/Average/Above) to the candidate.

Job Role: ${job_role}
Round: ${round}

Resume:
${resume_text}

Conversation so far:
${historyText}

Latest answer from candidate:
"${last_answer}"

This is question ${conversation_history.length + 1} of 10 questions.

${conversation_history.length >= 9 ? 'CRITICAL: This is the LAST question. After this, the interview MUST end. Set "interview_complete": true in your response.' : ''}

IMPORTANT: Look at the conversation history above. DO NOT repeat any previous questions. Ask a completely NEW question that follows logically from their latest answer.

Your task:
1. Evaluate the last answer critically (classify as Below/Average/Above Average internally)
2. Decide next question strategy based on adaptive difficulty principles
3. Ask the next question OR end the interview if we've reached 10 questions

Rules:
- ONE question only
- Adaptive difficulty based on answer quality
- Natural, conversational tone
- After question 9, set "interview_complete": true and provide NO question
- NEVER repeat a previous question
- Focus on real understanding, not memorization

Return ONLY valid JSON:
{
  "question": "Your next question",
  "answer_evaluation": {
    "score": (1-10, be fair and balanced),
    "was_specific": true/false,
    "had_examples": true/false,
    "filler_words": ["list any found"],
    "quick_feedback": "One line honest evaluation"
  },
  "interview_complete": false
}`;

    const message = await retryClaudeCall(() =>
      client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    );

    // Track token usage
    await trackTokens(user_id, 'smart-interview-continue', message.usage?.input_tokens, message.usage?.output_tokens);

    const text = message.content[0].text
      .replace(/```json/g, '').replace(/```/g, '').trim();
    
    console.log('Claude response:', text);
    
    let result;
    try {
      result = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error in smart-interview continue:', parseError);
      console.error('Raw text:', text);
      
      // Fallback response
      result = {
        question: "Can you tell me more about your experience with this type of work?",
        score: 5,
        was_specific: false,
        had_examples: false,
        filler_words: [],
        quick_feedback: "Answer needs more detail",
        interview_complete: false
      };
    }
    
    console.log('Next question:', result.question);
    
    return Response.json(result);
  }

  // ACTION 3: Final evaluation with placement chance
  if (action === 'evaluate') {
    const historyText = conversation_history.map((h, i) =>
      `Q${i+1}: ${h.question}\nA${i+1}: ${h.answer}\nScore: ${h.score || 'N/A'}`
    ).join('\n\n');

    const prompt = `You are an encouraging and supportive interviewer evaluating a FRESHER candidate.

IMPORTANT: Most candidates are FRESHERS with little to no experience. Be LENIENT, encouraging, and focus on POTENTIAL not perfection.

Job Role: ${job_role}
Round: ${round}

Interview History:
${historyText}

SCORING GUIDELINES (BE GENEROUS):
- Give 6-7/10 for average answers (this is GOOD for a fresher)
- Give 8-9/10 for clear, thoughtful answers
- Give 10/10 only for exceptional answers
- Placement chance: Start at 60% and increase based on effort, clarity, and potential
- Even if answers are basic, if the candidate shows interest and effort, give them 50-60%
- Only give below 40% if answers are completely irrelevant or show zero effort

Provide a DETAILED evaluation in JSON format:
{
  "placement_chance": 50-85 (be generous, most freshers deserve 60-75%),
  "verdict": "Strong Hire / Hire / Strong Maybe / Weak Maybe / Not Hire",
  "overall_score": 5-9 (be generous, give 6-7 for average performance),
  "summary": {
    "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
    "weaknesses": ["specific weakness 1", "specific weakness 2"],
    "key_takeaways": "2-3 sentence encouraging summary of overall performance"
  },
  "scores": {
    "communication": 5-9,
    "technical_knowledge": 5-9,
    "resume_jd_fit": 5-9,
    "confidence": 5-9,
    "answer_quality": 5-9,
    "problem_solving": 5-9
  },
  "question_analysis": [
    {
      "question_number": 1,
      "question": "the question asked",
      "answer_quality": "detailed evaluation of the answer",
      "score": 5-9,
      "what_did_well": ["specific thing done well"],
      "what_to_improve": ["specific improvement needed"]
    }
  ],
  "actionable_feedback": {
    "immediate_steps": ["step 1", "step 2", "step 3"],
    "resources": ["resource 1", "resource 2"],
    "practice_areas": ["area 1", "area 2"]
  },
  "career_insights": {
    "market_fit": "High/Medium/Low",
    "salary_range": "estimated range in Indian Rupees (₹) for fresher level",
    "growth_potential": "High/Medium/Low",
    "recommended_roles": ["role 1", "role 2"]
  }
}

Return ONLY the JSON, no other text. Be ENCOURAGING, focus on POTENTIAL, and be GENEROUS with scores for freshers. Use Indian Rupees (₹) for salary range.`;

    console.log('📝 Prompt length:', prompt.length);
    console.log('📝 History length:', historyText.length);
    console.log('📝 Number of Q&A pairs:', conversation_history.length);

    if (prompt.length > 15000) {
      console.error('⚠️ Prompt too long, truncating...');
      // Truncate history if too long
      const truncatedHistory = historyText.substring(0, 8000);
      const truncatedPrompt = prompt.replace(historyText, truncatedHistory);
      console.log('📝 Truncated prompt length:', truncatedPrompt.length);
    }

    const message = await retryClaudeCall(() =>
      client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    );

    // Track token usage
    await trackTokens(user_id, 'smart-interview-evaluate', message.usage?.input_tokens, message.usage?.output_tokens);

    console.log('✅ Claude API call successful');
    console.log('Raw Claude response:', message.content[0].text);
    
    const text = message.content[0].text
      .replace(/```json/g, '').replace(/```/g, '').trim();
    
    console.log('Cleaned text:', text);
    console.log('Text length:', text.length);
    
    if (!text || text.length === 0) {
      console.error('❌ Empty response from Claude - API call succeeded but no content');
      console.error('This might be due to:');
      console.error('1. Prompt too long');

      console.error('2. API rate limiting');
      console.error('3. Model content filtering');
      return Response.json({
        placement_chance: 65,
        verdict: "Hire",
        overall_score: 7,
        scores: {
          communication: 7,
          technical_knowledge: 7,
          resume_jd_fit: 7,
          confidence: 7,
          answer_quality: 7,
          problem_solving: 7
        },
        summary: {
          strengths: ["Completed the interview", "Showed interest and effort"],
          weaknesses: ["Analysis temporarily unavailable"],
          key_takeaways: "Good effort shown. AI analysis temporarily unavailable."
        },
        question_analysis: [],
        actionable_feedback: {
          immediate_steps: ["Try again for detailed analysis"],
          resources: [],
          practice_areas: []
        },
        career_insights: {
          market_fit: "Medium",
          salary_range: "₹3-6 LPA (Entry level)",
          growth_potential: "High",
          recommended_roles: [job_role]
        },
        interviewer_notes: "AI analysis temporarily unavailable - please try again"
      });
    }
    
    try {
      const parsed = JSON.parse(text);
      console.log('Successfully parsed JSON:', parsed);
      return Response.json(parsed);
    } catch (parseError) {
      console.error('JSON parse error in smart-interview evaluate:', parseError);
      console.error('Raw text that failed to parse:', text);
      
      // Try to extract JSON manually
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const manualParsed = JSON.parse(jsonMatch[0]);
          console.log('Successfully parsed with manual extraction:', manualParsed);
          return Response.json(manualParsed);
        } catch (manualError) {
          console.error('Manual parsing also failed:', manualError);
        }
      }
      
      // Fallback response (lenient for freshers)
      return Response.json({
        placement_chance: 65,
        verdict: "Hire",
        overall_score: 7,
        scores: {
          communication: 7,
          technical_knowledge: 7,
          resume_jd_fit: 7,
          confidence: 7,
          answer_quality: 7,
          problem_solving: 7
        },
        summary: {
          strengths: ["Completed the interview", "Showed interest and effort"],
          weaknesses: ["Analysis temporarily unavailable"],
          key_takeaways: "Good effort shown. AI analysis temporarily unavailable."
        },
        question_analysis: [],
        actionable_feedback: {
          immediate_steps: ["Try again for detailed analysis"],
          resources: [],
          practice_areas: []
        },
        career_insights: {
          market_fit: "Medium",
          salary_range: "₹3-6 LPA (Entry level)",
          growth_potential: "High",
          recommended_roles: [job_role]
        },
        interviewer_notes: "AI analysis temporarily unavailable - please try again"
      });
    }
  }

  return Response.json({ error: 'Invalid action' }, 
    { status: 400 });
}
