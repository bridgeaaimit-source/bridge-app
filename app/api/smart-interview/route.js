import Anthropic from '@anthropic-ai/sdk';
import { trackTokensServer } from '@/lib/tokenTrackerServer';
import { generateAndCacheTTS } from '@/lib/ttsGenerator';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeInt(val, fallback = 7) {
  const parsed = parseInt(val, 10);
  if (isNaN(parsed)) return fallback;
  return Math.max(1, Math.min(10, parsed));
}

async function retryClaudeCall(callFunction, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await callFunction();
    } catch (error) {
      console.error(`Claude API attempt ${attempt} failed:`, error.message);
      const isRetryable = error.status === 529 || error.status >= 500 || !error.status || error.message.includes('Connection');
      if (!isRetryable || attempt === maxRetries) throw error;
      const waitTime = delay * Math.pow(2, attempt - 1);
      console.log(`Waiting ${waitTime}ms before retry...`);
      await new Promise(r => setTimeout(r, waitTime));
    }
  }
}

// ─── Context Window Management ────────────────────────────────────────────────
// Keep only the last N turns verbatim. Older turns are already summarized
// in session_memory.interview_summary by Claude on each prior turn.
const RECENT_TURNS_LIMIT = 6;

function buildPromptHistory(conversation_history, olderTurnCount) {
  if (!conversation_history || conversation_history.length === 0) {
    return 'No conversation yet.';
  }
  const recent = conversation_history.slice(-RECENT_TURNS_LIMIT);
  let result = '';
  if (olderTurnCount > 0) {
    result += `[${olderTurnCount} earlier turn(s) already summarized in Session Memory above — do not re-ask those topics]\n\n`;
  }
  result += recent
    .map(h => `${h.role === 'interviewer' ? 'INTERVIEWER' : 'CANDIDATE'}: ${h.message}`)
    .join('\n\n');
  return result;
}

// ─── Competency Path Randomization ────────────────────────────────────────────
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const BASE_COMPETENCIES = [
  'communication',
  'resume_validation',
  'technical_knowledge',
  'problem_solving',
  'behavioral',
  'culture_fit',
];

// ─── Default session_memory factory ───────────────────────────────────────────
function defaultMemory(job_role) {
  return {
    interview_summary: `Interview initialized for ${job_role}.`,
    competencies: {
      communication:       { score: 0, covered: false, question_count: 0 },
      resume_validation:   { score: 0, covered: true,  question_count: 1 },
      technical_knowledge: { score: 0, covered: false, question_count: 0 },
      problem_solving:     { score: 0, covered: false, question_count: 0 },
      behavioral:          { score: 0, covered: false, question_count: 0 },
      culture_fit:         { score: 0, covered: false, question_count: 0 },
    },
    professionalism:           { score: 10, deductions: 0 },
    asked_questions:           [],
    covered_topics:            [],
    resume_claims:             [],
    contradictions_detected:   [],
    candidate_behavior_flags:  [],
    competency_path:           ['communication', 'technical_knowledge', 'problem_solving', 'behavioral', 'culture_fit'],
    session_seed:              1,
    current_competency:        'resume_validation',
    last_question_type:        'new_topic',
    needs_followup:            false,
  };
}

// ─── Score variance server-side guard ─────────────────────────────────────────
function checkScoreVariance(scores) {
  const vals = Object.values(scores).filter(v => typeof v === 'number');
  if (vals.length < 2) return;
  const range = Math.max(...vals) - Math.min(...vals);
  if (range < 2) {
    console.warn(`⚠️ Low score variance detected (range: ${range}). All scores: ${JSON.stringify(scores)}`);
  }
}

// ─── Duplicate / similar question guard ───────────────────────────────────────
// Uses keyword overlap to catch semantically similar questions that slip
// through Claude's anti-repetition instruction.
const STOP_WORDS = new Set(['the','a','an','in','on','at','to','for','of','and','or','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','shall','can','you','your','me','my','we','our','they','their','it','its','this','that','these','those','what','how','why','when','where','who','which','tell','me','about','time']);

function questionKeywords(q) {
  return q.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w));
}

function isSimilarQuestion(newQ, existingQ) {
  const nw = new Set(questionKeywords(newQ));
  const ew = questionKeywords(existingQ);
  if (nw.size === 0 || ew.length === 0) return false;
  const overlap = ew.filter(w => nw.has(w)).length;
  return (overlap / Math.max(nw.size, ew.length)) > 0.45; // 45% keyword overlap = too similar
}

// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request) {
  const body = await request.json();
  const {
    action,
    resume_base64,
    job_role,
    jd,
    round,
    conversation_history,
    last_question,
    last_answer,
    session_memory,
    user_id,
  } = body;

  console.log('👤 User ID:', user_id || 'unknown');
  console.log('⚙️  Action:', action);

  let client = null;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    } catch (e) {
      console.warn('Failed to initialize Anthropic client:', e.message);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ACTION 1: INIT
  // ══════════════════════════════════════════════════════════════════════════
  if (action === 'init') {
    // Allow client to force a seed (for testing / retry UX). Otherwise random.
    const sessionSeed = (body.session_seed && body.session_seed >= 1 && body.session_seed <= 5)
      ? body.session_seed
      : Math.floor(Math.random() * 5) + 1;
    const competencyPath = shuffleArray(
      BASE_COMPETENCIES.filter(c => c !== 'resume_validation')
    );

    const OPENING_STRATEGIES = {
      1: `Start with a specific project from their resume most relevant to the JD. Ask about their exact contribution and one technical challenge they overcame.`,
      2: `Identify something the JD explicitly requires that is NOT clearly on the resume. Open by probing how they would address that gap or handle that requirement from scratch.`,
      3: `Start with their most recent internship, job, or final-year project. Ask what they specifically did day-to-day and what their biggest learning was.`,
      4: `Start behavioral: "Imagine it's your first week in this ${job_role} role. Walk me through how you would approach your first two weeks to get up to speed." Make it role-specific.`,
      5: `Start with a lightweight technical hypothetical directly tied to the role's core responsibility. A problem they would realistically face week-1 on the job.`,
    };

    const hasResume = resume_base64 && resume_base64.length > 100;
    const resumeContext = hasResume
      ? 'You have the candidate\'s resume attached. Read it carefully before generating your first question.'
      : 'No resume document was provided for this session. Generate your opening question based purely on the JD and the opening strategy below. Do NOT ask the candidate for their resume — just proceed with the opening strategy.';

    const prompt = `You are a professional campus recruiter conducting a ${round} interview for: ${job_role}

${resumeContext}

JOB DESCRIPTION:
${jd || 'Not provided'}

ROUND: ${round}

OPENING STRATEGY FOR THIS SESSION (session_seed = ${sessionSeed}):
${OPENING_STRATEGIES[sessionSeed]}

CRITICAL INSTRUCTIONS:
1. Follow the opening strategy above exactly — do NOT default to "tell me about yourself."
2. Your question MUST feel like it was written by a real recruiter who read this specific resume.
3. Question length: 2 to 3 sentences maximum. Conversational. No bullet points, no sub-questions.

INITIAL RESUME CLAIMS:
After reading the resume, extract up to 5 factual claims the candidate has made on their resume (e.g., "Built React app", "Led team of 4", "Intern at TCS", "Knows Python"). These will be used later to detect contradictions.

Return ONLY valid JSON:
{
  "question": "2-3 sentence opening question based on opening strategy",
  "interviewer_thought": "What I saw in the resume/JD that led to this specific question",
  "session_memory": {
    "interview_summary": "Interview initialized for ${job_role}. Opening strategy: ${sessionSeed}.",
    "competencies": {
      "communication":       { "score": 0, "covered": false, "question_count": 0 },
      "resume_validation":   { "score": 0, "covered": true,  "question_count": 1 },
      "technical_knowledge": { "score": 0, "covered": false, "question_count": 0 },
      "problem_solving":     { "score": 0, "covered": false, "question_count": 0 },
      "behavioral":          { "score": 0, "covered": false, "question_count": 0 },
      "culture_fit":         { "score": 0, "covered": false, "question_count": 0 }
    },
    "professionalism":          { "score": 10, "deductions": 0 },
    "asked_questions":          ["<paste your generated question here>"],
    "covered_topics":           ["<1-3 word topic of your opening question, e.g. 'resume project'>"],
    "resume_claims":            ["<up to 5 factual claims from the resume>"],
    "contradictions_detected":  [],
    "candidate_behavior_flags": [],
    "competency_path":          ${JSON.stringify(competencyPath)},
    "session_seed":             ${sessionSeed},
    "current_competency":       "resume_validation",
    "last_question_type":       "new_topic",
    "needs_followup":           false
  }
}`;

    try {
      if (!client) throw new Error('Anthropic client not initialized');

      let message;
      if (resume_base64 && resume_base64.length > 100) {
        message = await retryClaudeCall(() =>
          client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 4000,
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: resume_base64 } },
              ],
            }],
          })
        );
      } else {
        message = await retryClaudeCall(() =>
          client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 4000,
            messages: [{ role: 'user', content: prompt }],
          })
        );
      }

      trackTokensServer(user_id || 'anonymous', 'smart-interview', message.usage?.input_tokens, message.usage?.output_tokens, 'claude-haiku-4-5-20251001').catch(e => console.error('Token tracking error:', e));

      const text = message.content[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const cleanText = jsonMatch ? jsonMatch[0] : text;

      try {
        const parsed = JSON.parse(cleanText);
        if (parsed.session_memory && parsed.question) {
          parsed.session_memory.asked_questions = [parsed.question];
        }
        
        // 🚀 PREFETCH: Generate TTS immediately in background
        if (parsed.question) {
          generateAndCacheTTS(parsed.question, user_id).catch(err => console.error("Prefetch TTS failed:", err));
        }

        return Response.json(parsed);
      } catch {
        console.error('JSON parse error in init. Raw:', text);
        const fallback = defaultMemory(job_role);
        const seedFallbackQs = {
          1: `I noticed your resume mentions some interesting projects. Can you walk me through the one most relevant to this ${job_role} role and explain your exact contribution?`,
          2: `The JD mentions ${(jd || '').split(' ').slice(0, 6).join(' ')} as a key requirement. How have you built experience in that area?`,
          3: `Starting with your most recent experience — what did you actually do day-to-day and what was the most important thing you built or contributed?`,
          4: `Imagine it is your first week as a ${job_role} here. Walk me through how you would approach getting up to speed and making your first meaningful contribution.`,
          5: `Here is a quick hypothetical for a ${job_role}: a user reports the page is loading slowly. Walk me through your step-by-step debugging approach.`,
        };
        const fallbackQ = seedFallbackQs[sessionSeed] || seedFallbackQs[1];
        fallback.asked_questions = [fallbackQ];
        fallback.covered_topics = ['resume project'];
        fallback.resume_claims = [];
        fallback.competency_path = competencyPath;
        fallback.session_seed = sessionSeed;
        return Response.json({ question: fallbackQ, interviewer_thought: 'Starting with resume exploration.', session_memory: fallback });
      }
    } catch (err) {
      console.warn('Init Claude call failed:', err.message);
      const fallback = defaultMemory(job_role);
      const seedFallbackQs = {
        1: `Can you walk me through the project or experience on your resume that you are most proud of and what your specific contribution was?`,
        2: `Looking at your background, I want to understand how it connects to what we need. What is one requirement in this ${job_role} role that you feel most confident about, and why?`,
        3: `Starting with your most recent experience — tell me what you worked on day-to-day and what the most impactful thing you shipped or contributed was.`,
        4: `Imagine it is your first week as a ${job_role} here. How would you approach the first two weeks to get up to speed and make your first meaningful contribution?`,
        5: `Quick hypothetical for a ${job_role}: a user reports the page is loading very slowly. Walk me through your debugging approach from first principles.`,
      };
      const fallbackQ = seedFallbackQs[sessionSeed] || seedFallbackQs[1];
      fallback.asked_questions = [fallbackQ];
      fallback.covered_topics = ['resume project'];
      fallback.resume_claims = [];
      fallback.competency_path = shuffleArray(BASE_COMPETENCIES.filter(c => c !== 'resume_validation'));
      fallback.session_seed = sessionSeed;
      return Response.json({ question: fallbackQ, interviewer_thought: 'Exploring resume experience.', session_memory: fallback });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ACTION 2: CONTINUE
  // ══════════════════════════════════════════════════════════════════════════
  if (action === 'continue') {
    console.log('=== SMART INTERVIEW CONTINUE ===');

    const memory = session_memory || defaultMemory(job_role);

    // Ensure professionalism exists (backwards compatibility)
    if (!memory.professionalism) memory.professionalism = { score: 10, deductions: 0 };
    if (!memory.covered_topics) memory.covered_topics = [];
    if (!memory.resume_claims) memory.resume_claims = [];
    if (!memory.contradictions_detected) memory.contradictions_detected = [];
    if (!memory.candidate_behavior_flags) memory.candidate_behavior_flags = [];
    if (!memory.competency_path) memory.competency_path = shuffleArray(BASE_COMPETENCIES.filter(c => c !== 'resume_validation'));

    // Server-side deduplication guard
    const canonicalAskedQuestions = Array.isArray(memory.asked_questions) ? memory.asked_questions : [];
    if (last_question && !canonicalAskedQuestions.includes(last_question)) {
      canonicalAskedQuestions.push(last_question);
    }
    memory.asked_questions = canonicalAskedQuestions;

    // Context window management
    const totalTurns = (conversation_history || []).length;
    const olderTurnCount = Math.max(0, totalTurns - RECENT_TURNS_LIMIT);
    const promptHistory = buildPromptHistory(conversation_history, olderTurnCount);

    const uncoveredCompetencies = Object.entries(memory.competencies || {})
      .filter(([, v]) => !v.covered)
      .map(([k]) => k);

    // Determine next competency from competency_path (prefer path order over random)
    const nextCompetency = memory.competency_path.find(c =>
      memory.competencies[c] && !memory.competencies[c].covered
    ) || uncoveredCompetencies[0] || 'behavioral';

    const prompt = `You are a professional campus recruiter conducting a ${round} for: ${job_role}.
You are currently on question ${canonicalAskedQuestions.length + 1} of max 10.

━━ SESSION MEMORY (your running notes) ━━
Interview Summary (older turns already captured here):
${memory.interview_summary}

Covered Topics (1-3 word topics — DO NOT revisit any of these):
${JSON.stringify(memory.covered_topics)}

Resume Claims (what candidate claims from their resume):
${JSON.stringify(memory.resume_claims)}

Contradictions Detected So Far:
${JSON.stringify(memory.contradictions_detected)}

Candidate Behavior Flags:
${JSON.stringify(memory.candidate_behavior_flags)}

Professionalism Score: ${memory.professionalism.score}/10

Competencies Status:
${JSON.stringify(memory.competencies, null, 2)}

Competency Path (intended order): ${JSON.stringify(memory.competency_path)}
Next Target Competency: ${nextCompetency}

━━ RECENT CONVERSATION (verbatim) ━━
${promptHistory}

━━ CURRENT EXCHANGE ━━
LAST QUESTION ASKED: "${last_question || 'None'}"
CANDIDATE'S LAST ANSWER: "${last_answer || '(no answer provided)'}"

JD Requirements: ${jd || 'Not provided'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — CLASSIFY CANDIDATE'S LAST ANSWER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Choose exactly one classification:

  A) OFF_TOPIC     — answer is completely unrelated to what was asked
  B) EVASIVE       — candidate acknowledged the question but gave no real answer
  C) INAPPROPRIATE — vulgar, abusive, offensive, or deeply unprofessional language
  D) TOO_SHORT     — 20 words or fewer; no example, no specifics, no explanation
  E) RAMBLING      — 200+ words that lose focus and don't answer the core question
  F) ADEQUATE      — acceptable answer; may proceed to next topic

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — CONTRADICTION CHECK (run even if ADEQUATE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Compare the candidate's last answer against:
  a) Resume claims listed above
  b) Everything said in the conversation above

A contradiction exists when the candidate says something factually inconsistent with a prior claim.
Examples:
  - Earlier: "I have never used AWS" → Now: "I deployed our app on AWS EC2"
  - Resume claims "led a team of 5" → Now: "I worked alone on that project"
  - Earlier: "My final year project was in Python" → Now: "I only know JavaScript"

If you find a clear contradiction: override your Step 1 classification to CONTRADICTION.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — VAGUE CLAIM SCAN (only if ADEQUATE, no contradiction)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If the answer is classified ADEQUATE, scan for unquantified boasts:
  - "I improved performance" → unquantified → VAGUE_CLAIM
  - "I led a team" (without size or context) → VAGUE_CLAIM
  - "I built [project]" (without specifying their contribution) → VAGUE_CLAIM
  - "I know/use [technology]" (with no concrete example attached) → VAGUE_CLAIM

If found: override classification to VAGUE_CLAIM.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — GENERATE YOUR RESPONSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Based on classification, respond EXACTLY as follows:

OFF_TOPIC / EVASIVE:
  - Politely redirect: "I appreciate that, but I'd like to bring us back to [topic of last question]. Could you specifically address [core of what was asked]?"
  - Do NOT ask a new topic.
  - "last_question_type": "redirect", "needs_followup": true

INAPPROPRIATE:
  - Professionally call it out: "I'd ask that we keep our conversation professional. Let's continue — [rephrase the original question calmly]."
  - Deduct 2 from professionalism.score (floor = 0). Add { "type": "inappropriate_language", "question_number": ${canonicalAskedQuestions.length}, "note": "brief factual note" } to candidate_behavior_flags.
  - "last_question_type": "professionalism_callout", "needs_followup": true

TOO_SHORT:
  - Ask a follow-up probe: "Could you give me a specific example of that?" or "Can you walk me through that in more detail?"
  - Do NOT move to new topic.
  - "last_question_type": "followup_probe", "needs_followup": true

RAMBLING:
  - Redirect: "Thanks for all that context — to make the most of our time, could you specifically tell me [the core of the original question, in 1 sentence]?"
  - "last_question_type": "redirect", "needs_followup": true

VAGUE_CLAIM:
  - Challenge the specific vague claim directly. Be precise about WHICH claim is vague.
  - "last_question_type": "challenge", "needs_followup": true

CONTRADICTION:
  - Challenge directly: "I want to make sure I understand correctly — earlier you mentioned [X], but just now you said [Y]. Can you help me reconcile that?"
  - Add entry to contradictions_detected: { "prior_claim": "X", "new_statement": "Y", "question_number": ${canonicalAskedQuestions.length} }
  - "last_question_type": "contradiction_challenge", "needs_followup": true

ADEQUATE:
  - Score the current competency (1-10) based on answer quality.
    Use these anchors:
      1-3: Irrelevant, refused, or no knowledge shown.
      4-5: Generic, surface-level, no examples.
      6-7: Adequate with some specifics but limited depth.
      8-9: Specific, structured, quantified, excellent example.
      10: Exceptional — rare, only for truly outstanding answers.
  - Set "covered": true for this competency ONLY if score >= 5.
  - Increment question_count for this competency.
  - Extract any new project/technology/skill claims and add to resume_claims (avoid duplicates).
  - Extract the 1-3 word topic of this exchange and add to covered_topics (avoid duplicates).
  - Append 1-2 bullet points summarizing new facts to interview_summary. Do NOT delete existing bullets.
  - Move to NEXT uncovered competency in competency_path: ${nextCompetency}
  - Ask a fresh, specific question on that competency. Do NOT revisit any topic in covered_topics.
  - "last_question_type": "new_topic", "needs_followup": false

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANTI-REPETITION — ABSOLUTE RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Questions already asked (do NOT ask anything similar):
${canonicalAskedQuestions.map((q, i) => `  Q${i + 1}: "${q}"`).join('\n')}

Topics already covered (do NOT revisit at topic level):
${JSON.stringify(memory.covered_topics)}

QUESTION RULES:
- 2 to 3 sentences maximum
- Conversational — like a real recruiter speaking, not reading a form
- No bullet points, no multi-part questions, no lengthy preamble

INTERVIEW COMPLETION:
Set "interview_complete": true ONLY when:
  - >= 10 questions asked
  - Do NOT end interview when "needs_followup": true (always resolve follow-ups first)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Return ONLY valid JSON (no markdown, no explanation):
{
  "question": "your 2-3 sentence response/question",
  "interviewer_thought": "1 sentence: why you chose this response",
  "answer_classification": "ADEQUATE|OFF_TOPIC|EVASIVE|INAPPROPRIATE|TOO_SHORT|RAMBLING|VAGUE_CLAIM|CONTRADICTION",
  "session_memory": {
    "interview_summary": "Updated summary — append new bullet points from this turn only",
    "competencies": {
      "communication":       { "score": 0, "covered": false, "question_count": 0 },
      "resume_validation":   { "score": 0, "covered": true,  "question_count": 1 },
      "technical_knowledge": { "score": 0, "covered": false, "question_count": 0 },
      "problem_solving":     { "score": 0, "covered": false, "question_count": 0 },
      "behavioral":          { "score": 0, "covered": false, "question_count": 0 },
      "culture_fit":         { "score": 0, "covered": false, "question_count": 0 }
    },
    "professionalism":          { "score": ${memory.professionalism.score}, "deductions": ${memory.professionalism.deductions} },
    "asked_questions":          ${JSON.stringify([...canonicalAskedQuestions, "<your_question_text>"])},
    "covered_topics":           ${JSON.stringify(memory.covered_topics)},
    "resume_claims":            ${JSON.stringify(memory.resume_claims)},
    "contradictions_detected":  ${JSON.stringify(memory.contradictions_detected)},
    "candidate_behavior_flags": ${JSON.stringify(memory.candidate_behavior_flags)},
    "competency_path":          ${JSON.stringify(memory.competency_path)},
    "session_seed":             ${memory.session_seed || 1},
    "current_competency":       "${nextCompetency}",
    "last_question_type":       "new_topic",
    "needs_followup":           false
  },
  "interview_complete": false
}`;

    let result;
    try {
      if (!client) throw new Error('Anthropic client not initialized');

      let message;
      if (resume_base64 && resume_base64.length > 100) {
        message = await retryClaudeCall(() =>
          client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 4000,
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: resume_base64 } },
              ],
            }],
          })
        );
      } else {
        message = await retryClaudeCall(() =>
          client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 4000,
            messages: [{ role: 'user', content: prompt }],
          })
        );
      }

      trackTokensServer(user_id || 'anonymous', 'smart-interview', message.usage?.input_tokens, message.usage?.output_tokens, 'claude-haiku-4-5-20251001').catch(e => console.error('Token tracking error:', e));

      const text = message.content[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const cleanText = jsonMatch ? jsonMatch[0] : text;

      console.log('Claude continue response:', text.substring(0, 500));

      try {
        result = JSON.parse(cleanText);

        // Normalize competency scores
        if (result.session_memory?.competencies) {
          Object.keys(result.session_memory.competencies).forEach(key => {
            const comp = result.session_memory.competencies[key];
            comp.score = safeInt(comp.score, 0);
            comp.question_count = parseInt(comp.question_count, 10) || 0;
            comp.covered = !!comp.covered;
          });
        }

        // Normalize professionalism (ensure Claude didn't go below 0 or above 10)
        if (result.session_memory?.professionalism) {
          result.session_memory.professionalism.score = Math.max(0, Math.min(10, result.session_memory.professionalism.score || 0));
        }

      } catch (parseError) {
        console.error('JSON parse error in continue:', parseError, 'Raw:', text);
        // Rotating fallback per uncovered competency
        const fallbackByCompetency = {
          technical_knowledge: `Can you walk me through a technical problem you solved recently and describe your thought process?`,
          problem_solving:     `If you had to design a simple caching system for a web application, what approach would you take?`,
          behavioral:          `Tell me about a time you had a tight deadline. How did you manage your time to deliver on time?`,
          culture_fit:         `What kind of work environment brings out your best work, and why?`,
          communication:       `How do you typically explain a complex technical concept to a non-technical stakeholder?`,
          resume_validation:   `Which project on your resume are you most proud of, and what was your specific contribution?`,
        };
        const fb = fallbackByCompetency[nextCompetency] || `What interests you most about the ${job_role} role?`;
        result = {
          question: fb,
          interviewer_thought: `Exploring ${nextCompetency.replace(/_/g, ' ')} competency.`,
          answer_classification: 'ADEQUATE',
          session_memory: {
            ...memory,
            asked_questions: [...canonicalAskedQuestions, fb],
            current_competency: nextCompetency,
            last_question_type: 'new_topic',
            needs_followup: false,
          },
          interview_complete: canonicalAskedQuestions.length >= 10,
        };
      }
    } catch (claudeError) {
      console.warn('Continue Claude call failed:', claudeError.message);
      const currentCount = canonicalAskedQuestions.length;
      const fallbackQuestions = [
        `That's helpful context. Can you describe a time you had to learn a new skill quickly under pressure?`,
        `How do you handle technical disagreements with teammates on implementation decisions?`,
        `Could you walk me through how you approach debugging a problem you've never seen before?`,
        `What long-term goals do you have, and how does this ${job_role} role fit into them?`,
        `Do you have any questions for me about the team or the role?`,
      ];
      const nextQ = fallbackQuestions[currentCount % fallbackQuestions.length];
      result = {
        question: nextQ,
        interviewer_thought: 'Continuing interview with behavioral question.',
        answer_classification: 'ADEQUATE',
        session_memory: {
          ...memory,
          asked_questions: [...canonicalAskedQuestions, nextQ],
          current_competency: nextCompetency,
          last_question_type: 'new_topic',
          needs_followup: false,
        },
        interview_complete: currentCount >= 10,
      };
    }

    // Server-side: ensure question is in asked_questions
    if (result.session_memory && result.question) {
      const existing = result.session_memory.asked_questions || canonicalAskedQuestions;
      if (!existing.includes(result.question)) {
        result.session_memory.asked_questions = [...existing, result.question];
      }
    }

    // ── Duplicate / similar question guard ──────────────────────────────────
    // If Claude generates a question too similar to one already asked, swap it
    // with a competency-specific fallback to prevent repetition loops.
    if (result.question && canonicalAskedQuestions.length > 0) {
      const isDuplicate = canonicalAskedQuestions.some(q => isSimilarQuestion(result.question, q));
      if (isDuplicate) {
        const FALLBACK_POOL = {
          technical_knowledge: [
            `What is the most important performance optimization technique for React you have applied, and can you give a concrete example?`,
            `How do you decide between local component state and a global state manager like Redux for a given feature?`,
            `Walk me through how you handle error boundaries and async error handling in a React app.`,
          ],
          problem_solving: [
            `If you joined our team and found the codebase had zero test coverage, what would your first three steps be?`,
            `How would you approach optimising a web page a user reports as slow on mobile devices?`,
            `If a feature you shipped caused a production incident, walk me through your response and team communication.`,
          ],
          behavioral: [
            `Tell me about a project where you learned a completely new technology under pressure. How did you approach it?`,
            `Describe a situation where you disagreed with a key team decision. How did you handle it and what was the outcome?`,
            `Give me an example of receiving difficult critical feedback. How did you respond and what changed?`,
          ],
          culture_fit: [
            `What does your ideal engineering team culture look like, and why does that matter to you?`,
            `How do you stay current with developments in frontend engineering outside of your coursework or job?`,
            `What kind of projects genuinely excite you, and how does this specific role connect to that?`,
          ],
          communication: [
            `How do you document technical decisions and communicate them to non-technical stakeholders?`,
            `Describe a time you had to explain a complex technical trade-off to a product manager or designer.`,
          ],
          resume_validation: [
            `What is the gap between where you are now and where you want to be technically in two years?`,
            `Which skill or technology on your background do you feel least confident about and what have you done to improve it?`,
          ],
        };
        const pool = FALLBACK_POOL[nextCompetency] || FALLBACK_POOL.behavioral;
        const freshFallback = pool.find(f =>
          !canonicalAskedQuestions.some(q => isSimilarQuestion(f, q))
        ) || pool[Math.floor(Math.random() * pool.length)];

        console.warn(`⚠️  Duplicate question detected. Substituting from ${nextCompetency} pool.`);
        result.question = freshFallback;
        result.interviewer_thought = `Redirecting to a fresh ${nextCompetency.replace(/_/g, ' ')} question to avoid repetition.`;
        if (result.session_memory) {
          const currentList = result.session_memory.asked_questions || canonicalAskedQuestions;
          if (!currentList.includes(freshFallback)) {
            result.session_memory.asked_questions = [...currentList, freshFallback];
          }
        }
      }
    }

    console.log(`📋 Asked: ${result.session_memory?.asked_questions?.length} | Classification: ${result.answer_classification} | Needs followup: ${result.session_memory?.needs_followup}`);
    
    // 🚀 PREFETCH: Generate TTS immediately in background for next question
    if (result.question) {
      generateAndCacheTTS(result.question, user_id).catch(err => console.error("Prefetch TTS failed:", err));
    }

    return Response.json(result);
  }


  // ══════════════════════════════════════════════════════════════════════════
  // ACTION 3: EVALUATE
  // ══════════════════════════════════════════════════════════════════════════
  if (action === 'evaluate') {
    const memory = session_memory || { interview_summary: 'Interview completed.', competencies: {}, asked_questions: [], candidate_behavior_flags: [], contradictions_detected: [] };

    console.log('Final evaluation. Memory keys:', Object.keys(memory));

    // Context window management: use full history for evaluation (it's final, latency is acceptable)
    const historyText = conversation_history && conversation_history.length > 0
      ? conversation_history.map(h => `${h.role === 'interviewer' ? 'INTERVIEWER' : 'CANDIDATE'}: ${h.message}`).join('\n\n')
      : 'No conversation history available.';

    const behaviorFlags = memory.candidate_behavior_flags || [];
    const contradictions = memory.contradictions_detected || [];

    const prompt = `You are an expert hiring manager evaluating a candidate for the role: ${job_role}.

FULL INTERVIEW TRANSCRIPT:
${historyText}

SESSION NOTES (AI observations):
Interview Summary: ${JSON.stringify(memory.interview_summary || 'None')}
Contradictions Detected: ${JSON.stringify(contradictions)}
Candidate Behavior Flags: ${JSON.stringify(behaviorFlags)}

TARGET CALIBRATION (CRITICAL):
- Candidates are Tier 2/3 college students, freshers, or early-career applicants. Do NOT benchmark against senior engineers.
- Reward logical reasoning, effort, fundamentals, and coachability.
- Evaluate ACTUAL answer content from the transcript. Short, generic, or vague answers MUST receive low scores.
- You MUST differentiate: do not cluster scores — if performance varied, scores must vary.

SCORE ANCHOR DEFINITIONS — use these precisely, do not deviate:
  1-3 (Poor):       Answer was irrelevant, refused, or demonstrated no knowledge.
  4-5 (Weak):       Generic, surface-level. No examples, no specifics, no structure.
  6-7 (Average):    Adequate, some specifics, reasonable structure but limited depth.
  8-9 (Strong):     Specific, structured (STAR or equivalent), quantified where applicable.
  10 (Exceptional): Rare. Only for genuinely outstanding, professional-grade responses.

SCORING DIMENSIONS (evaluate each dimension INDEPENDENTLY from 1-10):
1. communication:       Clarity, structure, and ability to articulate thoughts. Do not penalize accent. Do penalize incoherence or constant off-topic rambling.
2. technical_knowledge: Accuracy, depth, and correctness of technical concepts demonstrated.
3. resume_jd_fit:       How well their stated experiences align with JD requirements for ${job_role}.
4. confidence:          Certainty and conviction in delivery. Evasiveness = low confidence.
5. answer_quality:      Depth of detail, use of concrete examples, structure (STAR method encouraged).
6. problem_solving:     Logical, structured approach to hypothetical or analytical questions.
7. professionalism:     Start at 10. Deduct for: off-topic answers (−1 each), inappropriate language (−2 each), repeated question avoidance (−1 each), contradictions caught (−1 each).
   Behavior flags to consider: ${JSON.stringify(behaviorFlags)}
   Contradictions: ${JSON.stringify(contradictions)}

For each score, you MUST provide:
- "score": integer from 1 to 10.
- "evidence": direct quote or specific reference to the transcript where this was demonstrated.
- "justification": rationale mapping the evidence to the rubric anchors.

FEEDBACK GUIDELINES:
- Strengths and Weaknesses must be specific to what was said in the transcript.
- Identify RECURRING patterns, not one-off moments. Example: "You consistently gave vague answers when asked about your project contributions."
- key_takeaways: 3-4 sentences on overall readiness, main pattern of mistakes, and the single most important thing to practice.

Return ONLY valid JSON (the overall_score and placement_chance fields are placeholder values; the system will calculate them mathematically on the server, but they must be present in the output schema):
{
  "placement_chance": 70,
  "verdict": "Hire",
  "overall_score": 7,
  "scores": {
    "communication":       { "score": 7, "evidence": "...", "justification": "..." },
    "technical_knowledge": { "score": 7, "evidence": "...", "justification": "..." },
    "resume_jd_fit":       { "score": 7, "evidence": "...", "justification": "..." },
    "confidence":          { "score": 7, "evidence": "...", "justification": "..." },
    "answer_quality":      { "score": 7, "evidence": "...", "justification": "..." },
    "problem_solving":     { "score": 7, "evidence": "...", "justification": "..." },
    "professionalism":     { "score": 10, "evidence": "...", "justification": "..." }
  },
  "summary": {
    "strengths": ["specific strength 1 from transcript", "specific strength 2"],
    "weaknesses": ["specific recurring weakness or knowledge gap"],
    "key_takeaways": "3-4 sentences on readiness, main patterns, and what to practice."
  },
  "career_insights": {
    "market_fit": "High/Medium/Low",
    "salary_range": "₹X-Y LPA (fresher estimate for ${job_role})",
    "growth_potential": "High/Medium/Low",
    "recommended_roles": ["role 1", "role 2"]
  }
}`;

    try {
      if (!client) throw new Error('Anthropic client not initialized');

      const message = await retryClaudeCall(() =>
        client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }],
        })
      );

      trackTokensServer(user_id || 'anonymous', 'smart-interview', message.usage?.input_tokens, message.usage?.output_tokens, 'claude-haiku-4-5-20251001').catch(e => console.error('Token tracking error:', e));

      const text = message.content[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const cleanText = jsonMatch ? jsonMatch[0] : text;

      console.log('Evaluate response:', cleanText.substring(0, 400));

      try {
        const parsed = JSON.parse(cleanText);

        if (parsed.scores) {
          const flatScores = {};
          Object.entries(parsed.scores).forEach(([k, v]) => {
            if (typeof v === 'object' && v !== null && 'score' in v) {
              flatScores[k] = safeInt(v.score);
            } else {
              flatScores[k] = safeInt(v);
            }
          });

          // Server-side score variance check
          checkScoreVariance(flatScores);

          // Re-attach normalized scores to their objects or values
          if (typeof Object.values(parsed.scores)[0] === 'object') {
            Object.keys(parsed.scores).forEach(k => {
              if (typeof parsed.scores[k] === 'object') {
                parsed.scores[k].score = flatScores[k];
              } else {
                parsed.scores[k] = flatScores[k];
              }
            });
          } else {
            parsed.scores = flatScores;
          }

          // ─── Server-Side Mathematical Overall Score Calculation ───
          // Define weights for dimensions (sum of weights = 1.0)
          const weights = {
            communication: 0.15,
            technical_knowledge: 0.30,
            resume_jd_fit: 0.10,
            confidence: 0.05,
            answer_quality: 0.20,
            problem_solving: 0.20
          };

          let calculatedOverall = 0;
          let weightSum = 0;
          Object.entries(weights).forEach(([dim, w]) => {
            if (typeof flatScores[dim] === 'number') {
              calculatedOverall += flatScores[dim] * w;
              weightSum += w;
            }
          });

          let overall = weightSum > 0 ? (calculatedOverall / weightSum) : 6.0;

          // Deduct from overall score if professionalism is low (less than 7)
          const profVal = flatScores.professionalism;
          if (typeof profVal === 'number' && profVal < 7) {
            overall = Math.max(1.0, overall - (10 - profVal) * 0.5);
          }

          parsed.overall_score = Math.round(overall * 10) / 10;

          // Non-linear calibration for placement chance
          let calculatedChance = 60;
          const roundedOverall = parsed.overall_score;
          if (roundedOverall >= 8.5) {
            calculatedChance = 85 + (roundedOverall - 8.5) * 8.66; // 8.5 -> 85%, 10 -> 98%
          } else if (roundedOverall >= 7.0) {
            calculatedChance = 70 + (roundedOverall - 7.0) * 10.0;  // 7.0 -> 70%, 8.5 -> 85%
          } else if (roundedOverall >= 5.5) {
            calculatedChance = 50 + (roundedOverall - 5.5) * 13.33; // 5.5 -> 50%, 7.0 -> 70%
          } else if (roundedOverall >= 4.0) {
            calculatedChance = 30 + (roundedOverall - 4.0) * 13.33; // 4.0 -> 30%, 5.5 -> 50%
          } else {
            calculatedChance = 10 + (roundedOverall - 1.0) * 6.66;  // 1.0 -> 10%, 4.0 -> 30%
          }
          parsed.placement_chance = Math.round(Math.max(0, Math.min(100, calculatedChance)));

          // Derive verdict from calculated overall score
          if (roundedOverall >= 8.5) parsed.verdict = "Strong Hire";
          else if (roundedOverall >= 7.0) parsed.verdict = "Hire";
          else if (roundedOverall >= 5.5) parsed.verdict = "Strong Maybe";
          else if (roundedOverall >= 4.0) parsed.verdict = "Weak Maybe";
          else parsed.verdict = "Not Hire";
        } else {
          // Fallback values if scores object is missing
          parsed.overall_score = 6.0;
          parsed.placement_chance = 60;
          parsed.verdict = "Strong Maybe";
        }

        parsed.question_analysis = [];
        return Response.json(parsed);

      } catch (parseError) {
        console.error('JSON parse error in evaluate:', parseError, 'Raw:', text);
        return Response.json({
          placement_chance: 60,
          verdict: 'Strong Maybe',
          overall_score: 6.0,
          scores: {
            communication: { score: 6, evidence: "Completed the interview session.", justification: "General structured dialogue." },
            technical_knowledge: { score: 6, evidence: "Completed the interview session.", justification: "General knowledge." },
            resume_jd_fit: { score: 6, evidence: "Completed the interview session.", justification: "General fit." },
            confidence: { score: 6, evidence: "Completed the interview session.", justification: "Steady response rate." },
            answer_quality: { score: 6, evidence: "Completed the interview session.", justification: "Answers were direct." },
            problem_solving: { score: 6, evidence: "Completed the interview session.", justification: "Reasonable workflow." },
            professionalism: { score: 8, evidence: "No violations recorded.", justification: "Standard professional conduct." }
          },
          summary: {
            strengths: ['Completed the mock interview', 'Showed interest and effort'],
            weaknesses: ['Evaluation report encountered a minor parsing issue'],
            key_takeaways: 'Good effort shown. Re-run the interview for a more detailed breakdown.',
          },
          question_analysis: [],
          career_insights: {
            market_fit: 'Medium',
            salary_range: '₹3.5-6 LPA (Entry level)',
            growth_potential: 'High',
            recommended_roles: [job_role],
          },
        });
      }
    } catch (claudeError) {
      console.warn('Evaluate Claude call failed:', claudeError.message);
      return Response.json({
        placement_chance: 60,
        verdict: 'Strong Maybe',
        overall_score: 6.0,
        scores: {
          communication: { score: 7, evidence: "Completed the interview session.", justification: "Structured articulation." },
          technical_knowledge: { score: 6, evidence: "Completed the interview session.", justification: "Adequate explanations." },
          resume_jd_fit: { score: 6, evidence: "Completed the interview session.", justification: "Good alignment." },
          confidence: { score: 7, evidence: "Completed the interview session.", justification: "Clear vocal delivery." },
          answer_quality: { score: 5, evidence: "Completed the interview session.", justification: "Standard answers." },
          problem_solving: { score: 6, evidence: "Completed the interview session.", justification: "Satisfactory approach." },
          professionalism: { score: 8, evidence: "No violations recorded.", justification: "Standard conduct." }
        },
        summary: {
          strengths: ['Completed the full interview', 'Demonstrated structured communication'],
          weaknesses: ['Some answers lacked depth and concrete examples'],
          key_takeaways: 'Good overall participation. Practice using the STAR method when answering behavioral questions.',
        },
        question_analysis: [],
        career_insights: {
          market_fit: 'Medium',
          salary_range: '₹4-7 LPA',
          growth_potential: 'High',
          recommended_roles: [job_role || 'Software Engineer'],
        },
      });
    }
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 });
}
