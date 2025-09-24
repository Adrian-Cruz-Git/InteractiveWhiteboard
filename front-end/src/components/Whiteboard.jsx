import React, { useRef, useState, useEffect } from "react";
import "./Whiteboard.css";
import { supabase } from "../config/supabase";

function Whiteboard({ fileId }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [strokes, setStrokes] = useState([]);

    useEffect(() => {
        const fetchStrokes = async () => {
        const { data, error } = await supabase
            .from("whiteboards")
            .select("content")
            .eq("file_id", fileId)
            .single();

        if (!error && data) {
            setStrokes(data.content || []);
            redraw(data.content || []);
        }
    };
    if (fileId) fetchStrokes();
    }, [fileId]);

    const startDrawing = (e) => {
        setIsDrawing(true);
        const { offsetX, offsetY } = e.nativeEvent;
        setStrokes((prev) => [...prev, [{ x: offsetX, y: offsetY }]]);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = e.nativeEvent;
        setStrokes((prev) => {
            const updated = [...prev];
            updated[updated.length - 1].push({ x: offsetX, y: offsetY });
            redraw(updated);
            return updated;
        });
    };

    const endDrawing = async () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        await supabase
            .from("whiteboards")
            .upsert({ file_id: fileId, content: strokes }, { onConflict: "file_id" });
    };

    const redraw = (allStrokes) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.lineWidth = 2;
        ctx.strokeStyle = "black";

        allStrokes.forEach((stroke) => {
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
        <div>
        <canvas
            ref={canvasRef}
            className="whiteboard-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
        />
        </div>
    );
}

export default Whiteboard;