// Whiteboard.jsx
import React, { useRef, useState, useEffect, useMemo, useLayoutEffect, useCallback } from "react";
import "./Whiteboard.css";
import { supabase } from "../config/supabase";

import LiveCursors from "../components/LiveCursors";
import StickyNote from "./StickyNote";
import { Realtime } from "ably";
import { nanoid } from "nanoid";
import { config } from "../config.js"; // your Ably key
import { useAuth } from "../contexts/useAuth";

function Whiteboard({ onChange, activeTool, onUndo, onRedo, onClear, fileId }) {
    const boardRef = useRef(null);
    const canvasRef = useRef(null);
    const { user } = useAuth();

    const [isDrawing, setIsDrawing] = useState(false);
    const currentStrokeRef = useRef([]);
    const [localStrokes, setLocalStrokes] = useState([]);
    const [client, setClient] = useState(null); // Ably client

    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);

    // sticky notes state
    const [notes, setNotes] = useState([]);
    const [focusNoteId, setFocusNoteId] = useState(null);
    const stickyColorRef = useRef('#FFEB3B');

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
                setUndoStack(data.content || []);
                setRedoStack([]);
            }
        };
        if (fileId) fetchStrokes();
    }, [fileId]);

    useEffect(() => {
        const saveStrokes = async () => {
            if (!fileId) return;
            await supabase
                .from("whiteboards")
                .upsert({ file_id: fileId, content: undoStack }, { onConflict: "file_id" });
        };
        saveStrokes();
        setLocalStrokes(undoStack);
        onChange && onChange(undoStack);
    }, [undoStack, fileId, onChange]);

    useEffect(() => {
        setLocalStrokes(...undoStack);
    }, [undoStack]);

    const whiteboardId = fileId || "local-" + nanoid();

    // -------------------------
    // Ably client setup
    // -------------------------
    useEffect(() => {
        if (!user) return;

        const ablyClient = new Realtime({
            key: config.ABLY_KEY,
            clientId: user.email || nanoid(),
        });

        setClient(ablyClient);

        ablyClient.connection.once("connected", () => {
            console.log("Connected to Ably, clientId:", ablyClient.auth.clientId);
        });

        return () => {
            ablyClient.close();
        };
    }, [user]);

    // -------------------------
    // Ably channels
    // -------------------------
    const strokesChannel = useMemo(() => client?.channels.get(`whiteboard-strokes-${whiteboardId}`), [client, whiteboardId]);
    const cursorsChannel = useMemo(() => client?.channels.get(`whiteboard-cursors-${whiteboardId}`), [client, whiteboardId]);
    const eventsChannel = useMemo(() => client?.channels.get(`whiteboard-events-${whiteboardId}`), [client, whiteboardId]);

    // -------------------------
    // Toolbar actions
    // -------------------------
    const clearBoard = useCallback(() => {
        if (!eventsChannel) return;
        eventsChannel.publish("clear", { boardId: whiteboardId });
    }, [eventsChannel, whiteboardId]);

    const undo = useCallback(() => {
        if (!eventsChannel) return;
        eventsChannel.publish("undo", { boardId: whiteboardId });
    }, [eventsChannel, whiteboardId]);

    const redo = useCallback(() => {
        if (!eventsChannel) return;
        eventsChannel.publish("redo", { boardId: whiteboardId });
    }, [eventsChannel, whiteboardId]);

    useEffect(() => {
        if (onUndo) onUndo.current = undo;
        if (onRedo) onRedo.current = redo;
        if (onClear) onClear.current = clearBoard;
    }, [onUndo, onRedo, onClear, eventsChannel, undo, redo, clearBoard]);

        // -------------------------
    // Undo / Redo logic
    // -------------------------
    const handleUndo = useCallback(() => {
        setUndoStack(prevUndo => {
            if (!prevUndo.length) return prevUndo;
            const lastStroke = prevUndo[prevUndo.length - 1];
            setRedoStack(prevRedo => [...prevRedo, lastStroke]);
            return prevUndo.slice(0, -1);
        });
    }, []);

    const handleRedo = useCallback(() => {
        setRedoStack(prevRedo => {
            if (!prevRedo.length) return prevRedo;
            const lastRedo = prevRedo[prevRedo.length - 1];
            setUndoStack(prevUndo => [...prevUndo, lastRedo]);
            return prevRedo.slice(0, -1);
        });
    },[]);

    const addStroke = useCallback((stroke) => {
        setUndoStack(prev => {
            const updated = [...prev, stroke];
            setRedoStack([]); // clear redo on new stroke
            return updated;
        });
    }, []);

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
    }, [strokesChannel, addStroke]);

    // -------------------------
    // Subscribe to events (undo, redo, clear) via Ably
    // -------------------------
    useEffect(() => {
        if (!eventsChannel) return;

        const handleClear = (msg) => {
            if (msg.data.boardId !== whiteboardId) return;
            setUndoStack([]);
            setRedoStack([]);
            setNotes([]);

            supabase.from("whiteboards").update({ content: [] }).eq("file_id", fileId);
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
    }, [eventsChannel, whiteboardId, fileId, handleUndo, handleRedo]);

    // -------------------------
    // Redraw canvas
    // -------------------------
    
    const getMousePos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    };

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

            strokesChannel?.publish("new-stroke", { stroke: strokeData });
            setUndoStack(prev => [...prev, strokeData]);
        }

        currentStrokeRef.current = [];
    };

    const redraw = useCallback(() => {
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
    },[localStrokes]);

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
    }, [redraw]);


    // -------------------------
    // Sticky Notes
    // -------------------------
    const clampPosition = (x, y, w, h) => {
        const bounds = boardRef.current.getBoundingClientRect();
        const maxX = Math.max(0, bounds.width - w);
        const maxY = Math.max(0, bounds.height - h);
        return { x: Math.max(0, Math.min(x, maxX)), y: Math.max(0, Math.min(y, maxY)) };
    };

    const handleCanvasClick = (e) => {
        if (activeTool !== 'sticky') return;
        if (e.target !== canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        const DEFAULT_W = 180, DEFAULT_H = 160;
        let x = pos.x - DEFAULT_W / 2, y = pos.y - DEFAULT_H / 2;
        ({ x, y } = clampPosition(x, y, DEFAULT_W, DEFAULT_H));

        const id = `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const color = stickyColorRef.current || '#FFEB3B';

        setNotes((prev) => [...prev, { id, x, y, w: DEFAULT_W, h: DEFAULT_H, color, text: '' }]);
        setFocusNoteId(id);
    };

    const moveNote = (id, { x, y }) => {
        setNotes((prev) => prev.map(n => (n.id === id ? { ...n, x, y } : n)));
    };

    const resizeNote = (id, { w, h }) => {
        const b = boardRef.current.getBoundingClientRect();
        setNotes((prev) => prev.map(n => {
            if (n.id !== id) return n;
            const maxW = Math.max(120, b.width - n.x);
            const maxH = Math.max(100, b.height - n.y);
            return { ...n, w: Math.min(w, maxW), h: Math.min(h, maxH) };
        }));
    };

    const typeNote = (id, text) => {
        setNotes((prev) => prev.map(n => (n.id === id ? { ...n, text } : n)));
    };

    const removeNote = (idToRemove) => {
        setNotes((prev) => prev.filter(n => n.id !== idToRemove));
        if (focusNoteId === idToRemove) {
            setFocusNoteId(null);
        }
    };

    return (
        <div ref={boardRef} className="whiteboard-container" style={{ position: 'relative' }}>
            <canvas
                ref={canvasRef}
                className="whiteboard-canvas"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={endDrawing}
                onMouseLeave={endDrawing}
                onClick={handleCanvasClick}
            />
            {/* Sticky Notes */}
            {notes.map((n) => (
                <StickyNote
                    key={n.id}
                    id={n.id}
                    x={n.x}
                    y={n.y}
                    w={n.w}
                    h={n.h}
                    color={n.color}
                    text={n.text}
                    boundsRef={boardRef}
                    autoFocus={focusNoteId === n.id}
                    onMove={moveNote}
                    onChangeSize={resizeNote}
                    onChangeText={typeNote}
                    onRemove={removeNote}
                />
            ))}
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