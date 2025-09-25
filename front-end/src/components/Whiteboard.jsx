import React, { useRef, useState, useEffect, useMemo, useLayoutEffect } from "react";
import "./Whiteboard.css";
import { supabase } from "../config/supabase";

import LiveCursors from "../components/LiveCursors";
import { Realtime } from "ably";
import { nanoid } from "nanoid";
import { config } from "../config.js"; // your Ably key
import { useAuth } from "../contexts/useAuth";

function Whiteboard({ strokes, onChange, activeTool, onUndo, onRedo, onClear, fileId}) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const { currentUser } = useAuth();
    const currentStrokeRef = useRef([]);
    const [localStrokes, setLocalStrokes] = useState([]); // local strokes for rendering
    const [client, setClient] = useState(null); // Ably client

    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);

    // -------------------------
    // Supabase fetch / save
    // -------------------------
    useEffect(() => {
        const fetchStrokes = async () => {
            const { data, error } = await supabase
                .from("whiteboards")
                .select("content")
                .eq("file_id", fileId)
                .single();

            if (!error && data) {
                setUndoStack(data.content || []); // initialize undo stack
                setRedoStack([]);
            }
        };
        if (fileId) fetchStrokes();
    }, [fileId]);

    // Save strokes to Supabase whenever undoStack changes
    useEffect(() => {
        const saveStrokes = async () => {
            if (!fileId) return;
            await supabase
                .from("whiteboards")
                .upsert({ file_id: fileId, content: undoStack }, { onConflict: "file_id" });
        };
        saveStrokes();
        setLocalStrokes(undoStack); // redraw canvas
        onChange && onChange(undoStack); // sync with parent
    }, [undoStack, fileId, onChange]);

    // -------------------------
    // Unique whiteboard ID from URL
    // -------------------------
    const whiteboardId = fileId || "local-" + nanoid();

    // -------------------------
    // Ably client setup
    // -------------------------
    useEffect(() => {
        if (!currentUser) return;

        const ablyClient = new Realtime({
            key: config.ABLY_KEY,
            clientId: currentUser.email || nanoid(),
        });

        console.log("Creating Ably client with ID:", ablyClient.auth.clientId);
        setClient(ablyClient);

        ablyClient.connection.once("connected", () => {
            console.log("Connected to Ably, clientId:", ablyClient.auth.clientId);
        });

        return () => {
            ablyClient.close();
        };
    }, [currentUser]);

    // -------------------------
    // Ably channels
    // -------------------------
    const strokesChannel = useMemo(() => client?.channels.get(`whiteboard-strokes-${whiteboardId}`), [client, whiteboardId]);
    const cursorsChannel = useMemo(() => client?.channels.get(`whiteboard-cursors-${whiteboardId}`), [client, whiteboardId]);
    const eventsChannel = useMemo(() => client?.channels.get(`whiteboard-events-${whiteboardId}`), [client, whiteboardId]);

    const userName = currentUser?.displayName || currentUser?.email || "Anonymous";

    // -------------------------
    // Toolbar actions
    // -------------------------
    const clearBoard = () => {
        if (!eventsChannel) return;
        eventsChannel.publish("clear", { boardId: whiteboardId });
    };

    const undo = () => {
        if (!eventsChannel) return;
        eventsChannel.publish("undo", { boardId: whiteboardId });
    };

    const redo = () => {
        if (!eventsChannel) return;
        eventsChannel.publish("redo", { boardId: whiteboardId });
    };

    useEffect(() => {
        if (onUndo) onUndo.current = undo;
        if (onRedo) onRedo.current = redo;
        if (onClear) onClear.current = clearBoard;
    }, [onUndo, onRedo, onClear, eventsChannel]);

    // -------------------------
    // Subscribe to strokes via Ably
    // -------------------------
    useEffect(() => {
        if (!strokesChannel) return;
        const handleStrokeMessage = (msg) => {
            addStroke(msg.data.stroke);
        };
        strokesChannel.subscribe("new-stroke", handleStrokeMessage);
        return () => strokesChannel.unsubscribe("new-stroke", handleStrokeMessage);
    }, [strokesChannel]);

    // -------------------------
    // Undo / Redo logic
    // -------------------------
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

    const addStroke = (stroke) => {
        setUndoStack(prev => [...prev, stroke]);
    };

    // -------------------------
    // Subscribe to events (undo, redo, clear) via Ably
    // -------------------------
    useEffect(() => {
        if (!eventsChannel) return;

        const handleClear = (msg) => {
            if (msg.data.boardId !== whiteboardId) return;
            setUndoStack([]);
            setRedoStack([]);
        };
        const handleUndoEvent = (msg) => { if (msg.data.boardId === whiteboardId) handleUndo(); };
        const handleRedoEvent = (msg) => { if (msg.data.boardId === whiteboardId) handleRedo(); };

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
    // Redraw canvas on strokes change or resize
    // -------------------------
    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            redraw();
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        return () => window.removeEventListener("resize", resizeCanvas);
    }, [localStrokes]);

    // -------------------------
    // Drawing handlers
    // -------------------------
    const startDrawing = (e) => {
        if (activeTool !== "pen" && activeTool !== "eraser") return;
        setIsDrawing(true);
        currentStrokeRef.current = [getMousePos(e)];
    };

    const draw = (e) => {
        if (!isDrawing) return;

        const pos = getMousePos(e);
        const ctx = canvasRef.current.getContext("2d");
        const lastPos = currentStrokeRef.current[currentStrokeRef.current.length - 1];

        ctx.lineJoin = "round";
        ctx.lineCap = "round";

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

    const endDrawing = async () => {
        if (!isDrawing) return;
        setIsDrawing(false);

        if (currentStrokeRef.current.length > 1) {
            const strokeData = {
                points: currentStrokeRef.current,
                erase: activeTool === "eraser",
            };

            // Publish stroke via Ably
            strokesChannel?.publish("new-stroke", { stroke: strokeData });

            // Update local stack
            setUndoStack(prev => [...prev, strokeData]);
        }

        currentStrokeRef.current = [];
    };

    const getMousePos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
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

            if (Array.isArray(stroke)) points = stroke;
            else if (stroke?.points) {
                points = stroke.points;
                isErase = !!stroke.erase;
            }

            if (!points || points.length < 2) return;

            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.globalCompositeOperation = isErase ? "destination-out" : "source-over";
            ctx.lineWidth = isErase ? 20 : 2;
            ctx.strokeStyle = "black";

            for (let i = 1; i < points.length; i++) {
                const from = points[i - 1];
                const to = points[i];
                ctx.beginPath();
                ctx.moveTo(from.x, from.y);
                ctx.lineTo(to.x, to.y);
                ctx.stroke();
            }

            ctx.globalCompositeOperation = "source-over";
        });
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
            {/* Live cursors */}
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
