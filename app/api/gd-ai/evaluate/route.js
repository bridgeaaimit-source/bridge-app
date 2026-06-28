/**
 * GD AI Evaluation Engine
 * 
 * POST /api/gd-ai/evaluate
 * 
 * Receives the full session transcript and generates a 9-dimension evaluation.
 * Saves the session record to users/{uid}/gd_sessions (compatible with Bridge Score engine).
 * 
 * Evaluation dimensions (matching PRD + Bridge Score engine expectations):
 * 1. Communication Clarity
 * 2. Leadership
 * 3. Confidence
 * 4. Critical Thinking
 * 5. Active Listening
 * 6. Persuasiveness
 * 7. Participation Balance
 * 8. Collaboration
 * 9. Evidence Usage
 */

import Anthropic from '@anthropic-ai/sdk';
import { adminDb, admin } from '@/lib/firebase-admin';
import { trackTokensServer } from '@/lib/tokenTrackerServer';
import { refreshBridgeScore } from '@/lib/refreshBridgeScore';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Raised: 5-dim schema needs up to ~44s inference + Firestore write buffer

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  let sessionId = 'unknown';
  let topic = '';
  let category = 'General';
  let difficulty = 'intermediate';
  let turns = [];
  let elapsedSeconds = 600;
  let uid = 'unknown';
  let studentName = 'the candidate';
  let attempt = 1;
  let studentTurns = [];

  try {
    const body = await request.json();
    sessionId = body.sessionId || `gd_ai_${Date.now()}`;
    topic = body.topic || '';
    category = body.category || 'General';
    difficulty = body.difficulty || 'intermediate';
    turns = body.turns || [];
    elapsedSeconds = body.elapsedSeconds || 600;
    uid = body.uid || 'unknown';
    studentName = body.studentName || 'the candidate';
    attempt = body.attempt || 1;

    if (!topic || !turns.length || !uid) {
      return NextResponse.json({ error: 'topic, turns, and uid are required' }, { status: 400 });
    }

    const safeTurns = Array.isArray(turns) ? turns : [];
    studentTurns = safeTurns.filter(t => t && t.speakerId === 'student');
    if (studentTurns.length === 0) {
      return NextResponse.json({ error: 'No student turns to evaluate' }, { status: 400 });
    }

    // Format full transcript for evaluation
    const transcriptText = turns
      .filter(t => t.speakerId !== 'moderator' || t.type === 'opening' || t.type === 'closing')
      .map(t => {
        const name = t.speakerId === 'student'
          ? studentName
          : (t.personaName || t.speakerId);
        return `${name}: "${t.text}"`;
      })
      .join('\n');

    const studentContributions = studentTurns
      .map((t, i) => `Contribution ${i + 1}: "${t.text}"`)
      .join('\n');

    // Prompt: 5 recruiter-critical dimensions (redesigned from 9)
    // Profiled output tokens: ~1,450 vs ~2,900 → inference ~32-44s vs ~61-81s
    // Secondary signals (confidence, listening, evidence, collaboration) are
    // embedded within the 5 core dimensions rather than scored separately.
    const prompt = `You are an expert Group Discussion evaluator for Indian placement interviews.

TOPIC: "${topic}"
DURATION: ${Math.round(elapsedSeconds / 60)} minutes
STUDENT: ${studentName} (${studentTurns.length} contributions)

FULL TRANSCRIPT:
${transcriptText}

STUDENT CONTRIBUTIONS:
${studentContributions}

Evaluate ${studentName} across 5 recruiter-critical dimensions. Be SPECIFIC — quote actual student text. Most students score 50-75; reserve 80+ for exceptional performance.

SCORING WEIGHTS: Communication 25% | Critical Thinking 25% | Leadership & Collaboration 20% | Persuasiveness 15% | Participation Quality 15%

CRITICAL RULES:
- Evidence quotes MUST be exact text from the student's contributions above.
- Do NOT assign the same score to every dimension.
- Improvement suggestions must be actionable, not generic.
- Consider quality of contributions, not just quantity.

Return ONLY a valid JSON object. No markdown, no code fences, no explanation text.

{
  "overallScore": number (0-100, weighted average per scoring weights above),
  "summary": "2-3 sentence honest assessment referencing specific discussion moments",
  "strongestMoment": "exact quote of the single best student contribution",
  "growthArea": "the single most important improvement area",
  "dimensions": {
    "communication": {
      "score": number (0-100),
      "grade": "A|B|C|D|F",
      "summary": "2 specific sentences about this student's communication. Include signals: clarity, fluency, articulation, confidence in delivery.",
      "evidence": [{"quote": "exact student quote", "annotation": "what this reveals about communication"}],
      "improvement": "One specific actionable improvement",
      "exercise": "One 5-minute daily drill"
    },
    "criticalThinking": {
      "score": number (0-100),
      "grade": "A|B|C|D|F",
      "summary": "2 specific sentences. Include secondary signals: logical structure, data/evidence usage, original analysis vs repetition.",
      "evidence": [{"quote": "exact student quote", "annotation": "what this shows about analytical depth"}],
      "improvement": "...",
      "exercise": "..."
    },
    "leadershipCollaboration": {
      "score": number (0-100),
      "grade": "A|B|C|D|F",
      "summary": "2 specific sentences. Include secondary signals: initiating discussion threads, building on others' points, steering the group, active listening cues.",
      "evidence": [{"quote": "exact student quote", "annotation": "what this shows about leadership or collaboration"}],
      "improvement": "...",
      "exercise": "..."
    },
    "persuasiveness": {
      "score": number (0-100),
      "grade": "A|B|C|D|F",
      "summary": "2 specific sentences. Include secondary signals: conviction, argument framing, ability to shift the group's direction.",
      "evidence": [{"quote": "exact student quote", "annotation": "what this shows about persuasive ability"}],
      "improvement": "...",
      "exercise": "..."
    },
    "participationQuality": {
      "score": number (0-100),
      "grade": "A|B|C|D|F",
      "summary": "2 specific sentences. Include secondary signals: timing of jumps, relevance of each contribution, balance (not too dominant, not too quiet).",
      "evidence": [{"quote": "exact student quote", "annotation": "what this shows about participation"}],
      "improvement": "...",
      "exercise": "..."
    }
  },
  "overallAnalysis": {
    "totalScore": number (same as overallScore),
    "communication": number (0-10, communication score ÷ 10),
    "logicalFlow": number (0-10, criticalThinking score ÷ 10),
    "contentQuality": number (0-10, derived from evidence depth within criticalThinking),
    "persuasiveness": number (0-10, persuasiveness score ÷ 10),
    "summary": "...",
    "topStrength": "...",
    "topWeakness": "...",
    "actionItems": ["item 1", "item 2", "item 3"]
  }
}`;

    // Configurable execution timeout — default 90s (safe margin below 120s maxDuration)
    const timeoutMs = parseInt(process.env.EVALUATION_TIMEOUT_MS || '90000', 10);
    console.log(`[GD][Evaluation] [Session: ${sessionId}] [User: ${uid}] Timeout configured at ${timeoutMs}ms.`);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`LLM evaluation call timed out (exceeded ${timeoutMs}ms)`)), timeoutMs)
    );

    const apiCallPromise = client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const startApiTime = Date.now();
    const message = await Promise.race([apiCallPromise, timeoutPromise]);
    const endApiTime = Date.now();
    console.log(`[GD][Evaluation] [Session: ${sessionId}] [User: ${uid}] Claude call resolved in ${endApiTime - startApiTime}ms.`);

    trackTokensServer(uid, 'gd_ai_eval', message.usage?.input_tokens, message.usage?.output_tokens, 'claude-sonnet-4-5').catch(() => {});

    const rawText = message.content[0].text || '';

    // 5. Strict Bracket Extractor (Task 2 / Refinement 1)
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
      console.error(`[GD][Evaluation] [Session: ${sessionId}] No matching braces found in LLM response:`, rawText.slice(0, 500));
      throw new Error('LLM response did not contain a valid JSON object wrapper matching required curly braces.');
    }

    let evaluation;
    try {
      evaluation = JSON.parse(rawText.substring(firstBrace, lastBrace + 1));
    } catch (parseErr) {
      console.error(`[GD][Evaluation] [Session: ${sessionId}] Extraction parsed invalid JSON structure:`, rawText.slice(0, 500));
      throw new Error(`LLM extracted JSON string is malformed or invalid: ${parseErr.message}`);
    }

    // 6. Schema Validation & Repair Layer (Task 8)
    if (typeof evaluation.overallScore !== 'number') {
      evaluation.overallScore = 60;
    } else {
      evaluation.overallScore = Math.max(0, Math.min(100, evaluation.overallScore));
    }

    if (typeof evaluation.summary !== 'string') {
      evaluation.summary = "Evaluation completed. The candidate participated actively in the discussion on the chosen topic.";
    }

    if (typeof evaluation.strongestMoment !== 'string') {
      evaluation.strongestMoment = "The candidate contributed structured arguments to the discussion flow.";
    }

    if (typeof evaluation.growthArea !== 'string') {
      evaluation.growthArea = "Enhance analytical content density and reference peer statements.";
    }

    if (!evaluation.dimensions || typeof evaluation.dimensions !== 'object') {
      evaluation.dimensions = {};
    }

    // 5-dimension schema validation & repair
    const requiredDims = [
      'communication', 'criticalThinking', 'leadershipCollaboration',
      'persuasiveness', 'participationQuality'
    ];

    requiredDims.forEach(dim => {
      if (!evaluation.dimensions[dim] || typeof evaluation.dimensions[dim] !== 'object') {
        evaluation.dimensions[dim] = {};
      }
      const d = evaluation.dimensions[dim];
      if (typeof d.score !== 'number') d.score = 60;
      d.score = Math.max(0, Math.min(100, d.score));
      if (typeof d.grade !== 'string') d.grade = d.score >= 80 ? 'A' : d.score >= 65 ? 'B' : d.score >= 50 ? 'C' : d.score >= 35 ? 'D' : 'F';
      if (typeof d.summary !== 'string') d.summary = `The candidate demonstrated baseline performance in the ${dim} area.`;
      if (!Array.isArray(d.evidence)) d.evidence = [];
      if (typeof d.improvement !== 'string') d.improvement = 'Focus on delivering structured, evidence-backed contributions.';
      if (typeof d.exercise !== 'string') d.exercise = 'Practice the PEP (Point, Explanation, Proof) framework in a 5-minute daily drill.';
    });

    if (!evaluation.overallAnalysis || typeof evaluation.overallAnalysis !== 'object') {
      evaluation.overallAnalysis = {};
    }
    const oa = evaluation.overallAnalysis;
    const dims = evaluation.dimensions;
    // Derive overallAnalysis from 5 dimensions — preserves Bridge Score engine compatibility
    if (typeof oa.totalScore !== 'number') oa.totalScore = evaluation.overallScore;
    if (typeof oa.communication !== 'number') oa.communication = Math.round((dims.communication?.score || 60) / 10);
    if (typeof oa.logicalFlow !== 'number') oa.logicalFlow = Math.round((dims.criticalThinking?.score || 60) / 10);
    if (typeof oa.contentQuality !== 'number') oa.contentQuality = Math.round((dims.criticalThinking?.score || 60) / 10);
    if (typeof oa.persuasiveness !== 'number') oa.persuasiveness = Math.round((dims.persuasiveness?.score || 60) / 10);
    if (typeof oa.summary !== 'string') oa.summary = evaluation.summary;
    if (typeof oa.topStrength !== 'string') oa.topStrength = 'Logic-dense communication framing.';
    if (typeof oa.topWeakness !== 'string') oa.topWeakness = 'Actionable quantitative evidence implementation.';
    if (!Array.isArray(oa.actionItems) || oa.actionItems.length === 0) {
      oa.actionItems = [
        'Structure contributions using the PEP (Point, Explanation, Example) framework.',
        'Practice reference-based active listening to build on other participants\' arguments.',
        'Integrate structured data and placement-level facts in debate pitches.',
      ];
    }

    // Save to Firestore — compatible with bridgeScoreEngine.js expectations
    const sessionRecord = {
      sessionId: sessionId || `gd_ai_${Date.now()}`,
      topic,
      category,
      difficulty,
      type: 'ai_gd',
      durationSeconds: elapsedSeconds,
      studentTurnCount: studentTurns.length,
      totalTurns: turns.length,
      transcript: turns.map(t => ({
        speakerId: t.speakerId,
        speakerName: t.personaName || t.speakerId,
        text: t.text,
        type: t.type || 'debate',
      })),
      overallScore: evaluation.overallScore,
      summary: evaluation.summary,
      strongestMoment: evaluation.strongestMoment,
      growthArea: evaluation.growthArea,
      dimensions: evaluation.dimensions,
      overallAnalysis: evaluation.overallAnalysis,
      status: 'REPORT_READY',
      createdAt: admin?.firestore?.FieldValue?.serverTimestamp?.() || new Date(),
    };

    if (adminDb) {
      const startDbWrite = Date.now();
      await adminDb
        .collection('users')
        .doc(uid)
        .collection('gd_sessions')
        .doc(sessionRecord.sessionId)
        .set(sessionRecord);
      const endDbWrite = Date.now();
      console.log(`[GD][Firestore] [Session: ${sessionRecord.sessionId}] Saved final report record to Firestore in ${endDbWrite - startDbWrite}ms.`);

      // Trigger Bridge Score refresh in background — non-blocking, does not delay user response
      refreshBridgeScore(uid).catch(err =>
        console.warn(`[BridgeScore] [User: ${uid}] Background refresh failed (non-fatal):`, err.message)
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: sessionRecord.sessionId,
      evaluation,
    });

  } catch (error) {
    // 7. Structured Diagnostic Exception Logging & Firestore Preservation (Task 9 / Refinement 2 & 3)
    const errTimestamp = new Date().toISOString();
    console.error(`[GD][Evaluation] [Session: ${sessionId}] [User: ${uid}] [Timestamp: ${errTimestamp}] [Attempt: ${attempt}] Evaluation pipeline exception caught.
Error Message: ${error.message}
Stack Trace: ${error.stack}`);

    if (adminDb && uid && sessionId && turns && turns.length > 0) {
      try {
        console.log(`[GD][Firestore] [Session: ${sessionId}] Saving preservation record under 'evaluation_failed' status...`);
        const failedRecord = {
          sessionId,
          topic,
          category,
          difficulty,
          type: 'ai_gd',
          durationSeconds: elapsedSeconds,
          studentTurnCount: studentTurns.length,
          totalTurns: turns.length,
          turns: turns.map(t => ({
            speakerId: t.speakerId,
            speakerName: t.personaName || t.speakerId,
            text: t.text,
            type: t.type || 'debate',
          })),
          status: 'evaluation_failed',
          failureReason: error.message || 'Evaluation run failed',
          retryAttemptCount: attempt,
          lastFailedAt: errTimestamp,
          createdAt: admin?.firestore?.FieldValue?.serverTimestamp?.() || new Date(),
        };
        await adminDb
          .collection('users')
          .doc(uid)
          .collection('gd_sessions')
          .doc(sessionId)
          .set(failedRecord, { merge: true });
        console.log(`[GD][Firestore] [Session: ${sessionId}] Preservation record successfully committed to database.`);
      } catch (dbErr) {
        console.error(`[GD][Firestore] [Session: ${sessionId}] Failed to commit preservation record to database:`, dbErr);
      }
    }

    return NextResponse.json({ error: error.message || 'Evaluation failed' }, { status: 500 });
  }
}
