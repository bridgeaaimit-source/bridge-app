/**
 * GD Turn Manager
 * 
 * Pure JS — no API calls, no side effects.
 * Determines who speaks next in the GD session.
 *
 * Rules:
 * 1. Never the same speaker twice in a row (unless forced by directive)
 * 2. If moderator directive forces a speaker, always obey
 * 3. Student gets boosted weight after 3+ consecutive AI-only turns
 * 4. Dominant personas (high frequency) get higher base weight
 * 5. A persona recently spoken gets reduced weight
 * 6. If directly addressed in last turn, that persona gets 3× weight
 */

import { PERSONAS, getSpeakingWeight } from './gdPersonas';

/**
 * @param {Object} params
 * @param {string} params.lastSpeakerId - persona id of last speaker ('student' | personaId | 'moderator')
 * @param {string|null} params.forcedSpeakerId - from moderator directive, if any
 * @param {string[]} params.personaIds - active AI persona ids in this session
 * @param {Object} params.speakerStats - { personaId: { turnCount, lastTurnIndex } }
 * @param {number} params.currentTurnIndex - current turn number
 * @param {number} params.studentSilentTurns - consecutive turns student hasn't spoken
 * @param {string|null} params.addressedPersonaId - persona directly addressed in last turn
 * @param {string} params.sessionPhase - 'opening' | 'debate' | 'closing'
 * @returns {{ speakerId: string, type: 'ai' | 'student' | 'moderator' }}
 */
export function selectNextSpeaker({
  lastSpeakerId,
  forcedSpeakerId = null,
  personaIds,
  speakerStats = {},
  currentTurnIndex,
  studentSilentTurns = 0,
  addressedPersonaId = null,
  sessionPhase = 'debate',
}) {
  // Hard override from moderator directive
  if (forcedSpeakerId) {
    if (forcedSpeakerId === 'student') return { speakerId: 'student', type: 'student' };
    if (forcedSpeakerId === 'moderator') return { speakerId: 'moderator', type: 'moderator' };
    return { speakerId: forcedSpeakerId, type: 'ai' };
  }

  // Build candidate pool — exclude last speaker
  const candidates = personaIds.filter(id => id !== lastSpeakerId);

  // Opening: pick the aggressive persona first for dramatic start
  if (sessionPhase === 'opening' && currentTurnIndex === 1) {
    const aggressiveId = personaIds.find(id => id === 'aggressive') || candidates[0];
    return { speakerId: aggressiveId, type: 'ai' };
  }

  // Calculate weights
  const weights = candidates.map(personaId => {
    let weight = getSpeakingWeight(personaId);

    // Reduce weight if spoke recently (within last 2 turns)
    const stats = speakerStats[personaId] || { turnCount: 0, lastTurnIndex: -99 };
    const turnsSinceSpoke = currentTurnIndex - stats.lastTurnIndex;
    if (turnsSinceSpoke <= 1) weight *= 0.2;
    else if (turnsSinceSpoke <= 2) weight *= 0.5;

    // Boost if directly addressed
    if (personaId === addressedPersonaId) weight *= 3.0;

    return { personaId, weight };
  });

  // Decide whether to yield to student
  let studentWeight = 0;
  if (lastSpeakerId !== 'student') {
    if (studentSilentTurns >= 5) {
      studentWeight = 15.0; // Very strong push
    } else if (studentSilentTurns >= 3) {
      studentWeight = 6.0;
    } else if (studentSilentTurns >= 2) {
      studentWeight = 2.0;
    } else {
      studentWeight = 0.8; // Always a small chance
    }
  }

  // Closing phase: reduce student override (moderator will handle it)
  if (sessionPhase === 'closing') {
    studentWeight = Math.min(studentWeight, 2.0);
  }

  // Add student as candidate
  const allCandidates = [
    ...weights,
    { personaId: 'student', weight: studentWeight },
  ].filter(c => c.weight > 0);

  const selected = weightedRandom(allCandidates);
  if (selected === 'student') {
    return { speakerId: 'student', type: 'student' };
  }
  return { speakerId: selected, type: 'ai' };
}

/**
 * Weighted random selection from { personaId, weight }[]
 * @returns {string} personaId
 */
function weightedRandom(candidates) {
  const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return candidates[0]?.personaId;

  let rand = Math.random() * totalWeight;
  for (const c of candidates) {
    rand -= c.weight;
    if (rand <= 0) return c.personaId;
  }
  return candidates[candidates.length - 1].personaId;
}

/**
 * Determines turn type based on session context.
 * Used to give Claude context on what kind of response to generate.
 * 
 * @param {Object} params
 * @param {string} params.personaId
 * @param {Array} params.recentTurns
 * @param {string} params.sessionPhase
 * @param {boolean} params.studentJustSpoke
 * @returns {'opening' | 'debate' | 'question' | 'rebuttal' | 'support' | 'summary' | 'moderator' | 'closing'}
 */
export function determineTurnType({ personaId, recentTurns = [], sessionPhase, studentJustSpoke }) {
  if (sessionPhase === 'opening') return 'opening';
  if (sessionPhase === 'closing') return 'closing';

  // If student just spoke, AI should react/rebuttal
  if (studentJustSpoke) {
    const rand = Math.random();
    if (rand < 0.5) return 'rebuttal';
    if (rand < 0.7) return 'debate';
    return 'question';
  }

  // Normal debate distribution based on PRD
  const rand = Math.random();
  if (rand < 0.35) return 'debate';
  if (rand < 0.60) return 'rebuttal';
  if (rand < 0.80) return 'question';
  if (rand < 0.90) return 'support';
  return 'summary';
}

/**
 * Updates speaker stats after a turn completes.
 * Returns a new stats object (immutable update).
 */
export function updateSpeakerStats(speakerStats, speakerId, turnIndex) {
  const existing = speakerStats[speakerId] || { turnCount: 0, lastTurnIndex: -99 };
  return {
    ...speakerStats,
    [speakerId]: {
      turnCount: existing.turnCount + 1,
      lastTurnIndex: turnIndex,
    },
  };
}

/**
 * Checks if a specific persona was addressed in the given turn text.
 * Simple name-matching heuristic.
 */
export function detectAddressedPersona(turnText, personaIds, personaNames) {
  if (!turnText) return null;
  const lower = turnText.toLowerCase();
  for (const id of personaIds) {
    const name = personaNames[id]?.toLowerCase();
    if (name && lower.includes(name)) return id;
  }
  return null;
}
