import React, { useRef, useEffect, useContext } from "react";
import "./Whiteboard.css";
import { useAuth } from "../../contexts/useAuth";
import { useStrokes } from "./hooks/useStrokes";
import { useStickyNotes } from "./hooks/useStickyNotes";
import { useShapes } from "./hooks/useShapes";
import { ShapeLayer } from "./ShapeLayer";
import PanHandler from "./PanHandler";
import { ViewContext, useView } from "./ViewContext";
import Canvas from "./Canvas";
import StickyNotesLayer from "./Layers/StickyNotesLayer";
import LiveCursors from "../../components/LiveCursors";

function Whiteboard({ client, onChange, activeTool, setActiveTool, fileId, onUndo, onRedo, onClear, shapeSettings, toolSettings }) {
  const whiteboardId = fileId || "local-" + Math.random();
  const canvasRef = useRef(null);
  const boardRef = useRef(null);
  const { view, setView } = useView();

  // --- Hooks ---
  // VVV FIX: Destructure focusNoteId and setFocusNoteId VVV
  const {
    notes,
    setNotes,
    focusNoteId,      // <-- Added this
    setFocusNoteId,   // <-- Added this
    ...noteHandlers   // Keep the rest of the handlers
  } = useStickyNotes(fileId, client, whiteboardId);

  const { undoStack, addStroke, undo, redo, setUndoStack, clear: clearStrokes } = useStrokes(fileId, client, onChange, noteHandlers.loadNotes, noteHandlers.setNotes);
  const { shapes, addShape, updateShape, removeShape, clearShapes, selectedShapeId, setSelectedShapeId } = useShapes(fileId, client);

  // --- Real-time Event Handlers ---
  const strokesChannel = client?.channels.get(`whiteboard-strokes-${whiteboardId}`);
  useEffect(() => {
    if (!strokesChannel) return;
    const handleRemoteStroke = (message) => {
      addStroke(message.data.stroke, 'remote');
    };
    strokesChannel.subscribe("new-stroke", handleRemoteStroke);
    strokesChannel.history((err, resultPage) => {
        if (err) return console.error("Error loading stroke history:", err);
        const loadedStrokes = resultPage.items.map(msg => msg.data.stroke);
        setUndoStack(loadedStrokes);
    });
    return () => strokesChannel.unsubscribe("new-stroke", handleRemoteStroke);
  }, [strokesChannel, addStroke, setUndoStack]);

  useEffect(() => {
    if (!client) return;
    const eventsChannel = client.channels.get(`whiteboard-events-${whiteboardId}`);
    const handleRemoteClear = (msg) => {
      clearStrokes();
      clearShapes();
      setNotes({}); // Use setNotes directly
    };
    eventsChannel.subscribe("clear", handleRemoteClear);
    return () => eventsChannel.unsubscribe("clear", handleRemoteClear);
  }, [client, whiteboardId, clearStrokes, clearShapes, setNotes]); // Updated dependencies

  useEffect(() => {
    if (!client) return;
    const eventsChannel = client.channels.get(`whiteboard-events-${whiteboardId}`);
    const handleRemoteUndo = () => undo();
    const handleRemoteRedo = () => redo();
    eventsChannel.subscribe("undo", handleRemoteUndo);
    eventsChannel.subscribe("redo", handleRemoteRedo);
    return () => {
      eventsChannel.unsubscribe("undo", handleRemoteUndo);
      eventsChannel.unsubscribe("redo", handleRemoteRedo);
    };
  }, [client, whiteboardId, undo, redo]);

  // --- Broadcasting Actions ---
  useEffect(() => {
    if (!client) return;
    const eventsChannel = client.channels.get(`whiteboard-events-${whiteboardId}`);
    const handleClear = () => {
      clearStrokes();
      clearShapes();
      setNotes({}); // Use setNotes directly
      eventsChannel?.publish("clear", { by: client.auth.clientId });
    };
    const handleUndo = () => {
      undo();
      eventsChannel.publish("undo", { by: client.auth.clientId });
    };
    const handleRedo = () => {
      redo();
      eventsChannel.publish("redo", { by: client.auth.clientId });
    };
    if (onUndo) onUndo.current = handleUndo;
    if (onRedo) onRedo.current = handleRedo;
    if (onClear) onClear.current = handleClear;
  }, [client, whiteboardId, undo, redo, clearStrokes, clearShapes, setNotes, onUndo, onRedo, onClear]); // Updated dependencies

  // --- Local Action Handlers ---
  const handleStrokeComplete = (stroke) => {
    addStroke(stroke);
    // strokesChannel?.publish("new-stroke", { stroke }); // Only if hook doesn't publish
  };

  const isShapeLayerActive = activeTool === 'shapes' || activeTool === 'cursor';

  return (
    <div
      className="whiteboard-container"
      ref={boardRef}
      style={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        height: "100%",
        cursor: activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser' ? 'crosshair' :
                activeTool === 'shapes' ? 'copy' :
                activeTool === 'cursor' ? 'default' : 'default'
      }}
    >
        {/* LAYER 1: Pixel Canvas */}
        <Canvas
          canvasRef={canvasRef}
          activeTool={activeTool}
          strokes={undoStack}
          onStrokeComplete={handleStrokeComplete}
          toolSettings={toolSettings}
          view={view}
        />

        {/* LAYER 2: Sticky Notes */}
        <div style={{ pointerEvents: activeTool === 'sticky' || activeTool === 'cursor' ? 'auto' : 'none' }}>
          <StickyNotesLayer
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            boardRef={boardRef}
            fileId={fileId}
            notes={notes}
            setNotes={setNotes}
            focusNoteId={focusNoteId}      // <-- Now defined
            setFocusNoteId={setFocusNoteId}  // <-- Now defined
            addNote={noteHandlers.addNote}
            removeNote={noteHandlers.removeNote}
            moveNote={noteHandlers.moveNote}
            resizeNote={noteHandlers.resizeNote}
            typeNote={noteHandlers.typeNote}
            view={view}
          />
        </div>

        {/* LAYER 3: Shapes */}
        <div style={{ pointerEvents: isShapeLayerActive ? 'auto' : 'none', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          <ShapeLayer
            activeTool={activeTool}
            shapeSettings={shapeSettings}
            onAddShape={addShape}
            shapes={shapes}
            onUpdateShape={updateShape}
            onRemoveShape={removeShape}
            selectedShapeId={selectedShapeId}
            onSelectShape={setSelectedShapeId}
            view={view}
          />
        </div>

        {/* Live Cursors */}
        {client && (
          <LiveCursors
            boardRef={boardRef}
            client={client}
            channel={client.channels.get(`whiteboard-cursors-${whiteboardId}`)}
            whiteboardId={whiteboardId}
            view={view}
          />
        )}

        {/* Pan Handler */}
        <PanHandler
          boardRef={boardRef}
          activeTool={activeTool}
        />
    </div>
  );
}

export default Whiteboard;