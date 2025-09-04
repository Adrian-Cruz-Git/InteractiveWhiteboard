// Page for user authentication (login) - Second page a user is met with, if they already have an account
// login 
//Use firebase auth ui
// Later integrate google authentication aswell (button)
import { useState } from "react";
import { auth } from "../firebase";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import "./LoginPage.css";
import { useNavigate } from "react-router-dom";
import  TopNav from "../components/TopNav";


function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const googleProvider = new GoogleAuthProvider();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Logged in:", result.user);
      navigate("/");
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleEmailLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Logged in:", userCredential.user);
      navigate("/");
    } catch (err) {
      console.error(err.message);
    }
  };


  return (
    <>
      <TopNav />

      <div className="login-container">
        <h1 className="login-title">Login</h1>
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
        <button onClick={handleGoogleLogin} className="login-button red-btn">
          Continue with Google
        </button>
        <p className="register">Don't have an account? <a href="/register">Register</a></p>
      </div>
    </>
  );
}

export default LoginPage;
