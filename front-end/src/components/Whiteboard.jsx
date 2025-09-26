import React, { useRef, useState, useEffect } from "react";
import "./Whiteboard.css";
import StickyNote from "./StickyNote";

/* ------------------------- ImageObject ------------------------- */
const ImageObject = ({
  id, src, x, y, width, height, rotation,
  isSelected, onSelect, onMove, onResize, onRotate, onDelete, boundsRef,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width, height });
  const [initialRotation, setInitialRotation] = useState(rotation);
  const imgRef = useRef(null);

  const handleMouseDown = (e, action) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(id);

    if (action === "drag") {
      setIsDragging(true);
      setDragStart({ x: e.clientX - x, y: e.clientY - y });
    } else if (action === "resize") {
      setIsResizing(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setInitialSize({ width, height });
    } else if (action === "rotate") {
      setIsRotating(true);
      const rect = imgRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const angle = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
      setInitialRotation(rotation - angle);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const bounds = boundsRef?.current?.getBoundingClientRect();
        let newX = e.clientX - dragStart.x;
        let newY = e.clientY - dragStart.y;

        if (bounds) {
          newX = Math.max(0, Math.min(newX, bounds.width - width));
          newY = Math.max(0, Math.min(newY, bounds.height - height));
        }
        onMove(id, { x: newX, y: newY });
      } else if (isResizing) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        const scale = Math.max(0.5, Math.min(3, 1 + (dx + dy) / 200));
        onResize(id, {
          width: Math.max(50, initialSize.width * scale),
          height: Math.max(50, initialSize.height * scale),
        });
      } else if (isRotating) {
        const rect = imgRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const angle = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
        onRotate(id, (angle + initialRotation + 360) % 360);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);
    };

    if (isDragging || isResizing || isRotating) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [
    isDragging, isResizing, isRotating, dragStart,
    width, height, initialSize, initialRotation,
    id, onMove, onResize, onRotate, boundsRef,
  ]);

  return (
    <div
      ref={imgRef}
      style={{
        position: "absolute",
        left: x, top: y, width, height,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center",
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        border: isSelected ? "2px solid #2196F3" : "none",
        boxSizing: "border-box",
        zIndex: 2,
      }}
      onClick={(e) => { e.stopPropagation(); onSelect(id); }}
      onMouseDown={(e) => handleMouseDown(e, "drag")}
    >
      <img
        src={src}
        alt="Uploaded"
        style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }}
        draggable={false}
      />
      {isSelected && (
        <>
          <button
            style={{
              position: "absolute", top: -30, right: -10, width: 24, height: 24,
              background: "#f44336", color: "white", border: "none", borderRadius: "50%",
              cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center",
              justifyContent: "center", zIndex: 10,
            }}
            onClick={(e) => { e.stopPropagation(); onDelete(id); }}
            title="Delete image"
          >
            ×
          </button>
          <div
            style={{
              position: "absolute", bottom: -8, right: -8, width: 16, height: 16,
              background: "#2196F3", cursor: "nwse-resize", borderRadius: "50%",
              border: "2px solid white", boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
            onMouseDown={(e) => handleMouseDown(e, "resize")}
          />
          <div
            style={{
              position: "absolute", top: -30, left: "50%", transform: "translateX(-50%)",
              width: 20, height: 20, background: "#4CAF50", cursor: "grab", borderRadius: "50%",
              border: "2px solid white", boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, color: "white",
            }}
            onMouseDown={(e) => handleMouseDown(e, "rotate")}
            title="Rotate image"
          >
            ↻
          </div>
        </>
      )}
    </div>
  );
};

/* ---------------------------- Whiteboard ---------------------------- */
function Whiteboard({ strokes = [], onChange }) {
  const boardRef = useRef(null);
  const canvasRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]);

  const toolRef = useRef(null);
  const erasingRef = useRef(false);
  const stickyColorRef = useRef("#FFEB3B");

  const penSizeRef = useRef(2);
  const penColorRef = useRef("#000000");
  const eraserSizeRef = useRef(20);

  const [notes, setNotes] = useState([]);
  const [focusNoteId, setFocusNoteId] = useState(null);

  const [images, setImages] = useState([]);
  const [selectedImageId, setSelectedImageId] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 100;

    const initialTool = typeof window !== "undefined" ? window.__WB_TOOL__ : null;
    toolRef.current = initialTool || null;
    erasingRef.current = initialTool === "eraser";

    redraw();
  }, [strokes]);

  // Listen for toolbar events + incoming image payloads
  useEffect(() => {
    const onSelectTool = (e) => {
      const tool = e?.detail?.tool ?? null;
      toolRef.current = tool;
      erasingRef.current = tool === "eraser";
    };

    const onToggleErase = (e) => {
      const on = !!e?.detail?.on;
      if (toolRef.current) {
        erasingRef.current = on;
        toolRef.current = on ? "eraser" : "pen";
      }
    };

    const onStickyColor = (e) => {
      stickyColorRef.current = e?.detail?.color ?? "#FFEB3B";
    };

    // NEW: handle image payload coming from Toolbar's file input
    const onImageAdd = (e) => {
      const dataUrl = e?.detail?.dataUrl;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        const maxSize = 400;
        let w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) {
          const scale = Math.min(maxSize / w, maxSize / h);
          w *= scale; h *= scale;
        }
        const bounds = boardRef.current.getBoundingClientRect();
        const x = Math.max(0, (bounds.width - w) / 2);
        const y = Math.max(0, (bounds.height - h) / 2);

        const newImage = {
          id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          src: dataUrl, x, y, width: w, height: h, rotation: 0,
        };
        setImages((prev) => [...prev, newImage]);
        setSelectedImageId(newImage.id);

        // Exit image tool after placement
        toolRef.current = null;
        if (typeof window !== "undefined") {
          window.__WB_TOOL__ = null;
          window.dispatchEvent(new CustomEvent("wb:select-tool", { detail: { tool: null } }));
        }
      };
      img.src = dataUrl;
    };

    window.addEventListener("wb:select-tool", onSelectTool);
    window.addEventListener("wb:toggle-erase", onToggleErase);
    window.addEventListener("wb:sticky-select-color", onStickyColor);
    window.addEventListener("wb:image-add", onImageAdd);

    return () => {
      window.removeEventListener("wb:select-tool", onSelectTool);
      window.removeEventListener("wb:toggle-erase", onToggleErase);
      window.removeEventListener("wb:sticky-select-color", onStickyColor);
      window.removeEventListener("wb:image-add", onImageAdd);
    };
  }, []);

  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e) => {
    if (toolRef.current !== "pen" && toolRef.current !== "eraser") return;
    setIsDrawing(true);
    setCurrentStroke([getMousePos(e)]);
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
      const toSave = erasingRef.current ? { points: currentStroke, erase: true } : currentStroke;
      onChange?.([...strokes, toSave]);
      setCurrentStroke([]);
    }
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokes) {
      let points, isErase = false;
      if (Array.isArray(stroke)) points = stroke;
      else if (stroke && Array.isArray(stroke.points)) {
        points = stroke.points;
        isErase = !!stroke.erase;
      } else continue;
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
        const a = points[i - 1], b = points[i];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = "source-over";
  };

  /* Sticky notes */
  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current) setSelectedImageId(null);
    if (toolRef.current !== "sticky" || e.target !== canvasRef.current) return;

    const pos = getMousePos(e);
    const DEFAULT_W = 180, DEFAULT_H = 160;
    let x = pos.x - DEFAULT_W / 2, y = pos.y - DEFAULT_H / 2;

    const bounds = boardRef.current.getBoundingClientRect();
    const maxX = Math.max(0, bounds.width - DEFAULT_W);
    const maxY = Math.max(0, bounds.height - DEFAULT_H);
    x = Math.max(0, Math.min(x, maxX));
    y = Math.max(0, Math.min(y, maxY));

    const id = `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const color = stickyColorRef.current || "#FFEB3B";
    setNotes((prev) => [...prev, { id, x, y, w: DEFAULT_W, h: DEFAULT_H, color, text: "" }]);
    setFocusNoteId(id);

    toolRef.current = null;
    if (typeof window !== "undefined") {
      window.__WB_TOOL__ = null;
      window.dispatchEvent(new CustomEvent("wb:select-tool", { detail: { tool: null } }));
      window.dispatchEvent(new CustomEvent("wb:toggle-erase", { detail: { on: false } }));
    }
  };

  return (
    <div
      ref={boardRef}
      style={{ position: "relative", width: "100%", height: "calc(100vh - 100px)", overflow: "hidden" }}
      onClick={() => setSelectedImageId(null)}
    >
      <canvas
        ref={canvasRef}
        className="whiteboard-canvas"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        onClick={handleCanvasClick}
        style={{ display: "block", width: "100%", height: "100%", zIndex: 1 }}
      />

      {images.map((img) => (
        <ImageObject
          key={img.id}
          {...img}
          isSelected={selectedImageId === img.id}
          onSelect={setSelectedImageId}
          onMove={(_id, pos) => setImages((p) => p.map(i => i.id===_id ? { ...i, ...pos } : i))}
          onResize={(_id, size) => setImages((p) => p.map(i => i.id===_id ? { ...i, ...size } : i))}
          onRotate={(_id, rotation) => setImages((p) => p.map(i => i.id===_id ? { ...i, rotation } : i))}
          onDelete={(_id) => { setImages((p) => p.filter(i => i.id!==_id)); if (selectedImageId===_id) setSelectedImageId(null); }}
          boundsRef={boardRef}
        />
      ))}

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
          onMove={(id, pos) => setNotes((p) => p.map(s => s.id===id ? { ...s, ...pos } : s))}
          onChangeSize={(id, size) => setNotes((p) => p.map(s => s.id===id ? { ...s, ...size } : s))}
          onChangeText={(id, text) => setNotes((p) => p.map(s => s.id===id ? { ...s, text } : s))}
          onRemove={(id) => setNotes((p) => p.filter(s => s.id!==id))}
        />
      ))}
    </div>
  );
}

export default Whiteboard;