/**
 * GD AI Discussion Turn Generator
 * 
 * POST /api/gd-ai/discuss
 * 
 * Returns a streaming Server-Sent Events response.
 * Each event contains a token chunk from the AI participant's response.
 * 
 * The client collects tokens and renders them progressively (streaming transcript).
 * When the stream ends, the complete turn text is available.
 */

import Anthropic from '@anthropic-ai/sdk';
import { buildTurnPrompt, buildModeratorPrompt } from '@/lib/gdPromptBuilder';
import { trackTokensServer } from '@/lib/tokenTrackerServer';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      topic,
      personaId,
      sessionPhase = 'debate',
      turns = [],
      elapsedMinutes = 0,
      moderatorDirective = null,
      lastStudentTurn = null,
      wasInterrupted = false,
      studentName = 'the student',
      personaNames = {},
      turnType = 'debate',
      uid = 'anonymous',
      isModerator = false,
    } = body;

    if (!topic || !personaId) {
      return new Response(
        JSON.stringify({ error: 'topic and personaId are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build the prompt
    const prompt = isModerator
      ? buildModeratorPrompt({
          topic,
          directive: moderatorDirective,
          turns,
          sessionPhase,
          personaNames,
          studentName,
        })
      : buildTurnPrompt({
          topic,
          personaId,
          sessionPhase,
          turns,
          elapsedMinutes,
          moderatorDirective,
          lastStudentTurn,
          wasInterrupted,
          studentName,
          personaNames,
          turnType,
        });

    // Create SSE stream
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let totalInputTokens = 0;
          let totalOutputTokens = 0;
          let fullText = '';

          // Use Claude Haiku for speed (target <1s first token)
          const anthropicStream = await client.messages.create({
            model: 'claude-haiku-4-5',
            max_tokens: 150, // hard cap: 100 words max per turn
            temperature: 0.8,
            messages: [
              {
                role: 'user',
                content: prompt,
              }
            ],
            stream: true,
          });

          for await (const event of anthropicStream) {
            if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
              const chunk = event.delta.text;
              fullText += chunk;

              // Send SSE event
              const sseData = JSON.stringify({ type: 'token', text: chunk });
              controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
            }

            if (event.type === 'message_delta' && event.usage) {
              totalOutputTokens = event.usage.output_tokens || 0;
            }

            if (event.type === 'message_start' && event.message?.usage) {
              totalInputTokens = event.message.usage.input_tokens || 0;
            }
          }

          // Send completion event with full text
          const doneData = JSON.stringify({
            type: 'done',
            text: fullText.trim(),
            personaId,
            turnType,
          });
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));

          // Track token usage (fire and forget)
          trackTokensServer(
            uid,
            'gd_ai',
            totalInputTokens,
            totalOutputTokens,
            'claude-haiku-4-5'
          ).catch(() => {});

        } catch (err) {
          console.error('[gd-ai/discuss] stream error:', err);
          const errData = JSON.stringify({ type: 'error', message: err.message });
          controller.enqueue(encoder.encode(`data: ${errData}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });

  } catch (error) {
    console.error('[gd-ai/discuss] error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate turn' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
