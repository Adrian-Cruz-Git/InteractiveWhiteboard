import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../config/api";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

export default function InviteAcceptPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Checking invitation...");
  const boardId = params.get("board_id");
  const email = params.get("email");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!boardId || !email) {
        setStatus("Invalid invite link.");
        return;
      }
      if (!user) {
        setStatus("Please log in to accept the invite...");
        navigate("/login?redirect=" + encodeURIComponent(window.location.pathname + window.location.search));
        return;
      }
      try {
        await api("/invitations/accept", {
          method: "POST",
          body: { board_id: boardId, email }
        });
        setStatus("Invitation accepted. Redirecting...");
        navigate(`/board/${boardId}`);
      } catch (e) {
        setStatus(e.message || "Failed to accept invitation.");
      }
    });
    return () => unsub();
  }, [boardId, email]);

  return <div style={{padding: 24}}><h2>{status}</h2></div>;
}
