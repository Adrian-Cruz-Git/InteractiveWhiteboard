import React, { useRef, useEffect, useContext } from "react"; // Added useContext
import "./Whiteboard.css";
import { useAuth } from "../../contexts/useAuth"; // Keep if needed elsewhere, though not directly used here
import { useStrokes } from "./hooks/useStrokes";
import { useStickyNotes } from "./hooks/useStickyNotes";
import { useShapes } from "./hooks/useShapes";          // Import Shapes hook
import { ShapeLayer } from "./ShapeLayer";            // Import ShapeLayer component
import PanHandler from "./PanHandler";                 // Your PanHandler import
import { ViewContext, useView } from "./ViewContext";  // Import ViewContext and useView hook
import Canvas from "./Canvas";
import StickyNotesLayer from "./Layers/StickyNotesLayer";
import LiveCursors from "../../components/LiveCursors";

// Added shapeSettings and toolSettings props
function Whiteboard({ client, onChange, activeTool, setActiveTool, fileId, onUndo, onRedo, onClear, shapeSettings, toolSettings }) {
  const whiteboardId = fileId || "local-" + Math.random();
  const canvasRef = useRef(null);
  const boardRef = useRef(null);
  const { view, setView } = useView(); // Get view state and setter from context

  // --- Hooks ---
  const { notes, setNotes, ...noteHandlers } = useStickyNotes(fileId, client, whiteboardId);
  // Pass client to useStrokes if needed for publishing
  const { undoStack, addStroke, undo, redo, setUndoStack, clear: clearStrokes } = useStrokes(fileId, client, onChange, noteHandlers.loadNotes, noteHandlers.setNotes);
  // Initialize shapes hook
  const { shapes, addShape, updateShape, removeShape, clearShapes, selectedShapeId, setSelectedShapeId } = useShapes(fileId, client);


  // --- Real-time Event Handlers (Your existing logic) ---

  // Strokes subscription
  const strokesChannel = client?.channels.get(`whiteboard-strokes-${whiteboardId}`);
  useEffect(() => {
    if (!strokesChannel) return;
    const handleRemoteStroke = (message) => {
      addStroke(message.data.stroke, 'remote'); // Pass 'remote' flag
    };
    strokesChannel.subscribe("new-stroke", handleRemoteStroke);
    // Load stroke history
    strokesChannel.history((err, resultPage) => {
        if (err) return console.error("Error loading stroke history:", err);
        const loadedStrokes = resultPage.items.map(msg => msg.data.stroke);
        setUndoStack(loadedStrokes);
    });
    return () => strokesChannel.unsubscribe("new-stroke", handleRemoteStroke);
  }, [strokesChannel, addStroke, setUndoStack]);

  // Clear subscription
  useEffect(() => {
    if (!client) return;
    const eventsChannel = client.channels.get(`whiteboard-events-${whiteboardId}`);
    const handleRemoteClear = (msg) => {
      console.log("Received clear from:", msg.data.by);
      clearStrokes(); // Use clearStrokes from hook
      clearShapes();  // Clear shapes
      noteHandlers.setNotes({}); // Clear notes (assuming setNotes({}) clears)
    };
    eventsChannel.subscribe("clear", handleRemoteClear);
    return () => eventsChannel.unsubscribe("clear", handleRemoteClear);
  }, [client, whiteboardId, clearStrokes, clearShapes, noteHandlers]); // Added dependencies

  // Undo/Redo subscription
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
  }, [client, whiteboardId, undo, redo]); // Make sure hooks don't cause infinite loops


  // --- Broadcasting Actions (Undo/Redo/Clear) ---
  useEffect(() => {
    if (!client) return;
    const eventsChannel = client.channels.get(`whiteboard-events-${whiteboardId}`);

    const handleClear = () => {
      clearStrokes(); // Clear locally
      clearShapes();  // Clear locally
      noteHandlers.setNotes({}); // Clear notes locally
      eventsChannel?.publish("clear", { by: client.auth.clientId }); // Broadcast
    };

    const handleUndo = () => {
      undo(); // Perform local undo (from useStrokes)
      eventsChannel.publish("undo", { by: client.auth.clientId });
    };

    const handleRedo = () => {
      redo(); // Perform local redo (from useStrokes)
      eventsChannel.publish("redo", { by: client.auth.clientId });
    };

    // Connect refs to these handlers
    if (onUndo) onUndo.current = handleUndo;
    if (onRedo) onRedo.current = handleRedo;
    if (onClear) onClear.current = handleClear;

  // Added clearStrokes, clearShapes, noteHandlers.setNotes to dependencies
  }, [client, whiteboardId, undo, redo, clearStrokes, clearShapes, noteHandlers, onUndo, onRedo, onClear]);


  // --- Local Action Handlers ---
  const handleStrokeComplete = (stroke) => {
    addStroke(stroke); // Hook should handle adding locally and publishing
    // strokesChannel?.publish("new-stroke", { stroke }); // Only if hook doesn't publish
  };

  // Determine pointer event status for shape layer
  const isShapeLayerActive = activeTool === 'shapes' || activeTool === 'cursor';

  return (
    // No need for ViewContext.Provider here if it's provided higher up
    <div
      className="whiteboard-container"
      ref={boardRef}
      style={{
        position: "relative",
        overflow: "hidden", // Changed from scroll
        width: "100%",
        height: "100%",
        cursor: activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser' ? 'crosshair' :
                activeTool === 'shapes' ? 'copy' :
                activeTool === 'cursor' ? 'default' : 'default' // Handle cursor tool explicitly
      }}
    >
        {/* LAYER 1: Pixel Canvas */}
        <Canvas
          canvasRef={canvasRef}
          activeTool={activeTool}
          strokes={undoStack}
          onStrokeComplete={handleStrokeComplete}
          toolSettings={toolSettings} // Pass settings down
          view={view} // Pass view for coordinate calculations if needed in Canvas
        />

        {/* LAYER 2: Sticky Notes */}
        <div style={{ pointerEvents: activeTool === 'sticky' || activeTool === 'cursor' ? 'auto' : 'none' }}>
          <StickyNotesLayer
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            boardRef={boardRef} // Pass boardRef
            fileId={fileId}
            notes={notes}
            setNotes={setNotes} // Pass setNotes
            focusNoteId={focusNoteId} // Pass focusNoteId
            setFocusNoteId={setFocusNoteId} // Pass setFocusNoteId
            addNote={noteHandlers.addNote} // Pass specific handlers
            removeNote={noteHandlers.removeNote}
            moveNote={noteHandlers.moveNote}
            resizeNote={noteHandlers.resizeNote}
            typeNote={noteHandlers.typeNote}
            view={view} // Pass view context
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
            view={view} // Pass view context down
          />
        </div>

        {/* Live Cursors */}
        {client && (
          <LiveCursors
            boardRef={boardRef} // Pass boardRef
            client={client}
            channel={client.channels.get(`whiteboard-cursors-${whiteboardId}`)}
            whiteboardId={whiteboardId}
            view={view} // Pass view context
          />
        )}

        {/* Pan Handler */}
        <PanHandler
          boardRef={boardRef}
          activeTool={activeTool}
          // No need to pass view/setView if PanHandler uses useView() internally
        />
    </div>
  );
}

export default Whiteboard;