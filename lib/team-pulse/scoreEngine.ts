/**
 * Centralized Score Engine for Team Pulse / TalentPulse
 * Pure, deterministic business logic and scoring algorithms matching TalentPulse Feature Spec.
 */

export interface FlightRiskResult {
  score: number;
  level: "high" | "med" | "low";
  drivers: string[];
  replCostLpa: number;
  fixPayCostLpa: number;
}

export function computeFlightRisk(emp: {
  level?: number;
  ctc?: number;
  market?: number;
  engagement?: number;
  overtime?: number;
  mgrChanges?: number;
  tenure?: number;
  timeInLevel?: number;
  perf?: number;
  goals?: number;
}): FlightRiskResult {
  const level = emp.level || 2;
  const ctc = emp.ctc || 15.0;
  const market = emp.market || 16.0;
  const engagement = emp.engagement ?? 4.0;
  const overtime = emp.overtime || 40.0;
  const mgrChanges = emp.mgrChanges || 0;
  const timeInLevel = emp.timeInLevel || 1.5;
  const perf = emp.perf || 3;
  const goals = emp.goals ?? 80;

  let score = 20;
  const drivers: string[] = [];

  // 1. Pay vs Market
  const payRatio = ctc / Math.max(1, market);
  if (payRatio < 0.8) {
    score += 35;
    drivers.push(`Below market pay (-${Math.round((1 - payRatio) * 100)}%)`);
  } else if (payRatio < 0.92) {
    score += 18;
    drivers.push(`Below market pay (-${Math.round((1 - payRatio) * 100)}%)`);
  }

  // 2. Overtime & Burnout
  if (overtime >= 50) {
    score += 24;
    drivers.push(`High overtime (${overtime} hrs/wk)`);
  } else if (overtime >= 44) {
    score += 12;
    drivers.push(`Elevated overtime (${overtime} hrs/wk)`);
  }

  // 3. Manager Changes
  if (mgrChanges >= 2) {
    score += 15;
    drivers.push(`Frequent manager transitions (${mgrChanges})`);
  } else if (mgrChanges === 1) {
    score += 6;
  }

  // 4. Stagnation in level for high performers
  if (timeInLevel >= 2.5 && perf >= 4) {
    score += 16;
    drivers.push(`Stagnant in current level (${timeInLevel} yrs)`);
  }

  // 5. Engagement Drop
  if (engagement <= 2.5) {
    score += 20;
    drivers.push(`Low pulse engagement (${engagement}/5)`);
  } else if (engagement <= 3.2) {
    score += 10;
    drivers.push(`Moderate engagement (${engagement}/5)`);
  }

  // 6. Goal Alignment
  if (goals < 60 && perf <= 2) {
    score += 10;
  }

  const finalScore = Math.min(96, Math.max(12, Math.round(score)));
  const riskLevel: "high" | "med" | "low" = finalScore >= 70 ? "high" : finalScore >= 45 ? "med" : "low";

  const replCostLpa = Math.round(ctc * (level <= 2 ? 0.5 : level === 3 ? 0.75 : 1.0) * 10) / 10;
  const fixPayCostLpa = Math.round(Math.max(0, market * 0.95 - ctc) * 10) / 10;

  return {
    score: finalScore,
    level: riskLevel,
    drivers: drivers.slice(0, 3),
    replCostLpa,
    fixPayCostLpa,
  };
}

export interface PromoScoreResult {
  eligible: boolean;
  score: number;
  suggestedHike: number;
  nextRole?: string;
}

export function computePromoScore(emp: {
  level?: number;
  perf?: number;
  perfPrev?: number;
  potential?: number;
  goals?: number;
  timeInLevel?: number;
  ctc?: number;
  market?: number;
  role?: string;
}): PromoScoreResult {
  const level = emp.level || 2;
  const perf = emp.perf || 3;
  const perfPrev = emp.perfPrev || 3;
  const potential = emp.potential || 2;
  const goals = emp.goals ?? 80;
  const timeInLevel = emp.timeInLevel || 1.5;
  const ctc = emp.ctc || 15.0;
  const market = emp.market || 16.0;

  const eligible = level < 5 && perf >= 4 && perfPrev >= 3 && timeInLevel >= 1.5 && goals >= 70;
  const score = Math.round(perf * 11 + perfPrev * 6 + potential * 9 + goals / 10 + (timeInLevel >= 2 ? 10 : 5));

  const payRatio = ctc / Math.max(1, market);
  const suggestedHike = payRatio < 0.9 ? 22 : payRatio < 1.0 ? 18 : 14;

  let nextRole = emp.role || "Senior";
  if (nextRole.includes("Junior")) nextRole = nextRole.replace("Junior", "Mid");
  else if (nextRole.includes("SDE I")) nextRole = nextRole.replace("SDE I", "SDE II");
  else if (nextRole.includes("SDE II")) nextRole = nextRole.replace("SDE II", "Senior SDE");
  else if (nextRole.includes("Senior")) nextRole = nextRole.replace("Senior", "Staff / Lead");
  else if (!nextRole.includes("Lead") && !nextRole.includes("Staff") && !nextRole.includes("Director")) {
    nextRole = `Senior ${nextRole}`;
  }

  return { eligible, score, suggestedHike, nextRole };
}

export function computePipCheck(emp: {
  perf?: number;
  perfPrev?: number;
  goals?: number;
}): boolean {
  const perf = emp.perf ?? 3;
  const perfPrev = emp.perfPrev ?? 3;
  const goals = emp.goals ?? 80;
  return perf === 1 || (perf <= 2 && perfPrev <= 2 && goals < 60);
}

export interface CandidateFitResult {
  overall: number;
  skills: number;
  exp: number;
  pers: number;
  retention: number;
  redFlags: string[];
}

export function computeCandidateFit(
  candidate: {
    exp?: number;
    curCtc?: number;
    expcCtc?: number;
    notice?: number;
    offers?: number;
    hops?: number;
    careerGap?: number;
    skills?: string[] | string;
    cultureScore?: number;
  },
  role?: {
    expMin?: number;
    expMax?: number;
    bandMin?: number;
    bandMax?: number;
    reqSkills?: string[] | string;
  }
): CandidateFitResult {
  const exp = candidate.exp || 4;
  const curCtc = candidate.curCtc || 12;
  const expcCtc = candidate.expcCtc || 16;
  const notice = candidate.notice || 30;
  const offers = candidate.offers || 0;
  const hops = candidate.hops || 1;
  const careerGap = candidate.careerGap || 0;

  const redFlags: string[] = [];
  if (hops >= 3 && exp < 6) redFlags.push(`Frequent job changes (${hops} switches in ${exp} yrs)`);
  if (careerGap >= 6) redFlags.push(`Career gap of ${careerGap} months`);
  if (notice >= 60) redFlags.push(`Long notice period (${notice} days)`);
  if (offers >= 2) redFlags.push(`Multiple active competing offers (${offers})`);

  let skillScore = 80;
  let expScore = 80;

  if (role) {
    const minExp = role.expMin || 3;
    const maxExp = role.expMax || 6;
    if (exp >= minExp && exp <= maxExp + 2) expScore = 92;
    else if (exp < minExp) expScore = Math.max(50, Math.round(75 - (minExp - exp) * 15));
    else expScore = 85;

    if (role.bandMax && expcCtc > role.bandMax * 1.15) {
      redFlags.push(`Expected CTC (₹${expcCtc}L) significantly exceeds budget (₹${role.bandMax}L)`);
    }
  }

  const persScore = candidate.cultureScore || 78;
  const retentionScore = Math.max(40, 95 - (offers * 12) - (notice >= 60 ? 15 : 0) - (hops >= 3 ? 15 : 0));

  const overall = Math.round(skillScore * 0.35 + expScore * 0.25 + persScore * 0.2 + retentionScore * 0.2);

  return {
    overall: Math.min(99, Math.max(35, overall)),
    skills: skillScore,
    exp: expScore,
    pers: persScore,
    retention: retentionScore,
    redFlags,
  };
}

export function computeAcceptanceProbability(
  offerLpa: number,
  candidate: {
    curCtc?: number;
    expcCtc?: number;
    offers?: number;
    notice?: number;
  },
  role?: {
    bandMin?: number;
    bandMax?: number;
  },
  levers?: {
    joiningBonus?: boolean;
    noticeBuyout?: boolean;
    relocationSupport?: boolean;
    esops?: boolean;
  }
): { acceptanceProb: number; joiningProb: number } {
  const cur = candidate.curCtc || 15;
  const expc = candidate.expcCtc || 18;
  const offers = candidate.offers || 0;
  const notice = candidate.notice || 30;

  // Hike vs expectation ratio
  const ratio = offerLpa / Math.max(1, expc);
  let baseProb = 50;

  if (ratio >= 1.1) baseProb = 94;
  else if (ratio >= 1.0) baseProb = 88;
  else if (ratio >= 0.95) baseProb = 78;
  else if (ratio >= 0.9) baseProb = 66;
  else if (ratio >= 0.8) baseProb = 48;
  else baseProb = 25;

  // Deductions
  baseProb -= offers * 8;
  if (notice >= 60) baseProb -= 8;

  // Retention levers
  if (levers?.joiningBonus) baseProb += 6;
  if (levers?.noticeBuyout) baseProb += 8;
  if (levers?.relocationSupport) baseProb += 4;
  if (levers?.esops) baseProb += 6;

  const acceptanceProb = Math.min(98, Math.max(15, Math.round(baseProb)));
  const joiningProb = Math.min(96, Math.max(10, Math.round(acceptanceProb * (notice >= 60 ? 0.88 : 0.94))));

  return { acceptanceProb, joiningProb };
}
