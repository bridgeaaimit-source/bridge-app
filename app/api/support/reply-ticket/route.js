import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export async function POST(request) {
  try {
    // Check ADMIN_SECRET_KEY in headers
    const secret = request.headers.get('admin-secret-key') || 
                   request.headers.get('x-admin-secret-key') || 
                   request.headers.get('authorization');
                   
    const envKey = (process.env.ADMIN_SECRET_KEY || '').replace(/^["']|["']$/g, '').trim();

    if (!envKey || secret !== envKey) {
      return Response.json({ error: 'Unauthorized — invalid secret key' }, { status: 401 });
    }

    if (!adminDb) {
      return Response.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    const body = await request.json();
    const { ticketId, replyText, adminName, newStatus } = body;

    if (!ticketId || !replyText || !adminName) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const ticketRef = adminDb.collection('tickets').doc(ticketId);
    const ticketDoc = await ticketRef.get();

    if (!ticketDoc.exists) {
      return Response.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const updateData = {
      messages: admin.firestore.FieldValue.arrayUnion({
        sender: 'support',
        name: adminName,
        text: replyText,
        timestamp: admin.firestore.Timestamp.now()
      }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (newStatus) {
      updateData.status = newStatus;
      if (newStatus === 'resolved') {
        updateData.resolvedAt = admin.firestore.FieldValue.serverTimestamp();
      }
    }

    await ticketRef.update(updateData);

    return Response.json({ success: true });
  } catch (error) {
    console.error('[ReplyTicket] Error replying to ticket:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
