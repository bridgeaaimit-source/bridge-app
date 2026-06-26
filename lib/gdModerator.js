/**
 * GD Moderator Intelligence
 * 
 * Pure JS — no API calls.
 * Analyzes session state and determines if/when the moderator should intervene.
 * Returns a structured directive that the prompt builder injects into the next AI turn.
 */

// Topic keywords used for drift detection
function extractTopicKeywords(topic) {
  if (!topic) return [];
  // Remove common stop words, extract meaningful terms
  const stopWords = new Set(['the','a','an','is','are','of','in','on','to','for','with','and','or','but','that','this','should','would','could','will','be','by','at','from','as','into','was','were','has','have','had','its','it']);
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));
}

/**
 * Compute what fraction of recent AI turns are on-topic.
 * Returns 0.0 (completely drifted) to 1.0 (on-topic).
 */
function computeTopicRelevance(turns, topicKeywords, windowSize = 3) {
  if (!topicKeywords.length || !turns.length) return 1.0;
  const recent = turns.slice(-windowSize);
  if (!recent.length) return 1.0;

  const combined = recent
    .filter(t => t.speakerId !== 'moderator')
    .map(t => t.text || '')
    .join(' ')
    .toLowerCase();

  if (!combined.trim()) return 1.0;

  const matchedKeywords = topicKeywords.filter(kw => combined.includes(kw));
  return matchedKeywords.length / topicKeywords.length;
}

/**
 * Count consecutive turns where the student has NOT spoken.
 */
function countStudentSilentTurns(turns) {
  let count = 0;
  for (let i = turns.length - 1; i >= 0; i--) {
    if (turns[i].speakerId === 'student') break;
    if (turns[i].speakerId !== 'moderator') count++;
  }
  return count;
}

/**
 * Detect if one AI persona is dominating the last N turns (> 40% share).
 */
function detectDominantPersona(turns, windowSize = 8) {
  const recent = turns.filter(t => t.speakerId !== 'moderator').slice(-windowSize);
  if (recent.length < 4) return null;

  const counts = {};
  for (const t of recent) {
    if (t.speakerId !== 'student') {
      counts[t.speakerId] = (counts[t.speakerId] || 0) + 1;
    }
  }

  for (const [id, count] of Object.entries(counts)) {
    if (count / recent.length > 0.45) return id;
  }
  return null;
}

/**
 * Check if discussion has stalled (same semantic content repeated).
 * Simple heuristic: last 3 AI turns all contain the same top-3 words.
 */
function detectStall(turns, windowSize = 4) {
  const recent = turns
    .filter(t => t.speakerId !== 'moderator' && t.speakerId !== 'student')
    .slice(-windowSize);

  if (recent.length < 3) return false;

  // Get top content words from each turn
  const stopWords = new Set(['the','a','an','is','are','of','in','on','to','for','with','and','or','but','that','this','should','would','could','will','be','by','we','our','their']);
  const getTopWords = text =>
    (text || '').toLowerCase().replace(/[^a-z ]/g, '').split(/\s+/)
      .filter(w => w.length > 4 && !stopWords.has(w))
      .slice(0, 5);

  const wordSets = recent.map(t => new Set(getTopWords(t.text)));
  
  // Check overlap between consecutive pairs
  let overlapCount = 0;
  for (let i = 1; i < wordSets.length; i++) {
    const intersection = [...wordSets[i]].filter(w => wordSets[i-1].has(w));
    if (intersection.length >= 2) overlapCount++;
  }

  return overlapCount >= wordSets.length - 1;
}

/**
 * Main moderator analysis function.
 * 
 * @param {Object} params
 * @param {Array} params.turns - all turns so far
 * @param {string} params.topic - GD topic
 * @param {number} params.elapsedSeconds - seconds since session started
 * @param {number} params.totalDurationSeconds - target session length (600 = 10min)
 * @param {string} params.studentName - student's display name
 * @param {Object} params.personaNames - { personaId: displayName }
 * @param {string} params.currentPhase - 'opening' | 'debate' | 'closing'
 * 
 * @returns {{
 *   shouldIntervene: boolean,
 *   directive: string | null,
 *   newPhase: string | null,
 *   forcedSpeakerId: string | null,
 * }}
 */
export function analyzeSession({
  turns = [],
  topic = '',
  elapsedSeconds = 0,
  totalDurationSeconds = 600,
  studentName = 'the student',
  personaNames = {},
  currentPhase = 'debate',
}) {
  const topicKeywords = extractTopicKeywords(topic);
  const aiTurns = turns.filter(t => t.speakerId !== 'moderator');
  const studentSilentTurns = countStudentSilentTurns(turns);
  const dominantPersonaId = detectDominantPersona(turns);
  const topicRelevance = computeTopicRelevance(turns, topicKeywords);
  const isStalled = detectStall(turns);
  const remainingPercent = 1 - (elapsedSeconds / totalDurationSeconds);

  // ─── Phase transitions ────────────────────────────────────────────────────

  // Transition to closing phase at 80% of time
  if (currentPhase === 'debate' && remainingPercent <= 0.20) {
    return {
      shouldIntervene: true,
      directive: `We are approaching the final two minutes of our discussion. Please begin wrapping up your points and moving toward a conclusion.`,
      newPhase: 'closing',
      forcedSpeakerId: 'moderator',
    };
  }

  // Mid-session check at 50% of time
  if (currentPhase === 'debate' && remainingPercent <= 0.52 && remainingPercent > 0.48) {
    // Gentle mid-session energy check — only if student has been silent
    if (studentSilentTurns >= 4) {
      return {
        shouldIntervene: true,
        directive: `We're halfway through our discussion. ${studentName}, I'd love to hear your perspective on what's been discussed so far.`,
        newPhase: null,
        forcedSpeakerId: 'moderator',
      };
    }
  }

  // ─── Student silence ──────────────────────────────────────────────────────
  if (studentSilentTurns >= 5 && currentPhase !== 'opening') {
    return {
      shouldIntervene: true,
      directive: `${studentName}, you've been listening carefully — I'd love to hear your thoughts on this.`,
      newPhase: null,
      forcedSpeakerId: 'moderator',
    };
  }

  // ─── Dominant participant ─────────────────────────────────────────────────
  if (dominantPersonaId && currentPhase === 'debate') {
    const dominantName = personaNames[dominantPersonaId] || 'one participant';
    return {
      shouldIntervene: true,
      directive: `Thank you, ${dominantName}. Let's hear from some of the others on this point.`,
      newPhase: null,
      forcedSpeakerId: null, // Turn Manager will pick next, excluding dominant
    };
  }

  // ─── Topic drift ─────────────────────────────────────────────────────────
  if (topicRelevance < 0.3 && aiTurns.length > 4 && currentPhase === 'debate') {
    return {
      shouldIntervene: true,
      directive: `I'd like to bring us back to the core topic: "${topic}". Let's focus our arguments on that.`,
      newPhase: null,
      forcedSpeakerId: 'moderator',
    };
  }

  // ─── Stall / repetition ──────────────────────────────────────────────────
  if (isStalled && aiTurns.length > 6 && currentPhase === 'debate') {
    const angles = [
      `Let's explore a different angle — what are the long-term implications of this?`,
      `We seem to be circling on one point. Let's ask: who are the most affected stakeholders here?`,
      `Interesting debate. Let me add a new dimension: what would the ideal solution actually look like?`,
      `Good points all around. Now, let's consider the opposing argument more deeply.`,
    ];
    const directive = angles[Math.floor(Math.random() * angles.length)];
    return {
      shouldIntervene: true,
      directive,
      newPhase: null,
      forcedSpeakerId: 'moderator',
    };
  }

  // No intervention needed
  return {
    shouldIntervene: false,
    directive: null,
    newPhase: null,
    forcedSpeakerId: null,
  };
}

/**
 * Generates the moderator's opening statement for the session.
 */
export function buildModeratorOpening(topic, participantNames, studentName) {
  const aiNames = participantNames.join(', ');
  return `Welcome everyone. I'm Nalini, your discussion moderator today. We have ${studentName} joining us along with ${aiNames}.

Today's topic is: "${topic}"

Here's how we'll proceed: this is an open group discussion — feel free to agree, disagree, ask questions, or build on what others say. There are no fixed turns. Simply press "Speak Now" whenever you want to contribute.

I'll keep things on track and ensure everyone gets a chance to participate. The discussion will run for approximately ten minutes, after which I'll ask for closing statements.

Let's begin. Who would like to open?`;
}

/**
 * Generates the moderator's closing statement.
 */
export function buildModeratorClosing(topic) {
  return `We've had a rich discussion on "${topic}" today. Before we wrap up, I'd like to give everyone a final moment to share one key takeaway or closing thought. Let's do a quick round — please keep it concise.`;
}
