import { Link } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import "./TopNav.css";

const TopNav = () => {
  const { user } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <nav className="topnav">
      <Link to="/">Home</Link>
      {user ? (
        <>
          {/* Removed /whiteboard link to avoid invalid route */}
          <Link to="/settings">Settings</Link>
          <Link to="/files">Files</Link>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </nav>
  );
};

export default TopNav;
