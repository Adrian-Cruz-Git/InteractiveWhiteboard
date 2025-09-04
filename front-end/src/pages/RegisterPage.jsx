// Page for user authentication (register only) first page a user is met with.
// Option to create account or login  - e.g Already have an account
//Use firebase auth ui
// Later integrate google authentication aswell (button)
import { useState } from "react";
import { auth } from "../firebase";
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword } from "firebase/auth";
import "./RegisterPage.css";
import { useNavigate } from "react-router-dom";
import TopNav from "../components/TopNav";
import Popup from "../components/Popup";
import {getFriendlyError} from "../utils/firebaseErrors.js";

function RegisterPage({ setToken }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Popup state for errors
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const googleProvider = new GoogleAuthProvider();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Logged in:", result.user);
      const token = await result.user.getIdToken();
      setToken(token);
      navigate("/");
    } catch (err) {
      setPopupMessage(getFriendlyError(err.code));
      setShowPopup(true);
      console.error(err);
    }
  };

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Registered:", userCredential.user);
      const token = await userCredential.user.getIdToken();
      setToken(token);
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
        <h1 className="login-title">Register</h1>
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
        <button onClick={handleRegister} className="login-button green-btn">
          Register
        </button>
        <button onClick={handleGoogleLogin} className="login-button red-btn">
          Continue with Google
        </button>
        <p>Already have an account? <a href="/login">Login</a></p>
      </div>
      <Popup trigger={showPopup} setTrigger={setShowPopup}>
        <h3 style={{ color: "black" }}>Error</h3>
        <p style={{ color: "black" }}>{popupMessage}</p>
      </Popup>
    </>
  );
}

export default RegisterPage;
