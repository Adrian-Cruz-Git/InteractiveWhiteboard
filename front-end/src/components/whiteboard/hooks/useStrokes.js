import { useState, useEffect, useCallback } from "react";
import { api } from "../../../config/api";

export function useStrokes(fileId, onUndoRedo, onChange) {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Load strokes for this whiteboard
  useEffect(() => {
    let alive = true;
    async function fetchStrokes() {
      if (!fileId) {
        setLoaded(true);
        return;
      }
      try {
        const data = await api(`/whiteboards/${fileId}`);
        const content = Array.isArray(data?.content) ? data.content : [];
        if (alive) {
          setUndoStack(content);
          setRedoStack([]);
        }
      } catch (e) {
        // If 404 (row not created yet), start empty
        console.error("Load strokes failed:", e?.message || e);
        if (alive) {
          setUndoStack([]);
          setRedoStack([]);
        }
      } finally {
        if (alive) setLoaded(true);
      }
    }
    fetchStrokes();
    return () => { alive = false; };
  }, [fileId]);

  // Persist strokes whenever undoStack changes
  useEffect(() => {
    if (!loaded || !fileId) return;
    (async () => {
      try {
        await api(`/whiteboards/${fileId}/content`, {
          method: "PUT",
          body: { content: undoStack },
        });
      } catch (e) {
        console.error("Save strokes failed:", e?.message || e);
      }
    })();

    if (onChange) onChange(undoStack);
  }, [undoStack, loaded, fileId, onChange]);

  const addStroke = useCallback((stroke) => {
    setUndoStack((prev) => [...prev, stroke]);
    setRedoStack([]);
  }, []);

  const undo = useCallback(() => {
    setUndoStack((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      setRedoStack((r) => [...r, last]);
      if (onUndoRedo) onUndoRedo("undo");
      return prev.slice(0, -1);
    });
  }, [onUndoRedo]);

  const redo = useCallback(() => {
    setRedoStack((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      setUndoStack((u) => [...u, last]);
      if (onUndoRedo) onUndoRedo("redo");
      return prev.slice(0, -1);
    });
  }, [onUndoRedo]);

  const clear = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
    if (onUndoRedo) onUndoRedo("clear");

    // Optional visual clear
    const canvas = document.querySelector("canvas");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [onUndoRedo]);

  return { undoStack, setUndoStack, redoStack, addStroke, undo, redo, clear, loaded };
}
