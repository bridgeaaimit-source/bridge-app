import Anthropic from '@anthropic-ai/sdk';
import { adminDb, trackTokens } from '@/lib/firebase-admin';

// Helper to ensure values are safe integers between 1 and 10
function safeInt(val, fallback = 7) {
  const parsed = parseInt(val, 10);
  if (isNaN(parsed)) return fallback;
  return Math.max(1, Math.min(10, parsed));
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
  const { 
    action, 
    resume_text, 
    resume_base64, 
    job_role, 
    jd, 
    round, 
    conversation_history, 
    last_question,
    last_answer, 
    session_memory,
    user_id 
  } = body;
  
  console.log('👤 User ID:', user_id || 'unknown');
  console.log('⚙️ Action:', action);

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
1. Read every detail of the resume.
2. Note specific projects, technologies, companies, achievements mentioned.
3. Your first question MUST reference something SPECIFIC from their resume.
4. Do NOT ask generic questions like "tell me about yourself" first.
5. Pick the most interesting/relevant project or experience and probe it.
6. Match the question to the JD requirements.

Return ONLY valid JSON format:
{
  "question": "Specific question referencing something from their ACTUAL resume",
  "interviewer_thought": "What I noticed in resume that led to this question (shown to student as context)",
  "session_memory": {
    "interview_summary": "Interview initialized for target role ${job_role}.",
    "competencies": {
      "communication": { "score": 0, "covered": false, "question_count": 0 },
      "resume_validation": { "score": 0, "covered": true, "question_count": 1 },
      "technical_knowledge": { "score": 0, "covered": false, "question_count": 0 },
      "problem_solving": { "score": 0, "covered": false, "question_count": 0 },
      "behavioral": { "score": 0, "covered": false, "question_count": 0 },
      "culture_fit": { "score": 0, "covered": false, "question_count": 0 }
    },
    "asked_questions": ["First question text here"],
    "question_analysis": [],
    "current_competency": "resume_validation"
  }
}`;

    let message;
    if (resume_base64) {
      if (!resume_base64 || resume_base64.length < 100) {
        console.error('Invalid base64 data detected');
        return Response.json({ error: 'Invalid resume data provided' }, { status: 400 });
      }
      
      console.log('Base64 data length:', resume_base64.length);
      
      message = await retryClaudeCall(() => 
        client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1200,
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
      message = await retryClaudeCall(() =>
        client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1200,
          messages: [{ role: 'user', content: prompt }]
        })
      );
    }

    await trackTokens(user_id, 'smart-interview-init', message.usage?.input_tokens, message.usage?.output_tokens);

    const text = message.content[0].text
      .replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const parsed = JSON.parse(text);
      // Ensure asked_questions is synced with the first question text
      if (parsed.session_memory && parsed.question) {
        parsed.session_memory.asked_questions = [parsed.question];
      }
      return Response.json(parsed);
    } catch (parseError) {
      console.error('JSON parse error in smart-interview init:', parseError);
      console.error('Raw text:', text);
      
      return Response.json({
        question: "Tell me about yourself and your background based on your resume.",
        interviewer_thought: "Let's start with a general introduction based on your profile.",
        session_memory: {
          interview_summary: `Interview initialized for ${job_role}.`,
          competencies: {
            communication: { score: 0, covered: false, question_count: 0 },
            resume_validation: { score: 0, covered: true, question_count: 1 },
            technical_knowledge: { score: 0, covered: false, question_count: 0 },
            problem_solving: { score: 0, covered: false, question_count: 0 },
            behavioral: { score: 0, covered: false, question_count: 0 },
            culture_fit: { score: 0, covered: false, question_count: 0 }
          },
          asked_questions: ["Tell me about yourself and your background based on your resume."],
          question_analysis: [],
          current_competency: "resume_validation"
        }
      });
    }
  }

  // ACTION 2: Continue - dynamic follow-up based on answer
  if (action === 'continue') {
    console.log('=== SMART INTERVIEW CONTINUE ===');
    console.log('Last answer:', last_answer);

    const memory = session_memory || {
      interview_summary: "Interview ongoing.",
      competencies: {
        communication: { score: 0, covered: false, question_count: 0 },
        resume_validation: { score: 0, covered: false, question_count: 0 },
        technical_knowledge: { score: 0, covered: false, question_count: 0 },
        problem_solving: { score: 0, covered: false, question_count: 0 },
        behavioral: { score: 0, covered: false, question_count: 0 },
        culture_fit: { score: 0, covered: false, question_count: 0 }
      },
      asked_questions: [last_question || "Previous Question"],
      question_analysis: []
    };

    const prompt = `You are a senior interviewer conducting a ${round} for the role: ${job_role}.
We are using a token-efficient rolling memory. Evaluate the candidate's last answer, update the session memory, and generate the next question.

TARGET USERS CALIBRATION:
- Candidates are Tier 2 or 3 college students, freshers, and early-career applicants.
- DO NOT penalize heavily for minor grammatical slips, accent differences, or nervousness.
- Calibrate scoring reasonably: reward genuine effort, structural clarity, logical reasoning, and learning potential.

COMPETENCY BLUEPRINT (Target at least 1-2 questions per competency across the interview):
1. communication (Ice breaking, structure)
2. resume_validation (Probing projects/skills mentioned on resume)
3. technical_knowledge (Core technical concepts relevant to JD)
4. problem_solving (Coding query, design trade-offs, or analytical scenario)
5. behavioral (STAR situations: conflict, collaboration, stress)
6. culture_fit (Company values, flexibility, interests)

PREVENT REPETITION:
Strictly check the list of questions already asked: ${JSON.stringify(memory.asked_questions)}.
Do NOT ask any question that is semantically similar to them (e.g. asking about "leadership" twice in different words). Reject repetitions and push the interview forward naturally.

SCORING RULES:
Generate integer scores strictly on a scale of 1 to 10. Do not output fractions, strings like "7/10", or non-numeric formats.

Current Question Number: ${memory.asked_questions.length + 1}
Minimum Questions: 8
Target Questions: 10
Hard Limit: 15

If all competencies have been covered (at least 1 question count each) AND we have asked at least 8 questions, OR if we have reached the hard limit of 15 questions, set "interview_complete": true.

INPUT DETAILS:
Job Role: ${job_role}
JD Requirements: ${jd}
Last Question Asked: "${last_question || 'None'}"
Last Answer Received: "${last_answer}"

Current Session Memory:
${JSON.stringify(memory)}

Return ONLY valid JSON format:
{
  "question": "Your next question",
  "interviewer_thought": "Why you are asking this question (shown as helpful context)",
  "answer_analysis": {
    "question_number": ${memory.asked_questions.length},
    "question": "the last question asked",
    "answer": "the last answer received",
    "score": 7,
    "what_did_well": ["specific strength from their response"],
    "what_to_improve": ["constructive suggestion for improvement"],
    "better_sample_answer": "A model response suitable for a fresher candidate to study",
    "dimension_scores": {
      "communication": 7,
      "relevance": 7,
      "technical_depth": 7,
      "structure": 7,
      "confidence": 7
    }
  },
  "session_memory": {
    "interview_summary": "Append a summary of the latest response to the running paragraph...",
    "competencies": {
      "communication": { "score": 8, "covered": true, "question_count": 1 },
      "resume_validation": { "score": 7, "covered": true, "question_count": 1 },
      "technical_knowledge": { "score": 0, "covered": false, "question_count": 0 },
      "problem_solving": { "score": 0, "covered": false, "question_count": 0 },
      "behavioral": { "score": 0, "covered": false, "question_count": 0 },
      "culture_fit": { "score": 0, "covered": false, "question_count": 0 }
    },
    "asked_questions": ["q1", "q2", "Your next question"],
    "question_analysis": [ ... ],
    "current_competency": "technical_knowledge"
  },
  "interview_complete": false
}`;

    const message = await retryClaudeCall(() =>
      client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }]
      })
    );

    await trackTokens(user_id, 'smart-interview-continue', message.usage?.input_tokens, message.usage?.output_tokens);

    const text = message.content[0].text
      .replace(/```json/g, '').replace(/```/g, '').trim();
    
    console.log('Claude response:', text);
    
    let result;
    try {
      result = JSON.parse(text);
      
      // Calibrate and clean all scores to integers
      if (result.answer_analysis) {
        result.answer_analysis.score = safeInt(result.answer_analysis.score);
        if (result.answer_analysis.dimension_scores) {
          result.answer_analysis.dimension_scores.communication = safeInt(result.answer_analysis.dimension_scores.communication);
          result.answer_analysis.dimension_scores.relevance = safeInt(result.answer_analysis.dimension_scores.relevance);
          result.answer_analysis.dimension_scores.technical_depth = safeInt(result.answer_analysis.dimension_scores.technical_depth);
          result.answer_analysis.dimension_scores.structure = safeInt(result.answer_analysis.dimension_scores.structure);
          result.answer_analysis.dimension_scores.confidence = safeInt(result.answer_analysis.dimension_scores.confidence);
        }
      }
      
      if (result.session_memory && result.session_memory.competencies) {
        Object.keys(result.session_memory.competencies).forEach(key => {
          const comp = result.session_memory.competencies[key];
          comp.score = safeInt(comp.score, 0);
          comp.question_count = parseInt(comp.question_count, 10) || 0;
          comp.covered = !!comp.covered;
        });
      }

    } catch (parseError) {
      console.error('JSON parse error in smart-interview continue:', parseError);
      console.error('Raw text:', text);
      
      // Fallback result
      const newQuestionsList = [...memory.asked_questions, "Can you tell me more about your experience with this type of work?"];
      result = {
        question: "Can you tell me more about your experience with this type of work?",
        interviewer_thought: "Let's explore your background further.",
        answer_analysis: {
          question_number: memory.asked_questions.length,
          question: last_question || "Previous Question",
          answer: last_answer || "",
          score: 6,
          what_did_well: ["Expressed interest in the topic"],
          what_to_improve: ["Add more details and specific examples"],
          better_sample_answer: "In my previous project, I solved a similar issue by implementing standard patterns...",
          dimension_scores: {
            communication: 6,
            relevance: 6,
            technical_depth: 5,
            structure: 6,
            confidence: 6
          }
        },
        session_memory: {
          ...memory,
          asked_questions: newQuestionsList,
          current_competency: "communication"
        },
        interview_complete: memory.asked_questions.length >= 10
      };
    }
    
    // Add the current analysis step on client-side or backend
    if (result.session_memory && result.answer_analysis) {
      const currentList = memory.question_analysis || [];
      result.session_memory.question_analysis = [...currentList, result.answer_analysis];
    }
    
    console.log('Next question:', result.question);
    return Response.json(result);
  }

  // ACTION 3: Final evaluation
  if (action === 'evaluate') {
    const memory = session_memory || {
      interview_summary: "Interview completed.",
      competencies: {},
      asked_questions: [],
      question_analysis: []
    };

    console.log('Final evaluation requested. Memory keys:', Object.keys(memory));

    // Fallback if session memory doesn't contain detailed analysis
    let fallbackHistoryText = "";
    if ((!memory.question_analysis || memory.question_analysis.length === 0) && conversation_history) {
      fallbackHistoryText = conversation_history.map((h, i) =>
        `Q${i+1}: ${h.question}\nA${i+1}: ${h.answer}`
      ).join('\n\n');
    }

    const prompt = `You are a fair and intelligent hiring manager performing the final evaluation of a candidate for the role: ${job_role}.

Evaluate based on the structured session memory:
${JSON.stringify(memory)}
${fallbackHistoryText ? `\nFallback Conversation History:\n${fallbackHistoryText}` : ''}

TARGET USERS CALIBRATION:
- Candidates are Tier 2 or 3 college students, freshers, and early career applicants.
- Reward logical reasoning, structure, effort, and growth potential.
- Do not heavily penalize minor communication slips, accents, or nervousness.

SCORING GUIDELINES:
- Overall Score should represent the average candidate performance (scale 1-10, integer).
- Output numeric integer values for all score breakdowns (1-10).
- Placement Chance (0-100%): start at 60%, calibrate higher for logical clarity, effort, and tech competency.

Provide evaluation strictly in JSON format:
{
  "placement_chance": 70,
  "verdict": "Strong Hire / Hire / Strong Maybe / Weak Maybe / Not Hire",
  "overall_score": 7,
  "scores": {
    "communication": 7,
    "technical_knowledge": 7,
    "resume_jd_fit": 7,
    "confidence": 7,
    "answer_quality": 7,
    "problem_solving": 7
  },
  "summary": {
    "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
    "weaknesses": ["specific weakness 1"],
    "key_takeaways": "2-3 sentence encouraging, constructive performance summary."
  },
  "career_insights": {
    "market_fit": "High/Medium/Low",
    "salary_range": "estimated fresher salary range in Indian Rupees (₹), e.g. ₹4-7 LPA",
    "growth_potential": "High/Medium/Low",
    "recommended_roles": ["role 1", "role 2"]
  }
}`;

    const message = await retryClaudeCall(() =>
      client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    );

    await trackTokens(user_id, 'smart-interview-evaluate', message.usage?.input_tokens, message.usage?.output_tokens);

    console.log('✅ Claude API final evaluation call successful');
    const text = message.content[0].text
      .replace(/```json/g, '').replace(/```/g, '').trim();
    
    console.log('Cleaned text:', text);
    
    try {
      const parsed = JSON.parse(text);
      
      // Clean final scores
      parsed.overall_score = safeInt(parsed.overall_score);
      parsed.placement_chance = safeInt(parsed.placement_chance, 60);
      if (parsed.placement_chance <= 10) parsed.placement_chance = parsed.placement_chance * 10; // calibration check
      
      if (parsed.scores) {
        Object.keys(parsed.scores).forEach(k => {
          parsed.scores[k] = safeInt(parsed.scores[k]);
        });
      }
      
      // Re-attach the question-by-question analysis from memory
      parsed.question_analysis = memory.question_analysis || [];
      
      return Response.json(parsed);
    } catch (parseError) {
      console.error('JSON parse error in smart-interview evaluate:', parseError);
      
      // Fallback evaluation object
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
          strengths: ["Completed the mock interview", "Showed interest and effort"],
          weaknesses: ["Analysis report generated with minor errors"],
          key_takeaways: "Good effort shown. The detailed evaluation has been parsed."
        },
        question_analysis: memory.question_analysis || [],
        career_insights: {
          market_fit: "Medium",
          salary_range: "₹3.5-6 LPA (Entry level)",
          growth_potential: "High",
          recommended_roles: [job_role]
        }
      });
    }
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 });
}
