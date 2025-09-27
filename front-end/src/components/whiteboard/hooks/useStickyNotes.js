import { useState, useEffect } from "react";
import { supabase } from "../../../config/supabase";

export function useStickyNotes(fileId) {
  const [notes, setNotes] = useState([]);
  const [focusNoteId, setFocusNoteId] = useState(null);

  // Load sticky notes from Supabase when fileId changes
  useEffect(() => {
    if (!fileId) return;

    const loadNotes = async () => {
      const { data, error } = await supabase
        .from("sticky_notes")
        .select("*")
        .eq("file_id", fileId);

      if (error) {
        console.error("Error loading sticky notes:", error.message);
      } else {
        setNotes(data || []);
      }
    };

    loadNotes();
  }, [fileId]);

  // CRUD operations 

  const addNote = async (note) => {
    // don’t include id → Supabase will auto-generate it
    const { data, error } = await supabase
      .from("sticky_notes")
      .insert([{ ...note, file_id: fileId }])
      .select()
      .single();

    if (error) {
      console.error("Error adding sticky note:", error.message);
      return;

    }

    // Update local state with returned row (includes auto-generated id)
    setNotes((prev) => [...prev, data]);
    setFocusNoteId(data.id);

    if (typeof setActiveTool === "sticky") {
      setActiveTool("pen");
    }
  };

  const removeNote = async (id) => {
    const { error } = await supabase
      .from("sticky_notes")
      .delete()
      .eq("id", id)
      .eq("file_id", fileId);

    if (error) {
      console.error("Error deleting sticky note:", error.message);
    } else {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const moveNote = async (id, { x, y }) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, x, y } : n))
    );

    const { error } = await supabase
      .from("sticky_notes")
      .update({ x, y })
      .eq("id", id);

    if (error) console.error("Error moving sticky note:", error.message);
  };

  const resizeNote = async (id, { w, h }) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, w, h } : n))
    );

    const { error } = await supabase
      .from("sticky_notes")
      .update({ w, h })
      .eq("id", id);

    if (error) console.error("Error resizing sticky note:", error.message);
  };

  const typeNote = async (id, text) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, text } : n))
    );

    const { error } = await supabase
      .from("sticky_notes")
      .update({ text })
      .eq("id", id);

    if (error) console.error("Error typing sticky note:", error.message);
  };

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
