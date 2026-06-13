import Anthropic from '@anthropic-ai/sdk';
import { trackTokensServer } from '@/lib/tokenTrackerServer';





export async function POST(request) {
  try {
    const body = await request.json();
    const { pdf_base64, question, chat_history, user_id, userId } = body;

    if (!pdf_base64 || !question) {
      return Response.json(
        { error: 'PDF and question are required' },
        { status: 400 }
      );
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    // Build conversation context
    const conversationContext = chat_history?.slice(-5).map(msg => ({
      role: msg.role,
      content: msg.content
    })) || [];

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        ...conversationContext,
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdf_base64
              }
            },
            {
              type: 'text',
              text: question
            }
          ]
        }
      ]
    });

    // Track token usage
    await trackTokensServer(user_id || userId || 'anonymous', 'pdf-chat', message.usage?.input_tokens, message.usage?.output_tokens);

    const answer = message.content[0].text;

    return Response.json({ answer });
  } catch (error) {
    console.error('PDF Chat Error:', error);
    return Response.json(
      { error: 'Failed to process PDF question' },
      { status: 500 }
    );
  }
}
