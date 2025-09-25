import React, { useRef } from "react";
import "./Whiteboard.css";
import { useAuth } from "../../contexts/useAuth";
import { useStrokes } from "./hooks/useStrokes";
import { useRealtime } from "./hooks/useRealtime";
import Canvasrend from "./Canvas";
import StickyNote from "./StickyNote";
import LiveCursors from "../../components/LiveCursors";

function Whiteboard({ onChange, activeTool, fileId }) {
  const { user } = useAuth();
  const whiteboardId = fileId || "local-" + Math.random();
  const canvasRef = useRef(null);

  const { addStroke, undo, redo, setUndoStack } = useStrokes(fileId, () => { }, onChange);

  const { client, strokesChannel } = useRealtime(user, whiteboardId, addStroke, undo, redo,() => 
    setUndoStack([])
  );

  const handleStrokeComplete = (stroke) => {
    addStroke(stroke);
    strokesChannel?.publish("new-stroke", { stroke });
  };

  return (
    <div className="whiteboard-container">
      <Canvasrend activeTool={activeTool} onStrokeComplete={handleStrokeComplete} canvasRef={canvasRef}/>
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
