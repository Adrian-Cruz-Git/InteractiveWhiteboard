import React, { useRef, useEffect } from "react";
import "./Whiteboard.css";
import { useAuth } from "../../contexts/useAuth";
import { useStrokes } from "./hooks/useStrokes";
import { useRealtime } from "./hooks/useRealtime";
import Canvas from "./Canvas";
import StickyNote from "./StickyNote";
import LiveCursors from "../../components/LiveCursors";

function Whiteboard({ onChange, activeTool, fileId, onUndo, onRedo, onClear }) {
  const { user } = useAuth();
  const whiteboardId = fileId || "local-" + Math.random();
  const canvasRef = useRef(null);

  const { undoStack ,addStroke, undo, redo, setUndoStack, clear } = useStrokes(fileId, () => {}, onChange);

  const { client, strokesChannel } = useRealtime(user, whiteboardId, addStroke, undo, redo, () =>
    setUndoStack([])
  );

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
    <div className="whiteboard-container">
      <Canvas
        canvasRef={canvasRef}
        activeTool={activeTool}
        strokes={undoStack} 
        onStrokeComplete={handleStrokeComplete}

        />
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
