import React, { useEffect, useRef } from "react";

function Canvas({ canvasRef, activeTool, strokes, onStrokeComplete }) {
  const currentStroke = useRef([]);

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

        if (!points || points.length < 2) return;

        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.globalCompositeOperation = isErase ? "destination-out" : "source-over";
        ctx.lineWidth = isErase ? 20 : 2;
        ctx.strokeStyle = "black";

        for (let i = 1; i < points.length; i++) {
          const from = points[i - 1];
          const to = points[i];
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
        }

        ctx.globalCompositeOperation = "source-over";
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
    if (activeTool !== "pen" && activeTool !== "eraser") return;
    currentStroke.current = [getPos(e)];
    canvasRef.current.isDrawing = true;
  };

  const draw = (e) => {
    if (!canvasRef.current.isDrawing) return;
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    const lastPos = currentStroke.current[currentStroke.current.length - 1];

    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    if (activeTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 20;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = 2;
      ctx.strokeStyle = "black";
    }

    if (lastPos) {
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
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
