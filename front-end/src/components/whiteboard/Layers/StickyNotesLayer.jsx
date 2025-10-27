import React, { useState, useEffect } from "react";
import StickyNote from "../StickyNote";
import { useView } from "../ViewContext";

export default function StickyNotesLayer({
  activeTool,
  setActiveTool,
  boardRef,
  notes,
  focusNoteId,
  setFocusNoteId,
  addNote,
  removeNote,
  moveNote,
  resizeNote,
  typeNote,
  setNotes,
}) {
  const [stickyColor, setStickyColor] = useState("#FFEB3B");
  const [draggingNote, setDraggingNote] = useState(false);
  const { view } = useView();

  useEffect(() => {
    const handler = (e) => setStickyColor(e.detail.color);
    window.addEventListener("wb:sticky-select-color", handler);
    return () => window.removeEventListener("wb:sticky-select-color", handler);
  }, []);

//   const handleDragMove = (id, pos) => {
//     setDraggingNote(true);
//     const { x, y } = pos;
//     if (typeof x !== "number" || typeof y !== "number") return;
//     setNotes(prev =>
//       prev.map(n => (n.id === id ? { ...n, x, y } : n))
//     );
//   };

  const handleDragMove = (id, pos) => {
//   console.log("handleDragMove called:", id, pos); // debug
  setDraggingNote(true);
  const { x, y } = pos;
  if (typeof x !== "number" || typeof y !== "number") {
    console.log("Invalid coords, returning");
    return;
  }
  setNotes(prev => {
    const updated = prev.map(n => (n.id === id ? { ...n, x, y } : n));
    // console.log("Updated notes:", updated); // debug
    return updated;
  });
};

  const handleDragEnd = (id) => {
    setDraggingNote(false);
    const note = notes.find(n => n.id === id);
    if (!note) return;
    moveNote(id, { x: note.x, y: note.y });
  };

  const handleBoardMouseUp = () => {
    setTimeout(() => setDraggingNote(false), 50);
  };

  const handleBoardClick = async (e) => {
    // Only handle clicks directly on the layer (not on sticky notes)
    if (e.target !== e.currentTarget) return;
    if (draggingNote) return;
    if (activeTool !== "sticky") return;
    if (!boardRef.current) return;

    const scale = view?.scale ?? 1;
    const offsetX = view?.offsetX ?? 0;
    const offsetY = view?.offsetY ?? 0;

    // Convert screen coordinates to world coordinates
    const worldX = (e.clientX - offsetX) / scale;
    const worldY = (e.clientY - offsetY) / scale;

    const DEFAULT_W = 180;
    const DEFAULT_H = 160;

    const newNote = {
      x: worldX - DEFAULT_W / 2,
      y: worldY - DEFAULT_H / 2,
      w: DEFAULT_W,
      h: DEFAULT_H,
      color: stickyColor,
      text: "",
    };

    try {
      const saved = await addNote(newNote);
      if (saved?.id) setFocusNoteId(saved.id);
    } finally {
      setActiveTool?.("pen");
      window.__WB_TOOL__ = "pen";
      window.dispatchEvent(
        new CustomEvent("wb:select-tool", { detail: { tool: "pen" } })
      );
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: ["sticky", "edit"].includes(activeTool) ? "auto" : "none",
      }}
      onMouseDown={handleBoardClick}
      onMouseUp={handleBoardMouseUp}
    >
      {notes.map((note) => {
        // Convert world coordinates to screen coordinates
        const screenX = note.x * view.scale + view.offsetX;
        const screenY = note.y * view.scale + view.offsetY;

        return (
          <div
            key={note.id}
            style={{
              position: "absolute",
              transform: `translate(${screenX}px, ${screenY}px) scale(${view.scale})`,
              width: note.w,
              height: note.h,
              transformOrigin: "0 0",
            }}
          >
            <StickyNote
              id={note.id}
              x={note.x}
              y={note.y}
              w={note.w}
              h={note.h}
              color={note.color}
              text={note.text}
              autoFocus={focusNoteId === note.id}
              activeTool={activeTool}
              onRemove={removeNote}
              onChangeText={typeNote}
              onChangeSize={resizeNote}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
            />
          </div>
        );
      })}
    </div>
  );
}