const admin = require('firebase-admin');


// 🔒 Securely load service account values from .env
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // 🔑 \n को असली newline में बदलना जरूरी है
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

// ✅ Duplicate initialization से बचने के लिए check lagao
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'resume-ai-a2edc.appspot.com', // अगर storage use कर रहे हो तो
  });
}

// 🔥 Firestore aur Auth export karo
const db = admin.firestore();
const auth = admin.auth();

module.exports = { db, auth };
