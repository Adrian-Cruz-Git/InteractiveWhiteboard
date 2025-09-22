import React, { useRef, useState, useEffect } from "react";
import "./Whiteboard.css";

function Whiteboard({ strokes, onChange, activeTool }) { //add pen activeTool
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentStroke, setCurrentStroke] = useState([]);
    const erasingRef = useRef(false);
    const [erasing, setErasing] = useState(false);
    const prevDebugModeRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 100;
        redraw();
        if (typeof window !== "undefined" && window.__WB_ERASE__ == null) {
            window.__WB_ERASE__ = false;
        }
        console.log("[Whiteboard] mounted");
        window.__WB_MOUNTED__ = true;
    }, [strokes]);

    useEffect(() => {
        const toggle = () => {
            erasingRef.current = !erasingRef.current;
            setErasing(erasingRef.current);
            console.log("[Whiteboard] Eraser toggled:", erasingRef.current);
            // update cursor for quick visual feedback
            if (canvasRef.current) {
                canvasRef.current.style.cursor = erasingRef.current ? "cell" : "crosshair";
            }
        };
        window.__WB_DEBUG_TOGGLE__ = () => {
            toggle();
            return erasingRef.current;
        };
        const eventHandler = () => toggle();
        const keyHandler = (e) => {
            if (e.key === "e" || e.key === "E") toggle();
        };

        window.addEventListener("wb:toggle-erase", eventHandler);
        window.addEventListener("keydown", keyHandler);
        return () => {
            window.removeEventListener("wb:toggle-erase", eventHandler);
            window.removeEventListener("keydown", keyHandler);
        };
    }, []);


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


    const startDrawing = (e) => {
        if (activeTool !== 'pen') return; // only draw when pen or eraser is selected
        setIsDrawing(true);
        const pos = getMousePos(e);
        setCurrentStroke([pos]);
        if (canvasRef.current) {
            const isErase = window.__WB_ERASE__ === true;
            canvasRef.current.style.cursor = isErase ? "cell" : "crosshair";
        }
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const pos = getMousePos(e);
        const ctx = canvasRef.current.getContext("2d");
        const isErase = window.__WB_ERASE__ === true;
        if (prevDebugModeRef.current !== erasingRef.current) {
            console.log("[Whiteboard] Drawing mode:", erasingRef.current ? "ERASE" : "DRAW");
            prevDebugModeRef.current = erasingRef.current;
        }
        setCurrentStroke((prev) => {
            const lastPos = prev[prev.length - 1];
            // Configure drawing vs erasing
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            if (isErase) {
                ctx.globalCompositeOperation = "destination-out"; // erase pixels
                ctx.lineWidth = 20; // eraser size
            } else {
                ctx.globalCompositeOperation = "source-over";
                ctx.lineWidth = 2; // pen size
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
            const toSave = (window.__WB_ERASE__ === true)
                ? { points: currentStroke, erase: true }
                : currentStroke;
            onChange([...strokes, toSave]); // update parent
            setCurrentStroke([]);
        }
    };

    const getMousePos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const redraw = () => {
        const canvas = canvasRef.current;
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

        // Always reset composite op after redraw
        ctx.globalCompositeOperation = "source-over";
    };

    const handlePointerDown = (e) => {
        if (activeTool !== "pen") return; //only draw when pen is active
        startDrawing(e);
    };

    return (
        <canvas
            ref={canvasRef}
            className="whiteboard-canvas"
            onMouseDown={handlePointerDown}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
        />
    );
}

export default Whiteboard;