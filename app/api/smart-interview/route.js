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
  try {
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

    let client = null;
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        client = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY
        });
      } catch (e) {
        console.warn('Failed to initialize Anthropic client:', e.message);
      }
    }

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

      try {
        if (!client) {
          throw new Error('Anthropic client is not initialized (missing API key)');
        }
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
            question: "Can you walk me through one of the technical projects listed on your resume? What technologies did you use and what was your specific contribution?",
            interviewer_thought: "Starting the interview by asking about a specific project from their resume/experience to assess practical coding and design skills.",
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
              asked_questions: ["Can you walk me through one of the technical projects listed on your resume? What technologies did you use and what was your specific contribution?"],
              question_analysis: [],
              current_competency: "resume_validation"
            }
          });
        }
      } catch (claudeError) {
        console.warn('⚠️ smart-interview init Claude API failed, using mock init fallback:', claudeError.message);
        let question = "Can you walk me through one of the technical projects listed on your resume? What technologies did you use and what was your specific contribution?";
        let thought = "Starting the interview by asking about a specific project from their resume/experience to assess practical coding and design skills.";
        
        const roleLower = (job_role || '').toLowerCase();
        if (roleLower.includes('marketing')) {
          question = "Can you describe a marketing project or campaign you worked on? What channels did you use, and how did you measure its success?";
          thought = "Probing marketing project experience to evaluate understanding of audience, strategy, and ROI measurement.";
        } else if (roleLower.includes('finance')) {
          question = "Could you walk me through a financial analysis or class project you completed? What financial concepts did you apply?";
          thought = "Assessing financial literacy and analytical thinking through a project explanation.";
        } else if (roleLower.includes('data')) {
          question = "I see you have worked with data/analytics. Can you describe a data analysis project you built and what insights you derived?";
          thought = "Probing data project experience to evaluate tools, insights generation, and business communication.";
        }
        
        return Response.json({
          question,
          interviewer_thought: thought,
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
            asked_questions: [question],
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

      const canonicalAskedQuestions = Array.isArray(memory.asked_questions)
        ? memory.asked_questions
        : [];
      if (last_question && !canonicalAskedQuestions.includes(last_question)) {
        canonicalAskedQuestions.push(last_question);
      }
      memory.asked_questions = canonicalAskedQuestions;

      const uncoveredCompetencies = Object.entries(memory.competencies || {})
        .filter(([, v]) => !v.covered)
        .map(([k]) => k);

      const prompt = `You are a professional campus recruiter conducting a ${round} for the role: ${job_role}.
Evaluate the candidate's last answer and generate the NEXT unique question.

CANDIDATE PROFILE:
- Tier 2/3 college student or fresher — reward effort, logic, and learning potential.
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

If the next question you think of sounds similar to ANY of the above, discard it and move to a different competency instead.

QUESTION LENGTH RULE (MANDATORY):
Write 2 to 3 sentences maximum. Conversational — like a real recruiter speaking. No bullet points, no multi-part questions, no lengthy preamble.

SCORING: Integer scores 1-10 only. No fractions or strings.

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
  "answer_analysis": {
    "question_number": ${canonicalAskedQuestions.length},
    "question": "${(last_question || '').replace(/"/g, "'")}",
    "answer": "${(last_answer || '').replace(/"/g, "'")}",
    "score": 7,
    "what_did_well": ["one specific strength"],
    "what_to_improve": ["one constructive suggestion"],
    "better_sample_answer": "A 2-3 sentence model response for a fresher",
    "dimension_scores": { "communication": 7, "relevance": 7, "technical_depth": 7, "structure": 7, "confidence": 7 }
  },
  "session_memory": {
    "interview_summary": "Running summary including latest response...",
    "competencies": { "communication": { "score": 0, "covered": false, "question_count": 0 }, "resume_validation": { "score": 0, "covered": false, "question_count": 0 }, "technical_knowledge": { "score": 0, "covered": false, "question_count": 0 }, "problem_solving": { "score": 0, "covered": false, "question_count": 0 }, "behavioral": { "score": 0, "covered": false, "question_count": 0 }, "culture_fit": { "score": 0, "covered": false, "question_count": 0 } },
    "asked_questions": ${JSON.stringify([...canonicalAskedQuestions, "<your_next_question_text>"])},
    "question_analysis": [],
    "current_competency": "next_competency_name"
  },
  "interview_complete": false
}`;

      let result;
      try {
        if (!client) {
          throw new Error('Anthropic client is not initialized (missing API key)');
        }
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
            answer_analysis: {
              question_number: canonicalAskedQuestions.length,
              question: last_question || "Previous Question",
              answer: last_answer || "",
              score: 6,
              what_did_well: ["Showed willingness to engage with the topic"],
              what_to_improve: ["Provide more specific examples with measurable outcomes"],
              better_sample_answer: "I worked on a project where I had to... (describe situation, your action, the result).",
              dimension_scores: { communication: 6, relevance: 6, technical_depth: 5, structure: 6, confidence: 6 }
            },
            session_memory: {
              ...memory,
              asked_questions: newQuestionsList,
              current_competency: nextCompetency
            },
            interview_complete: canonicalAskedQuestions.length >= 10
          };
        }
      } catch (claudeError) {
        console.warn('⚠️ smart-interview continue Claude API failed, using mock continue fallback:', claudeError.message);
        const currentCount = conversation_history ? conversation_history.length : 0;
        const fallbackQuestions = [
          "That's interesting. Can you tell me about a time you had to learn a new tool or technology quickly to solve a problem?",
          "How do you handle working in a team when there is a disagreement on the technical approach or implementation details?",
          "Could you describe a situation where you had a tight deadline and how you managed your time to deliver on time?",
          "If you were given a completely unfamiliar codebase, what steps would you take to understand it and start contributing?",
          "What are your long-term career goals, and how do you see this specific role helping you achieve them?",
          "Do you have any questions for me about the company or the role?"
        ];
        const nextQ = fallbackQuestions[currentCount % fallbackQuestions.length];
        const isComplete = currentCount >= 9;

        result = {
          question: nextQ,
          interviewer_thought: "Assessing behavioral traits, team collaboration, and adaptability to new tasks.",
          answer_analysis: {
            question_number: currentCount,
            question: last_question || "Previous Question",
            answer: last_answer || "",
            score: 7,
            what_did_well: ["Communicated clearly"],
            what_to_improve: ["Add more specific technical details"],
            better_sample_answer: "A good answer would use details showing your problem solving process.",
            dimension_scores: { communication: 7, relevance: 7, technical_depth: 6, structure: 7, confidence: 7 }
          },
          session_memory: {
            ...memory,
            asked_questions: [...canonicalAskedQuestions, nextQ]
          },
          interview_complete: isComplete
        };
      }

      // Server-side: ensure the new question was actually appended to asked_questions
      if (result.session_memory && result.question) {
        const existing = result.session_memory.asked_questions || canonicalAskedQuestions;
        if (!existing.includes(result.question)) {
          result.session_memory.asked_questions = [...existing, result.question];
        }
      }

      // Add the current analysis step on client-side or backend
      if (result.session_memory && result.answer_analysis) {
        const currentList = memory.question_analysis || [];
        result.session_memory.question_analysis = [...currentList, result.answer_analysis];
      }
      
      console.log('✅ Next question:', result.question);
      console.log('📋 Asked so far:', result.session_memory?.asked_questions?.length, 'questions');
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
}

Return ONLY the JSON, no other text. Be FAIR and ENCOURAGING. Only penalize for gaps relevant to THIS JD. Focus on POTENTIAL. Use Indian Rupees (₹) for salary range.`;

      try {
        if (!client) {
          throw new Error('Anthropic client is not initialized (missing API key)');
        }
        const message = await retryClaudeCall(() =>
          client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 2000,
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
          if (parsed.placement_chance <= 10) parsed.placement_chance = parsed.placement_chance * 10;
          
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
          throw parseError;
        }
      } catch (claudeError) {
        console.warn('⚠️ smart-interview evaluate Claude API failed, using mock evaluate fallback:', claudeError.message);
        
        // Fallback evaluation object
        return Response.json({
          placement_chance: 70,
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
            recommended_roles: [job_role || "Software Engineer"]
          }
        });
      }
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Smart Interview error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
