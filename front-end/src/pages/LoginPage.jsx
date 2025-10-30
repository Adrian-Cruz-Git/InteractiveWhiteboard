import { useState } from "react";
import { auth } from "../firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
} from "firebase/auth";
import "./LoginPage.css";
import { useNavigate, Link, useLocation } from "react-router-dom";
import TopNav from "../components/TopNav";
import Popup from "../components/Popup";
import { getFriendlyError } from "../utils/firebaseErrors.js";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const googleProvider = new GoogleAuthProvider();

  const params = new URLSearchParams(location.search);
  const rawNext = params.get("next") || "";
  const nextTarget = rawNext.startsWith("/") ? rawNext : "/files";

  // Google login
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Logged in:", result.user);

      navigate(nextTarget, { replace: true });
    } catch (err) {
      setPopupMessage(getFriendlyError(err.code));
      setShowPopup(true);
      console.error(err);
    }
  };

  // Email login
  const handleEmailLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Logged in:", userCredential.user);

      navigate(nextTarget, { replace: true });
    } catch (err) {
      setPopupMessage(getFriendlyError(err.code));
      setShowPopup(true);
      console.error(err);
    }
  };

  const registerHref = params.toString() ? `/register?${params.toString()}` : "/register";

  return (
    <>
      <TopNav />
      <div className="login-wrapper">
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
          <p className="register">
            Don&apos;t have an account? <Link to={registerHref}>Register</Link>
          </p>
        </div>
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
