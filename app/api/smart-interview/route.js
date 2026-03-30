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
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: resume_base64
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

    const prompt = `You are evaluating a candidate interview.

Job Role: ${job_role}
Round: ${round}

Interview History:
${historyText}

Provide a simple evaluation in JSON format:
{
  "placement_chance": 75,
  "verdict": "Strong Maybe",
  "overall_score": 8,
  "scores": {
    "communication": 8,
    "technical_knowledge": 7,
    "resume_jd_fit": 8,
    "confidence": 7,
    "answer_quality": 8
  }
}

Return ONLY the JSON, no other text.`;

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
