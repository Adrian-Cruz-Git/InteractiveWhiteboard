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
import TextLayer from "./Layers/TextLayer.jsx";



function Whiteboard({ client, onChange, activeTool, setActiveTool, fileId, onUndo, onRedo, onClear, }) {
  const whiteboardId = fileId || "local-" + Math.random();
  const canvasRef = useRef(null);
  const boardRef = useRef(null);

  // state for text boxes
  const [texts, setTexts] = useState([]);

  //state for sticky notes
  const { notes, setNotes, focusNoteId, setFocusNoteId, addNote, removeNote, moveNote, resizeNote, typeNote, loadNotes } = useStickyNotes(fileId, client, whiteboardId);

  const { undoStack, addStroke, undo, redo, setUndoStack, clear } = useStrokes(fileId, () => { }, onChange, loadNotes, setNotes);



  // Use the client passed from WhiteboardPage
  const strokesChannel = client?.channels.get(`whiteboard-strokes-${whiteboardId}`);

  // Set up real-time stroke subscription - subscirbe to other users strokes
  useEffect(() => {
    if (!strokesChannel) return;

    const handleRemoteStroke = (message) => {
      // console.log('Received remote stroke:', message.data.stroke);
      addStroke(message.data.stroke);
    };

    strokesChannel.subscribe("new-stroke", handleRemoteStroke);

    return () => {
      strokesChannel.unsubscribe("new-stroke", handleRemoteStroke);
    };
  }, [strokesChannel, addStroke]);

  // Set up real-time clear subscription - subscribe to others users clear events
  useEffect(() => {
    if (!client) return;
    const eventsChannel = client.channels.get(`whiteboard-events-${whiteboardId}`);

    const handleRemoteClear = (msg) => { // receive clear event from other user
      console.log("Received clear from:", msg.data.by);
      clear(); // wipe local canvas when others clear
      setNotes([]); // clear sticky notes as well
    };

    eventsChannel.subscribe("clear", handleRemoteClear);
    return () => eventsChannel.unsubscribe("clear", handleRemoteClear);
  }, [client, whiteboardId, clear]);

  // Set up real-time undo/redo subscription - subscribe to other users undo/redo events
  useEffect(() => {
    if (!client) return;
    const eventsChannel = client.channels.get(`whiteboard-events-${whiteboardId}`);
    //when other user performs undo/redo, do it locally as well
    const handleRemoteUndo = () => {
      console.log("Received undo");
      undo();
    };

    const handleRemoteRedo = () => {
      console.log("Received redo");
      redo();
    };

    eventsChannel.subscribe("undo", handleRemoteUndo);
    eventsChannel.subscribe("redo", handleRemoteRedo);

    return () => {
      eventsChannel.unsubscribe("undo", handleRemoteUndo);
      eventsChannel.unsubscribe("redo", handleRemoteRedo);
    };
  }, [client, whiteboardId, undo, redo]);


  // Set up undo, redo, and clear broadcasting - publish to other users when local user performs these actions
  useEffect(() => {
    if (!client) return;

    const eventsChannel = client.channels.get(`whiteboard-events-${whiteboardId}`);

    const handleClear = () => {
      clear(); // clear locally
      setNotes([]); // clear sticky notes locally
      eventsChannel?.publish("clear", { by: client.auth.clientId }); // broadcast to other users
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
  }, [client, whiteboardId, undo, redo, clear]);

  const handleStrokeComplete = (stroke) => {
    // console.log('Publishing stroke:', stroke);
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
        // canvasRef={canvasRef}
        boardRef={boardRef}
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
    </div >
  );
}

export default Whiteboard;