import React, { useEffect, useRef } from "react";

function Canvas({ canvasRef, activeTool, strokes, onStrokeComplete }) {
  const currentStroke = useRef([]);
  const highlighterColorRef = useRef('#FFEB3B');

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

    canvas.width = 5000;
    canvas.height = 5000;
    const ctx = canvas.getContext("2d");

    const redraw = () => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      if (!Array.isArray(strokes)) return;

      strokes.forEach((stroke) => {
        const points = stroke.points || stroke;
        const isErase = stroke.erase;
        const isHighlighter = stroke.tool === 'highlighter';
        const highlighterColor = stroke.color || '#FFEB3B';

        if (!points || points.length < 2) return;

        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        if (isErase) {
          ctx.globalCompositeOperation = "destination-out";
          ctx.lineWidth = 20;
          ctx.strokeStyle = "black";
        } else if (isHighlighter) {
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 0.35;
          ctx.lineWidth = 25;
          ctx.strokeStyle = highlighterColor;
        } else {
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 1.0;
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

        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1.0;
      });
    };

    redraw();
  }, [strokes, canvasRef]);

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
    currentStroke.current = [getPos(e)];
    canvasRef.current.isDrawing = true;
  };

  const draw = (e) => {
    if (!canvasRef.current.isDrawing) return;
    const pos = getPos(e);
    currentStroke.current.push(pos);

    const ctx = canvasRef.current.getContext("2d");
    
    // Set up the drawing style
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    if (activeTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 20;
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else if (activeTool === "highlighter") {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 25;
      ctx.strokeStyle = highlighterColorRef.current;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1.0;
      ctx.lineWidth = 2;
      ctx.strokeStyle = "black";
    }

    // Redraw the entire current stroke smoothly
    if (currentStroke.current.length > 1) {
      // Clear and redraw everything to avoid overlapping opacity issues
      const canvas = canvasRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Redraw all completed strokes
      redrawCompletedStrokes();
      
      // Draw the current stroke
      ctx.beginPath();
      ctx.moveTo(currentStroke.current[0].x, currentStroke.current[0].y);
      
      for (let i = 1; i < currentStroke.current.length; i++) {
        ctx.lineTo(currentStroke.current[i].x, currentStroke.current[i].y);
      }
      
      ctx.stroke();
    }

    ctx.globalAlpha = 1.0;
  };

  const redrawCompletedStrokes = () => {
    const ctx = canvasRef.current.getContext("2d");
    if (!Array.isArray(strokes)) return;

    strokes.forEach((stroke) => {
      const points = stroke.points || stroke;
      const isErase = stroke.erase;
      const isHighlighter = stroke.tool === 'highlighter';
      const highlighterColor = stroke.color || '#FFEB3B';

      if (!points || points.length < 2) return;

      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      if (isErase) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = 20;
        ctx.strokeStyle = "rgba(0,0,0,1)";
      } else if (isHighlighter) {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 25;
        ctx.strokeStyle = highlighterColor;
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = 2;
        ctx.strokeStyle = "black";
      }

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1.0;
    });
  };

  const endDrawing = () => {
    if (!canvasRef.current.isDrawing) return;
    canvasRef.current.isDrawing = false;

    if (currentStroke.current.length > 1) {
      onStrokeComplete({
        points: currentStroke.current,
        erase: activeTool === "eraser",
        tool: activeTool === "highlighter" ? "highlighter" : "pen",
        color: activeTool === "highlighter" ? highlighterColorRef.current : "#000000",
      });
    }

    currentStroke.current = [];
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