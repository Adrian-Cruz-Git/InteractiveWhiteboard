import React, { useRef, useState, useEffect, useMemo } from "react";
import "./Whiteboard.css";
import LiveCursors from "../components/LiveCursorsDemo";
import { Realtime } from "ably";
import { nanoid } from "nanoid";
import { config } from "../config.js"; // your Ably key
import { useAuth } from "../contexts/AuthContext";

function Whiteboard({ strokes, onChange }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentStroke, setCurrentStroke] = useState([]);
    const { currentUser } = useAuth();


    //Unique whiteboard ID from URL 
    const whiteboardId = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get("id") || "default";
    }, []);

    // Ably client
    const client = useMemo(
        () => new Realtime({ key: config.ABLY_KEY, clientId: nanoid() }),
        []
    );
    //Ably channel for stroke updates
    const strokesChannel = useMemo(
        () => client.channels.get(`whiteboard-strokes-${whiteboardId}`),
        [client, whiteboardId]
    );
    //Channel for cursor updates
    const cursorsChannel = useMemo(
        () => client.channels.get(`whiteboard-cursors-${whiteboardId}`),
        [client, whiteboardId]
    );
    // Username for cursors & stroke info 
    const userName = currentUser?.displayName || currentUser?.email || "Anonymous";

    // Subscribe to strokes from other users 
    useEffect(() => {
        const handleStrokeMessage = (msg) => {
            onChange([...strokes, msg.data.stroke]);
        };
        strokesChannel.subscribe("new-stroke", handleStrokeMessage);
        return () => strokesChannel.unsubscribe("new-stroke", handleStrokeMessage);
    }, [strokesChannel, strokes, onChange]);

    // Canvas redraw whenever strokes change 
    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 100;
        redraw();
    }, [strokes]);

    //  Drawing handlers 
    const startDrawing = (e) => {
        setIsDrawing(true);
        setCurrentStroke([getMousePos(e)]);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const pos = getMousePos(e);
        setCurrentStroke([...currentStroke, pos]);

        const ctx = canvasRef.current.getContext("2d");
        const lastPos = currentStroke[currentStroke.length - 1];
        if (lastPos) {
            ctx.beginPath();
            ctx.moveTo(lastPos.x, lastPos.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        }
    };

    const endDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        if (currentStroke.length > 0) {
            const updatedStrokes = [...strokes, currentStroke];
            onChange(updatedStrokes);

            // Publish to Ably for other users
            strokesChannel.publish("new-stroke", { stroke: currentStroke });

            setCurrentStroke([]);
        }
    };

    const getMousePos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const redraw = () => {
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.lineWidth = 2;
        ctx.strokeStyle = "black";

        if (!Array.isArray(strokes)) return;

        strokes.forEach((stroke) => {
            for (let i = 1; i < stroke.length; i++) {
                const from = stroke[i - 1];
                const to = stroke[i];
                ctx.beginPath();
                ctx.moveTo(from.x, from.y);
                ctx.lineTo(to.x, to.y);
                ctx.stroke();
            }
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
            {/* Live cursors aligned to canvas , pass all the ably references to livecursors component*/}
            <LiveCursors
                canvasRef={canvasRef}
                client={client}
                channel={cursorsChannel}
                whiteboardId={whiteboardId} />
        </div>
    );
}

export default Whiteboard;
