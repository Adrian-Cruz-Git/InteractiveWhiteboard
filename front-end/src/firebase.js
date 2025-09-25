// firebase.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional



const firebaseConfig = {
  apiKey: "AIzaSyA19NQwfim_XkgbXyNB5EZtMJ7k1UV7FCY",
  authDomain: "whiteboard-b2bb2.firebaseapp.com",
  databaseURL: "https://whiteboard-b2bb2-default-rtdb.firebaseio.com",
  projectId: "whiteboard-b2bb2",
  storageBucket: "whiteboard-b2bb2.firebasestorage.app",
  messagingSenderId: "577487192519",
  appId: "1:577487192519:web:cc41eedac02c3d9e6019e2",
  measurementId: "G-7GN3TBB4E9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
