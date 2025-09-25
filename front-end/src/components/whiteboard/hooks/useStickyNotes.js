// useStickyNotes.js
import { useState, useCallback } from "react";

export function useStickyNotes() {
  const [notes, setNotes] = useState([]);
  const [focusNoteId, setFocusNoteId] = useState(null);

  // Add a new note
  const addNote = useCallback((note) => {
    setNotes((prev) => [...prev, note]);
    setFocusNoteId(note.id);
  }, []);

  // Remove a note
  const removeNote = useCallback((idToRemove) => {
    setNotes((prev) => prev.filter((n) => n.id !== idToRemove));
    if (focusNoteId === idToRemove) {
      setFocusNoteId(null);
    }
  }, [focusNoteId]);

  // Move note (dragging)
  const moveNote = useCallback((id, { x, y }) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, x, y } : n))
    );
  }, []);

  // Resize note
  const resizeNote = useCallback((id, { w, h }) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, w, h } : n))
    );
  }, []);

  // Update text
  const typeNote = useCallback((id, text) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, text } : n))
    );
  }, []);

  return {
    notes,
    focusNoteId,
    setFocusNoteId,
    addNote,
    removeNote,
    moveNote,
    resizeNote,
    typeNote,
  };
}
