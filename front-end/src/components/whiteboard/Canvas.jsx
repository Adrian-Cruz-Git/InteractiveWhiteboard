import React, { useEffect, useRef } from "react";

function Canvas({ canvasRef, activeTool, strokes, onStrokeComplete }) {
  const currentStroke = useRef([]);
  const highlighterColorRef = useRef('#FFEB3B');
  const offscreenHighlighter = useRef(null);

  useEffect(() => {
    const onHighlighterSelectColor = (e) => {
      highlighterColorRef.current = e.detail.color;
      console.log('[Canvas] highlighter color changed to:', e.detail.color);
    };

    window.addEventListener('wb:highlighter-select-color', onHighlighterSelectColor);

    return () => {
      window.removeEventListener('wb:highlighter-select-color', onHighlighterSelectColor);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Fixed large working area; no compositing/replay of strokes
    canvas.width = 5000;
    canvas.height = 5000;

    if (!offscreenHighlighter.current) {
      offscreenHighlighter.current = document.createElement('canvas');
      offscreenHighlighter.current.width = 5000;
      offscreenHighlighter.current.height = 5000;
    }
  }, [canvasRef]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    if (e.touches && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    if (activeTool !== "pen" && activeTool !== "eraser" && activeTool !== "highlighter") return;
    const start = getPos(e);
    currentStroke.current = [start];
    canvasRef.current.isDrawing = true;

    let ctx;
    if (activeTool === "highlighter") {
      ctx = offscreenHighlighter.current.getContext("2d");
    } else {
      ctx = canvasRef.current.getContext("2d");
    }
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    if (activeTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 20;
      ctx.strokeStyle = "black";
      ctx.globalAlpha = 1.0;
    } else if (activeTool === "highlighter") {
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = 20; // thicker than pen
      ctx.strokeStyle = highlighterColorRef.current;
      ctx.globalAlpha = 0.1; // 10% opacity
    } else { // pen
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = 2;
      ctx.strokeStyle = "black";
      ctx.globalAlpha = 1.0;
    }

    // Open a single path for the whole stroke
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
  };

  const draw = (e) => {
    if (!canvasRef.current.isDrawing) return;

    const pos = getPos(e);
    let ctx;
    if (activeTool === "highlighter") {
      ctx = offscreenHighlighter.current.getContext("2d");
    } else {
      ctx = canvasRef.current.getContext("2d");
    }

    // Single continuous path for pen, highlighter, and eraser
    if (activeTool === "pen") {
      const last = currentStroke.current[currentStroke.current.length - 1];
      const midX = (last.x + pos.x) / 2;
      const midY = (last.y + pos.y) / 2;
      ctx.quadraticCurveTo(last.x, last.y, midX, midY);
      ctx.stroke();
    } else {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }

    if (activeTool === "highlighter") {
      const ctxMain = canvasRef.current.getContext("2d");
      ctxMain.globalCompositeOperation = "destination-over";
      ctxMain.drawImage(offscreenHighlighter.current, 0, 0);
      ctxMain.globalCompositeOperation = "source-over";
    }

    currentStroke.current.push(pos);
  };

  const endDrawing = () => {
    if (!canvasRef.current.isDrawing) return;
    canvasRef.current.isDrawing = false;

    if (currentStroke.current.length > 1) {
      onStrokeComplete({
        points: currentStroke.current,
        erase: activeTool === "eraser",
        tool: activeTool,
        color: activeTool === "highlighter" ? highlighterColorRef.current : "#000000",
      });
    }

    currentStroke.current = [];
    let ctx;
    if (activeTool === "highlighter") {
      ctx = offscreenHighlighter.current.getContext("2d");
    } else {
      ctx = canvasRef.current.getContext("2d");
    }
    if (ctx.closePath) ctx.closePath();
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = "source-over";

    if (activeTool === "highlighter") {
      const ctxMain = canvasRef.current.getContext("2d");
      ctxMain.globalCompositeOperation = "destination-over";
      ctxMain.drawImage(offscreenHighlighter.current, 0, 0);
      ctxMain.globalCompositeOperation = "source-over";
      // Removed clearing of highlighter canvas to preserve previous marks
    }
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        backgroundColor: "white",
        display: "block",
        position: "absolute",
        top: 0,
        left: 0,
      }}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={endDrawing}
      onMouseLeave={endDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={endDrawing}
    />
  );
}

export default Canvas;