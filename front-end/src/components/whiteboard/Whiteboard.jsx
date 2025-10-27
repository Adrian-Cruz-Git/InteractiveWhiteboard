// src/components/whiteboard/Whiteboard.jsx (FULL UPDATED FILE)
import React, { useRef, useEffect } from "react";
import "./Whiteboard.css";
import { useAuth } from "../../contexts/useAuth"; // Not used here, but safe to keep
import { useStrokes } from "./hooks/useStrokes";
import { useStickyNotes } from "./hooks/useStickyNotes";

// Import the shapes hook and layer
import { useShapes } from "./hooks/useShapes";
import { ShapeLayer } from "./ShapeLayer"; 

import Canvas from "./Canvas"; // Your stable, original Canvas.jsx
import StickyNotesLayer from "./Layers/StickyNotesLayer";
import LiveCursors from "../../components/LiveCursors";

function Whiteboard({ client, onChange, activeTool, setActiveTool, fileId, onUndo, onRedo, onClear, shapeSettings }) {
  const whiteboardId = fileId || "local-" + Math.random();
  const canvasRef = useRef(null);
  const boardRef = useRef(null);

  // --- All your hooks ---
  const { notes, setNotes, ...noteHandlers } = useStickyNotes(fileId);
  
  // Your existing useStrokes hook
  const { undoStack, addStroke, undo, redo, setUndoStack, clear: clearStrokes } = useStrokes(fileId, () => { }, onChange, noteHandlers.loadNotes, noteHandlers.setNotes);

  // Initialize shapes hook. We pass 'client' as designed in Step 1
  const { shapes, addShape, updateShape, removeShape, clearShapes, selectedShapeId, setSelectedShapeId } = useShapes(fileId, client);


  // --- REAL-TIME STROKES (Your existing logic) ---
  const strokesChannel = client?.channels.get(`whiteboard-strokes-${whiteboardId}`);
  useEffect(() => {
    if (!strokesChannel) return;

    const handleRemoteStroke = (message) => {
      console.log('Received remote stroke:', message.data.stroke);
      addStroke(message.data.stroke, 'remote'); 
    };
    strokesChannel.subscribe("new-stroke", handleRemoteStroke);

    return () => {
      strokesChannel.unsubscribe("new-stroke", handleRemoteStroke);
    };
  }, [strokesChannel, addStroke]);

  
  // --- Connect UNDO / REDO / CLEAR from parent ---
  useEffect(() => {
    if (onUndo) onUndo.current = undo; // From useStrokes
    if (onRedo) onRedo.current = redo; // From useStrokes
    
    if (onClear) {
      onClear.current = () => {
        console.log("Clearing all layers...");
        clearStrokes(); // From useStrokes
        clearShapes();  // From useShapes
        // You should also add a clearNotes() function
      };
    }
  }, [onUndo, onRedo, onClear, undo, redo, clearStrokes, clearShapes]);

  // Handle local stroke completion
  const handleStrokeComplete = (stroke) => {
    console.log('Publishing stroke:', stroke);
    addStroke(stroke);
    strokesChannel?.publish("new-stroke", { stroke });
  };
  
  // --- NEW: Determine if the shape layer should be interactive ---
  const isShapeLayerActive = activeTool === 'shapes' || activeTool === 'cursor';

  return (
    <div
      className="whiteboard-container"
      ref={boardRef}
      style={{
        position: "relative",
        overflow: "scroll",
        width: "100%",
        height: "100%",
        // Set cursor based on the active tool
        cursor: activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser' ? 'crosshair' : 
                activeTool === 'shapes' ? 'copy' : 'default'
      }}
    >
      {/* LAYER 1: The Pixel Canvas (Pen, Eraser, Highlighter) */}
      <Canvas
        canvasRef={canvasRef}
        activeTool={activeTool}
        strokes={undoStack}
        onStrokeComplete={handleStrokeComplete}
      />

      {/* LAYER 2: Sticky Notes (Your existing layer) */}
      {/* NEW: Added pointerEvents logic here too */}
      <div style={{ pointerEvents: activeTool === 'sticky' || activeTool === 'cursor' ? 'auto' : 'none' }}>
        <StickyNotesLayer
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          boardRef={boardRef}
          fileId={fileId}
          notes={notes}
          setNotes={setNotes}
          {...noteHandlers}
          />
      </div>
      
      {/* LAYER 3: The Object/Vector Canvas (Shapes) */}
      {/* NEW: Added pointerEvents logic */}
      <div style={{ pointerEvents: isShapeLayerActive ? 'auto' : 'none', position: 'absolute', top: 0, left: 0 }}>
        <ShapeLayer
          activeTool={activeTool}
          shapeSettings={shapeSettings}
          onAddShape={addShape}
          shapes={shapes}
          onUpdateShape={updateShape}
          onRemoveShape={removeShape}
          selectedShapeId={selectedShapeId}
          onSelectShape={setSelectedShapeId}
        />
      </div>

      {/* Live Cursors (Should always be on top) */}
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