import React, { useRef, useState, useEffect, useMemo, useLayoutEffect } from "react";
import "./Whiteboard.css";
import LiveCursors from "../components/LiveCursors";
import { Realtime } from "ably";
import { nanoid } from "nanoid";
import { config } from "../config.js"; // your Ably key
import { useAuth } from "../contexts/AuthContext";

function Whiteboard({ strokes, onChange }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const { currentUser } = useAuth();
    const currentStrokeRef = useRef([]);
    const [localStrokes, setLocalStrokes] = useState(strokes || []); // new local state for strokes

    //Keep local strokes in sync with prop strokes
    useEffect(() => {
        setLocalStrokes(strokes);
    }, [strokes]);

    // Unique whiteboard ID from URL
    const whiteboardId = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get("id") || "default";
    }, []);

    // Creating ABLY CLIENT for real-time comms
    // Only create once user is known
    // Use email as clientId if possible for easier tracking
    // Fallback to random id if no user info (should not happen in protected route)

    console.log("Creating Ably client with ID:", currentUser?.email || "generated-" + nanoid());

    const client = useMemo(() => {
        if (!currentUser) return null; // don’t init Ably until user is known
        return new Realtime({
            key: config.ABLY_KEY, // ably api key from config
            clientId: currentUser.email || nanoid(), // use email or random id for client id
        });
    }, [currentUser]);


    client.connection.once("connected", () => {
        console.log("Connected to Ably, clientId:", client.auth.clientId);
    });

    // -------------------------
    // ABLY SETUP
    // -------------------------

    // Ably channel for stroke updates
    const strokesChannel = useMemo(
        () => client.channels.get(`whiteboard-strokes-${whiteboardId}`),
        [client, whiteboardId]
    );

    // Channel for cursor updates
    const cursorsChannel = useMemo(
        () => client.channels.get(`whiteboard-cursors-${whiteboardId}`),
        [client, whiteboardId]
    );

    // Username for cursors & stroke info
    const userName =
        currentUser?.displayName || currentUser?.email || "Anonymous";

    // -------------------------
    // SUBSCRIBE TO STROKES FROM ABLY
    // -------------------------
    useEffect(() => {
        const handleStrokeMessage = (msg) => {
            setLocalStrokes((prev) => [...prev, msg.data.stroke]); // changed from onChange to local strokes
            console.log("Received stroke", msg.data.stroke); // DEBUG - TESTING , testing to see if strokes are received correctly
        };

        strokesChannel.subscribe("new-stroke", handleStrokeMessage);

        console.log("Subscribed to strokes channel", strokesChannel.name); // DEBUG - testing to see if subscription is successful to ably channel
        return () => {
            strokesChannel.unsubscribe("new-stroke", handleStrokeMessage); // after unmounting, unsubscribe
        };
    }, [strokesChannel, onChange]);

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




    // -------------------------
    // DRAWING HANDLERS
    // -------------------------
    const startDrawing = (e) => {
        setIsDrawing(true);
        const pos = getMousePos(e);
        currentStrokeRef.current = [pos];
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const pos = getMousePos(e);
        const lastPos =
            currentStrokeRef.current[currentStrokeRef.current.length - 1];

        if (lastPos) {
            const ctx = canvasRef.current.getContext("2d");
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
            //Only publish if there's something drawn, dont call onChange directly, let the ably subscription handle it
            strokesChannel.publish("new-stroke", { stroke: currentStrokeRef.current });
            console.log("Published stroke", userName, currentStrokeRef.current); // DEBUB - TESTING , to see if stroke is published correctly
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
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.lineWidth = 2;
        ctx.strokeStyle = "black";

        if (!Array.isArray(localStrokes)) return;

        localStrokes.forEach((stroke) => {
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
                whiteboardId={whiteboardId}
            />
        </div>
    );
}

export default Whiteboard;
