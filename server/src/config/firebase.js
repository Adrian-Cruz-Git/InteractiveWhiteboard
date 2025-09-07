const admin = require("firebase-admin");  // Firebase Admin SDK
const serviceAccount = require("../../serviceAccountKey.json"); // Path to your service account key JSON file


// Initialize Firebase Admin SDK
admin.initializeApp({ 
  credential: admin.credential.cert(serviceAccount), // Use the service account credentials
});

const db = admin.firestore(); // Initialize Firestore

module.exports = { admin, db };
