import React, { useEffect, useRef } from "react";

function Canvas({ canvasRef, activeTool, strokes, onStrokeComplete }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    //  canvas size
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

  // Center the user in the middle of canvas
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;

    // scrolls to center
    container.scrollLeft = (canvas.width - container.clientWidth) / 2;
    container.scrollTop = (canvas.height - container.clientHeight) / 2;
  }, [canvasRef]);

  // mouse shit
  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  let currentStroke = [];

  // --- Drawing logic ---
  const startDrawing = (e) => {
    if (activeTool !== "pen" && activeTool !== "eraser") return;
    currentStroke = [getMousePos(e)];
    canvasRef.current.isDrawing = true;
  };

  const draw = (e) => {
    if (!canvasRef.current.isDrawing) return;
    const pos = getMousePos(e);
    const ctx = canvasRef.current.getContext("2d");
    const lastPos = currentStroke[currentStroke.length - 1];

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

    currentStroke.push(pos);
  };

  const endDrawing = () => {
    if (!canvasRef.current.isDrawing) return;
    canvasRef.current.isDrawing = false;

    if (currentStroke.length > 1) {
      onStrokeComplete({
        points: currentStroke,
        erase: activeTool === "eraser",
      });
    }

    currentStroke = [];
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "scroll",
        border: "1px solid #ccc",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          backgroundColor: "white",
          display: "block",
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
      />
    </div>
  );
}

export default Canvas;
