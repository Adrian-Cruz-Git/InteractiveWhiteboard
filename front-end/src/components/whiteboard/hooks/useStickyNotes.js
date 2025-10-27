import { useState, useEffect } from "react";
import { api } from "../../../config/api";

export function useStickyNotes(fileId) {
  const [notes, setNotes] = useState([]);
  const [focusNoteId, setFocusNoteId] = useState(null);

  const loadNotes = async (forceClear = false) => {
    if (!fileId) return;
    if (forceClear) setNotes([]);
    try {
      const data = await api(`/sticky-notes?fileId=${encodeURIComponent(fileId)}`);
      setNotes(data || []);
    } catch (e) {
      console.error("Error loading sticky notes:", e.message);
    }
  };

  useEffect(() => { loadNotes(true); }, [fileId]);

  const addNote = async (note) => {
    const toInsert = { ...note, file_id: fileId };
    const created = await api(`/sticky-notes`, { method: "POST", body: toInsert });
    setNotes((prev) => [...prev, created]);
    return created;
  };

  const removeNote = async (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await api(`/sticky-notes/${id}`, { method: "DELETE" });
    } catch (e) {
      console.error("Error deleting sticky note:", e.message);
    }
  };

  const moveNote = async (id, { x, y }) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
    try {
      await api(`/sticky-notes/${id}`, { method: "PATCH", body: { x, y } });
    } catch (e) {
      console.error("Error moving sticky note:", e.message);
    }
  };

  const resizeNote = async (id, { width, height }) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, width, height } : n)));
    try {
      await api(`/sticky-notes/${id}`, { method: "PATCH", body: { width, height } });
    } catch (e) {
      console.error("Error resizing sticky note:", e.message);
    }
  };

  const typeNote = async (id, text) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)));
    try {
      await api(`/sticky-notes/${id}`, { method: "PATCH", body: { text } });
    } catch (e) {
      console.error("Error typing sticky note:", e.message);
    }
  };

  return { notes, setNotes, focusNoteId, setFocusNoteId, loadNotes, addNote, removeNote, moveNote, resizeNote, typeNote };
}
