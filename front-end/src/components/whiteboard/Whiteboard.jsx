// Whiteboard.jsx
import React, { useRef, useEffect } from "react";
import "./Whiteboard.css";
import { useAuth } from "../../contexts/useAuth";
import { useStrokes } from "./hooks/useStrokes";
import { useRealtime } from "./hooks/useRealtime";

import Canvas from "./Canvas";
import StickyNotesLayer from "./Layers/StickyNotesLayer";
import LiveCursors from "../../components/LiveCursors";

function Whiteboard({ client, onChange, activeTool, fileId, onUndo, onRedo, onClear }) {
  const { user } = useAuth();
  const whiteboardId = fileId || "local-" + Math.random();
  const canvasRef = useRef(null);
  const boardRef = useRef(null);

  const {
    undoStack,
    addStroke,
    undo,
    redo,
    setUndoStack,
    clear,
  } = useStrokes(fileId, () => { }, onChange);

  // Realtime setup
  const strokesChannel = client?.channels.get(`whiteboard-strokes-${whiteboardId}`);

  useEffect(() => {
    if (onUndo) onUndo.current = undo;
    if (onRedo) onRedo.current = redo;
    if (onClear) onClear.current = clear;
  }, [onUndo, onRedo, onClear, undo, redo, clear]);

  const handleStrokeComplete = (stroke) => {
    addStroke(stroke);
    strokesChannel?.publish("new-stroke", { stroke });
  };

  return (
    <div
      className="whiteboard-container"
      ref={boardRef}
      style={{
        position: "relative",
        overflow: "scroll",
        width: "100%",
        height: "100%"
      }}
    >
      {/* Canvas */}
      <Canvas
        canvasRef={canvasRef}
        activeTool={activeTool}
        strokes={undoStack}
        onStrokeComplete={handleStrokeComplete}
      />

      {/* Sticky Notes Layer above canvas but transparent background */}
      <StickyNotesLayer
        activeTool={activeTool}
        boardRef={boardRef}
        fileId={fileId} />

      {/* Live Cursors */}
      {client && (
        <LiveCursors
          canvasRef={canvasRef}
          client={client}
          channel={client.channels.get(`whiteboard-cursors-${whiteboardId}`)}
          whiteboardId={whiteboardId}
        />
      )}
    </div>
  );
}

export default Whiteboard;
