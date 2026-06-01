import { adminDb } from '@/lib/firebase-admin';

export async function GET(request) {
  try {
    // Check ADMIN_SECRET_KEY in headers or query parameters
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get('secret');
    
    const secret = request.headers.get('admin-secret-key') || 
                   request.headers.get('x-admin-secret-key') || 
                   request.headers.get('authorization') ||
                   querySecret;
                   
    const envKey = (process.env.ADMIN_SECRET_KEY || '').replace(/^["']|["']$/g, '').trim();

    if (!envKey || secret !== envKey) {
      return Response.json({ error: 'Unauthorized — invalid secret key' }, { status: 401 });
    }

    if (!adminDb) {
      return Response.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    const ticketsSnapshot = await adminDb
      .collection('tickets')
      .orderBy('createdAt', 'desc')
      .get();

    const tickets = [];
    ticketsSnapshot.forEach(doc => {
      const data = doc.data();
      // Format timestamps for serialization if needed, though Firestore admin SDK returns
      // objects that can be serialized (but dates are best serialized as ISO strings or raw timestamp seconds)
      tickets.push({
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
        resolvedAt: data.resolvedAt ? data.resolvedAt.toDate().toISOString() : null,
        messages: (data.messages || []).map(msg => ({
          ...msg,
          timestamp: msg.timestamp ? msg.timestamp.toDate().toISOString() : null
        }))
      });
    });

    return Response.json(tickets);
  } catch (error) {
    console.error('[GetTickets] Error retrieving tickets:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
