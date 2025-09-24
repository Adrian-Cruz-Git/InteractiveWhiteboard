import React, { useRef, useState, useEffect } from "react";
import "./Whiteboard.css";

function Whiteboard({ strokes, onChange, activeTool }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentStroke, setCurrentStroke] = useState([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 100;
        redraw();
        console.log("[Whiteboard] mounted");
    }, [strokes]);


    const startDrawing = (e) => {
        if (activeTool !== "pen" && activeTool !== "eraser") return;
        setIsDrawing(true);
        const pos = getMousePos(e);
        setCurrentStroke([pos]);

        if (canvasRef.current) {
            canvasRef.current.style.cursor =
                activeTool === "eraser" ? "cell" : "crosshair";
        }
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const pos = getMousePos(e);
        const ctx = canvasRef.current.getContext("2d");

        setCurrentStroke((prev) => {
            const lastPos = prev[prev.length - 1];

            ctx.lineJoin = "round";
            ctx.lineCap = "round";

            if (activeTool === "eraser") {
                ctx.globalCompositeOperation = "destination-out"; // erasing
                ctx.lineWidth = 20;
            } else {
                ctx.globalCompositeOperation = "source-over"; // drawing
                ctx.lineWidth = 2;
                ctx.strokeStyle = "black";
            }

            if (lastPos) {
                ctx.beginPath();
                ctx.moveTo(lastPos.x, lastPos.y);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
            }

            return [...prev, pos];
        });
    };

    const endDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);

        if (currentStroke.length > 0) {
            const toSave =
                activeTool === "eraser"
                    ? { points: currentStroke, erase: true }
                    : currentStroke;
            onChange([...strokes, toSave]); // send updated strokes to parent
            setCurrentStroke([]);
        }
    };

    const getMousePos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const redraw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        strokes.forEach((stroke) => {
            let points = null;
            let isErase = false;

            if (Array.isArray(stroke)) {
                points = stroke;
                isErase = false;
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

        // Reset composite mode
        ctx.globalCompositeOperation = "source-over";
    };

    return (
        <canvas
            ref={canvasRef}
            className="whiteboard-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
        />
    );
}

export default Whiteboard;
