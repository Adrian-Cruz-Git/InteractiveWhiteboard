import React, { useState } from "react";

function CanvasRenderer({ canvasRef, activeTool, onStrokeComplete }) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]);

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    if (activeTool !== "pen" && activeTool !== "eraser") return;
    setIsDrawing(true);
    setCurrentStroke([getMousePos(e)]);
  };

  const draw = (e) => {
    if (!isDrawing) return;
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

    setCurrentStroke([...currentStroke, pos]);
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentStroke.length > 1) {
      const strokeData = {
        points: currentStroke,
        erase: activeTool === "eraser",
      };
      onStrokeComplete(strokeData); // notify parent
    }
    setCurrentStroke([]);
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

export default CanvasRenderer;
