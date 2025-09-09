import React, { useRef, useState, useEffect } from "react";
import "./Whiteboard.css";

function Whiteboard({ strokes, onChange, activeTool, stickyNotes = [], onAddStickyNote, onUpdateStickyNote }) { 
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentStroke, setCurrentStroke] = useState([]);
    const [draggedNoteId, setDraggedNoteId] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 100;
        redraw();
    }, [strokes]);

    const startDrawing = (e) => {
        if (activeTool !== 'pen' ) return; // only draw when pen or eraser is selected
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

    //only draw when pen is active
    const handlePointerDown = (e) => {
        if (activeTool === "pen"){
            startDrawing(e);
        } else if (activeTool === "stickyNote"){
            const rect = canvasRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            onAddStickyNote(x, y); //add sticky note
        }
    };

    const handleMouseUp = () => {
        setDraggedNoteId(null);
    }

    //dragging sticky notes
    const handleNoteMouseDown = (e, note) => {
        e.stopPropagation(); //prevent canvas drawing
        setDraggedNoteId(note.id);
        setDragOffset({ x: e.clientX - note.x, y: e.clientY - note.y });
    };

    const handleMouseMove = (e) => {
        if (draggedNoteId !== null) {
            const x= e.clientX - dragOffset.x;
            const y= e.clientY - dragOffset.y;
            onUpdateStickyNote(draggedNoteId, undefined, x, y); //update position
        }
    };

    useEffect(() => {
        if (draggedNoteId !== null) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        } else {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        }
    }, [draggedNoteId, dragOffset]);


    return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
                <canvas
                    ref={canvasRef}
                    className="whiteboard-canvas"
                    onMouseDown={handlePointerDown}
                    onMouseMove={draw}
                onMouseUp={endDrawing}
                onMouseLeave={endDrawing}
                style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }}
            />
            {stickyNotes.map((note) => (
                <div
                    key={note.id}
                    style={{
                        position: "absolute",
                        left: note.x,
                        top: note.y,
                        backgroundColor: "pink",
                        padding: "10px",
                        border: "1px solid #ccc",
                        borderRadius: "5px",
                        minWidth: "100px",
                        minHeight: "100px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        zIndex: 2,
                        cursor: "move",
                    }}
                    onMouseDown={(e) => handleNoteMouseDown(e, note)}
                >
                    <textarea
                        value={note.text}
                        onChange={(e) => onUpdateStickyNote(note.id, e.target.value)}
                        style={{
                            width: "100%",
                            height: "100%",
                            border: "none",
                            background: "transparent",
                            resize: "none",
                            fontSize: "14px"
                        }}
                        placeholder="Yuna was here"
                    />
                </div>
            ))}
        </div>
    );
}

export default Whiteboard;