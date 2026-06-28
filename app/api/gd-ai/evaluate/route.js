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
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

    const prompt = `You are an expert Group Discussion evaluator for Indian MBA and engineering placement interviews.

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

You MUST return ONLY valid JSON.
Do not include:
- Markdown (do not wrap in \`\`\`json or other code fences)
- Explanations
- Notes
- Introductory text
- Trailing text
- Apologies

Return exactly one JSON object matching the required schema:
{
  "overallScore": number (0-100, weighted average),
  "summary": "2-3 sentence honest overall assessment referencing the discussion",
  "strongestMoment": "the single best thing the student said, quoted exactly",
  "growthArea": "the single most important improvement needed",
  "dimensions": {
    "communication": {
      "score": number (0-100),
      "grade": "A|B|C|D|F",
      "summary": "2 sentences specific to THIS student's actual communication style",
      "evidence": [
        {"quote": "exact student quote", "annotation": "what this shows about their communication", "timestamp": "turn number or approximate time"}
      ],
      "improvement": "One specific, actionable improvement",
      "exercise": "A concrete 5-minute daily exercise to improve this dimension"
    },
    "leadership": {
      "score": number,
      "grade": "A|B|C|D|F",
      "summary": "2 sentences",
      "evidence": [{"quote": "...", "annotation": "...", "timestamp": "..."}],
      "improvement": "...",
      "exercise": "..."
    },
    "confidence": {
      "score": number,
      "grade": "A|B|C|D|F",
      "summary": "2 sentences",
      "evidence": [{"quote": "...", "annotation": "...", "timestamp": "..."}],
      "improvement": "...",
      "exercise": "..."
    },
    "criticalThinking": {
      "score": number,
      "grade": "A|B|C|D|F",
      "summary": "2 sentences",
      "evidence": [{"quote": "...", "annotation": "...", "timestamp": "..."}],
      "improvement": "...",
      "exercise": "..."
    },
    "listening": {
      "score": number,
      "grade": "A|B|C|D|F",
      "summary": "2 sentences — did they reference or respond to what others said?",
      "evidence": [{"quote": "...", "annotation": "...", "timestamp": "..."}],
      "improvement": "...",
      "exercise": "..."
    },
    "persuasiveness": {
      "score": number,
      "grade": "A|B|C|D|F",
      "summary": "2 sentences — were their arguments convincing?",
      "evidence": [{"quote": "...", "annotation": "...", "timestamp": "..."}],
      "improvement": "...",
      "exercise": "..."
    },
    "participation": {
      "score": number,
      "grade": "A|B|C|D|F",
      "summary": "2 sentences — was participation balanced? Not too dominant, not too quiet?",
      "evidence": [{"quote": "...", "annotation": "...", "timestamp": "..."}],
      "improvement": "...",
      "exercise": "..."
    },
    "collaboration": {
      "score": number,
      "grade": "A|B|C|D|F",
      "summary": "2 sentences — did they build on others' points?",
      "evidence": [{"quote": "...", "annotation": "...", "timestamp": "..."}],
      "improvement": "...",
      "exercise": "..."
    },
    "evidenceUsage": {
      "score": number,
      "grade": "A|B|C|D|F",
      "summary": "2 sentences — did they cite data, examples, or facts?",
      "evidence": [{"quote": "...", "annotation": "...", "timestamp": "..."}],
      "improvement": "...",
      "exercise": "..."
    }
  },
  "overallAnalysis": {
    "totalScore": number (same as overallScore),
    "communication": number (0-10, the communication score / 10),
    "logicalFlow": number (0-10, critical thinking / 10),
    "contentQuality": number (0-10, evidence usage / 10),
    "persuasiveness": number (0-10, persuasiveness / 10),
    "summary": "...",
    "topStrength": "...",
    "topWeakness": "...",
    "actionItems": ["item 1", "item 2", "item 3"]
  }
}`;

    // 4. Configurable execution timeout wrapper (Task 3 / Refinement 1)
    const timeoutMs = parseInt(process.env.EVALUATION_TIMEOUT_MS || '45000', 10);
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

    const requiredDims = [
      'communication', 'leadership', 'confidence', 'criticalThinking', 
      'listening', 'persuasiveness', 'participation', 'collaboration', 'evidenceUsage'
    ];

    requiredDims.forEach(dim => {
      if (!evaluation.dimensions[dim] || typeof evaluation.dimensions[dim] !== 'object') {
        evaluation.dimensions[dim] = {};
      }
      const d = evaluation.dimensions[dim];
      if (typeof d.score !== 'number') d.score = 60;
      if (typeof d.grade !== 'string') d.grade = d.score >= 80 ? 'A' : d.score >= 60 ? 'B' : d.score >= 45 ? 'C' : 'D';
      if (typeof d.summary !== 'string') d.summary = `Candidate demonstrated consistent performance in the ${dim} area.`;
      if (!Array.isArray(d.evidence)) d.evidence = [];
      if (typeof d.improvement !== 'string') d.improvement = "Focus on structuring key arguments.";
      if (typeof d.exercise !== 'string') d.exercise = "Engage in structured peer discussion drills.";
    });

    if (!evaluation.overallAnalysis || typeof evaluation.overallAnalysis !== 'object') {
      evaluation.overallAnalysis = {};
    }
    const oa = evaluation.overallAnalysis;
    if (typeof oa.totalScore !== 'number') oa.totalScore = evaluation.overallScore;
    if (typeof oa.communication !== 'number') oa.communication = Math.round((evaluation.dimensions.communication?.score || 60) / 10);
    if (typeof oa.logicalFlow !== 'number') oa.logicalFlow = Math.round((evaluation.dimensions.criticalThinking?.score || 60) / 10);
    if (typeof oa.contentQuality !== 'number') oa.contentQuality = Math.round((evaluation.dimensions.evidenceUsage?.score || 60) / 10);
    if (typeof oa.persuasiveness !== 'number') oa.persuasiveness = Math.round((evaluation.dimensions.persuasiveness?.score || 60) / 10);
    if (typeof oa.summary !== 'string') oa.summary = evaluation.summary;
    if (typeof oa.topStrength !== 'string') oa.topStrength = "Logic-dense communication framing.";
    if (typeof oa.topWeakness !== 'string') oa.topWeakness = "Actionable quantitative evidence implementation.";
    if (!Array.isArray(oa.actionItems) || oa.actionItems.length === 0) {
      oa.actionItems = [
        "Structure contributions using the PEP (Point, Explanation, Example) framework.",
        "Practice reference-based active listening to build on other participants' arguments.",
        "Integrate structured data and placement-level facts in debate pitches."
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
