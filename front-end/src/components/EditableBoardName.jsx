// components/EditableBoardName.jsx
import { useState, useRef, useEffect } from "react";
import { api } from "../config/api";

export default function EditableBoardName({ fileId, value, onChange, debounceMs = 500 }) {
  const [draft, setDraft] = useState(value || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const lastCommittedRef = useRef((value || "").trim());

  // keep local draft in sync when parent value changes
  useEffect(() => {
    const v = value || "";
    setDraft(v);
    lastCommittedRef.current = v.trim();
  }, [value]);

  // select all when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const commitToServer = async (newName) => {
    const trimmed = (newName || "").trim();
    if (!fileId || !trimmed) return { ok: false, reason: "invalid" };
    if (trimmed === lastCommittedRef.current) return { ok: true, skipped: true };

    setIsSaving(true);
    try {
      await api(`/files/${fileId}/rename`, {
        method: "PUT",
        body: { name: trimmed },
      });
      lastCommittedRef.current = trimmed;
      onChange?.(trimmed);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e?.message || String(e) };
    } finally {
      setIsSaving(false);
    }
  };

  const commitNow = async () => {
    setIsEditing(false);
    clearTimeout(timerRef.current);
    const res = await commitToServer(draft);
    if (!res.ok && !res.skipped) {
      // rollback to last known good name
      setDraft(lastCommittedRef.current || "");
      console.error("Rename failed:", res.error || res.reason);
    }
  };

  const scheduleCommit = (next) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // fire-and-forget debounce save while staying in edit
      commitToServer(next).then((res) => {
        if (!res.ok && !res.skipped) {
          // don't exit edit mode, just show console error and keep user text
          console.error("Rename failed:", res.error || res.reason);
        }
      });
    }, debounceMs);
  };

  const onInput = (e) => {
    const next = e.target.value;
    setDraft(next);
    scheduleCommit(next);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitNow();
    } else if (e.key === "Escape") {
      e.preventDefault();
      clearTimeout(timerRef.current);
      setIsEditing(false);
      setDraft(lastCommittedRef.current || "");
    }
  };

  const onBlur = () => commitNow();

  const readOnly = !fileId;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "4px 8px",
        position: "relative",
      }}
    >
      {isEditing && !readOnly ? (
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={onInput}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          disabled={isSaving}
          maxLength={120}
          aria-label="Board name"
          placeholder="Untitled Board"
          spellCheck="false"
          autoComplete="off"
          style={{
            fontSize: 16,
            border: "1px solid #ccc",
            borderRadius: 4,
            padding: "4px 8px",
            width: 260,
          }}
        />
      ) : (
        <h2
          style={{
            fontSize: 16,
            margin: 0,
            cursor: readOnly ? "default" : "text",
            userSelect: "none",
            opacity: isSaving ? 0.7 : 1,
          }}
          title={
            readOnly ? "Loading…" : isSaving ? "Saving…" : "Click to rename"
          }
          onClick={() => {
            if (!readOnly) setIsEditing(true);
          }}
        >
          {(value && value.trim()) ? value : "Untitled Board"}
          {isSaving ? " (saving…)" : ""}
        </h2>
      )}
    </div>
  );
}