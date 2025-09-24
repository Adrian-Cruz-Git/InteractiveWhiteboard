import React, { useRef, useState, useEffect, useMemo, useLayoutEffect } from "react";
import "./Whiteboard.css";
import LiveCursors from "../components/LiveCursors";
import { Realtime } from "ably";
import { nanoid } from "nanoid";
import { config } from "../config.js"; // your Ably key
import { useAuth } from "../contexts/AuthContext";

function Whiteboard({ strokes, onChange, activeTool, onUndo, onRedo, onClear, }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const { currentUser } = useAuth();
    const currentStrokeRef = useRef([]);
    const [localStrokes, setLocalStrokes] = useState(strokes || []); // new local state for strokes
    const [client, setClient] = useState(null);// hold client so you only have to create it once

    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);

    //Keep local strokes in sync with prop strokes
    useEffect(() => {
        setLocalStrokes(undoStack);
    }, [undoStack]);


    // Unique whiteboard ID from URL
    const whiteboardId = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get("id") || "default";
    }, []);

    // Creating ABLY CLIENT for real-time comms
    // Only create once user is known
    // Use email as clientId if possible for easier tracking
    // Fallback to random id if no user info (should not happen in protected route)

    useEffect(() => {
        if (!currentUser) return;

        const ablyClient = new Realtime({
            key: config.ABLY_KEY,
            clientId: currentUser.email || nanoid(),
        });

        console.log("Creating Ably client with ID:", ablyClient.auth.clientId);

        // Set the client into state
        setClient(ablyClient);

        // Wait until connected
        ablyClient.connection.once("connected", () => {
            console.log("Connected to Ably, clientId:", ablyClient.auth.clientId);
        });

        // Cleanup on unmount
        return () => {
            ablyClient.close();
        };
    }, [currentUser]);

    // -------------------------
    // ABLY SETUP
    // -------------------------

    // Ably channel for stroke updates
    const strokesChannel = useMemo(() => {
        if (!client) return null; // ONLY create channel if client exists
        return client.channels.get(`whiteboard-strokes-${whiteboardId}`);
    }, [client, whiteboardId]);

    // Channel for cursor updates
    const cursorsChannel = useMemo(() => {
        if (!client) return null;// ONLY create channel if client exists
        return client.channels.get(`whiteboard-cursors-${whiteboardId}`);
    }, [client, whiteboardId]);

    //Ably channel for other events (e.g., clear ,undo, redo)
    const eventsChannel = useMemo(() => {
        if (!client) return null;
        return client.channels.get(`whiteboard-events-${whiteboardId}`);
    }, [client, whiteboardId]);

    // Username for cursors & stroke info
    const userName =
        currentUser?.displayName || currentUser?.email || "Anonymous";

    // -------------------------
    // TOOLBAR ACTIONS (undo, redo, clear) 
    // -------------------------
    // These functions publish events to Ably channels
    // The actual state changes are handled in the Ably subscription effects below

    const clearBoard = () => {
        eventsChannel.publish("clear", { boardId: whiteboardId });
    };

    const undo = () => {
        eventsChannel.publish("undo", { boardId: whiteboardId });
    };

    const redo = () => {
        eventsChannel.publish("redo", { boardId: whiteboardId });
    };

    useEffect(() => {
        if (onUndo) onUndo.current = undo;
        if (onRedo) onRedo.current = redo;
        if (onClear) onClear.current = clearBoard;
    }, [onUndo, onRedo, onClear, eventsChannel]);

    // -------------------------
    // SUBSCRIBE TO STROKES FROM ABLY
    // -------------------------
    useEffect(() => {
        if (!strokesChannel) return;

        const handleStrokeMessage = (msg) => {
            addStroke(msg.data.stroke);
        };

        strokesChannel.subscribe("new-stroke", handleStrokeMessage);

        return () => strokesChannel.unsubscribe("new-stroke", handleStrokeMessage);
    }, [strokesChannel]);


    //  -------------------------
    // UNDO / REDO LOGIC
    //  -------------------------

    const handleUndo = () => {
        setUndoStack(prevUndo => {
            if (!prevUndo.length) return prevUndo;
            const lastStroke = prevUndo[prevUndo.length - 1];
            setRedoStack(prevRedo => [...prevRedo, lastStroke]);
            return prevUndo.slice(0, -1);
        });
    };

    const handleRedo = () => {
        setRedoStack(prevRedo => {
            if (!prevRedo.length) return prevRedo;
            const lastRedo = prevRedo[prevRedo.length - 1];
            setUndoStack(prevUndo => [...prevUndo, lastRedo]);
            return prevRedo.slice(0, -1);
        });
    };

    //
    const addStroke = (stroke) => {
        setUndoStack(prev => [...prev, stroke]);
    };


    // ----- SUBSCRIBE TO EVENTS (undo, redo, clear) -----
    useEffect(() => {
        if (!eventsChannel) return;

        const handleClear = (msg) => {
            if (msg.data.boardId !== whiteboardId) return;
            setUndoStack([]);
            setRedoStack([]);
            setLocalStrokes([]);
        };

        const handleUndoEvent = (msg) => {
            if (msg.data.boardId !== whiteboardId) return;
            handleUndo();
        };

        const handleRedoEvent = (msg) => {
            if (msg.data.boardId !== whiteboardId) return;
            handleRedo();
        };

        eventsChannel.subscribe("clear", handleClear);
        eventsChannel.subscribe("undo", handleUndoEvent);
        eventsChannel.subscribe("redo", handleRedoEvent);

        return () => {
            eventsChannel.unsubscribe("clear", handleClear);
            eventsChannel.unsubscribe("undo", handleUndoEvent);
            eventsChannel.unsubscribe("redo", handleRedoEvent);
        };
    }, [eventsChannel, whiteboardId]);


    // -------------------------
    // REDRAW CANVAS ON STROKE CHANGES OR RESIZE
    // -------------------------
    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth; // internal pixel width
            canvas.height = window.innerHeight; // internal pixel height
            redraw(); // redraw existing strokes
        };

        resizeCanvas(); // initial sizing
        window.addEventListener("resize", resizeCanvas);

        return () => window.removeEventListener("resize", resizeCanvas);
    }, [localStrokes]);

    //CLEAR whiteboard
    useEffect(() => {
        const handleClear = () => {
            console.log("[Whiteboard] Clear event received");
            // Clear parent strokes and currentStroke
            onChange([]);
            setCurrentStroke([]);
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        };

        window.addEventListener("wb:clear", handleClear);

        return () => {
            window.removeEventListener("wb:clear", handleClear);
        };
    }, [onChange]);


    // -------------------------
    // DRAWING HANDLERS
    // -------------------------


    const startDrawing = (e) => {
        if (activeTool !== "pen" && activeTool !== "eraser") return;
        setIsDrawing(true);
        const pos = getMousePos(e);
        currentStrokeRef.current = [pos];
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const pos = getMousePos(e);
        const ctx = canvasRef.current.getContext("2d");

        const lastPos =
            currentStrokeRef.current[currentStrokeRef.current.length - 1];

        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        // if (activeTool === "highlighter") {
        //     ctx.globalCompositeOperation = "source-over";
        //     ctx.strokeStyle = "yellow";
        //     ctx.lineWidth = 8;
        //     ctx.globalAlpha = 0.5;
        // } else {
        //     ctx.globalAlpha = 1;
        // }
        if (activeTool === "eraser") {
            ctx.globalCompositeOperation = "destination-out";
            ctx.lineWidth = 20;
        } else {
            ctx.globalCompositeOperation = "source-over";
            ctx.lineWidth = 2;
            ctx.strokeStyle = "black";
        }

        if (lastPos) {
            ctx.beginPath();
            ctx.moveTo(lastPos.x, lastPos.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        }

        currentStrokeRef.current.push(pos);
    };

    const endDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);

        if (currentStrokeRef.current.length > 1) {
            // package stroke with erase flag
            const strokeData = {
                points: currentStrokeRef.current,
                erase: activeTool === "eraser" // mark as eraser stroke so it doesnt draw a line
            };

            // publish through Ably
            strokesChannel.publish("new-stroke", { stroke: strokeData });
            console.log("Published stroke", userName, strokeData);
        }

        currentStrokeRef.current = [];
    };


    const getMousePos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    const redraw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!Array.isArray(localStrokes)) return;

        localStrokes.forEach((stroke) => {
            let points = null;
            let isErase = false;

            if (Array.isArray(stroke)) {
                points = stroke;
            } else if (stroke && Array.isArray(stroke.points)) {
                points = stroke.points;
                isErase = !!stroke.erase;
            }

            if (!points || points.length < 2) return;

            ctx.lineJoin = "round";
            ctx.lineCap = "round";

            if (isErase) {
                ctx.globalCompositeOperation = "destination-out";
                ctx.lineWidth = 20;
            } else {
                ctx.globalCompositeOperation = "source-over";
                ctx.lineWidth = 2;
                ctx.strokeStyle = "black";
            }

            for (let i = 1; i < points.length; i++) {
                const from = points[i - 1];
                const to = points[i];
                ctx.beginPath();
                ctx.moveTo(from.x, from.y);
                ctx.lineTo(to.x, to.y);
                ctx.stroke();
            }
        });


        ctx.globalCompositeOperation = "source-over";
    };

    return (
        <div className="whiteboard-container">
            <canvas
                ref={canvasRef}
                className="whiteboard-canvas"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={endDrawing}
                onMouseLeave={endDrawing}
            />
            {/* Live cursors aligned to canvas , pass all the ably references to livecursors component*/}
            {/* Only render if client and channel are ready */}
            {client && cursorsChannel && (
                <LiveCursors
                    canvasRef={canvasRef}
                    client={client}
                    channel={cursorsChannel}
                    whiteboardId={whiteboardId}
                />
            )}
        </div>
    );
}

export default Whiteboard;
