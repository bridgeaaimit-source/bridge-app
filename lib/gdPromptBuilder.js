/**
 * GD Prompt Builder
 * 
 * Assembles the 6-block prompt for each AI participant turn.
 * Handles context compression when conversation history exceeds token budget.
 * 
 * Block 1: Session Context
 * Block 2: Active Persona Descriptor  
 * Block 3: Realism Rules (always included — critical for immersion)
 * Block 4: Moderator Directive (injected only when needed)
 * Block 5: Conversation History (with compression after 6K chars)
 * Block 6: Turn Instruction
 */

import { getPersona, MODERATOR } from './gdPersonas';

const HISTORY_COMPRESSION_THRESHOLD = 5000; // chars before compression kicks in

/**
 * Main prompt builder for AI participant turns.
 * 
 * @param {Object} params
 * @param {string} params.topic
 * @param {string} params.personaId - which AI participant speaks
 * @param {string} params.sessionPhase - 'opening' | 'debate' | 'closing'
 * @param {Array}  params.turns - full turn history [{speakerId, speakerName, text, type}]
 * @param {number} params.elapsedMinutes
 * @param {string|null} params.moderatorDirective
 * @param {string|null} params.lastStudentTurn - text of student's most recent turn (for interruption context)
 * @param {boolean} params.wasInterrupted - student interrupted this persona mid-turn
 * @param {string} params.studentName
 * @param {Object} params.personaNames - { personaId: displayName }
 * @param {string} params.turnType - 'opening' | 'debate' | 'question' | 'rebuttal' | 'support' | 'summary' | 'closing'
 * @returns {string} complete prompt
 */
export function buildTurnPrompt({
  topic,
  personaId,
  sessionPhase,
  turns = [],
  elapsedMinutes = 0,
  moderatorDirective = null,
  lastStudentTurn = null,
  wasInterrupted = false,
  studentName = 'the student',
  personaNames = {},
  turnType = 'debate',
  difficulty = 'intermediate',
  language = 'en-IN',
}) {
  const persona = getPersona(personaId);
  if (!persona) throw new Error(`Unknown persona: ${personaId}`);

  const historyText = buildHistory(turns, personaNames, studentName);
  const lastTurn = turns[turns.length - 1];
  const lastSpeakerName = lastTurn
    ? (personaNames[lastTurn.speakerId] || lastTurn.speakerId)
    : '';
  const lastTurnExcerpt = lastTurn
    ? (lastTurn.text || '').slice(0, 200)
    : '';

  // ── Block 1: Session Context ───────────────────────────────────────────────
  const block1 = `=== SESSION CONTEXT ===
This is a campus placement Group Discussion round run by a company's HR panel in India
(the kind held by firms such as Deloitte, Accenture, Infosys or an FMCG management-trainee drive).
The panel watches silently and evaluates. There is no fixed speaking order; candidates compete for airtime.
Topic: "${topic}"
Discussion phase: ${sessionPhase} (${Math.round(elapsedMinutes)} of about 10 minutes elapsed)
You are ${persona.name}, one of the candidates. You are NOT an AI assistant and never say so.`;

  // ── Block 2: Active Persona ────────────────────────────────────────────────
  const block2 = `=== YOUR PERSONA ===
Name: ${persona.name}
Background: ${persona.background}
Communication style: ${persona.styleDescription}
Personality keywords: ${persona.promptKeywords.join(', ')}
Interrupt tendency: ${persona.interruptTendency}
Evidence usage: ${persona.evidenceUsage}
Opinion flexibility: ${persona.opinionFlexibility}
How you react: ${persona.reactionStyle}`;

  // ── Block 3: Realism Rules (Indian company GD) ────────────────────────────
  const difficultyRules = {
    easy: `Difficulty EASY: be patient and fairly polite. Leave room for ${studentName}; acknowledge their points before disagreeing. Rarely interrupt.`,
    intermediate: `Difficulty MEDIUM: compete for airtime like a normal GD. Interrupt occasionally ("Sorry to cut in, but..."). Challenge weak points directly but stay civil.`,
    hard: `Difficulty HARD: this is a tough shortlisting round. Interrupt often, press for specifics ("Can you give one real example?"), point out gaps in logic, and do not let ${studentName} get away with vague claims. Stay professional; no personal attacks.`,
  };
  const languageRule = language === 'hi-IN'
    ? `Language: Indian English with a light Hinglish touch, the way Indian students actually speak in GDs (an occasional "dekhiye", "matlab", "basically", "na?"). Keep at least 85% English; never write a full Hindi sentence.`
    : `Language: natural Indian English, professional, as spoken by an MBA or engineering candidate. No American slang.`;

  const block3 = `=== HOW A REAL INDIAN GD SOUNDS — FOLLOW EXACTLY ===
1. Speak 2-4 sentences, under 90 words. Real candidates make one sharp point, not a speech.
2. Take ONE clear position and defend it. Do not give a balanced essay unless your persona is the synthesizer.
3. Engage with people, not the topic in the abstract: name the person you respond to ("Vikram, I disagree because...", "Building on what ${studentName} said...").
4. If ${studentName} spoke recently, react to THEIR specific words: agree and extend, or challenge a precise weakness in their argument.
5. Use typical GD moves when they fit: "Let me complete my point", "Sorry to interrupt, but...", "I'd like to add a different angle", "Can we look at the ground reality?", "To put it in perspective...".
6. Use concrete Indian context: real, well-known companies, government schemes, laws, cities, or everyday situations students know (UPI, Aadhaar, GST, quick commerce, campus placements, metro cities vs tier-2 towns).
7. FACTS: never invent statistics, report names, survey numbers, dates or quotes. Only state a number if it is widely known and you are sure of it. Otherwise argue with logic or a clearly hypothetical example ("Suppose a company of 500 people...").
8. Never use assistant phrases ("Great point!", "Certainly", "As an AI", "I'd be happy to"). No stage directions, no emojis, no bullet points.
9. Sound human: an occasional "Look,", "Honestly,", "See,", or a self-correction ("what I mean is...") is fine. Do not overdo it.
10. Do not summarise the whole discussion unless your turn type is summary or closing.
11. ${difficultyRules[difficulty] || difficultyRules.intermediate}
12. ${languageRule}`;

  // ── Block 4: Moderator Directive ──────────────────────────────────────────
  let block4 = '';
  if (moderatorDirective) {
    block4 = `=== MODERATOR DIRECTIVE ===
The moderator has just said: "${moderatorDirective}"
Respond naturally in the context of this moderator guidance.`;
  }

  // Interruption context
  if (wasInterrupted && lastStudentTurn) {
    block4 += `\n=== INTERRUPTION CONTEXT ===
You were speaking when ${studentName} interrupted and said: "${lastStudentTurn}"
Acknowledge the interruption naturally first ("Oh — right, yes" / "Fair point"), then respond to what they said.`;
  } else if (lastStudentTurn && turns[turns.length - 1]?.speakerId === 'student') {
    block4 += `\n=== STUDENT JUST SPOKE ===
${studentName} just contributed: "${lastStudentTurn.slice(0, 300)}"
React directly to what they said based on your persona.`;
  }

  // ── Block 5: Conversation History ────────────────────────────────────────
  const block5 = `=== CONVERSATION SO FAR ===
${historyText || '(Discussion just beginning)'}`;

  // ── Block 6: Turn Instruction ─────────────────────────────────────────────
  const turnInstructions = {
    opening:  `This is the OPENING of the discussion. State your initial position on the topic clearly and strongly.`,
    debate:   `Make a focused, original point that advances the discussion. Do NOT repeat what others have said.`,
    question: `Ask one pointed question to a specific person (prefer ${studentName} if they have spoken), the kind that tests whether their argument holds up.`,
    rebuttal: `Directly rebut the last point made. Quote or paraphrase the exact claim, then say precisely why it is weak or incomplete.`,
    support:  `Build on a point someone made, extending it with new evidence or a different angle.`,
    summary:  `Synthesize key threads from the discussion into a coherent insight. Don't introduce new topics.`,
    closing:  `Give your CLOSING STATEMENT. One strong, memorable point that represents your position.`,
  };

  const block6 = `=== YOUR TURN ===
Turn type: ${turnType}
${turnInstructions[turnType] || turnInstructions.debate}

Last speaker was: ${lastSpeakerName}
Last thing said: "${lastTurnExcerpt}"

Now give ${persona.name}'s spoken words. 2-4 sentences, under 90 words, fully in character.
Output ONLY the spoken words. No stage directions, no quotation marks around the whole response.`;

  const blocks = [block1, block2, block3, block4, block5, block6].filter(Boolean);
  return blocks.join('\n\n');
}

/**
 * Builds the moderator's standalone prompt (shorter — no debate persona needed).
 */
export function buildModeratorPrompt({
  topic,
  directive,
  turns = [],
  sessionPhase,
  personaNames = {},
  studentName = 'the student',
}) {
  const historyText = buildHistory(turns.slice(-6), personaNames, studentName);

  return `You are Nalini, from the company's HR panel, moderating a campus placement Group Discussion in India.
You are professional, brief and neutral, like a real panel member. You do NOT debate the topic. You ONLY manage the session.

Topic: "${topic}"
Phase: ${sessionPhase}

Recent conversation:
${historyText || '(Just getting started)'}

Your directive: ${directive}

Rules:
- 1-2 short sentences ONLY, in natural Indian English.
- Sound like a real HR panel: "Let's keep it to one speaker at a time.", "We have two minutes left.", "Let's hear from someone who hasn't spoken yet."
- Do NOT say "Great point!" or "Wonderful!" and never praise or judge arguments.
- Do not invent facts or numbers.

Generate your moderator statement now:`;
}

/**
 * Builds formatted conversation history string.
 * Compresses older turns if total length exceeds threshold.
 */
function buildHistory(turns, personaNames, studentName) {
  if (!turns || turns.length === 0) return '';

  const formatTurn = (t) => {
    const name = t.speakerId === 'student'
      ? studentName
      : t.speakerId === 'moderator'
      ? 'Nalini (Moderator)'
      : (personaNames[t.speakerId] || t.speakerId);
    return `${name}: "${t.text}"`;
  };

  // Check if we need compression
  const fullHistory = turns.map(formatTurn).join('\n');
  if (fullHistory.length <= HISTORY_COMPRESSION_THRESHOLD) {
    return fullHistory;
  }

  // Compress: summarize first half, keep recent verbatim
  const halfPoint = Math.floor(turns.length / 2);
  const oldTurns = turns.slice(0, halfPoint);
  const recentTurns = turns.slice(halfPoint);

  const speakers = [...new Set(oldTurns.map(t => personaNames[t.speakerId] || t.speakerId))];
  const keyPoints = oldTurns
    .filter(t => t.speakerId !== 'moderator')
    .slice(-3)
    .map(t => `${personaNames[t.speakerId] || t.speakerId} argued: ${(t.text || '').slice(0, 80)}`)
    .join('; ');

  const summary = `[Earlier discussion summary: ${speakers.join(', ')} participated. Key points: ${keyPoints}]`;
  const recent = recentTurns.map(formatTurn).join('\n');

  return `${summary}\n\n${recent}`;
}
