import { Link } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import ShareBtn from "./ShareBtn";
import OnlineUsers from "./Users/OnlineUsers";
import EditableBoardName from "./EditableBoardName";
import "./TopNav.css";

const TopNav = ({ boardId, client }) => {
  const { user } = useAuth();

  const handleNameChange  = (newName) => {
    setBoardName(newName);
     // future: call API endpoint here
    // await fetch(`/api/boards/${boardId}/rename`, { method: 'PUT', body: JSON.stringify({ name: newName }) });
  };

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
          {boardId && <EditableBoardName initialName={boardId} onNameChange={handleNameChange} />}
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
