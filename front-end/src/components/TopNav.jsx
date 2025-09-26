import { Link } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import OnlineUsers from "./Users/OnlineUsers";
import "./TopNav.css";

const TopNav = ({ boardId, client }) => {
  const { user } = useAuth();


  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <nav className="topnav">
      <Link to="/">Home</Link>
      {user ? (
        <>
          {/* Removed /whiteboard link to avoid invalid route, and incomplete settings page */}
          {/* <Link to="/settings">Settings</Link> */}
          <Link to="/files">Files</Link>
          {/* Render online users only on whiteboard */}
          {boardId && client && <OnlineUsers boardId={boardId} client={client} />}
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
