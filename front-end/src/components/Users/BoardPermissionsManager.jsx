import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../config/api"; // adjust path if needed
import "./BoardPermissionsManager.css";

export default function BoardPermissionsManager({ boardId, open, onOpenChange }) {
    const [loading, setLoading] = useState(false);
    const [myPerm, setMyPerm] = useState(null);                // "owner" | "editor" | "viewer" | "none"
    const [members, setMembers] = useState([]);                // [{ user_id, permission }]
    const [membersSupported, setMembersSupported] = useState(true);

    // invite form
    const [inviteEmail, setInviteEmail] = useState("");
    const [invitePerm, setInvitePerm] = useState("viewer");
    const [inviteBusy, setInviteBusy] = useState(false);
    const [inviteMsg, setInviteMsg] = useState("");
    const [error, setError] = useState("");

    const canManage = useMemo(() => myPerm === "owner" || myPerm === "editor", [myPerm]);
    const isOwner = useMemo(() => myPerm === "owner", [myPerm]);

    const close = () => onOpenChange?.(false);

    // lock page scroll while open
    useEffect(() => {
        if (!open) return;
        document.body.classList.add("modal-open");
        return () => document.body.classList.remove("modal-open");
    }, [open]);

    // fetch permission + members when opened
    useEffect(() => {
        if (!open || !boardId) return;

        let alive = true;
        (async () => {
            setLoading(true); setError(""); setInviteMsg("");
            try {
                // 1) my permission
                const permRes = await api(`/files/${boardId}/permissions`);
                const p = permRes?.permission ?? permRes?.permissions; // be tolerant
                if (alive) setMyPerm(p ?? "none");
            } catch (e) {
                if (alive) { setMyPerm("none"); }
            }

            // 2) members (optional if endpoint exists)
            try {
                const data = await api(`/files/${boardId}/members`);
                if (alive) {
                    setMembers(Array.isArray(data) ? data : []);
                    setMembersSupported(true);
                }
            } catch {
                if (alive) {
                    setMembers([]);
                    setMembersSupported(false);
                }
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => { alive = false; };
    }, [open, boardId]);

    // invite by email (Pattern A – no public link; email-based access)
    const handleInvite = async () => {
        if (!inviteEmail.trim()) { setError("Please enter an email."); return; }
        setInviteBusy(true); setError(""); setInviteMsg("");
        try {
            await api("/invitations", {
                method: "POST",
                body: { board_id: boardId, email: inviteEmail.trim(), permission: invitePerm },
            });
            setInviteMsg("Invite recorded. The user will see the board after they sign in with that email.");
            setInviteEmail("");
        } catch (e) {
            setError(e?.message || "Failed to create invite.");
        } finally {
            setInviteBusy(false);
        }
    };

    // change a member’s permission
    const handleChangePerm = async (userId, newPerm) => {
        try {
            await api(`/files/${boardId}/members/${encodeURIComponent(userId)}`, {
                method: "PUT",
                body: { permission: newPerm },
            });
            setMembers(members.map(m => m.user_id === userId ? { ...m, permission: newPerm } : m));
        } catch (e) {
            setError(e?.message || "Failed to change permission.");
        }
    };

    // remove a member
    const handleRemove = async (userId) => {
        if (!confirm("Remove this user from the board?")) return;
        try {
            await api(`/files/${boardId}/members/${encodeURIComponent(userId)}`, { method: "DELETE" });
            setMembers(members.filter(m => m.user_id !== userId));
        } catch (e) {
            setError(e?.message || "Failed to remove user.");
        }
    };

    if (!open) return null;

    const content = (
        <div className="perm-overlay" onClick={close}>
            <div className="perm-modal" onClick={(e) => e.stopPropagation()}>
                <header className="perm-header">
                    <h3 className="perm-title">
                        {myPerm ? myPerm.charAt(0).toUpperCase() + myPerm.slice(1) : "…"}
                    </h3>
                    <button className="perm-close" onClick={close} aria-label="Close">×</button>
                </header>

                <div className="perm-content">
                    {loading && (
                        <div className="perm-loading">
                            <div className="spinner" />
                            <span>Loading…</span>
                        </div>
                    )}

                    {!loading && (
                        <>
                            <section className="perm-section">
                                <h4>Your access</h4>
                                {myPerm === "owner" && (
                                    <p className="perm-note">You are the <b>Owner</b>. You can manage members and transfer ownership.</p>
                                )}
                                {myPerm === "editor" && (
                                    <p className="perm-note">You’re an <b>Editor</b>. You can edit and manage viewers.</p>
                                )}
                                {myPerm === "viewer" && (
                                    <p className="perm-note">You’re a <b>Viewer</b>. You can view the board but cannot make changes.</p>
                                )}
                                {myPerm === "none" && (
                                    <p className="perm-note">You don’t have access to this board.</p>
                                )}
                            </section>

                            <section className="perm-section">
                                <div className="perm-row perm-row-between">
                                    <h4>Members</h4>
                                    {canManage && membersSupported && (
                                        <small className="muted">Owner/Editor can modify roles</small>
                                    )}
                                </div>

                                {!membersSupported && (
                                    <div className="perm-alert">
                                        Members endpoint not available. Expose <code>GET /api/files/:id/members</code> (and PUT/DELETE) on the backend.
                                    </div>
                                )}

                                {membersSupported && (
                                    <div className="member-list">
                                        {members.length === 0 ? (
                                            <div className="empty">No members yet.</div>
                                        ) : members.map(m => (
                                            <div key={m.user_id} className="member-item">
                                                <div className="member-main">
                                                    <div className="avatar">{(m.user_id || "?").slice(0, 2).toUpperCase()}</div>
                                                    <div className="id-col">
                                                        <div className="uid">
                                                            {m.display_name || m.email || m.user_id}
                                                        </div>
                                                        {m.email && <div className="subtle">{m.email}</div>}
                                                    </div>
                                                </div>
                                                <div className="member-actions">
                                                    {canManage ? (
                                                        <>
                                                            <select
                                                                value={m.permission}
                                                                className="perm-select"
                                                                onChange={(e) => handleChangePerm(m.user_id, e.target.value)}
                                                            >
                                                                <option value="viewer">Viewer</option>
                                                                <option value="editor">Editor</option>
                                                                {isOwner && <option value="owner">Owner</option>}
                                                            </select>
                                                            {(isOwner || myPerm === "editor") && m.permission !== "owner" && (
                                                                <button className="remove-btn" onClick={() => handleRemove(m.user_id)}>Remove</button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className={`pill pill-${m.permission}`}>{m.permission}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {canManage && (
                                <section className="perm-section">
                                    <h4>Invite by email</h4>
                                    <div className="invite-row">
                                        <input
                                            type="email"
                                            placeholder="user@example.com"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            className="input"
                                        />
                                        <select
                                            value={invitePerm}
                                            onChange={(e) => setInvitePerm(e.target.value)}
                                            className="perm-select"
                                        >
                                            <option value="viewer">Viewer</option>
                                            <option value="editor">Editor</option>
                                        </select>
                                        <button
                                            className="primary"
                                            onClick={handleInvite}
                                            disabled={!inviteEmail.trim() || inviteBusy}
                                        >
                                            {inviteBusy ? "Inviting…" : "Invite"}
                                        </button>
                                    </div>
                                    {inviteMsg && <div className="success">{inviteMsg}</div>}
                                </section>
                            )}

                            {error && <div className="error">{error}</div>}
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
}
