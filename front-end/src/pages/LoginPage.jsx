// Page for user authentication (login) - Second page a user is met with, if they already have an account
// login 
//Use firebase auth ui
// Later integrate google authentication aswell (button)
import { useState } from "react";
import { auth } from "../firebase";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import "./LoginPage.css";
import { useNavigate } from "react-router-dom";
import TopNav from "../components/TopNav";
import Popup from "../components/Popup";
import {getFriendlyError} from "../utils/firebaseErrors.js";

function LoginPage() {
  const navigate = useNavigate(); //navigate with react router

  const [email, setEmail] = useState(""); // set email with the one in the box
  const [password, setPassword] = useState(""); //set password same

  // Popup state for errors
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const googleProvider = new GoogleAuthProvider();



  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Logged in:", result.user);

      const token = await result.user.getIdToken();
      localStorage.setItem("token", token);

      navigate("/");
    } catch (err) {
      setPopupMessage(getFriendlyError(err.code));
      setShowPopup(true);
      console.error(err);
    }
  };

  const handleEmailLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Logged in:", userCredential.user);

      const token = await userCredential.user.getIdToken();
      localStorage.setItem("token", token);

      navigate("/");
    } catch (err) {
      setPopupMessage(getFriendlyError(err.code));
      setShowPopup(true);
      console.error(err);
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
      {/* Popup */}
      <Popup trigger={showPopup} setTrigger={setShowPopup}>
        <h3 style={{ color: "black" }}>Error</h3>
        <p style={{ color: "black" }}>{popupMessage}</p>
      </Popup>
    </>
  );
}

export default LoginPage;
