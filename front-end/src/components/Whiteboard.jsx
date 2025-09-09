// Whiteboard.jsx
// Eraser stays selected until another tool is chosen.
// No cursor overrides (uses your original CSS crosshair).
// Eraser truly deletes pixels via destination-out, and erase strokes persist.

import React, { useRef, useState, useEffect } from "react";
import "./Whiteboard.css";

function Whiteboard({ strokes, onChange }) {
  const canvasRef = useRef(null);

  // drawing session state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]);

  // tool state (null | 'pen' | 'eraser')
  const toolRef = useRef(null);
  const erasingRef = useRef(false);

  // simple configs
  const penSizeRef = useRef(2);
  const penColorRef = useRef("#000000");
  const eraserSizeRef = useRef(20); // fixed

  // set size & initial tool from global (if any); DO NOT auto-activate pen
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 100;

    // read global tool if already selected by toolbar previously
    const initialTool = typeof window !== 'undefined' ? window.__WB_TOOL__ : null;
    toolRef.current = initialTool || null;
    erasingRef.current = initialTool === 'eraser';

    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes]);

  // keep tool in sync with toolbar selections; NEVER reset on mouse up
  useEffect(() => {
    const onSelectTool = (e) => {
      const tool = e?.detail?.tool ?? null;
      toolRef.current = tool;               // persists until next selection
      erasingRef.current = tool === 'eraser';
      console.log("[Whiteboard] tool ->", tool || "none");
    };

    // (optional legacy support; doesn't auto-unset tool)
    const onToggleErase = (e) => {
      const on = !!e?.detail?.on;
      // Only update if a tool is already chosen; otherwise wait for explicit selection
      if (toolRef.current) {
        erasingRef.current = on;
        toolRef.current = on ? 'eraser' : 'pen';
      }
    };

    window.addEventListener("wb:select-tool", onSelectTool);
    window.addEventListener("wb:toggle-erase", onToggleErase);
    return () => {
      window.removeEventListener("wb:select-tool", onSelectTool);
      window.removeEventListener("wb:toggle-erase", onToggleErase);
    };
  }, []);

  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e) => {
    // if no tool selected, ignore input (prevents accidental marks)
    if (!toolRef.current) return;

    setIsDrawing(true);
    const p = getMousePos(e);
    setCurrentStroke([p]);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const p = getMousePos(e);
    const ctx = canvasRef.current.getContext("2d");
    const isErase = erasingRef.current;

    setCurrentStroke((prev) => {
      const last = prev[prev.length - 1];

      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      if (isErase) {
        // delete pixels
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = eraserSizeRef.current;
      } else {
        // normal draw
        ctx.globalCompositeOperation = "source-over";
        ctx.lineWidth = penSizeRef.current;
        ctx.strokeStyle = penColorRef.current;
      }

      if (last) {
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }

      return [...prev, p];
    });
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentStroke.length > 0) {
      // IMPORTANT: we DO NOT reset tool here; it stays whatever the user selected.
      const toSave = erasingRef.current
        ? { points: currentStroke, erase: true }  // persist erase stroke
        : currentStroke;                          // persist draw stroke

      onChange([...strokes, toSave]);
      setCurrentStroke([]);
    }
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokes) {
      let points, isErase = false;

      if (Array.isArray(stroke)) {
        points = stroke;
      } else if (stroke && Array.isArray(stroke.points)) {
        points = stroke.points;
        isErase = !!stroke.erase;
      } else {
        continue;
      }

      if (!points || points.length < 2) continue;

      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      if (isErase) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = eraserSizeRef.current;
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.lineWidth = penSizeRef.current;
        ctx.strokeStyle = penColorRef.current;
      }

      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

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
