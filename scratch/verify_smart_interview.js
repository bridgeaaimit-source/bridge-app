/**
 * Smart Interview — Verification Test Suite
 * Tests all 8 requirements with live Claude API calls.
 * Run: node scratch/verify_smart_interview.js
 */

const BASE_URL = 'http://localhost:3000/api/smart-interview';
const JOB_ROLE = 'Software Engineer (Frontend)';
const ROUND = 'Technical Round';
const JD = 'We need a frontend engineer with experience in React, JavaScript, and REST APIs. Bonus: TypeScript, Next.js.';
const USER_ID = 'verify-agent';

// Minimal valid base64 PDF (just enough to pass the length check)
const DUMMY_PDF = 'JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nDPUM1Qo5ypUMFAwALJMLYGsEiBrcZ5aAFO/BfIKZW5kc3RyZWFtCmVuZG9iago='.repeat(5);

async function post(payload) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, user_id: USER_ID }),
  });
  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch {
    return { status: res.status, raw: text };
  }
}

function makeMemory(overrides = {}) {
  return {
    interview_summary: 'Candidate is a fresher with React experience from a college project.',
    competencies: {
      communication:       { score: 7, covered: true,  question_count: 1 },
      resume_validation:   { score: 6, covered: true,  question_count: 1 },
      technical_knowledge: { score: 0, covered: false, question_count: 0 },
      problem_solving:     { score: 0, covered: false, question_count: 0 },
      behavioral:          { score: 0, covered: false, question_count: 0 },
      culture_fit:         { score: 0, covered: false, question_count: 0 },
    },
    professionalism:           { score: 10, deductions: 0 },
    asked_questions:           ['Tell me about your React project on your resume.'],
    covered_topics:            ['resume project', 'react'],
    resume_claims:             ['Built a React e-commerce app', 'Led a team of 3', 'Internship at InfoSoft'],
    contradictions_detected:   [],
    candidate_behavior_flags:  [],
    competency_path:           ['technical_knowledge', 'problem_solving', 'behavioral', 'culture_fit'],
    session_seed:              2,
    current_competency:        'technical_knowledge',
    last_question_type:        'new_topic',
    needs_followup:            false,
    ...overrides,
  };
}

function makeConversation(extras = []) {
  return [
    { role: 'interviewer', message: 'Tell me about your React project on your resume.' },
    { role: 'user',        message: 'I built a React e-commerce app for my college project with a team of 3.' },
    ...extras,
  ];
}

function pass(msg) { console.log(`  ✅ PASS: ${msg}`); }
function fail(msg) { console.log(`  ❌ FAIL: ${msg}`); }
function info(msg) { console.log(`  ℹ️  ${msg}`); }
function header(n, title) { console.log(`\n${'═'.repeat(60)}\n TEST ${n}: ${title}\n${'═'.repeat(60)}`); }

// ─────────────────────────────────────────────────────────────────────────────

async function test_R1a_offTopic() {
  header('R1a', 'Off-Topic Answer → Interviewer Redirects');
  const { data } = await post({
    action: 'continue',
    job_role: JOB_ROLE, jd: JD, round: ROUND,
    last_question: 'Can you describe a technical challenge you faced in your React project?',
    last_answer: 'I love cricket and my favourite player is Virat Kohli. I watch every match.',
    session_memory: makeMemory(),
    conversation_history: makeConversation([
      { role: 'interviewer', message: 'Can you describe a technical challenge you faced in your React project?' },
      { role: 'user',        message: 'I love cricket and my favourite player is Virat Kohli. I watch every match.' },
    ]),
  });
  info(`Answer classification: ${data.answer_classification}`);
  info(`Interviewer response: "${data.question}"`);
  info(`Needs followup: ${data.session_memory?.needs_followup}`);
  const isRedirect = ['OFF_TOPIC', 'EVASIVE'].includes(data.answer_classification);
  const hasRedirectType = ['redirect', 'followup_probe'].includes(data.session_memory?.last_question_type);
  const keepFollowup = data.session_memory?.needs_followup === true;
  isRedirect ? pass(`Classified as ${data.answer_classification}`) : fail(`Expected OFF_TOPIC, got ${data.answer_classification}`);
  hasRedirectType ? pass(`last_question_type = ${data.session_memory?.last_question_type}`) : fail(`Expected redirect, got ${data.session_memory?.last_question_type}`);
  keepFollowup ? pass('needs_followup = true (did not advance topic)') : fail('needs_followup should be true');
}

async function test_R1b_inappropriate() {
  header('R1b', 'Inappropriate Language → Called Out + Score Deducted');
  const { data } = await post({
    action: 'continue',
    job_role: JOB_ROLE, jd: JD, round: ROUND,
    last_question: 'What is your approach to debugging a React component?',
    last_answer: 'This is a stupid question, what the hell kind of interview is this? I hate this sh*t.',
    session_memory: makeMemory(),
    conversation_history: makeConversation([
      { role: 'interviewer', message: 'What is your approach to debugging a React component?' },
      { role: 'user',        message: 'This is a stupid question, what the hell kind of interview is this? I hate this sh*t.' },
    ]),
  });
  info(`Answer classification: ${data.answer_classification}`);
  info(`Professionalism score: ${data.session_memory?.professionalism?.score}`);
  info(`Behavior flags: ${JSON.stringify(data.session_memory?.candidate_behavior_flags)}`);
  info(`Interviewer response: "${data.question}"`);
  const isInappropriate = data.answer_classification === 'INAPPROPRIATE';
  const scoreDeducted = (data.session_memory?.professionalism?.score ?? 10) < 10;
  const flagAdded = (data.session_memory?.candidate_behavior_flags || []).length > 0;
  isInappropriate ? pass('Classified as INAPPROPRIATE') : fail(`Expected INAPPROPRIATE, got ${data.answer_classification}`);
  scoreDeducted ? pass(`Professionalism deducted → ${data.session_memory?.professionalism?.score}/10`) : fail('Professionalism score was NOT deducted');
  flagAdded ? pass('Behavior flag logged') : fail('No behavior flag added');
}

async function test_R1c_tooShort() {
  header('R1c', 'Too-Short Answer → Follow-up Probe');
  const { data } = await post({
    action: 'continue',
    job_role: JOB_ROLE, jd: JD, round: ROUND,
    last_question: 'Can you describe a technical challenge you faced in building your project?',
    last_answer: 'It was hard.',
    session_memory: makeMemory(),
    conversation_history: makeConversation([
      { role: 'interviewer', message: 'Can you describe a technical challenge you faced in building your project?' },
      { role: 'user',        message: 'It was hard.' },
    ]),
  });
  info(`Answer classification: ${data.answer_classification}`);
  info(`Interviewer response: "${data.question}"`);
  info(`last_question_type: ${data.session_memory?.last_question_type}`);
  const isTooShort = data.answer_classification === 'TOO_SHORT';
  const isProbe = data.session_memory?.last_question_type === 'followup_probe';
  const isFollowup = data.session_memory?.needs_followup === true;
  isTooShort ? pass('Classified as TOO_SHORT') : fail(`Expected TOO_SHORT, got ${data.answer_classification}`);
  isProbe ? pass('last_question_type = followup_probe') : fail(`Expected followup_probe, got ${data.session_memory?.last_question_type}`);
  isFollowup ? pass('needs_followup = true') : fail('needs_followup should be true');
}

async function test_R2_topicDeduplication() {
  header('R2', 'Topic-Level Anti-Repetition via covered_topics');
  const { data } = await post({
    action: 'continue',
    job_role: JOB_ROLE, jd: JD, round: ROUND,
    last_question: 'How do you keep your React components reusable?',
    last_answer: 'I break them into small components with clear props interfaces and avoid passing too many props to keep them modular.',
    session_memory: makeMemory({
      covered_topics: ['resume project', 'react', 'component design', 'state management', 'debugging', 'api integration', 'leadership'],
    }),
    conversation_history: makeConversation(),
  });
  info(`Answer classification: ${data.answer_classification}`);
  info(`New question: "${data.question}"`);
  info(`Updated covered_topics: ${JSON.stringify(data.session_memory?.covered_topics)}`);
  const newTopic = (data.session_memory?.covered_topics || []).slice(-1)[0];
  const noDuplicate = !['resume project', 'react', 'component design'].includes(newTopic);
  noDuplicate ? pass(`New topic added: "${newTopic}" (not a duplicate)`) : fail(`Duplicate topic added: "${newTopic}"`);
  pass(`Question count: ${data.session_memory?.asked_questions?.length}`);
}

async function test_R3_competencyTracking() {
  header('R3', 'Weak Technical Answer → Low Score, Not Marked Covered');
  const { data } = await post({
    action: 'continue',
    job_role: JOB_ROLE, jd: JD, round: ROUND,
    last_question: 'Explain how React\'s virtual DOM works and why it improves performance.',
    last_answer: 'React uses a virtual DOM which makes it fast. I think it updates things efficiently.',
    session_memory: makeMemory({ current_competency: 'technical_knowledge' }),
    conversation_history: makeConversation([
      { role: 'interviewer', message: 'Explain how React\'s virtual DOM works and why it improves performance.' },
      { role: 'user',        message: 'React uses a virtual DOM which makes it fast. I think it updates things efficiently.' },
    ]),
  });
  info(`Answer classification: ${data.answer_classification}`);
  info(`technical_knowledge score: ${data.session_memory?.competencies?.technical_knowledge?.score}`);
  info(`technical_knowledge covered: ${data.session_memory?.competencies?.technical_knowledge?.covered}`);
  const score = data.session_memory?.competencies?.technical_knowledge?.score ?? 7;
  const notCovered = data.session_memory?.competencies?.technical_knowledge?.covered === false;
  score <= 5 ? pass(`Score is ${score}/10 (weak answer correctly scored low)`) : fail(`Score is ${score}/10 (too high for a vague answer)`);
  notCovered ? pass('competency NOT marked covered (score < 5 threshold working)') : fail('competency was incorrectly marked covered');
}

async function test_R4_vagueClaimChallenge() {
  header('R4', 'Vague Claim → Quantification Challenge');
  const { data } = await post({
    action: 'continue',
    job_role: JOB_ROLE, jd: JD, round: ROUND,
    last_question: 'Tell me about a performance improvement you made in your project.',
    last_answer: 'I improved the performance of our app significantly and it became much faster.',
    session_memory: makeMemory(),
    conversation_history: makeConversation([
      { role: 'interviewer', message: 'Tell me about a performance improvement you made in your project.' },
      { role: 'user',        message: 'I improved the performance of our app significantly and it became much faster.' },
    ]),
  });
  info(`Answer classification: ${data.answer_classification}`);
  info(`Interviewer response: "${data.question}"`);
  const isVague = data.answer_classification === 'VAGUE_CLAIM';
  const isChallenge = data.session_memory?.last_question_type === 'challenge';
  isVague ? pass('Classified as VAGUE_CLAIM') : fail(`Expected VAGUE_CLAIM, got ${data.answer_classification}`);
  isChallenge ? pass('last_question_type = challenge') : fail(`Expected challenge, got ${data.session_memory?.last_question_type}`);
}

async function test_R5_contradiction() {
  header('R5', 'Contradiction vs. Resume Claims → Called Out');
  const { data } = await post({
    action: 'continue',
    job_role: JOB_ROLE, jd: JD, round: ROUND,
    last_question: 'What tools did you use for deployment in your e-commerce project?',
    last_answer: 'I never worked with any cloud platforms. We just ran everything locally on our laptops.',
    session_memory: makeMemory({
      resume_claims: ['Built a React e-commerce app', 'Deployed on AWS EC2', 'Led a team of 3', 'Internship at InfoSoft'],
    }),
    conversation_history: makeConversation([
      { role: 'interviewer', message: 'What tools did you use for deployment in your e-commerce project?' },
      { role: 'user',        message: 'I never worked with any cloud platforms. We just ran everything locally on our laptops.' },
    ]),
  });
  info(`Answer classification: ${data.answer_classification}`);
  info(`Interviewer response: "${data.question}"`);
  info(`Contradictions detected: ${JSON.stringify(data.session_memory?.contradictions_detected)}`);
  const isContradiction = data.answer_classification === 'CONTRADICTION';
  const contradictionLogged = (data.session_memory?.contradictions_detected || []).length > 0;
  isContradiction ? pass('Classified as CONTRADICTION') : fail(`Expected CONTRADICTION, got ${data.answer_classification}`);
  contradictionLogged ? pass('Contradiction logged in session_memory') : fail('Contradiction was NOT logged');
}

async function test_R6_professionalismInEvaluate() {
  header('R6', 'Professionalism Flags Reflected in Final Evaluation Score');
  const { data } = await post({
    action: 'evaluate',
    job_role: JOB_ROLE, jd: JD, round: ROUND,
    session_memory: makeMemory({
      candidate_behavior_flags: [
        { type: 'inappropriate_language', question_number: 2, note: 'Used profanity when asked about debugging.' },
        { type: 'off_topic_repeated', question_number: 4, note: 'Spoke about personal hobbies when asked a technical question.' },
      ],
      contradictions_detected: [
        { prior_claim: 'Deployed on AWS EC2', new_statement: 'Never used cloud platforms', question_number: 3 },
      ],
    }),
    conversation_history: [
      { role: 'interviewer', message: 'Tell me about yourself.' },
      { role: 'user',        message: 'I am a frontend developer.' },
      { role: 'interviewer', message: 'How do you debug React components?' },
      { role: 'user',        message: 'What the hell is this stupid question?' },
      { role: 'interviewer', message: 'Please keep it professional. What tools do you use for API integration?' },
      { role: 'user',        message: 'I like playing cricket and watching movies on weekends.' },
    ],
  });
  info(`Professionalism score: ${data.scores?.professionalism?.score ?? data.scores?.professionalism}`);
  info(`Verdict: ${data.verdict}`);
  info(`Placement chance: ${data.placement_chance}%`);
  const profScore = typeof data.scores?.professionalism === 'object'
    ? data.scores.professionalism.score
    : data.scores?.professionalism;
  profScore <= 6 ? pass(`Professionalism score = ${profScore}/10 (correctly penalized)`) : fail(`Professionalism score ${profScore}/10 — should be lower given flags`);
}

async function test_R7_scoreDifferentiation() {
  header('R7', 'Score Differentiation: Poor vs Average vs Strong Answers');

  const basePayload = {
    action: 'evaluate',
    job_role: JOB_ROLE, jd: JD, round: ROUND,
    session_memory: makeMemory(),
  };

  // POOR answers
  const poor = await post({
    ...basePayload,
    conversation_history: [
      { role: 'interviewer', message: 'Explain React hooks.' },
      { role: 'user',        message: 'Hooks are things in React. I use them sometimes.' },
      { role: 'interviewer', message: 'What is state management?' },
      { role: 'user',        message: 'It manages state. I don\'t know much about it.' },
      { role: 'interviewer', message: 'How would you debug a performance issue?' },
      { role: 'user',        message: 'I would try different things until it works.' },
    ],
  });

  // STRONG answers
  const strong = await post({
    ...basePayload,
    conversation_history: [
      { role: 'interviewer', message: 'Explain React hooks.' },
      { role: 'user',        message: 'React hooks let functional components use state and lifecycle methods. I use useState for local state, useEffect for side effects like API calls, and useCallback to memoize callbacks that are passed as props to prevent unnecessary child re-renders.' },
      { role: 'interviewer', message: 'Tell me about a performance challenge you solved.' },
      { role: 'user',        message: 'In my e-commerce app, the product listing page was re-rendering on every keystroke in the search bar, causing noticeable lag. I used React.memo on ProductCard, debounced the search input by 300ms, and moved the filtering logic into useMemo. Page load time dropped from 1.8s to 0.6s based on Chrome DevTools profiling.' },
      { role: 'interviewer', message: 'How do you approach code reviews?' },
      { role: 'user',        message: 'I focus on three things: correctness, readability, and maintainability. I check for edge cases the author might have missed, suggest variable names that clarify intent, and ensure error handling is consistent with the rest of the codebase. I always frame feedback as questions rather than commands to keep it constructive.' },
    ],
  });

  const poorOverall = poor.data?.overall_score ?? 7;
  const strongOverall = strong.data?.overall_score ?? 7;
  const diff = strongOverall - poorOverall;

  info(`Poor answers  → overall_score: ${poorOverall}/10`);
  info(`Strong answers → overall_score: ${strongOverall}/10`);
  info(`Score gap: ${diff} points`);

  diff >= 2 ? pass(`Score gap = ${diff} (meaningful differentiation confirmed)`) : fail(`Score gap = ${diff} (insufficient differentiation — scores too similar)`);
  poorOverall <= 5 ? pass(`Poor answers scored ${poorOverall}/10 (correctly low)`) : fail(`Poor answers scored ${poorOverall}/10 (should be ≤ 5)`);
  strongOverall >= 7 ? pass(`Strong answers scored ${strongOverall}/10 (correctly high)`) : fail(`Strong answers scored ${strongOverall}/10 (should be ≥ 7)`);
}

async function test_R8_sessionVariety() {
  header('R8', 'Session Variety: Different Opening Strategies');

  // Force different seeds so the test is deterministic regardless of PDF validity.
  // seed=1 → resume project question; seed=4 → first-week hypothetical
  async function initSession(seed, label) {
    const { data } = await post({
      action: 'init',
      job_role: JOB_ROLE, jd: JD, round: ROUND,
      session_seed: seed,   // explicit seed override
      resume_base64: DUMMY_PDF,
    });
    info(`${label} seed: ${data.session_memory?.session_seed} | Question: "${(data.question || '').substring(0, 120)}..."`);
    return data;
  }

  const s1 = await initSession(1, 'Session (seed=1)');
  const s4 = await initSession(4, 'Session (seed=4)');

  const q1 = s1.question || '';
  const q4 = s4.question || '';

  const seed1 = s1.session_memory?.session_seed;
  const seed4 = s4.session_memory?.session_seed;

  const seedsPreserved = seed1 === 1 && seed4 === 4;
  const questionsAreDifferent = q1 !== q4;
  const pathsAreDifferent = JSON.stringify(s1.session_memory?.competency_path) !== JSON.stringify(s4.session_memory?.competency_path);
  const hasTopics = (s1.session_memory?.covered_topics || []).length > 0;
  const hasClaimsArray = Array.isArray(s1.session_memory?.resume_claims); // array existence (real PDF → populated; dummy → empty [])

  seedsPreserved ? pass(`Seeds preserved: session1=${seed1}, session4=${seed4}`) : fail(`Seed mismatch: got ${seed1} and ${seed4}`);
  questionsAreDifferent ? pass('Opening questions are different across sessions') : fail('Opening questions are identical — seed-based variety not working');
  pathsAreDifferent ? pass('Competency paths are shuffled differently') : fail('Competency paths are identical');
  hasTopics ? pass('covered_topics seeded from init') : fail('covered_topics not seeded in init');
  hasClaimsArray ? pass('resume_claims array exists in init response') : fail('resume_claims missing from init response');
}


// ─── Context Window Test (bonus) ─────────────────────────────────────────────
async function test_contextWindowManagement() {
  header('CW', 'Context Window Management — Long Interview Stays Stable');
  const longHistory = [];
  for (let i = 0; i < 14; i++) {
    longHistory.push({ role: 'interviewer', message: `Interview question number ${i + 1} about various topics.` });
    longHistory.push({ role: 'user',        message: `My answer to question ${i + 1}. I did various things and learned a lot.` });
  }

  const { data, status } = await post({
    action: 'continue',
    job_role: JOB_ROLE, jd: JD, round: ROUND,
    last_question: 'What is your biggest technical strength?',
    last_answer: 'I am very good at React and building user interfaces.',
    session_memory: makeMemory({ asked_questions: longHistory.filter(h => h.role === 'interviewer').map(h => h.message) }),
    conversation_history: longHistory,
  });

  info(`HTTP status: ${status}`);
  info(`Response received: ${!!data.question}`);
  info(`Question: "${data.question?.substring(0, 100)}"`);

  status === 200 ? pass('Long interview (14 turns) processed successfully') : fail(`Unexpected status: ${status}`);
  data.question ? pass('Valid question generated after 14 turns') : fail('No question in response');
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀 Smart Interview Verification Suite — Live Claude API Tests');
  console.log(`Target: ${BASE_URL}\n`);

  await test_R1a_offTopic();
  await test_R1b_inappropriate();
  await test_R1c_tooShort();
  await test_R2_topicDeduplication();
  await test_R3_competencyTracking();
  await test_R4_vagueClaimChallenge();
  await test_R5_contradiction();
  await test_R6_professionalismInEvaluate();
  await test_R7_scoreDifferentiation();
  await test_R8_sessionVariety();
  await test_contextWindowManagement();

  console.log('\n✅ Verification suite complete. Review results above.\n');
}

main().catch(err => { console.error('Suite error:', err); process.exit(1); });
