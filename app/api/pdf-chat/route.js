import Anthropic from '@anthropic-ai/sdk';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin for token tracking
let adminDb = null;
try {
  if (!admin.apps.length && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });
  }
  adminDb = admin.firestore();
} catch (error) {
  console.warn('Firebase Admin init failed:', error.message);
}

// Track token usage
async function trackTokens(userId, feature, inputTokens, outputTokens) {
  if (!adminDb) return;
  const total = (inputTokens || 0) + (outputTokens || 0);
  const today = new Date().toISOString().split('T')[0];
  
  try {
    await adminDb.collection('tokenUsage').doc('daily').collection(today).doc(userId || 'anonymous').set({
      userId: userId || 'anonymous',
      [feature]: admin.firestore.FieldValue.increment(total),
      total: admin.firestore.FieldValue.increment(total),
      lastUsed: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log(`📊 ${userId || 'anonymous'} | ${feature}: ${total} tokens`);
  } catch (e) {
    console.error('Token tracking failed:', e);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { pdf_base64, question, chat_history, user_id } = body;

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
    await trackTokens(user_id, 'pdf-chat', message.usage?.input_tokens, message.usage?.output_tokens);

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
