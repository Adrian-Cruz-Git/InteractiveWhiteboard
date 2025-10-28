// components/EditableBoardName.jsx
import { useState, useRef, useEffect } from "react";
import { api } from "../config/api";
import { useAuth } from "../contexts/useAuth";

export default function EditableBoardName({ fileId, value, onChange }) {
  const { user } = useAuth();
  const [draft, setDraft] = useState(value || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef(null);

  // keep local draft in sync when parent value changes
  useEffect(() => {
    setDraft(value || "");
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.select();
  }, [isEditing]);

  const withAuth = async (init = {}) => {
    const idToken = user ? await user.getIdToken() : "";
    return {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
    };
  };

  const renameItem = async (id, newName) => {
    if (!id) throw new Error("Missing fileId for rename.");
    const trimmed = (newName || "").trim();
    if (!trimmed) throw new Error("Name cannot be empty.");
    if (trimmed === (value || "").trim()) return { skipped: true };

    setIsSaving(true);
    try {
      const req = await withAuth({
        method: "PUT",
        body: JSON.stringify({ name: trimmed }),
      });
      await api(`/files/${id}/rename`, req);
      return { ok: true, next: trimmed };
    } finally {
      setIsSaving(false);
    }
  };

  const commit = async () => {
    setIsEditing(false);
    try {
      const res = await renameItem(fileId, draft);
      if (res?.ok) {
        onChange?.(res.next); // parent updates its state
      } else if (res?.skipped) {
        setDraft(value || "");
      }
    } catch (e) {
      alert(e?.message || "Failed to rename.");
      setDraft(value || "");
    }
  };

  const cancel = () => {
    setIsEditing(false);
    setDraft(value || "");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); commit(); }
    else if (e.key === "Escape") { e.preventDefault(); cancel(); }
  };

  const readOnly = !fileId;

  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", position: "relative" }}
    >
      {isEditing && !readOnly ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          autoFocus
          disabled={isSaving}
          style={{ fontSize: 16, border: "1px solid #ccc", borderRadius: 4, padding: "4px 8px", width: 250 }}
        />
      ) : (
        <h2
          style={{
            fontSize: 16, margin: 0, cursor: readOnly ? "default" : "text",
            userSelect: "none", opacity: isSaving ? 0.7 : 1,
          }}
          title={readOnly ? "Loading..." : isSaving ? "Saving..." : "Click to rename"}
          onClick={() => { if (!readOnly) setIsEditing(true); }}
        >
          {(value && value.trim()) ? value : "Untitled Board"}
          {isSaving ? " (saving…)" : ""}
        </h2>
      )}
    </div>
  );
}
