import Anthropic from '@anthropic-ai/sdk';

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
    round, conversation_history, last_answer } = body;

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
      // Clean and validate base64 data
      const cleanBase64 = resume_base64
        .replace(/^data:application\/pdf;base64,/, '') // Remove data URL prefix if present
        .replace(/\s/g, '') // Remove whitespace
        .replace(/[^A-Za-z0-9+/=]/g, ''); // Remove non-base64 characters
      
      if (!cleanBase64 || cleanBase64.length < 100) {
        console.error('Invalid base64 data detected');
        return Response.json({ error: 'Invalid resume data provided' }, { status: 400 });
      }
      
      console.log('Base64 data length after cleaning:', cleanBase64.length);
      
      // Handle PDF resume
      message = await retryClaudeCall(() => 
        client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: cleanBase64
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
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

    const prompt = `You are a strict senior interviewer.
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
1. Evaluate the last answer critically
2. Decide next question strategy:
   - If answer was vague → dig deeper on same topic
   - If answer mentioned something interesting → follow up on it
   - If answer was weak → note it, move to next topic
   - If answer was strong → acknowledge briefly, probe harder
3. Ask the next question OR end the interview if we've reached 10 questions

Rules:
- ONE question only
- Dynamic - based on what they just said
- If they mentioned a project, ask technical details
- If they mentioned a number/achievement, verify it
- Sound like a real interviewer
- After question 9, set "interview_complete": true and provide NO question
- NEVER repeat a previous question

Return ONLY valid JSON:
{
  "question": "Your next question",
  "answer_evaluation": {
    "score": (1-10, be strict),
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

    const prompt = `You are a fair and balanced senior hiring manager evaluating a candidate.
Job Role: ${job_role}
Round: ${round}

Resume:
${resume_text}

Job Description:
${jd}

Complete Interview Transcript:
${historyText}

Provide a comprehensive and FAIR evaluation. Be honest but constructive.
Consider: answer quality, communication, resume fit, technical accuracy, confidence, specific examples given.

IMPORTANT SCORING GUIDELINES:
- Score 1-3: Very poor, major red flags
- Score 4-5: Below expectations, needs significant improvement
- Score 6-7: Meets basic expectations, acceptable performance
- Score 8-9: Good performance, above average
- Score 10: Exceptional, outstanding performance

Most candidates should score in the 5-8 range. Reserve 1-3 for truly poor responses and 9-10 for exceptional ones.

Return ONLY valid JSON:
{
  "placement_chance": (0-100, be realistic:
    0-20: Major concerns, not suitable,
    21-40: Significant gaps, unlikely to proceed,
    41-60: Mixed performance, borderline,
    61-75: Decent candidate, could proceed,
    76-85: Good candidate, likely to proceed,
    86-95: Strong candidate, highly recommended,
    96-100: Exceptional - top tier),
  "verdict": "Selected/Strong Maybe/Weak Maybe/Rejected",
  "overall_score": (1-10, be fair and balanced),
  "scores": {
    "communication": (1-10, how clearly they expressed ideas),
    "technical_knowledge": (1-10, depth of technical understanding),
    "resume_jd_fit": (1-10, how well their background matches the role),
    "confidence": (1-10, their self-assurance and composure),
    "answer_quality": (1-10, thoroughness and relevance of answers)
  },
  "best_answer": {
    "question": "question they answered best",
    "why": "specific reasons why this answer stood out"
  },
  "worst_answer": {
    "question": "question they answered worst",
    "why": "specific areas for improvement"
  },
  "filler_words_summary": "Overall assessment of verbal clarity and filler word usage",
  "strengths": [
    "specific strength with example from interview",
    "specific strength with example from interview",
    "specific strength with example from interview"
  ],
  "weaknesses": [
    "specific weakness with example from interview",
    "specific weakness with example from interview"
  ],
  "improvement_roadmap": [
    "Specific action item 1 to improve before next interview",
    "Specific action item 2 to improve",
    "Specific action item 3 to improve"
  ],
  "interviewer_notes": "What the interviewer would write 
    about this candidate internally - be honest",
  "should_hire": true/false,
  "hire_reasoning": "Honest one paragraph hiring decision"
}`;

    const message = await retryClaudeCall(() =>
      client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    );

    const text = message.content[0].text
      .replace(/```json/g, '').replace(/```/g, '').trim();
    
    console.log('Raw Claude response:', message.content[0].text);
    console.log('Cleaned text:', text);
    console.log('Text length:', text.length);
    
    if (!text || text.length === 0) {
      console.error('Empty response from Claude');
      return Response.json({
        placement_chance: 50,
        verdict: "Weak Maybe",
        overall_score: 5,
        scores: {
          communication: 5,
          technical_knowledge: 5,
          resume_jd_fit: 5,
          confidence: 5,
          answer_quality: 5
        },
        best_answer: {
          question: "No specific answer available",
          why: "AI analysis temporarily unavailable"
        },
        worst_answer: {
          question: "No specific answer available", 
          why: "AI analysis temporarily unavailable"
        },
        filler_words_summary: "Analysis temporarily unavailable",
        strengths: ["Answer provided"],
        weaknesses: ["Needs more details"],
        improvement_roadmap: ["Practice more interviews", "Improve technical knowledge", "Work on communication"],
        interviewer_notes: "AI analysis temporarily unavailable - please try again",
        should_hire: false,
        hire_reasoning: "Unable to complete full analysis due to technical issues. Please retry."
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
      
      // Fallback response
      return Response.json({
        placement_chance: 50,
        verdict: "Weak Maybe",
        overall_score: 5,
        scores: {
          communication: 5,
          technical_knowledge: 5,
          resume_jd_fit: 5,
          confidence: 5,
          answer_quality: 5
        },
        best_answer: {
          question: "No specific answer available",
          why: "AI analysis temporarily unavailable"
        },
        worst_answer: {
          question: "No specific answer available",
          why: "AI analysis temporarily unavailable"
        },
        filler_words_summary: "Analysis temporarily unavailable",
        strengths: ["Answer provided"],
        weaknesses: ["Needs more details"],
        improvement_roadmap: ["Practice more interviews", "Improve technical knowledge", "Work on communication"],
        interviewer_notes: "AI analysis temporarily unavailable - please try again",
        should_hire: false,
        hire_reasoning: "Unable to complete full analysis due to technical issues. Please retry."
      });
    }
  }

  return Response.json({ error: 'Invalid action' }, 
    { status: 400 });
}
