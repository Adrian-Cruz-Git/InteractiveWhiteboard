import React, { useRef, useState, useEffect } from "react";
import "./Whiteboard.css";
import LiveCursors from "../components/LiveCursorsDemo";

function Whiteboard({ strokes, onChange }) {


    const canvasRef = useRef(null);
    const containerRef = useRef(null); // Add a ref for the container
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentStroke, setCurrentStroke] = useState([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 100;
        redraw();
    }, [strokes]);

    const startDrawing = (e) => {
        setIsDrawing(true);
        const pos = getMousePos(e);
        setCurrentStroke([pos]);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const pos = getMousePos(e);
        setCurrentStroke((prev) => [...prev, pos]);

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
            onChange([...strokes, currentStroke]); // update parent
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
                onMouseMove={(e) => {
                    draw(e);
                }}
                onMouseUp={endDrawing}
                onMouseLeave={(e) => {
                    endDrawing();
                }}
            />
            {/*Add live cursors to the whiteboard , pass the container reference so cursors align with canvas*/}
            <LiveCursors canvasRef={canvasRef} />

        </div>
    );
}

export default Whiteboard;