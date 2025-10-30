import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { api } from "../config/api";

export default function AcceptInvitePage() {
  const { token } = useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [msg, setMsg] = useState("Processing invite…");

  useEffect(() => {
    if (!token) { setMsg("Invalid invite link."); return; }
    if (loading) return;

    // not logged in → go to /login?next=/invite/<token>
    if (!user) {
      const next = encodeURIComponent(`/invite/${token}`);
      nav(`/login?next=${next}`, { replace: true, state: { from: loc } });
      return;
    }

    (async () => {
      try {
        const res = await api("/invitations/accept", { method: "POST", body: { token } });
        if (res?.board_id) {
          setMsg("Invite accepted! Opening board…");
          nav(`/whiteboards/${res.board_id}`, { replace: true });
        } else {
          setMsg("Invite accepted! Redirecting to Files…");
          nav("/files", { replace: true });
        }
      } catch (e) {
        setMsg(e?.message || "Failed to accept invite.");
      }
    })();
  }, [token, user, loading, nav, loc]);

  return <div style={{ padding: 24 }}>{msg}</div>;
}