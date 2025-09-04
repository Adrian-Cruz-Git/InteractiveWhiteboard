import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import "./TopNav.css";

const TopNav = () => {
  const { currentUser } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <nav className="navbar">
      <Link to="/">Home</Link>
      {currentUser ? (
        <>
          <Link to="/whiteboard">Whiteboard</Link>
          <Link to="/settings">Settings</Link>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </nav>
  );
};

export default TopNav;
