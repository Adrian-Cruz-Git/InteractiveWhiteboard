import { initializeApp } from 'firebase-admin/app';

const app = initializeApp();

const admin = require("firebase-admin");
const serviceAccount = require("../../../../../whiteboard-f5b48-firebase-adminsdk-fbsvc-afc081cd56.json"); //local path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
