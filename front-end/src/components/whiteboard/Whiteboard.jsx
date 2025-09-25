import React, { useRef, useEffect } from "react";
import "./Whiteboard.css";
import { useAuth } from "../../contexts/useAuth";
import { useStrokes } from "./hooks/useStrokes";
import { useRealtime } from "./hooks/useRealtime";
import { useStickyNotes } from "./hooks/useStickyNotes";
import Canvas from "./Canvas";
import StickyNote from "./StickyNote";
import LiveCursors from "../../components/LiveCursors";

function Whiteboard({ onChange, activeTool, fileId, onUndo, onRedo, onClear }) {
  const { user } = useAuth();
  const whiteboardId = fileId || "local-" + Math.random();
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);

  const { undoStack ,addStroke, undo, redo, setUndoStack, clear } = useStrokes(fileId, () => {}, onChange);

  const { client, strokesChannel } = useRealtime(user, whiteboardId, addStroke, undo, redo, () =>
    setUndoStack([])
  );

  // stickynotes
  const { notes, focusNoteId, setFocusNoteId, addNote, removeNote, moveNote, resizeNote, typeNote, } = useStickyNotes();

  useEffect(() => {
    if (onUndo) onUndo.current = undo;
    if (onRedo) onRedo.current = redo;
    if (onClear) onClear.current = clear;
  }, [onUndo, onRedo, onClear, undo, redo, clear]);

  const handleStrokeComplete = (stroke) => {
    addStroke(stroke);
    strokesChannel?.publish("new-stroke", { stroke });
  };

  // Handles canvas click for adding sticky notes
  const handlePlaceSticky = ({ x, y }) => {
    const DEFAULT_W = 180;
    const DEFAULT_H = 160;
    const id = `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    addNote({
      id,
      x: x - DEFAULT_W / 2,   // center under cursor
      y: y - DEFAULT_H / 2,
      w: DEFAULT_W,
      h: DEFAULT_H,
      color: "#FFEB3B",
      text: "",
    });

    setFocusNoteId(id);
  };

  return (
    <div className="whiteboard-container">
      <Canvas
        canvasRef={canvasRef}
        activeTool={activeTool}
        strokes={undoStack}
        onStrokeComplete={handleStrokeComplete}
        onPlaceSticky={handlePlaceSticky} 
        overlayRef={overlayRef}
      />

      {/* Sticky Notes */}
      {notes.map((note) => (
        <StickyNote
          key={note.id}
          id={note.id}
          x={note.x}
          y={note.y}
          w={note.w}
          h={note.h}
          color={note.color}
          text={note.text}
          boundsRef={overlayRef}
          autoFocus={focusNoteId === note.id}
          onMove={moveNote}
          onChangeSize={resizeNote}
          onChangeText={typeNote}
          onRemove={removeNote}
        />
      ))}
      {client && (
        <LiveCursors
          canvasRef={canvasRef}
          client={client}
          channel={client.channels.get(`whiteboard-cursors-${whiteboardId}`)}
          whiteboardId={whiteboardId}
        />
      )}
      {/* Sticky notes will go here */}
    </div>
  );
}

export default Whiteboard;
