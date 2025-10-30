import { Link } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import ShareBtn from "./ShareBtn";
import OnlineUsers from "./Users/OnlineUsers";
import EditableBoardName from "./EditableBoardName";
import "./TopNav.css";
import { api } from "../config/api";
import { useEffect, useState } from "react";

const TopNav = ({ boardId, client, boardName, onRename }) => {
  const { user } = useAuth();
  const fileId = boardId;

  const [myPerm, setMyPerm] = useState(null);           // "owner" | "editor" | "viewer" | "none"
  const [canInvite, setCanInvite] = useState(false);     // derived from myPerm

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!boardId || !user) {
        if (alive) { setMyPerm(null); setCanInvite(false); }
        return;
      }
      try {
        const res = await api(`/files/${boardId}/permissions`);
        const p = res?.permissions ?? res?.permission ?? "viewer";
        if (!alive) return;
        setMyPerm(p);
        setCanInvite(p === "owner" || p === "editor");
      } catch {
        if (alive) { setMyPerm("viewer"); setCanInvite(false); }
      }
    })();
    return () => { alive = false; };
  }, [boardId, user]);

  const handleLogout = async () => {
    try {
      await api("/session/logout", { method: "POST" }); // clear httpOnly cookie
    } catch { /* ignore */ }
    await signOut(auth);
  };

  // If you want to HIDE the Share button for viewers, set this to `canInvite`.
  const showShareButton = !!boardId; // or: const showShareButton = !!boardId && canInvite;

  return (
    <nav className="topnav">
      <Link to="/">Home</Link>

      {user ? (
        <>
          <Link to="/files">Files</Link>

          {boardId && (
            <EditableBoardName
              fileId={fileId}
              value={boardName}
              onChange={onRename}
            />
          )}

          {boardId && client && (
            <OnlineUsers boardId={boardId} client={client} />
          )}

          {showShareButton && (
            <ShareBtn boardId={boardId} />
          )}

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
