import React, { useRef, useEffect, useState } from "react";
import "./Whiteboard.css";
import { useAuth } from "../../contexts/useAuth";
import { useStrokes } from "./hooks/useStrokes";
import PanHandler from "./PanHandler"; // for panning functionality using cursor
import { ViewContext } from "./ViewContext";// context for view state (zooming and panning)
// Remove this import since client is already created in WhiteboardPage
// import { useRealtime } from "./hooks/useRealtime";
import Canvas from "./Canvas";
import { useStickyNotes } from "./hooks/useStickyNotes";
import StickyNotesLayer from "./Layers/StickyNotesLayer";
import LiveCursors from "../../components/LiveCursors";

function Whiteboard({ client, onChange, activeTool, setActiveTool, fileId, onUndo, onRedo, onClear, }) {
  const whiteboardId = fileId || "local-" + Math.random();
  const canvasRef = useRef(null);
  const boardRef = useRef(null);

  const { notes, setNotes, focusNoteId, setFocusNoteId, addNote, removeNote, moveNote, resizeNote, typeNote, loadNotes } = useStickyNotes(fileId);

  const { undoStack, addStroke, undo, redo, setUndoStack, clear } = useStrokes(fileId, () => { }, onChange, loadNotes, setNotes);



  // Use the client passed from WhiteboardPage
  const strokesChannel = client?.channels.get(`whiteboard-strokes-${whiteboardId}`);

  // Set up real-time stroke subscription
  useEffect(() => {
    if (!strokesChannel) return;

    const handleRemoteStroke = (message) => {
      console.log('Received remote stroke:', message.data.stroke);
      addStroke(message.data.stroke);
    };

    strokesChannel.subscribe("new-stroke", handleRemoteStroke);

    return () => {
      strokesChannel.unsubscribe("new-stroke", handleRemoteStroke);
    };
  }, [strokesChannel, addStroke]);


  useEffect(() => {
    if (onUndo) onUndo.current = undo;
    if (onRedo) onRedo.current = redo;
    if (onClear) onClear.current = clear;
  }, [onUndo, onRedo, onClear, undo, redo, clear]);

  const handleStrokeComplete = (stroke) => {
    console.log('Publishing stroke:', stroke);
    addStroke(stroke);
    strokesChannel?.publish("new-stroke", { stroke });
  };
  // View state for zooming and panning, needed for zooming implementation
  // Keeps coords for the global view state of the whiteboard (camera like model)
  const [view, setView] = useState({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });

  return (
    <div
      className="whiteboard-container"
      ref={boardRef}
      style={{
        position: "relative",
        overflow: "hidden", // previously "scroll"
        width: "100%",
        height: "100%"
      }}
    >
      <ViewContext.Provider value={{ view, setView }}>
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
          setActiveTool={setActiveTool}
          boardRef={boardRef}
          fileId={fileId}
          notes={notes}
          setNotes={setNotes}
          focusNoteId={focusNoteId}
          setFocusNoteId={setFocusNoteId}
          addNote={addNote}
          removeNote={removeNote}
          moveNote={moveNote}
          resizeNote={resizeNote}
          typeNote={typeNote}
        />

        {/* Live Cursors */}
        {client && (
          <LiveCursors
            canvasRef={canvasRef}
            client={client}
            channel={client.channels.get(`whiteboard-cursors-${whiteboardId}`)}
            whiteboardId={whiteboardId}
          />
        )}

        <PanHandler
          boardRef={boardRef}
          activeTool={activeTool}
        /> {/* PanHandler for moving around functionality (panning) when cursor is activated */}
      </ViewContext.Provider>
    </div>
  );
}

export default Whiteboard;