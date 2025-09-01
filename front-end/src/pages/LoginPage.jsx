// Page for user authentication (login/register) - first page a user is met with
// Option to create account or login 
//Use firebase auth ui
// Later integrate google authentication aswell (button)
import { useState } from "react";
import { auth } from "../firebase";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import "./LoginPage.css";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const googleProvider = new GoogleAuthProvider();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Logged in:", result.user);
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleEmailLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Logged in:", userCredential.user);
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Registered:", userCredential.user);
    } catch (err) {
      console.error(err.message);
    }
  };

  return (
 <div className="login-container">
      <h1 className="login-title">Welcome</h1>
      <input
        type="email"
        placeholder="Email"
        className="login-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        className="login-input"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleEmailLogin} className="login-button blue-btn">
        Login with Email
      </button>
      <button onClick={handleRegister} className="login-button green-btn">
        Register
      </button>
      <button onClick={handleGoogleLogin} className="login-button red-btn">
        Continue with Google
      </button>
    </div>
  );
}

export default LoginPage;
