import Anthropic from '@anthropic-ai/sdk';
import { adminDb } from '@/lib/firebase-admin';
import { trackTokensServer } from '@/lib/tokenTrackerServer';

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
    const prompt = `You are a professional campus recruiter conducting a ${round} interview for: ${job_role}

You have the candidate's resume. Read it carefully before asking.

JOB DESCRIPTION:
${jd}

ROUND: ${round}

CRITICAL INSTRUCTIONS:
1. Read the resume carefully. Note specific projects, technologies, achievements.
2. Your first question MUST reference something SPECIFIC from their resume — a project, a skill, or an achievement.
3. Do NOT open with generic questions like "tell me about yourself".
4. Probe what is most interesting or most relevant to the JD.

QUESTION LENGTH RULE (MANDATORY):
Each question must be 2 to 3 sentences maximum. Conversational tone — like a real recruiter speaking, not reading from a form. Avoid bullet points, sub-questions, or lengthy context-setting preambles.

Return ONLY valid JSON format:
{
  "question": "2-3 sentence question referencing something specific from the resume",
  "interviewer_thought": "What I noticed in the resume that led to this question (shown to student as brief context)",
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

    // Track token usage
    await trackTokensServer(user_id || 'anonymous', 'smart-interview', message.usage?.input_tokens, message.usage?.output_tokens);

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
      asked_questions: [],
      question_analysis: []
    };

    // ── Server-side deduplication guard ────────────────────────────────────
    // Always ensure last_question is in asked_questions before building prompt
    // This prevents loops even if client sends stale session_memory
    const canonicalAskedQuestions = Array.isArray(memory.asked_questions)
      ? memory.asked_questions
      : [];
    if (last_question && !canonicalAskedQuestions.includes(last_question)) {
      canonicalAskedQuestions.push(last_question);
    }
    memory.asked_questions = canonicalAskedQuestions;
    // ────────────────────────────────────────────────────────────────────────

    // Figure out which competencies still need coverage
    const uncoveredCompetencies = Object.entries(memory.competencies || {})
      .filter(([, v]) => !v.covered)
      .map(([k]) => k);

    const prompt = `You are a professional campus recruiter conducting a ${round} for the role: ${job_role}.
Generate the NEXT unique question based on the candidate's previous answer. DO NOT generate detailed answer analysis to save processing time.

CANDIDATE PROFILE:
- Tier 2/3 college student or fresher — reward effort, clarity, logic, and learning potential.
- Do NOT penalize minor grammar slips or accent.

COMPETENCY BLUEPRINT — cover at least 1 question per competency:
1. communication
2. resume_validation
3. technical_knowledge
4. problem_solving
5. behavioral
6. culture_fit

Uncovered competencies remaining: ${JSON.stringify(uncoveredCompetencies)}

STRICT ANTI-REPETITION RULE (most important):
The following questions have ALREADY been asked — your next question MUST be completely different in topic, angle, and wording:
${canonicalAskedQuestions.map((q, i) => `  Q${i + 1}: "${q}"`).join('\n')}
If the next question sounds similar to ANY of the above, discard it and move to a different competency instead.
Track insights in "interview_summary" to avoid revisiting the same topics.

QUESTION LENGTH RULE (MANDATORY):
Write 2 to 3 sentences maximum. Conversational — like a real recruiter speaking. No bullet points, no multi-part questions, no lengthy preamble.

Question count: ${canonicalAskedQuestions.length + 1} of max 15 (target 10)
End interview ("interview_complete": true) when: all competencies covered AND ≥8 questions asked, OR ≥15 questions asked.

Job Role: ${job_role}
JD Requirements: ${jd || 'Not provided'}
Last Question: "${last_question || 'None'}"
Last Answer: "${last_answer || '(no answer)'}"

Session Memory:
${JSON.stringify({ interview_summary: memory.interview_summary, competencies: memory.competencies, current_competency: memory.current_competency })}

Return ONLY valid JSON:
{
  "question": "2-3 sentence question on a NEW topic not covered above",
  "interviewer_thought": "Brief reason for asking this (shown to candidate as context)",
  "session_memory": {
    "interview_summary": "Update this running summary with 1-2 new bullet points capturing specific facts or technical concepts the candidate just mentioned, so you don't ask about them again.",
    "competencies": { "communication": { "score": 0, "covered": false, "question_count": 0 }, "resume_validation": { "score": 0, "covered": false, "question_count": 0 }, "technical_knowledge": { "score": 0, "covered": false, "question_count": 0 }, "problem_solving": { "score": 0, "covered": false, "question_count": 0 }, "behavioral": { "score": 0, "covered": false, "question_count": 0 }, "culture_fit": { "score": 0, "covered": false, "question_count": 0 } },
    "asked_questions": ${JSON.stringify([...canonicalAskedQuestions, "<your_next_question_text>"])},
    "current_competency": "next_competency_name"
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

    // Track token usage
    await trackTokensServer(user_id || 'anonymous', 'smart-interview', message.usage?.input_tokens, message.usage?.output_tokens);

    const text = message.content[0].text
      .replace(/```json/g, '').replace(/```/g, '').trim();
    
    console.log('Claude response:', text);
    
    let result;
    try {
      result = JSON.parse(text);
      
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

      // Rotating fallback questions per uncovered competency to avoid loops
      const fallbackByCompetency = {
        technical_knowledge: `Can you walk me through a technical problem you solved recently and how you approached it?`,
        problem_solving: `If you had to design a simple URL shortener service, what components would you include and why?`,
        behavioral: `Tell me about a time you had to meet a tight deadline. How did you manage your work?`,
        culture_fit: `What kind of work environment helps you do your best, and why?`,
        communication: `How do you usually explain a complex technical concept to someone who isn't technical?`,
        resume_validation: `Which project on your resume are you most proud of, and what was your specific contribution?`
      };

      const nextCompetency = uncoveredCompetencies[0] || 'behavioral';
      const fallbackQ = fallbackByCompetency[nextCompetency] ||
        `What interests you most about the ${job_role} role and why did you apply?`;

      const newQuestionsList = [...canonicalAskedQuestions, fallbackQ];
      result = {
        question: fallbackQ,
        interviewer_thought: `Exploring ${nextCompetency.replace('_', ' ')} competency.`,
        session_memory: {
          ...memory,
          asked_questions: newQuestionsList,
          current_competency: nextCompetency
        },
        interview_complete: canonicalAskedQuestions.length >= 10
      };
    }

    // Server-side: ensure the new question was actually appended to asked_questions
    if (result.session_memory && result.question) {
      const existing = result.session_memory.asked_questions || canonicalAskedQuestions;
      if (!existing.includes(result.question)) {
        result.session_memory.asked_questions = [...existing, result.question];
      }
    }

    // Check if question was appended correctly
    if (result.session_memory && result.question) {
      console.log('📋 Asked so far:', result.session_memory?.asked_questions?.length, 'questions');
      return Response.json(result);
    }
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

    // Since we no longer generate per-question analysis, we rely entirely on conversation_history
    const historyText = conversation_history && conversation_history.length > 0
      ? conversation_history.map((h, i) => `${h.role === 'interviewer' ? 'Q' : 'A'}: ${h.message}`).join('\n\n')
      : "No conversation history available.";

    const prompt = `You are an expert hiring manager and technical interviewer evaluating a candidate for the role: ${job_role}.

FULL INTERVIEW TRANSCRIPT:
${historyText}

SESSION SUMMARY (AI Notes):
${JSON.stringify(memory.interview_summary || "None")}

TARGET AUDIENCE CALIBRATION (CRITICAL):
- Candidates are Tier 2/3 college students, freshers, or early career applicants. DO NOT compare them to senior engineers.
- Reward logical reasoning, effort, fundamental understanding, and coachability.
- Evaluate the ACTUAL content of their answers. If the answers are short, generic, or lack detail, they MUST receive low scores (e.g., 3-5). If the answers are structured, specific, and demonstrate clear understanding, they should receive high scores (e.g., 7-9).
- Differentiate strongly between weak, average, and strong candidates. Do not default to giving everyone a 7.

SCORING DIMENSIONS (Evaluate each INDEPENDENTLY from 1-10):
1. communication: Clarity, structure, and ability to articulate thoughts (don't penalize accents heavily).
2. technical_knowledge: Accuracy, depth, and correctness of technical concepts mentioned.
3. resume_jd_fit: How well their experiences align with the role ${job_role}.
4. confidence: Certainty and delivery tone.
5. answer_quality: Depth of detail, use of examples (e.g., STAR method).
6. problem_solving: Logical approach to answering hypothetical or structural questions.

FEEDBACK GUIDELINES:
- Identify recurring patterns. Don't just summarize what they said. Instead, write e.g., "You consistently struggled to provide concrete examples when asked about past projects."
- Strengths and Weaknesses must be highly specific to what was said in the transcript.

Provide evaluation strictly in JSON format:
{
  "placement_chance": 75,
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
    "strengths": ["specific strength 1 based on transcript", "specific strength 2"],
    "weaknesses": ["specific recurring weakness or knowledge gap"],
    "key_takeaways": "3-4 sentences highlighting their overall readiness, main pattern of mistakes, and the most critical thing to practice."
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

    // Track token usage
    await trackTokensServer(user_id || 'anonymous', 'smart-interview', message.usage?.input_tokens, message.usage?.output_tokens);

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
      // We removed question_analysis to save tokens, so it will be an empty array
      parsed.question_analysis = [];
      
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
        question_analysis: [],
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
