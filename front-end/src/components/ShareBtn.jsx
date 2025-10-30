import { useState, useEffect } from "react";
import "./ShareBtn.css"; // You'll need to create this CSS file or add styles to your existing CSS
import { api } from "../config/api"; 

function ShareBtn({ boardId, activeBoard }) {
    const resolvedBoardId  = boardId ?? activeBoard;

    const [showShareModal, setShowShareModal] = useState(false);

    const [email, setEmail] = useState("");
    const [permission, setPermission] = useState("viewer"); // "viewer" | "editor"
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");
    const [error, setError] = useState("");

    // Handle modal close
    const handleCloseModal = () => {
        setShowShareModal(false);
        setEmail("");
        setPermission("viewer");
        setBusy(false);
        setMsg("");
        setError("");

    };


    // Handle escape key
    useEffect(() => {
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape' && showShareModal) {
                handleCloseModal();
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, [showShareModal]);

    const handleCreateInvite = async () => {
        if (!resolvedBoardId ) { setError("Missing board id."); return; }
        if (!email.trim()) { setError("Please enter an email."); return; }

        setBusy(true); setError(""); setMsg("");
        try {
            const res = await api("/invitations", {
                method: "POST",
                body: { board_id: resolvedBoardId , email, permission },
            });
            setMsg("Invite recorded. The user will see the board after they log in.");
            setEmail("");
        } catch (e) {
            setError(e?.message || "Failed to create invite.");
        } finally {
            setBusy(false);
        }
    };

    return (
    <>
      <button className="share" onClick={() => setShowShareModal(true)}>Share</button>

      {showShareModal && (
        <div className="share-modal-overlay" onClick={close}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>Share Board {resolvedBoardId}</h3>
              <button className="close-btn" onClick={close} aria-label="Close">×</button>
            </div>

            <div className="share-modal-content">
              <label className="share-label">Invite by email</label>
              <div className="share-row">
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="share-input"
                  autoFocus
                />
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value)}
                  className="share-select"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
                <button
                  onClick={handleCreateInvite}
                  className="create-invite-btn"
                  disabled={busy || !email.trim()}
                >
                  {busy ? "Inviting…" : "Invite"}
                </button>
              </div>

              {msg && <div className="share-success">{msg}</div>}
              {error && <div className="share-error">{error}</div>}
            </div>

            <div className="share-modal-footer">
              <small>
                The recipient just needs to sign in with that email. We’ll auto-add them.
              </small>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


export default ShareBtn;