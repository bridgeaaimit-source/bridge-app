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
  try {
    const {
      sessionId,
      topic,
      category = 'General',
      difficulty = 'intermediate',
      turns = [],
      elapsedSeconds = 600,
      uid,
      studentName = 'the candidate',
    } = await request.json();

    if (!topic || !turns.length || !uid) {
      return NextResponse.json({ error: 'topic, turns, and uid are required' }, { status: 400 });
    }

    // Extract student turns only
    const studentTurns = turns.filter(t => t.speakerId === 'student');
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

Return ONLY valid JSON, no markdown:
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

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    trackTokensServer(uid, 'gd_ai_eval', message.usage?.input_tokens, message.usage?.output_tokens, 'claude-sonnet-4-5').catch(() => {});

    const rawText = message.content[0].text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    let evaluation;
    try {
      evaluation = JSON.parse(rawText);
    } catch {
      console.error('[gd-ai/evaluate] JSON parse error:', rawText.slice(0, 500));
      return NextResponse.json({ error: 'Evaluation parsing failed' }, { status: 500 });
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
      // Bridge Score engine reads this field:
      overallAnalysis: evaluation.overallAnalysis,
      createdAt: admin?.firestore?.FieldValue?.serverTimestamp?.() || new Date(),
    };

    if (adminDb) {
      await adminDb
        .collection('users')
        .doc(uid)
        .collection('gd_sessions')
        .doc(sessionRecord.sessionId)
        .set(sessionRecord);
    }

    return NextResponse.json({
      success: true,
      sessionId: sessionRecord.sessionId,
      evaluation,
    });

  } catch (error) {
    console.error('[gd-ai/evaluate] error:', error);
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 500 });
  }
}
