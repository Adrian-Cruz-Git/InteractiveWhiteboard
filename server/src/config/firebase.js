const admin = require("firebase-admin");

if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({ credential: admin.credential.cert(svc) });
    } else {
        // Falls back to GOOGLE_APPLICATION_CREDENTIALS when set
        admin.initializeApp({ credential: admin.credential.applicationDefault() });
    }
}

module.exports = admin;
