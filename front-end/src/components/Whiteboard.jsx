// Whiteboard.jsx
import React, { useRef, useState, useEffect } from "react";
import "./Whiteboard.css";
import StickyNote from "./StickyNote";

function Whiteboard({ strokes, onChange }) {
  const boardRef = useRef(null);
  const canvasRef = useRef(null);

  // draw state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]);

  // tools
  const toolRef = useRef(null);
  const erasingRef = useRef(false);
  const stickyColorRef = useRef('#FFEB3B');

  // configs
  const penSizeRef = useRef(2);
  const penColorRef = useRef("#000000");
  const eraserSizeRef = useRef(20);

  // sticky notes state
  const [notes, setNotes] = useState([]);
  const [focusNoteId, setFocusNoteId] = useState(null);

  // size canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 100;

    const initialTool = typeof window !== 'undefined' ? window.__WB_TOOL__ : null;
    toolRef.current = initialTool || null;
    erasingRef.current = initialTool === 'eraser';

    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes]);

  // listen toolbar
  useEffect(() => {
    const onSelectTool = (e) => {
      const tool = e?.detail?.tool ?? null;
      toolRef.current = tool;
      erasingRef.current = tool === 'eraser';
    };
    const onToggleErase = (e) => {
      const on = !!e?.detail?.on;
      if (toolRef.current) {
        erasingRef.current = on;
        toolRef.current = on ? 'eraser' : 'pen';
      }
    };
    const onStickyColor = (e) => {
      stickyColorRef.current = e?.detail?.color ?? '#FFEB3B';
    };

    window.addEventListener("wb:select-tool", onSelectTool);
    window.addEventListener("wb:toggle-erase", onToggleErase);
    window.addEventListener("wb:sticky-select-color", onStickyColor);
    return () => {
      window.removeEventListener("wb:select-tool", onSelectTool);
      window.removeEventListener("wb:toggle-erase", onToggleErase);
      window.removeEventListener("wb:sticky-select-color", onStickyColor);
    };
  }, []);

  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  // -------- Pen / Eraser ----------
  const startDrawing = (e) => {
    if (toolRef.current !== 'pen' && toolRef.current !== 'eraser') return;
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
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = eraserSizeRef.current;
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.lineWidth = penSizeRef.current;
        ctx.strokeStyle = penColorRef.current;
      }
      if (last) {
        ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      return [...prev, p];
    });
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 0) {
      const toSave = erasingRef.current ? { points: currentStroke, erase: true } : currentStroke;
      onChange?.([...strokes, toSave]);
      setCurrentStroke([]);
    }
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokes) {
      let points, isErase = false;
      if (Array.isArray(stroke)) points = stroke;
      else if (stroke && Array.isArray(stroke.points)) { points = stroke.points; isErase = !!stroke.erase; }
      else continue;
      if (!points || points.length < 2) continue;

      ctx.lineJoin = "round"; ctx.lineCap = "round";
      if (isErase) { ctx.globalCompositeOperation = "destination-out"; ctx.lineWidth = eraserSizeRef.current; }
      else { ctx.globalCompositeOperation = "source-over"; ctx.lineWidth = penSizeRef.current; ctx.strokeStyle = penColorRef.current; }

      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1], b = points[i];
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = "source-over";
  };

  // ---------- Sticky Notes ----------
  const clampPosition = (x, y, w, h) => {
    const bounds = boardRef.current.getBoundingClientRect();
    const maxX = Math.max(0, bounds.width - w);
    const maxY = Math.max(0, bounds.height - h);
    return { x: Math.max(0, Math.min(x, maxX)), y: Math.max(0, Math.min(y, maxY)) };
  };

  const handleCanvasClick = (e) => {
    // place a single note then turn tool OFF
    if (toolRef.current !== 'sticky') return;
    if (e.target !== canvasRef.current) return;

    const pos = getMousePos(e);
    const DEFAULT_W = 180, DEFAULT_H = 160;
    let x = pos.x - DEFAULT_W / 2, y = pos.y - DEFAULT_H / 2;
    ({ x, y } = clampPosition(x, y, DEFAULT_W, DEFAULT_H));

    const id = `note_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    const color = stickyColorRef.current || '#FFEB3B';

    setNotes((prev) => [...prev, { id, x, y, w: DEFAULT_W, h: DEFAULT_H, color, text: '' }]);
    setFocusNoteId(id);

    // toggle sticky tool OFF after placing one note
    toolRef.current = null;
    if (typeof window !== 'undefined') {
      window.__WB_TOOL__ = null;
      window.dispatchEvent(new CustomEvent('wb:select-tool', { detail: { tool: null } }));
      window.dispatchEvent(new CustomEvent('wb:toggle-erase', { detail: { on: false } }));
    }
  };

  const moveNote = (id, { x, y }) => {
    setNotes((prev) => prev.map(n => (n.id === id ? { ...n, x, y } : n)));
  };

  const resizeNote = (id, { w, h }) => {
    // also clamp size so it doesn't overflow the board
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
    <div
      ref={boardRef}
      style={{ position: 'relative', width: '100%', height: 'calc(100vh - 100px)' }}
    >
      <canvas
        ref={canvasRef}
        className="whiteboard-canvas"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        onClick={handleCanvasClick}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
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
    </div>
  );
}

export default Whiteboard;