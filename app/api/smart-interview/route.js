import Anthropic from '@anthropic-ai/sdk';
import { adminDb, trackTokens } from '@/lib/firebase-admin';





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
    const prompt = `You are a strict senior interviewer at a company hiring for: ${job_role}

You have the candidate's resume. Read it VERY carefully before asking anything.

JOB DESCRIPTION:
${jd}

ROUND: ${round}

CRITICAL INSTRUCTIONS:
1. Read every detail of the resume
2. Note specific projects, technologies, companies, achievements mentioned
3. Your first question MUST reference something SPECIFIC from their resume
4. Do NOT ask generic questions like "tell me about yourself" first
5. Pick the most interesting/relevant project or experience and probe it
6. Match the question to the JD requirements

For example:
- If resume mentions a specific project → ask about that specific project
- If resume mentions an internship → ask about what they built there
- If resume mentions a competition win → ask about their strategy

Rules:
- Ask ONE question only
- Sound like a real interviewer, professional but direct
- Do NOT say "Great resume!" or give compliments

Return ONLY valid JSON:
{
  "question": "Specific question referencing something from their ACTUAL resume",
  "interviewer_thought": "What I noticed in resume that led to this question (shown to student as context)",
  "resume_highlights": [
    "key thing 1 from resume",
    "key thing 2 from resume"
  ],
  "interview_plan": [
    "Topic 1 to cover",
    "Topic 2 to cover",
    "Topic 3 to cover"
  ]
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
      `Exchange ${i+1}:\nInterviewer: ${h.question}\nCandidate: ${h.answer}\nWas answered: ${(h.answer?.length || 0) > 20 ? 'YES' : 'NO'}`
    ).join('\n\n');

    const topicsCovered = conversation_history.map((h, i) => `${i+1}. ${(h.question || '').substring(0, 60)}`).join(', ');

    console.log('History text preview:', historyText.substring(0, 200) + '...');

    const isClarificationRequest = (last_answer || '').startsWith('[Clarification needed]:');

    const prompt = `You are a senior interviewer conducting a ${round} for: ${job_role}

CONVERSATION RULES:
1. If candidate asks for clarification → explain the question clearly in simple terms, then re-ask it
2. If candidate goes off-topic → gently bring back to the question
3. If candidate's answer is incomplete (< 20 words) → ask a follow-up on the same topic
4. NEVER repeat the exact same question if candidate has answered it
5. Allow natural back-and-forth conversation
6. Keep tone natural, human-like — say "Got it", "Makes sense", "Interesting" occasionally

Current question number: ${conversation_history.length + 1} of 10
Has candidate answered this question: ${(last_answer?.length || 0) > 20 ? 'YES — move to next topic' : 'NO — probe deeper or re-ask'}
Is clarification request: ${isClarificationRequest ? 'YES — clarify then re-ask' : 'NO'}

Job Role: ${job_role}
Round: ${round}

IMPORTANT — Previous conversation:
${historyText}

Topics already covered:
${topicsCovered}

DO NOT ask about any topic already covered above. Move to a NEW topic.

Latest answer from candidate:
"${last_answer}"

${conversation_history.length >= 9 ? 'CRITICAL: This is the LAST question. Set "interview_complete": true.' : ''}

Your task:
1. If clarification requested → clarify and re-ask same question naturally
2. If answer was substantial (> 20 words) → evaluate and move to NEW topic
3. If answer was too short → probe deeper on same topic
4. Keep adaptive difficulty: struggling candidate gets simpler questions, strong candidate gets harder ones

Return ONLY valid JSON:
{
  "question": "Your next question or clarification",
  "interviewer_thought": "Why you are asking this (shown to student as helpful context)",
  "answer_evaluation": {
    "score": 5,
    "was_specific": true,
    "had_examples": false,
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
      `Q${i+1}: ${h.question}\nA${i+1}: ${h.answer}`
    ).join('\n\n');

    const prompt = `You are a fair and intelligent hiring manager evaluating a fresher candidate.

Evaluate ONLY based on:
1. What was RELEVANT to their role and JD
2. What they ACTUALLY discussed
3. Their communication and thinking quality

CRITICAL FAIRNESS RULES:
- Do NOT penalize for skills not mentioned in their resume
- Do NOT penalize for tools not required by the JD
- Only evaluate against the JD requirements listed below
- Judge answer quality based on the specific question asked
- A clear answer to the right question beats a buzzword-filled wrong answer
- Most candidates are freshers — be lenient and encouraging, focus on POTENTIAL

SCORING GUIDELINES:
- 6-7/10 for average answers (good for a fresher)
- 8-9/10 for clear, thoughtful answers
- Placement chance: start at 60%, increase for effort, clarity, potential
- Only go below 40% if answers show zero effort or are completely irrelevant

Job Role: ${job_role}
Round: ${round}

JD Requirements:
${jd}

Full Interview Transcript:
${historyText}

When evaluating, first check: what does THIS specific JD require?
Then evaluate if the candidate demonstrated those specific requirements.

Provide evaluation in JSON format:
{
  "placement_chance": 60,
  "verdict": "Strong Hire / Hire / Strong Maybe / Weak Maybe / Not Hire",
  "overall_score": 7,
  "summary": {
    "strengths": ["specific strength from actual answers", "strength 2", "strength 3"],
    "weaknesses": ["only gaps relevant to this specific JD"],
    "key_takeaways": "2-3 sentence encouraging summary"
  },
  "scores": {
    "communication": 7,
    "technical_knowledge": 7,
    "resume_jd_fit": 7,
    "confidence": 7,
    "answer_quality": 7,
    "problem_solving": 7
  },
  "what_impressed": ["specific good thing from actual answers"],
  "genuine_gaps": ["only gaps RELEVANT to this specific JD — nothing else"],
  "fair_assessment": "honest paragraph based only on what was discussed and what the JD requires",
  "improvement_areas": ["relevant to THIS role only"],
  "interviewer_notes": "what interviewer would actually write — fair and specific",
  "question_analysis": [
    {
      "question_number": 1,
      "question": "the question asked",
      "answer_quality": "detailed evaluation of the answer",
      "score": 7,
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

Return ONLY the JSON, no other text. Be FAIR and ENCOURAGING. Only penalize for gaps relevant to THIS JD. Focus on POTENTIAL. Use Indian Rupees (₹) for salary range.`;

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
