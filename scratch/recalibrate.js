import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import * as admin from 'firebase-admin';
import { calculateBridgeScore } from '../lib/bridgeScoreEngine.js';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
    });
}

const db = admin.firestore();

async function runRecalibration() {
    console.log("🚀 Starting Bridge Score Recalibration...");
    
    try {
        const usersSnap = await db.collection('users').get();
        console.log(`Found ${usersSnap.size} total users.`);

        let successCount = 0;
        let failCount = 0;

        for (const doc of usersSnap.docs) {
            const userId = doc.id;
            console.log(`\nProcessing user: ${userId}`);

            try {
                // Fetch Aptitude
                const aptitudeSnap = await db.collection('users').doc(userId).collection('aptitude')
                    .orderBy('createdAt', 'desc').limit(5).get();
                const aptitudeRecords = aptitudeSnap.docs.map(d => d.data()).reverse();

                // Fetch Interviews
                const interviewSnap = await db.collection('users').doc(userId).collection('interviews')
                    .orderBy('createdAt', 'desc').limit(5).get();
                const interviewRecords = interviewSnap.docs.map(d => d.data()).reverse();

                // Fetch GD
                const gdSnap = await db.collection('users').doc(userId).collection('gd_sessions')
                    .orderBy('createdAt', 'desc').limit(5).get();
                const gdRecords = gdSnap.docs.map(d => d.data()).reverse();

                // Fetch old Bridge Scores for reliability (we will only fetch the ones NOT marked as isRecalibration if possible, but let's just fetch all to be safe)
                const scoreSnap = await db.collection('users').doc(userId).collection('bridge_scores')
                    .orderBy('createdAt', 'desc').limit(5).get();
                const historicalBridgeScores = scoreSnap.docs.map(d => d.data().score).reverse();

                const candidateData = {
                    aptitudeRecords,
                    interviewRecords,
                    gdRecords,
                    historicalBridgeScores
                };

                const newScoreResult = calculateBridgeScore(candidateData);

                // If user has absolutely no data, calculateBridgeScore returns score: null.
                if (newScoreResult.score === null) {
                    console.log(`⏭️  Skipping user ${userId} - No assessment data available.`);
                    continue;
                }

                console.log(`✅ Calculated new score for ${userId}: ${newScoreResult.score}`);

                // Save new authoritative score to bridge_scores subcollection
                await db.collection('users').doc(userId).collection('bridge_scores').add({
                    ...newScoreResult,
                    isRecalibration: true,
                    createdAt: new Date() // Use server timestamp technically better but Date works
                });

                // Update root user document
                await db.collection('users').doc(userId).update({
                    bridgeScore: newScoreResult.score,
                    lastBridgeScoreUpdate: new Date(),
                    bridgeScoreVersion: newScoreResult.version
                });

                successCount++;

            } catch (err) {
                console.error(`❌ Error processing user ${userId}:`, err);
                failCount++;
            }
        }

        console.log(`\n🎉 Recalibration Complete!`);
        console.log(`Successfully updated: ${successCount} users.`);
        console.log(`Failed to update: ${failCount} users.`);

    } catch (err) {
        console.error("Critical error during recalibration:", err);
    }
}

runRecalibration();
