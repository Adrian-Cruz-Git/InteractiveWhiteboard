import { Link } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import ShareBtn from "./ShareBtn";
import OnlineUsers from "./Users/OnlineUsers";
import EditableBoardName from "./EditableBoardName";
import "./TopNav.css";
import { api } from "../config/api";

const TopNav = ({ boardId, client, boardName, onRename }) => {
  const { user } = useAuth();
  const fileId = boardId;



  const handleLogout = async () => {
    // clear backend cookie first
    try {
      await api("/session/logout", { method: "POST" });
    } catch { }
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
          {boardId && <EditableBoardName fileId={fileId} value={boardName} onChange={onRename} />}
          {boardId && client && <OnlineUsers boardId={boardId} client={client} />}
          {boardId && <ShareBtn activeBoard={boardId} />}


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
