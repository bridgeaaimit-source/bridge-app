const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Parse .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

if (env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY && env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
  console.log('Firebase Admin initialized.');
} else {
  console.error('Credentials missing in .env.local');
  process.exit(1);
}

const db = admin.firestore();

async function run() {
  console.log('=== Firestore Token Usage Audit ===');
  
  // List daily collections
  // Firestore collections are retrieved by getting documents first
  const dailyDoc = db.collection('tokenUsage').doc('daily');
  const collections = await dailyDoc.listCollections();
  
  for (const coll of collections) {
    console.log(`\nCollection: ${coll.id}`);
    const snapshot = await coll.get();
    snapshot.forEach(doc => {
      console.log(`  Document (UID): ${doc.id}`);
      console.log('  Data:', JSON.stringify(doc.data(), null, 2));
    });
  }
}

run().catch(console.error);
