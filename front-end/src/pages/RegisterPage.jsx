// Page for user registration (sign up)
import { useState } from "react";
import { auth } from "../firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import "./RegisterPage.css";
import { useNavigate, Link } from "react-router-dom";
import TopNav from "../components/TopNav";
import Popup from "../components/Popup";
import { getFriendlyError } from "../utils/firebaseErrors.js";

function RegisterPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Popup state for errors
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const googleProvider = new GoogleAuthProvider();

  // Google signup
  const handleGoogleRegister = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Registered:", result.user);

      const token = await result.user.getIdToken();
      localStorage.setItem("token", token);

      navigate("/");
    } catch (err) {
      setPopupMessage(getFriendlyError(err.code));
      setShowPopup(true);
      console.error(err);
    }
  };

  // Email signup
  const handleEmailRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("Registered:", userCredential.user);

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
      <div className="register-wrapper">
        <div className="register-container">
          <h1 className="register-title">Register</h1>
          <input
            type="email"
            placeholder="Email"
            className="register-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="register-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={handleEmailRegister}
            className="register-button blue-btn"
          >
            Sign Up with Email
          </button>
          <button
            onClick={handleGoogleRegister}
            className="register-button red-btn"
          >
            Continue with Google
          </button>
          <p className="login">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
      {/* Popup for errors */}
      <Popup trigger={showPopup} setTrigger={setShowPopup}>
        <h3 style={{ color: "black" }}>Error</h3>
        <p style={{ color: "black" }}>{popupMessage}</p>
      </Popup>
    </>
  );
}

export default RegisterPage;
