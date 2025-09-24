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
    const [client, setClient] = useState(null);// hold client so you only have to create it once

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

    // Username for cursors & stroke info
    const userName =
        currentUser?.displayName || currentUser?.email || "Anonymous";

    // -------------------------
    // SUBSCRIBE TO STROKES FROM ABLY
    // -------------------------
    useEffect(() => {
        if (!strokesChannel) return;
        const handleStrokeMessage = (msg) => {
            setLocalStrokes((prev) => [...prev, msg.data.stroke]); // changed from onChange to local strokes
            console.log("Received stroke", msg.data.stroke); // DEBUG - TESTING , testing to see if strokes are received correctly
        };

        strokesChannel.subscribe("new-stroke", handleStrokeMessage);

        console.log("Subscribed to strokes channel", strokesChannel.name); // DEBUG - testing to see if subscription is successful to ably channel
        return () => {
            strokesChannel.unsubscribe("new-stroke", handleStrokeMessage); // after unmounting, unsubscribe
        };
    }, [strokesChannel]);

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
