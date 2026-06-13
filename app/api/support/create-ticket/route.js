import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export async function POST(request) {
  try {
    const body = await request.json();
    const { uid, userName, userEmail, category, description, screenshotUrl } = body;

    if (!uid || !userName || !userEmail || !category || !description) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!adminDb) {
      console.log('⚠️ Firebase Admin not initialized. Running mock ticket creation.');
      return Response.json({ success: true, ticketId: 'BR-001', mock: true });
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

    // Prepare Discord Message
    const truncatedDesc = description.length > 300 ? description.substring(0, 300) + '...' : description;
    
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
    
    if (discordWebhookUrl) {
      try {
        const discordPayload = {
          content: `🚨 **New Support Ticket: #${ticketId}** 🚨`,
          embeds: [{
            title: `Ticket Details`,
            color: 16711680, // Red color
            fields: [
              { name: "Student", value: userName, inline: true },
              { name: "Email", value: userEmail, inline: true },
              { name: "Category", value: category, inline: false },
              { name: "Description", value: truncatedDesc, inline: false },
              { name: "Link", value: "[View Ticket in Admin Dashboard](https://www.appbridgeai.in/admin/support)", inline: false }
            ]
          }]
        };

        const response = await fetch(discordWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(discordPayload)
        });

        if (!response.ok) {
          console.error('[CreateTicket] Discord webhook failed:', await response.text());
        } else {
          console.log('[CreateTicket] Discord notification sent successfully.');
        }
      } catch (discordError) {
        console.error('[CreateTicket] Error sending to Discord:', discordError.message);
      }
    } else {
      console.warn('[CreateTicket] DISCORD_WEBHOOK_URL missing. Notifications skipped.');
    }

    return Response.json({ success: true, ticketId });
  } catch (error) {
    console.error('[CreateTicket] Error creating ticket:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
