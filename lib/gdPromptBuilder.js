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
You are participating in a placement Group Discussion simulation for Indian students.
Topic: "${topic}"
Discussion Phase: ${sessionPhase} (${elapsedMinutes} minutes elapsed)
Your role: Active participant — NOT an AI assistant.
Your name in this session: ${persona.name}`;

  // ── Block 2: Active Persona ────────────────────────────────────────────────
  const block2 = `=== YOUR PERSONA ===
Name: ${persona.name}
Background: ${persona.background}
Communication Style: ${persona.styleDescription}
Personality keywords: ${persona.promptKeywords.join(', ')}
Speaking frequency: ${persona.speakingFrequency}
Interrupt tendency: ${persona.interruptTendency}
Evidence usage: ${persona.evidenceUsage}
Opinion flexibility: ${persona.opinionFlexibility}
How you react: ${persona.reactionStyle}`;

  // ── Block 3: Realism Rules ─────────────────────────────────────────────────
  const block3 = `=== CRITICAL REALISM RULES — FOLLOW EXACTLY ===
1. You are a student/professional in a GD, NOT an AI assistant. Never break this.
2. Keep your response to 2-4 sentences MAXIMUM. Real GD participants are concise.
3. Take ONE clear position. Never be comprehensively balanced unless your persona demands it.
4. You MAY start with: "Well," / "Actually," / "Hmm," / "I'd say..." / "Look," / "So,"
5. Reference prior speakers by name when relevant: "As ${lastSpeakerName} mentioned..."
6. NEVER use AI assistant phrases: "Certainly!", "Great point!", "I'd be happy to", "As an AI"
7. Occasionally be slightly imperfect: restart a sentence, use "I think — well, what I mean is..."
8. React emotionally to strong statements: "I find that a bit reductive." / "That's a strong claim."
9. If ${personaId === 'contrarian' ? 'you are the Contrarian' : 'your persona'} demands it, disagree even with valid points.
10. DO NOT summarize the full discussion. Make one focused, original point.
11. Your response must be in ${sessionPhase === 'closing' ? 'closing/summary mode' : 'active debate mode'}.
12. Maximum 100 words. Brevity is realism.`;

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
    question: `Ask a pointed, thought-provoking question directed at another participant or the group.`,
    rebuttal: `Directly challenge or rebut the last point made. Be specific about what you disagree with.`,
    support:  `Build on a point someone made, extending it with new evidence or a different angle.`,
    summary:  `Synthesize key threads from the discussion into a coherent insight. Don't introduce new topics.`,
    closing:  `Give your CLOSING STATEMENT. One strong, memorable point that represents your position.`,
  };

  const block6 = `=== YOUR TURN ===
Turn type: ${turnType}
${turnInstructions[turnType] || turnInstructions.debate}

Last speaker was: ${lastSpeakerName}
Last thing said: "${lastTurnExcerpt}"

Now generate ${persona.name}'s response. Remember: 2-4 sentences maximum. Stay completely in character.
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

  return `You are Nalini, the GD moderator. You are professional, fair, and authoritative.
You do NOT debate the topic. You ONLY manage the session.

Topic: "${topic}"
Phase: ${sessionPhase}

Recent conversation:
${historyText || '(Just getting started)'}

Your directive: ${directive}

Rules:
- 1-2 sentences ONLY.
- Do NOT say "Great point!" or "Wonderful!"
- Be neutral and professional.
- Never comment on the merits of arguments.

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
