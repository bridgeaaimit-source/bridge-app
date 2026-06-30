/**
 * Profile script: estimate token counts for the GD evaluation prompt
 * Run: node scratch/profile-eval-prompt.js
 */
const fs = require('fs');
const path = require('path');

// Simple token estimator (1 token ≈ 4 chars for English text)
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

// Simulate a realistic 10-minute GD session (30 total turns, ~5 student turns)
const topic = "Artificial Intelligence in Modern Healthcare: Opportunities and Challenges";
const studentName = "Rahul Sharma";
const elapsedSeconds = 600;

const simulatedTurns = [
  { speakerId: 'moderator', personaName: 'Nalini', text: "Welcome everyone. Today's topic is Artificial Intelligence in Modern Healthcare: Opportunities and Challenges. We have Vikram, Rohan, Anjali, Dev, and our candidate Rahul Sharma. Please begin your discussion. You have 10 minutes.", type: 'opening' },
  { speakerId: 'aggressive', personaName: 'Vikram', text: "AI is already transforming diagnostics. Deep learning models can detect cancer from imaging with 95% accuracy — outperforming many radiologists. We should fully embrace this rather than being cautious.", type: 'debate' },
  { speakerId: 'student', text: "I think AI has enormous potential in healthcare, but we need to be careful about patient data privacy. While diagnostic accuracy is impressive, we must ensure that AI systems are trained on diverse datasets to avoid bias in outcomes for underrepresented populations.", type: 'debate' },
  { speakerId: 'analytical', personaName: 'Rohan', text: "Rahul raises a valid point about bias. A 2023 NIH study showed that AI diagnostic systems had 35% higher error rates for darker skin tones when trained primarily on Western patient data. The GDPR in Europe and India's DPDP Act both require algorithmic accountability.", type: 'debate' },
  { speakerId: 'contrarian', personaName: 'Anjali', text: "But these concerns are being used to delay genuinely life-saving technology. In rural India, there are only 1.3 doctors per 1000 people. AI-assisted diagnosis could immediately serve 600 million underserved patients. We cannot let perfect be the enemy of good.", type: 'debate' },
  { speakerId: 'balanced', personaName: 'Dev', text: "Both perspectives have merit. Perhaps a graduated rollout — starting with AI as a decision support tool rather than autonomous diagnosis — would address the safety concerns while still expanding access.", type: 'debate' },
  { speakerId: 'student', text: "Dev makes an excellent point. I'd add that the implementation model matters as much as the technology itself. Countries like Estonia have shown that federated learning — where AI trains on distributed data without centralizing patient records — can address both privacy and bias simultaneously. This could be particularly relevant for India's diverse population.", type: 'debate' },
  { speakerId: 'aggressive', personaName: 'Vikram', text: "The federated learning approach is theoretically sound but computationally expensive. Many rural hospitals that need this most lack the infrastructure to participate in federated networks.", type: 'debate' },
  { speakerId: 'analytical', personaName: 'Rohan', text: "That's where public-private partnerships become essential. ISRO has demonstrated satellite connectivity to remote areas. Combining this with cloud-based AI inference — where processing happens at the server — could bypass local infrastructure limitations entirely.", type: 'debate' },
  { speakerId: 'student', text: "I think we're converging on an important insight: the technology is ready, but the ecosystem needs to catch up. What I'd propose is a three-pronged approach — invest in data infrastructure first, use AI in an advisory capacity during the transition, and build clear regulatory frameworks before autonomous deployment. This balances urgency with responsibility.", type: 'debate' },
  { speakerId: 'contrarian', personaName: 'Anjali', text: "That framework sounds reasonable, but who funds the data infrastructure? The government's health budget is already stretched thin.", type: 'debate' },
  { speakerId: 'balanced', personaName: 'Dev', text: "Impact investing in health AI has grown 400% since 2020. The funding challenge is solvable if the regulatory environment is clear — which brings us back to Rahul's point about frameworks.", type: 'debate' },
  { speakerId: 'student', text: "Exactly, Dev. And I'd argue that India is uniquely positioned here — we have both the technological talent and the scale of health challenges that make AI solutions economically viable. AIIMS Delhi's collaboration with Google Health for diabetic retinopathy screening is already proving this model works at scale.", type: 'debate' },
  { speakerId: 'moderator', personaName: 'Nalini', text: "Thank you all for a rich discussion. We're approaching time.", type: 'closing' },
];

const studentTurns = simulatedTurns.filter(t => t.speakerId === 'student');

const transcriptText = simulatedTurns
  .filter(t => t.speakerId !== 'moderator' || t.type === 'opening' || t.type === 'closing')
  .map(t => {
    const name = t.speakerId === 'student' ? studentName : (t.personaName || t.speakerId);
    return `${name}: "${t.text}"`;
  })
  .join('\n');

const studentContributions = studentTurns
  .map((t, i) => `Contribution ${i + 1}: "${t.text}"`)
  .join('\n');

// ─── CURRENT 9-dimension prompt ───
const currentPrompt = `You are an expert Group Discussion evaluator for Indian MBA and engineering placement interviews.

TOPIC: "${topic}"
DURATION: ${Math.round(elapsedSeconds / 60)} minutes
STUDENT NAME: ${studentName}
TOTAL STUDENT CONTRIBUTIONS: ${studentTurns.length}

FULL TRANSCRIPT:
${transcriptText}

STUDENT'S CONTRIBUTIONS ONLY:
${studentContributions}

Evaluate ${studentName}'s performance across exactly 9 dimensions. Be REALISTIC and SPECIFIC — reference actual transcript moments, not generic observations. Most students score 50-75. Only exceptional performance deserves 80+. Weak or absent performance should score 20-45.

CRITICAL RULES:
- Every evidence quote MUST be the actual text the student said, taken directly from their contributions above.
- Improvement suggestions must be actionable exercises, not vague advice.
- Do NOT give the same score to every dimension.
- Consider QUALITY of contributions, not just quantity.

You MUST return ONLY valid JSON. No markdown, no explanations, no code fences.

Return exactly one JSON object with: overallScore, summary, strongestMoment, growthArea, dimensions (9 keys each with score/grade/summary/evidence[]/improvement/exercise), overallAnalysis (totalScore, communication/10, logicalFlow/10, contentQuality/10, persuasiveness/10, summary, topStrength, topWeakness, actionItems[3]).`;

// ─── PROPOSED 5-dimension prompt ───
const newPrompt = `You are an expert Group Discussion evaluator for Indian placement interviews.

TOPIC: "${topic}"
DURATION: ${Math.round(elapsedSeconds / 60)} minutes
STUDENT: ${studentName} (${studentTurns.length} contributions)

FULL TRANSCRIPT:
${transcriptText}

STUDENT CONTRIBUTIONS:
${studentContributions}

Evaluate ${studentName} across 5 recruiter-critical dimensions. Be SPECIFIC — quote actual student text. Most students score 50-75; reserve 80+ for exceptional performance.

SCORING WEIGHTS: Communication 25% | Critical Thinking 25% | Leadership & Collaboration 20% | Persuasiveness 15% | Participation Quality 15%

Return ONLY a valid JSON object. No markdown, no code fences, no explanation text.

Schema:
{
  "overallScore": number (0-100, weighted average per above weights),
  "summary": "2-3 sentence honest assessment referencing specific discussion moments",
  "strongestMoment": "exact quote of the single best student contribution",
  "growthArea": "the single most important improvement area",
  "dimensions": {
    "communication": { "score": number, "grade": "A|B|C|D|F", "summary": "2 specific sentences", "evidence": [{"quote":"exact student quote","annotation":"what this shows"}], "improvement": "one actionable improvement", "exercise": "one 5-min daily drill" },
    "criticalThinking": { "score": number, "grade": "A|B|C|D|F", "summary": "2 specific sentences. Secondary signals: evidence usage, logical structure, data-backed claims.", "evidence": [{"quote":"...","annotation":"..."}], "improvement": "...", "exercise": "..." },
    "leadershipCollaboration": { "score": number, "grade": "A|B|C|D|F", "summary": "2 specific sentences. Secondary signals: initiating threads, building on others, steering discussion.", "evidence": [{"quote":"...","annotation":"..."}], "improvement": "...", "exercise": "..." },
    "persuasiveness": { "score": number, "grade": "A|B|C|D|F", "summary": "2 specific sentences. Secondary signals: confidence, conviction, argument framing.", "evidence": [{"quote":"...","annotation":"..."}], "improvement": "...", "exercise": "..." },
    "participationQuality": { "score": number, "grade": "A|B|C|D|F", "summary": "2 specific sentences. Secondary signals: listening, relevance of jumps, timing.", "evidence": [{"quote":"...","annotation":"..."}], "improvement": "...", "exercise": "..." }
  },
  "overallAnalysis": {
    "totalScore": number,
    "communication": number (0-10),
    "logicalFlow": number (0-10),
    "contentQuality": number (0-10),
    "persuasiveness": number (0-10),
    "summary": "...",
    "topStrength": "...",
    "topWeakness": "...",
    "actionItems": ["item 1", "item 2", "item 3"]
  }
}`;

const currentTokens = estimateTokens(currentPrompt);
const newTokens = estimateTokens(newPrompt);

// Estimate response sizes
// Current: 9 dims × ~300 tokens per dim + ~200 header = ~2900 output tokens
// New: 5 dims × ~250 tokens per dim + ~200 header = ~1450 output tokens
const currentOutputEstimate = 9 * 300 + 200;
const newOutputEstimate = 5 * 250 + 200;

console.log('\n====================================================');
console.log('   GD Evaluation Prompt Profiling Report           ');
console.log('====================================================\n');

console.log('── Prompt Construction ──────────────────────────');
console.log(`Transcript turns (total):     ${simulatedTurns.length}`);
console.log(`Student turns:                ${studentTurns.length}`);
console.log(`Transcript text length:       ${transcriptText.length} chars`);
console.log(`Student contributions length: ${studentContributions.length} chars`);

console.log('\n── Current 9-Dimension Schema ───────────────────');
console.log(`Full prompt length:           ${currentPrompt.length} chars`);
console.log(`Estimated input tokens:       ~${currentTokens.toLocaleString()}`);
console.log(`Estimated output tokens:      ~${currentOutputEstimate.toLocaleString()}`);
console.log(`Estimated total tokens:       ~${(currentTokens + currentOutputEstimate).toLocaleString()}`);
console.log(`Estimated cost @ Sonnet 4.5:  $${((currentTokens * 3 + currentOutputEstimate * 15) / 1e6).toFixed(4)}`);

console.log('\n── Proposed 5-Dimension Schema ──────────────────');
console.log(`Full prompt length:           ${newPrompt.length} chars`);
console.log(`Estimated input tokens:       ~${newTokens.toLocaleString()}`);
console.log(`Estimated output tokens:      ~${newOutputEstimate.toLocaleString()}`);
console.log(`Estimated total tokens:       ~${(newTokens + newOutputEstimate).toLocaleString()}`);
console.log(`Estimated cost @ Sonnet 4.5:  $${((newTokens * 3 + newOutputEstimate * 15) / 1e6).toFixed(4)}`);

console.log('\n── Savings ──────────────────────────────────────');
const tokenSaving = (currentTokens + currentOutputEstimate) - (newTokens + newOutputEstimate);
const pctSaving = ((tokenSaving / (currentTokens + currentOutputEstimate)) * 100).toFixed(1);
console.log(`Token reduction:              ~${tokenSaving.toLocaleString()} tokens (${pctSaving}% less)`);
console.log(`Output reduction:             ${currentOutputEstimate - newOutputEstimate} tokens (~${(((currentOutputEstimate - newOutputEstimate) / currentOutputEstimate) * 100).toFixed(0)}% less completion)`);
console.log(`Latency impact:               Output tokens dominate inference time.`);
console.log(`                              Fewer output tokens = significantly faster response.`);

console.log('\n── Root Cause of 45s Timeout ────────────────────');
console.log(`Claude Sonnet 4.5 output speed: ~40-60 tokens/sec`);
console.log(`Current output estimate:        ~${currentOutputEstimate} tokens`);
console.log(`Estimated generation time:      ${(currentOutputEstimate/50).toFixed(0)}-${(currentOutputEstimate/40).toFixed(0)}s for completion alone`);
console.log(`TTFB (first token) overhead:    ~3-8s`);
console.log(`Total inference estimate:       ~${(3 + currentOutputEstimate/50).toFixed(0)}-${(8 + currentOutputEstimate/40).toFixed(0)}s`);
console.log(`→ 45s timeout is too tight for ~${currentOutputEstimate} output tokens.`);
console.log(`\nWith 5-dimension schema (~${newOutputEstimate} tokens):`);
console.log(`   Estimated inference:         ~${(3 + newOutputEstimate/50).toFixed(0)}-${(8 + newOutputEstimate/40).toFixed(0)}s`);
console.log(`   → Should comfortably fit in 45s on normal runs.`);
console.log(`   → Recommend raising default timeout to 90s for safety margin.`);

console.log('\n── maxDuration vs EVALUATION_TIMEOUT_MS ─────────');
console.log('maxDuration = 60 → Next.js kills the serverless function at 60s hard');
console.log('EVALUATION_TIMEOUT_MS = 45000 → Our Promise.race rejects at 45s');
console.log('Issue: Even if LLM replies at 55s, Next.js kills before Firestore write.');
console.log('Fix: Raise maxDuration to 120 + timeout to 90000ms.');

console.log('\n====================================================\n');
