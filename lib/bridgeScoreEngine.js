/**
 * Bridge Score Engine v1.0
 * Core employability benchmark calculator designed for reliability and anti-gaming.
 */

const BRIDGE_SCORE_VERSION = "1.0.0";

// --- Math Utilities ---
function getRecent(records, count = 3) {
  if (!records || !Array.isArray(records)) return [];
  // Assuming records are sorted oldest to newest, take the last 'count'
  return records.slice(-count);
}

function average(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

function standardDeviation(arr) {
  if (!arr || arr.length < 2) return 0;
  const avg = average(arr);
  const squareDiffs = arr.map((value) => Math.pow(value - avg, 2));
  const avgSquareDiff = average(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}

function linearRegressionSlope(yValues) {
  if (!yValues || yValues.length < 2) return 0;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  const n = yValues.length;
  for (let i = 0; i < n; i++) {
    const x = i + 1;
    const y = yValues[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }
  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return 0;
  return (n * sumXY - sumX * sumY) / denominator;
}

// --- Component Calculators ---

function calculateCognitiveScore(aptitudeRecords) {
  const recent = getRecent(aptitudeRecords, 3);
  if (recent.length === 0) return null;

  const scores = recent.map(record => {
    // Expected structure: record.sectionScores = { quant: 80, logical: 70, verbal: 60 }
    // record.level = 'easy', 'medium', 'hard'
    const s = record.sectionScores || {};
    const quant = s.quant || s.Quantitative || 0;
    const logical = s.logical || s['Logical Reasoning'] || 0;
    const verbal = s.verbal || s['Verbal Ability'] || 0;
    
    // Base 0-100%
    const basePercent = (0.40 * quant) + (0.40 * logical) + (0.20 * verbal);
    
    // Scale to 350 max
    let rawScore = basePercent * 3.5;

    // Apply difficulty limits
    const level = (record.level || 'medium').toLowerCase();
    let maxAllowed = 315; // default medium
    if (level === 'easy') maxAllowed = 280;
    if (level === 'hard') maxAllowed = 350;

    return Math.min(rawScore, maxAllowed);
  });

  return average(scores);
}

function calculateCompetenceScore(interviewRecords) {
  const recent = getRecent(interviewRecords, 3);
  if (recent.length === 0) return null;

  const scores = recent.map(record => {
    // Expected structure: record.scores = { technical_knowledge: 8, problem_solving: 7, answer_quality: 7 }
    const s = record.scores || {};
    const tech = s.technical_knowledge || 0; // out of 10
    const prob = s.problem_solving || 0; // out of 10
    const ans = s.answer_quality || 0; // out of 10

    // Base 0-100%
    const basePercent = (0.40 * (tech * 10)) + (0.40 * (prob * 10)) + (0.20 * (ans * 10));
    
    // Scale to 380 base max
    const rawScore = basePercent * 3.8;

    // Bounded Bonus logic based on interview difficulty/type
    const type = (record.type || record.round || 'standard').toLowerCase();
    let bonus = 10; // Standard Placement
    if (type.includes('hr') || type.includes('basic')) bonus = 0;
    if (type.includes('advanced') || type.includes('technical')) bonus = 20;

    return Math.min(rawScore + bonus, 400); // hard cap at 400 just in case
  });

  return average(scores);
}

function calculateCommunicationScore(interviewRecords, gdRecords) {
  const recentInterviews = getRecent(interviewRecords, 3);
  const recentGDs = getRecent(gdRecords, 3);

  if (recentInterviews.length === 0 && recentGDs.length === 0) return null;

  // Interview Comm
  let intCommAvg = 0;
  if (recentInterviews.length > 0) {
    const intScores = recentInterviews.map(r => ((r.scores?.communication || 0) * 10)); // out of 100
    intCommAvg = average(intScores);
  }

  // GD Comm
  let gdCommAvg = 0;
  if (recentGDs.length > 0) {
    const gdScores = recentGDs.map(r => {
      // average of logical flow + content quality + overall comm
      const s = r.overallAnalysis || {};
      const comm = s.communication || 0; // out of 10
      const flow = s.logicalFlow || 0;
      const content = s.contentQuality || 0;
      return ((comm * 10 * 0.4) + (flow * 10 * 0.3) + (content * 10 * 0.3));
    });
    gdCommAvg = average(gdScores);
  }

  // Blend
  let finalPercent = 0;
  if (recentInterviews.length > 0 && recentGDs.length > 0) {
    finalPercent = (intCommAvg * 0.6) + (gdCommAvg * 0.4);
  } else if (recentInterviews.length > 0) {
    finalPercent = intCommAvg;
  } else {
    finalPercent = gdCommAvg;
  }

  // Max 250
  return finalPercent * 2.5;
}

function calculateIntegrity(interviewRecords) {
  const recent = getRecent(interviewRecords, 3);
  let multiplier = 1.00;

  for (const record of recent) {
    
    // Contradictions caught (-0.25 each)
    const contradictions = record.contradictions?.length || 0;
    multiplier -= (contradictions * 0.25);

    // Behavior flags (-0.50 each)
    const flags = record.behavior_flags?.length || 0;
    multiplier -= (flags * 0.50);

    // Tab switching (-0.05 each)
    const tabSwitches = record.tab_switches || 0;
    multiplier -= (tabSwitches * 0.05);
  }

  // Disqualification Check
  if (multiplier < 0.50) {
    return { multiplier: 0, disqualified: true };
  }

  return { multiplier: Math.max(multiplier, 0.50), disqualified: false };
}

function calculateReliability(totalScoresHistory) {
  // requires array of overall raw scores out of 1000 from the last 5 attempts
  if (!totalScoresHistory || totalScoresHistory.length < 2) {
    return 1.00; // Not enough data to penalize
  }
  
  const stdDev = standardDeviation(totalScoresHistory);
  const avg = average(totalScoresHistory);
  
  // stdDev as percentage of the average
  const variancePct = avg > 0 ? (stdDev / avg) * 100 : 0;

  if (variancePct < 10) return 1.00; // Consistent
  if (variancePct > 25) return 0.85; // Highly erratic / lucky
  return 0.95; // Moderate variance
}

function calculateLearningVelocity(totalScoresHistory) {
  // Slope of the last 5 scores
  if (!totalScoresHistory || totalScoresHistory.length < 2) {
    return { score: 0, label: 'Not Enough Data' };
  }
  const slope = linearRegressionSlope(totalScoresHistory);
  
  // Normalize slope to 0-100 logic. 
  // If score grows by 50 points per attempt -> amazing
  let normalized = 50 + (slope * 2); // 0 slope = 50.
  normalized = Math.max(0, Math.min(100, normalized));

  let label = 'Moderate';
  if (normalized < 30) label = 'Needs Improvement';
  if (normalized >= 70) label = 'High';
  if (normalized >= 90) label = 'Exceptional';

  return { score: Math.round(normalized), label };
}

function getDataConfidence(totalRecordsCount) {
  if (totalRecordsCount <= 2) return 'Low';
  if (totalRecordsCount <= 5) return 'Medium';
  return 'High';
}

function getHiringRecommendation(score, disqualified) {
  if (disqualified) return 'Disqualified (Integrity)';
  if (score === null) return 'Pending Data';
  
  if (score >= 900) return 'Exceptional Hire';
  if (score >= 800) return 'Strong Hire';
  if (score >= 700) return 'Hire';
  if (score >= 600) return 'Borderline';
  return 'Needs Significant Improvement';
}

export function calculateBridgeScore(candidateData) {
  const { aptitudeRecords = [], interviewRecords = [], gdRecords = [] } = candidateData;

  const cognitive = calculateCognitiveScore(aptitudeRecords);
  const competence = calculateCompetenceScore(interviewRecords);
  const communication = calculateCommunicationScore(interviewRecords, gdRecords);

  const totalRecordsCount = aptitudeRecords.length + interviewRecords.length + gdRecords.length;
  const dataConfidence = getDataConfidence(totalRecordsCount);

  // If literally no data, return null state
  if (cognitive === null && competence === null && communication === null) {
    return {
      version: BRIDGE_SCORE_VERSION,
      score: null,
      breakdown: { cognitive: null, competence: null, communication: null },
      indicators: {
        integrityIndex: 100,
        reliabilityIndex: 100,
        learningVelocity: { score: 0, label: 'Not Enough Data' },
        dataConfidence
      },
      recommendation: getHiringRecommendation(null, false),
      disqualified: false
    };
  }

  // Treat missing modules as 0 for the final total if they have at least *some* data
  // Alternatively, we could project the score if a module is completely missing.
  // Standardizing: if they haven't taken aptitude, cognitive is 0. 
  const cCog = cognitive || 0;
  const cComp = competence || 0;
  const cComm = communication || 0;

  let rawCore = cCog + cComp + cComm;

  const integrityResult = calculateIntegrity(interviewRecords);
  
  // Generate a mock history of totals for reliability/velocity (In production, this should be fetched from historical Bridge Scores)
  // Since we calculate it freshly, we will approximate historical reliability from the individual record variances
  // To do it correctly, we use the `totalScoresHistory` passed in, or default to 1.0
  const historicalTotals = candidateData.historicalBridgeScores || [rawCore]; 
  
  const reliabilityMulti = calculateReliability(historicalTotals);
  const learningVelocity = calculateLearningVelocity(historicalTotals);

  let finalScore = rawCore * integrityResult.multiplier * reliabilityMulti;

  if (integrityResult.disqualified) {
    finalScore = 0;
  }

  // Ensure it never technically exceeds 1000 due to float math
  finalScore = Math.min(Math.round(finalScore), 1000);

  return {
    version: BRIDGE_SCORE_VERSION,
    score: finalScore,
    breakdown: {
      cognitive: Math.round(cCog),
      competence: Math.round(cComp),
      communication: Math.round(cComm)
    },
    indicators: {
      integrityIndex: Math.round(integrityResult.multiplier * 100),
      reliabilityIndex: Math.round(reliabilityMulti * 100),
      learningVelocity,
      dataConfidence
    },
    recommendation: getHiringRecommendation(finalScore, integrityResult.disqualified),
    disqualified: integrityResult.disqualified
  };
}
