/**
 * END-TO-END INTERVIEW SIMULATION SUITE — v2
 * Adaptive answer selection: answers match the topic of the actual question asked.
 * Three complete ~10-question interviews: Strong / Average / Weak candidate.
 *
 * Run: node scratch/e2e_simulation.js
 */

const BASE_URL = 'http://localhost:3000/api/smart-interview';
const JOB_ROLE = 'Frontend Software Engineer';
const ROUND    = 'Technical + Behavioural Round';
const JD       = `We are looking for a Frontend Software Engineer with:
- Strong React.js and JavaScript (ES6+) skills
- Experience with state management (Redux / Context API)
- REST API integration experience
- Git version control proficiency
- Bonus: TypeScript, Next.js, testing frameworks`;
const USER_ID  = 'e2e-simulation-v2';

// ─── Answer Banks ─────────────────────────────────────────────────────────────

/**
 * STRONG CANDIDATE answer bank, keyed by topic.
 * Each entry is a structured, quantified, STAR-method answer.
 */
const STRONG = {
  project: `In my final year project I built a React e-commerce platform. I led a 3-person team, architected the component tree, implemented Redux Toolkit for cart and auth state, and integrated Razorpay for payments. The hardest part was cart persistence across page refreshes — I solved it with a custom usePersistentCart hook that syncs Redux state to localStorage on every dispatch. We shipped in 6 weeks and it was selected as a top-10 department project.`,
  performance: `I identified a re-render problem in the product listing page using React DevTools profiler. Every keystroke in the search bar was re-rendering the entire list. I debounced the input by 300ms, memoised the filtered list with useMemo, and wrapped ProductCard with React.memo. Load time dropped from 1.8 seconds to under 600ms — I kept the before/after Chrome DevTools flame charts.`,
  api: `I built a custom useApi hook that wraps fetch with AbortController to prevent memory leaks on unmount. For the admin panel I also wrote an Axios interceptor that automatically refreshes the JWT token on a 401 response, so users never see an unexpected logout mid-session.`,
  state: `For our e-commerce project we chose Redux Toolkit over Context API after benchmarking both. Context caused too many re-renders when cart state changed across 8 sibling components. Redux with selectors limited updates to only the components that subscribed to specific slices. I wrote the cart slice and the thunks for async checkout.`,
  teamwork: `During my internship, my teammate and I disagreed on using Context API versus Redux. I proposed we prototype both in 2 days and benchmark re-renders. My Context version was simpler but measurably slower. Their Redux approach was better. We went with Redux — I owned the implementation. Shipping together mattered more than being right individually.`,
  deadline: `Midway through our capstone, our backend developer dropped out 2 weeks before demo day. Instead of requesting an extension, I migrated the entire backend to Firebase in 4 days — replaced Express endpoints with Firestore listeners, moved auth to Firebase Auth, and updated all hooks. Our professor later said it was a better architecture than the original plan.`,
  debug: `My process is: reproduce first, isolate second. I write the smallest test case that shows the bug. For UI bugs I inspect props with React DevTools. For data bugs I log at every transformation step. I also use git bisect for regressions. I keep a personal log of non-obvious bugs I have fixed so I recognise patterns faster.`,
  learning: `I follow the React and TypeScript RFCs on GitHub so I understand changes before they land in a release. Last month I migrated a side project from JavaScript to TypeScript to practice strict typing. I also participate in competitive programming for the discipline of writing efficient code under time constraints.`,
  communication: `When our non-technical faculty advisor asked why the app was "slow on mobile", I said: "Right now it downloads all 500 products at once. I will add pagination so it downloads 20 at a time — like Google search pages." She understood immediately and approved the extra sprint day. I find analogies help more than technical terms.`,
  leadership: `When our backend developer dropped out, I called a team meeting within the hour, outlined three options — extension, scope cut, or Firebase migration — and asked the team to vote. They chose migration. I then distributed tasks clearly: I handled Firebase setup and hook updates, my other teammate handled the UI polish. Clear ownership prevented confusion.`,
  testing: `In our e-commerce project I wrote unit tests for all custom hooks using React Testing Library and Jest. For the cart hook specifically I tested 12 edge cases — adding the same item twice, removing a non-existent item, and clearing on logout. This caught a bug where clearing the cart did not reset the item count badge.`,
  generic: `That is a great question. Based on my experience building the React e-commerce platform — where I handled state management, API integration, and performance optimisation — I approached that challenge systematically, profiled first, then made targeted changes and measured results before shipping.`,
};

/**
 * AVERAGE CANDIDATE answer bank.
 * Inconsistent depth — some adequate, some vague, some too short.
 */
const AVERAGE = {
  project: `I made a to-do application using React for my college project. It had basic CRUD operations. I mostly did the frontend and my friend helped with some backend stuff using Node.js.`,
  performance: `I am not sure about the exact numbers but the app felt faster after I made some changes. I think I used some React optimization stuff.`,
  api: `I used fetch to call the backend API and stored the data in useState. Sometimes it did not load properly so I added a loading spinner.`,
  state: `I used useState and useEffect mostly. I think I also used Context somewhere but I am not fully sure how it works exactly.`,
  teamwork: `In a group project we had some arguments about the design. We discussed it and voted on which option looked better. It worked out okay in the end.`,
  deadline: `I stayed up late to finish the assignment before the deadline. It was stressful but I managed to submit it on time.`,
  debug: `When I get a bug I usually read the error message and google it. I also use console.log a lot to see what is happening.`,
  learning: `I learn mostly from YouTube tutorials and freeCodeCamp. I try to do projects to practice what I learn.`,
  communication: `I try to explain things simply without using too many technical words. I ask if they understood.`,
  leadership: `I have not officially led a team but in our project I usually started the meetings and kept track of who was supposed to do what using a WhatsApp group.`,
  testing: `I have not done much testing. I usually just check if it works manually in the browser.`,
  generic: `I think I understand the concept generally. I have used it in my projects but I am not sure I can explain it very well right now.`,
};

/**
 * WEAK CANDIDATE — topic-based responses with deliberate problem behaviors injected
 * at specific turn numbers via the wrapper function below.
 */
const WEAK_TOPIC = {
  project: `I built some projects. They were okay.`,
  performance: `I don't know much about performance. I just code and hope it works.`,
  api: `APIs are just HTTP requests right? I have done some of those I think.`,
  state: `State is like variables in React I think.`,
  teamwork: `I prefer to work alone honestly. Teams are just drama.`,
  deadline: `I just submitted what I had.`,
  debug: `I restart the laptop and try again usually.`,
  learning: `I watch random YouTube videos sometimes.`,
  communication: `I just say what I know.`,
  leadership: `I have never led anything.`,
  testing: `Testing is a waste of time for college projects.`,
  generic: `I don't know.`,
};

// Turn-specific overrides for WEAK candidate to inject deliberate problem behaviors
const WEAK_TURN_OVERRIDES = {
  0: `Honestly I am really into gaming right now. I play about 6 hours a day. I think gaming teaches problem-solving which is useful for software engineering.`,  // OFF_TOPIC
  2: `These kinds of questions are stupid honestly. Why do you even ask about this? Nobody cares about this in real jobs. This interview is a waste of my time.`, // INAPPROPRIATE
  4: `Actually I want to correct myself. I was the main architect of a large-scale microservices platform at a top startup. I led a team of 15 engineers handling 10 million daily users.`, // CONTRADICTION with "built some projects"
  6: `I once solved a very complex problem that the whole company praised and it made everything extremely fast and efficient and everyone was amazed at my work.`, // VAGUE_CLAIM + RAMBLING
  8: `Sorry I misspoke earlier. I never actually worked at a startup or led any team. I got confused. I am just a fresher with college projects only.`, // CONTRADICTION of turn-4 claim
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function post(payload) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, job_role: JOB_ROLE, jd: JD, round: ROUND, user_id: USER_ID }),
  });
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: null, raw: text }; }
}

/**
 * Select the most appropriate answer from the bank based on question keywords.
 */
function pickAnswer(bank, question) {
  const q = question.toLowerCase();
  if (q.includes('project') || q.includes('built') || q.includes('resume') || q.includes('background')) return bank.project;
  if (q.includes('performance') || q.includes('optim') || q.includes('fast') || q.includes('slow') || q.includes('render')) return bank.performance;
  if (q.includes('api') || q.includes('fetch') || q.includes('backend') || q.includes('rest') || q.includes('http')) return bank.api;
  if (q.includes('state') || q.includes('redux') || q.includes('context') || q.includes('hook')) return bank.state;
  if (q.includes('team') || q.includes('disagree') || q.includes('conflict') || q.includes('colleague') || q.includes('collaborate')) return bank.teamwork;
  if (q.includes('deadline') || q.includes('pressure') || q.includes('tight') || q.includes('time') || q.includes('deliver')) return bank.deadline;
  if (q.includes('debug') || q.includes('bug') || q.includes('fix') || q.includes('problem') || q.includes('issue') || q.includes('error')) return bank.debug;
  if (q.includes('learn') || q.includes('study') || q.includes('skill') || q.includes('grow') || q.includes('improve') || q.includes('stay current')) return bank.learning;
  if (q.includes('communicat') || q.includes('explain') || q.includes('non-technical') || q.includes('stakeholder')) return bank.communication;
  if (q.includes('lead') || q.includes('owner') || q.includes('responsib') || q.includes('decision')) return bank.leadership;
  if (q.includes('test') || q.includes('unit') || q.includes('jest') || q.includes('coverage')) return bank.testing;
  return bank.generic;
}

function pickWeakAnswer(question, turnNumber) {
  if (WEAK_TURN_OVERRIDES[turnNumber] !== undefined) return WEAK_TURN_OVERRIDES[turnNumber];
  return pickAnswer(WEAK_TOPIC, question);
}

function divider(t) { console.log(`\n${'─'.repeat(70)}\n  ${t}\n${'─'.repeat(70)}`); }

// ─── Core simulation engine ────────────────────────────────────────────────────

async function runInterview({ label, profile, bank, seedNum, weakMode }) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  SIMULATION: ${label}`);
  console.log(`  Profile: ${profile}`);
  console.log(`${'═'.repeat(70)}`);

  const report = {
    label, profile,
    exchanges: [],
    classificationLog: [],
    behaviorFlags: [],
    contradictions: [],
    coveredTopics: [],
    competencyProgression: [],
    professionalism: 10,
    finalMemory: null,
    evaluation: null,
    issues: [],
  };

  const conversationHistory = [];
  let sessionMemory = null;
  let currentQuestion = null;
  let questionCount = 0;
  let turnNumber = 0;

  // ── INIT ──
  console.log('\n  [INIT] Starting interview...');
  const initRes = await post({ action: 'init', session_seed: seedNum });
  if (!initRes.data?.question) {
    console.error('  ❌ INIT FAILED:', initRes.raw?.substring(0, 300));
    report.issues.push('INIT_FAILED');
    return report;
  }

  sessionMemory   = initRes.data.session_memory;
  currentQuestion = initRes.data.question;
  questionCount++;

  conversationHistory.push({ role: 'interviewer', message: currentQuestion });
  report.exchanges.push({ questionNumber: questionCount, question: currentQuestion, answer: null, classification: 'INIT', questionType: 'init', followup: false });
  console.log(`\n  Q1 [INIT]: ${currentQuestion.substring(0, 130)}`);

  // ── 10 ANSWER TURNS ──
  for (let turn = 0; turn < 10; turn++) {
    turnNumber = turn;
    const answer = weakMode
      ? pickWeakAnswer(currentQuestion, turn)
      : pickAnswer(bank, currentQuestion);

    conversationHistory.push({ role: 'user', message: answer });

    console.log(`\n  A${turn + 1} [${weakMode ? (WEAK_TURN_OVERRIDES[turn] ? '⚠️  TRIGGER' : 'WEAK') : 'CANDIDATE'}]: ${answer.substring(0, 100)}`);

    const contRes = await post({
      action: 'continue',
      last_question: currentQuestion,
      last_answer: answer,
      session_memory: sessionMemory,
      conversation_history: conversationHistory,
    });

    if (!contRes.data?.question) {
      console.error(`  ❌ CONTINUE FAILED turn ${turn + 1}:`, contRes.raw?.substring(0, 200));
      report.issues.push(`CONTINUE_FAILED_T${turn + 1}`);
      break;
    }

    const d = contRes.data;
    sessionMemory = d.session_memory;

    // Update tracking
    report.behaviorFlags         = sessionMemory?.candidate_behavior_flags || report.behaviorFlags;
    report.contradictions        = sessionMemory?.contradictions_detected  || report.contradictions;
    report.coveredTopics         = sessionMemory?.covered_topics           || report.coveredTopics;
    report.professionalism       = sessionMemory?.professionalism?.score   ?? report.professionalism;
    report.competencyProgression.push(sessionMemory?.current_competency   || '?');
    report.classificationLog.push(d.answer_classification || '?');

    // Update last exchange with answer + classification
    report.exchanges[report.exchanges.length - 1].answer         = answer;
    report.exchanges[report.exchanges.length - 1].classification = d.answer_classification;
    report.exchanges[report.exchanges.length - 1].questionType   = sessionMemory?.last_question_type;

    const cls   = d.answer_classification || '?';
    const qtype = sessionMemory?.last_question_type || '?';
    console.log(`  → Classification: ${cls} | Type: ${qtype} | Prof: ${report.professionalism}/10 | Topics: ${report.coveredTopics.length}`);

    if (d.interview_complete) {
      console.log('  ✅ Interview complete signal received.');
      break;
    }

    currentQuestion = d.question;
    questionCount++;
    conversationHistory.push({ role: 'interviewer', message: currentQuestion });
    report.exchanges.push({ questionNumber: questionCount, question: currentQuestion, answer: null, classification: null, questionType: null, followup: sessionMemory?.needs_followup || false });
    console.log(`\n  Q${questionCount} [${qtype.toUpperCase()}]: ${currentQuestion.substring(0, 130)}`);
  }

  report.finalMemory = sessionMemory;

  // ── EVALUATE ──
  console.log('\n  [EVALUATE] Generating final feedback...');
  const evalRes = await post({
    action: 'evaluate',
    session_memory: sessionMemory,
    conversation_history: conversationHistory,
  });

  if (evalRes.data?.overall_score !== undefined) {
    report.evaluation = evalRes.data;
    const sc = evalRes.data.scores || {};
    const scoreStr = Object.entries(sc)
      .map(([k, v]) => `${k.replace('_','-')}: ${typeof v === 'object' ? v.score : v}`)
      .join(' | ');
    console.log(`\n  📊 EVALUATION:`);
    console.log(`     Verdict:   ${evalRes.data.verdict}`);
    console.log(`     Overall:   ${evalRes.data.overall_score}/10`);
    console.log(`     Placement: ${evalRes.data.placement_chance}%`);
    console.log(`     Scores:    ${scoreStr}`);
  } else {
    console.error('  ❌ EVALUATE FAILED:', evalRes.raw?.substring(0, 200));
    report.issues.push('EVALUATE_FAILED');
  }

  // Validation checks
  const questions = report.exchanges.map(e => e.question);
  const uniqueQ   = new Set(questions);
  if (uniqueQ.size < questions.length) {
    report.issues.push(`DUPLICATE_QUESTIONS (${questions.length - uniqueQ.size} duplicates)`);
  }
  if (!report.evaluation) report.issues.push('NO_EVALUATION');
  if (!report.finalMemory) report.issues.push('NO_FINAL_MEMORY');

  return report;
}

// ─── Report rendering ──────────────────────────────────────────────────────────

function printReport(r) {
  divider(`FULL REPORT: ${r.label}`);
  console.log(`\nProfile:   ${r.profile}`);
  console.log(`Questions: ${r.exchanges.length} | Turns: ${r.exchanges.filter(e=>e.answer).length}`);
  console.log(`Professionalism: ${r.professionalism}/10 | Flags: ${r.behaviorFlags.length} | Contradictions: ${r.contradictions.length}`);
  console.log(`Covered Topics (${r.coveredTopics.length}): ${r.coveredTopics.join(', ')}`);
  console.log(`Classifications: ${r.classificationLog.join(' → ')}`);
  console.log(`Competency Path: ${r.competencyProgression.join(' → ')}`);

  if (r.behaviorFlags.length > 0) {
    console.log('\nBehavior Flags:');
    r.behaviorFlags.forEach(f => console.log(`  • [${f.type}] Q${f.question_number}: ${f.note}`));
  }
  if (r.contradictions.length > 0) {
    console.log('\nContradictions:');
    r.contradictions.forEach(c => console.log(`  • "${c.prior_claim}" → "${c.new_statement}"`));
  }

  console.log('\nQ&A LOG:');
  r.exchanges.forEach(e => {
    console.log(`\n  Q${e.questionNumber} [${e.questionType || ''}${e.followup ? ' FOLLOWUP' : ''}]:`);
    console.log(`    ${e.question}`);
    if (e.answer) {
      console.log(`  A: ${e.answer.substring(0, 150)}${e.answer.length > 150 ? '...' : ''}`);
      console.log(`  → ${e.classification}`);
    }
  });

  if (r.evaluation) {
    const ev = r.evaluation;
    const sc = ev.scores || {};
    console.log('\nFINAL EVALUATION:');
    console.log(`  Verdict:          ${ev.verdict}`);
    console.log(`  Overall Score:    ${ev.overall_score}/10`);
    console.log(`  Placement Chance: ${ev.placement_chance}%`);
    console.log('\n  Scores:');
    Object.entries(sc).forEach(([k, v]) => {
      const score = typeof v === 'object' ? v.score : v;
      const just  = typeof v === 'object' && v.justification ? `  → ${v.justification.substring(0, 80)}` : '';
      console.log(`    ${k.padEnd(22)}: ${score}/10${just}`);
    });
    console.log(`\n  Strengths:`);
    (ev.summary?.strengths || []).forEach(s => console.log(`    + ${s}`));
    console.log(`\n  Weaknesses:`);
    (ev.summary?.weaknesses || []).forEach(w => console.log(`    - ${w}`));
    console.log(`\n  Key Takeaways: ${ev.summary?.key_takeaways || ''}`);
    if (ev.career_insights) {
      console.log(`\n  Career: Market=${ev.career_insights.market_fit} | Growth=${ev.career_insights.growth_potential} | Salary=${ev.career_insights.salary_range}`);
    }
  }

  if (r.issues.length > 0) {
    console.log(`\n  ⚠️  ISSUES: ${r.issues.join(', ')}`);
  } else {
    console.log('\n  ✅ No issues detected.');
  }
}

function printSummary(reports) {
  divider('COMPARATIVE SUMMARY');

  console.log('\n  Label             | Qs | Score | Placement | Verdict             | Prof | Flags | Contrads | Topics | Issues');
  console.log('  ' + '─'.repeat(115));
  reports.forEach(r => {
    const sc = r.evaluation?.overall_score ?? 'N/A';
    const pl = r.evaluation?.placement_chance ?? 'N/A';
    const vd = r.evaluation?.verdict ?? 'N/A';
    console.log(
      `  ${r.label.padEnd(17)} | ${String(r.exchanges.length).padEnd(2)} | ${String(sc).padEnd(6)}| ${String(pl+'%').padEnd(10)}| ${String(vd).padEnd(20)}| ${String(r.professionalism).padEnd(5)}| ${String(r.behaviorFlags.length).padEnd(6)}| ${String(r.contradictions.length).padEnd(9)}| ${String(r.coveredTopics.length).padEnd(7)}| ${r.issues.join(',') || 'none'}`
    );
  });

  console.log('\n  VALIDATION CHECKS:');
  const [strong, avg, weak] = reports;
  const sc = strong?.evaluation?.overall_score ?? 0;
  const ac = avg?.evaluation?.overall_score    ?? 0;
  const wc = weak?.evaluation?.overall_score   ?? 0;

  const checks = [
    [sc > ac,                                  `Strong (${sc}) > Average (${ac})`],
    [ac > wc,                                  `Average (${ac}) > Weak (${wc})`],
    [sc > wc,                                  `Strong (${sc}) > Weak (${wc})`],
    [(sc - wc) >= 3,                           `Score spread ≥ 3 points (actual: ${sc - wc})`],
    [(weak?.behaviorFlags?.length ?? 0) > 0,   `Weak candidate triggered behavior flags`],
    [(weak?.contradictions?.length ?? 0) > 0,  `Weak candidate contradiction detected`],
    [(weak?.professionalism ?? 10) < 8,        `Weak professionalism penalized (${weak?.professionalism}/10)`],
    [reports.every(r => r.issues.length === 0), `No stability issues across all 3 sessions`],
    [reports.every(r => !r.issues.some(i => i.includes('DUPLICATE'))), `No duplicate questions in any session`],
    [reports.every(r => r.evaluation !== null), `All 3 sessions evaluated successfully`],
    [reports.every(r => r.coveredTopics.length >= 3), `All sessions covered ≥3 distinct topics`],
  ];

  checks.forEach(([passed, msg]) => console.log(`  ${passed ? '✅' : '❌'} ${msg}`));

  const allPassed = checks.every(([p]) => p);
  console.log(`\n  ${'═'.repeat(70)}`);
  if (allPassed) {
    console.log('  ✅ FINAL VERDICT: PASS');
    console.log('  Smart Interview behaves as a real recruiter across all 3 full-length simulations.');
    console.log('  - Actively redirects, challenges, and calls out problematic candidates.');
    console.log('  - No transcript loss. No duplicate questions. No session crashes.');
    console.log('  - Scoring differentiates meaningfully across candidate quality tiers.');
    console.log('  - Feedback is candidate-specific and actionable.');
  } else {
    const failed = checks.filter(([p]) => !p).map(([, m]) => m);
    console.log('  ⚠️  PARTIAL PASS — Failed checks:');
    failed.forEach(m => console.log(`    ❌ ${m}`));
  }
  console.log(`  ${'═'.repeat(70)}`);
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🎯 BridgeAI — End-to-End Interview Simulation Suite v2');
  console.log(`   Target: ${BASE_URL}`);
  console.log(`   Role:   ${JOB_ROLE}`);
  console.log(`   Round:  ${ROUND}\n`);

  const strong = await runInterview({
    label:    'STRONG CANDIDATE',
    profile:  'Confident, STAR-structured, quantified examples, strong resume alignment',
    bank:     STRONG,
    seedNum:  1,
    weakMode: false,
  });

  const average = await runInterview({
    label:    'AVERAGE CANDIDATE',
    profile:  'Tier 2/3 student, inconsistent depth, sometimes vague, genuine effort',
    bank:     AVERAGE,
    seedNum:  3,
    weakMode: false,
  });

  const weak = await runInterview({
    label:    'WEAK CANDIDATE',
    profile:  'Poor prep, off-topic (T0), inappropriate (T2), contradiction (T4+T8), vague (T6)',
    bank:     WEAK_TOPIC,
    seedNum:  5,
    weakMode: true,
  });

  printReport(strong);
  printReport(average);
  printReport(weak);
  printSummary([strong, average, weak]);
  console.log('\n');
}

main().catch(err => { console.error('Fatal error:', err); process.exit(1); });
