const admin = require("firebase-admin");  // Firebase Admin SDK
const serviceAccount = require("../serviceAccountKey.json"); // Path to your service account key JSON file


// Initialize Firebase Admin SDK
admin.initializeApp({ 
  credential: admin.credential.cert(serviceAccount), // Use the service account credentials
  storageBucket: "whiteboard-b2bb2.appspot.com" // Your Firebase Storage bucket name
});

const db = admin.firestore(); // Initialize Firestore
