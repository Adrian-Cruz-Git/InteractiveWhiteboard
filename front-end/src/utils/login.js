import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Logged in:", userCredential.user.email);
    return userCredential.user;
  } catch (err) {
    console.error("Login error:", err);
  }
}
