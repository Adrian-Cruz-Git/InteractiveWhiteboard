import { useState, useEffect, useCallback } from "react";
import { api } from "../../../config/api";

export function useStrokes(fileId, onUndoRedo, onChange) {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Load strokes for this whiteboard
  useEffect(() => {
    const fetchStrokes = async () => {
      if (!fileId) return;
      try {
        const data = await api(`/whiteboards/${fileId}`);
        const content = data?.content || [];
        setUndoStack(content);
        setRedoStack([]);
      } finally {
        setLoaded(true);
      }
    };
    fetchStrokes();
  }, [fileId]);

  // Persist strokes when undoStack changes
  useEffect(() => {
    if (!loaded || !fileId) return;
    api(`/whiteboards/${fileId}`, { method: "PUT", body: { content: undoStack } }).catch((e) =>
      console.error("Save strokes failed:", e.message)
    );
    onChange && onChange(undoStack);
  }, [undoStack, loaded, fileId]);

  const addStroke = useCallback((stroke) => {
    setUndoStack((prev) => [...prev, stroke]);
    setRedoStack([]);
  }, []);

  const undo = useCallback(() => {
    setUndoStack((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      setRedoStack((r) => [...r, last]);
      onUndoRedo && onUndoRedo("undo");
      return prev.slice(0, -1);
    });
  }, [onUndoRedo]);

  const redo = useCallback(() => {
    setRedoStack((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      setUndoStack((u) => [...u, last]);
      onUndoRedo && onUndoRedo("redo");
      return prev.slice(0, -1);
    });
  }, [onUndoRedo]);
  
  useEffect(() => {
    if (!loaded || !fileId) return;
    // Persist every time undoStack changes (after undo, redo, or stroke)
    api(`/whiteboards/${fileId}`, { method: "PUT", body: { content: undoStack } })
      .catch((e) => console.error("Save strokes failed:", e.message));
  }, [undoStack, loaded, fileId]);


  const clear = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
    onUndoRedo && onUndoRedo("clear");

    // Optional immediate visual clear:
    const canvas = document.querySelector("canvas");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [onUndoRedo]);

  return { undoStack, setUndoStack, redoStack, addStroke, undo, redo, clear, loaded };
}
