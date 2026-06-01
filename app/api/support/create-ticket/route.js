import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import twilio from 'twilio';

export async function POST(request) {
  try {
    const body = await request.json();
    const { uid, userName, userEmail, category, description, screenshotUrl } = body;

    if (!uid || !userName || !userEmail || !category || !description) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!adminDb) {
      return Response.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    // Generate ticketId: query tickets collection count -> 'BR-' + padded number
    const ticketsCollection = adminDb.collection('tickets');
    const ticketsCountSnap = await ticketsCollection.count().get();
    const count = ticketsCountSnap.data().count;
    const ticketId = `BR-${String(count + 1).padStart(3, '0')}`;

    // Create the ticket document data
    const ticketData = {
      ticketId,
      uid,
      userName,
      userEmail,
      category,
      description,
      screenshotUrl: screenshotUrl || null,
      status: 'open',
      assignedTo: null,
      assignedName: null,
      messages: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      resolvedAt: null
    };

    // Save ticket to Firestore using ticketId as the document ID
    await ticketsCollection.doc(ticketId).set(ticketData);

    // Prepare WhatsApp Message
    const truncatedDesc = description.length > 100 ? description.substring(0, 100) + '...' : description;
    const messageText = `🆕 New BRIDGE Support Ticket\nTicket: #${ticketId}\nStudent: ${userName}\nIssue: ${category}\nDescription: ${truncatedDesc}\n👉 appbridgeai.in/admin/support`;

    // Try sending Twilio WhatsApp notifications
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioWhatsappFrom = process.env.TWILIO_WHATSAPP_FROM;

    if (twilioAccountSid && twilioAuthToken && twilioWhatsappFrom) {
      try {
        const client = twilio(twilioAccountSid, twilioAuthToken);
        const formattedFrom = twilioWhatsappFrom.startsWith('whatsapp:')
          ? twilioWhatsappFrom
          : `whatsapp:${twilioWhatsappFrom}`;

        const recipients = [
          process.env.SUPPORT_WHATSAPP_1,
          process.env.SUPPORT_WHATSAPP_2,
          process.env.SUPPORT_WHATSAPP_3
        ].filter(Boolean);

        const sendPromises = recipients.map(to => {
          const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
          return client.messages.create({
            from: formattedFrom,
            to: formattedTo,
            contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
            contentVariables: JSON.stringify({
              "1": `Ticket ${ticketId}`,
              "2": userName
            })
          });
        });

        const results = await Promise.allSettled(sendPromises);
        
        // Log successes and failures
        let successCount = 0;
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`[CreateTicket] Twilio failed for recipient ${recipients[index]}:`, result.reason);
          } else {
            successCount++;
          }
        });
        
        console.log(`[CreateTicket] Twilio notifications sent successfully to ${successCount}/${recipients.length} recipients.`);
      } catch (twilioError) {
        console.error('[CreateTicket] Twilio notification failed:', twilioError.message);
      }
    } else {
      console.warn('[CreateTicket] Twilio credentials missing. WhatsApp notifications skipped.');
    }

    return Response.json({ success: true, ticketId });
  } catch (error) {
    console.error('[CreateTicket] Error creating ticket:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
