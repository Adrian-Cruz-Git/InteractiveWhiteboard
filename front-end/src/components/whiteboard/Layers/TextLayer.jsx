import React, { useState, useRef, useEffect } from "react";
import { useView } from "../ViewContext";

// TextLayer component for managing and rendering text boxes on the whiteboard
// Props:
// - activeTool: current selected tool (e.g., "text", "edit")
// - setActiveTool: function to change the active tool
// - boardRef: reference to the whiteboard DOM element
// - texts: array of text box objects {id, x, y, w, h, text}
// - setTexts: function to update the texts array

// Each text box can be added, edited, moved, resized, or deleted
// Text boxes are positioned and scaled according to the current view (zoom/pan)

export default function TextLayer({
    activeTool,
    setActiveTool,
    boardRef,
    texts,
    setTexts,
}) {
    const { view } = useView();
    const justPlacedRef = useRef(false);
    const resizingRef = useRef(null);
    const draggingRef = useRef(null); // track which text is being dragged

    //Text state management functions
    const addText = (newText) => setTexts((prev) => [...prev, newText]);
    const updateText = (id, text) =>
        setTexts((prev) => prev.map((t) => (t.id === id ? { ...t, text } : t)));
    const updateSize = (id, w, h) =>
        setTexts((prev) => prev.map((t) => (t.id === id ? { ...t, w, h } : t)));
    const updatePosition = (id, x, y) =>
        setTexts((prev) => prev.map((t) => (t.id === id ? { ...t, x, y } : t)));
    const removeText = (id) => setTexts((prev) => prev.filter((t) => t.id !== id));

    // handle new text placement
    const handleBoardClick = (e) => {
        if (draggingRef.current || resizingRef.current || activeTool !== "text") return;

        const rect = boardRef.current.getBoundingClientRect();
        //  Convert screen to world coords
        const worldX = (e.clientX - rect.left - view.offsetX) / view.scale;
        const worldY = (e.clientY - rect.top - view.offsetY) / view.scale;


        const newText = {
            id: crypto.randomUUID(),
            x: worldX,
            y: worldY,
            w: 180,
            h: 60,
            text: "Type here",
        };

        addText(newText);
        justPlacedRef.current = true;
        setActiveTool("edit");
    };

    // auto focus newly added box
    useEffect(() => {
        if (!justPlacedRef.current) return;
        justPlacedRef.current = false;

        setTimeout(() => {
            const lastEditable = document.querySelector(".wb-text-editable:last-of-type");
            if (lastEditable) {
                lastEditable.focus();
                const range = document.createRange();
                range.selectNodeContents(lastEditable);
                range.collapse(false);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }, 50);
    }, [texts]);

    // Drag Logic
    const handleMouseDownDrag = (e, id) => {
        // Don't drag if clicking inside the text
        if (e.target.classList.contains('wb-text-editable')) {
            return;
        }

        e.stopPropagation();
        e.preventDefault();

        const target = texts.find((t) => t.id === id);
        draggingRef.current = {
            id,
            startX: e.clientX,
            startY: e.clientY,
            startPosX: target.x,
            startPosY: target.y,
        };

        window.addEventListener("mousemove", handleMouseMoveDrag);
        window.addEventListener("mouseup", handleMouseUpDrag);
    };

    const handleMouseMoveDrag = (e) => {
        if (!draggingRef.current) return;

        const { id, startX, startY, startPosX, startPosY } = draggingRef.current;
        // Convert delta into world-space movement
        const dx = (e.clientX - startX) / view.scale;
        const dy = (e.clientY - startY) / view.scale;
        ;

        updatePosition(id, startPosX + dx, startPosY + dy);
    };

    const handleMouseUpDrag = () => {
        draggingRef.current = null;
        window.removeEventListener("mousemove", handleMouseMoveDrag);
        window.removeEventListener("mouseup", handleMouseUpDrag);
    };

    // Resize Logic
    const handleMouseDownResize = (e, id) => {
        e.stopPropagation();
        e.preventDefault();

        const target = texts.find((t) => t.id === id);
        resizingRef.current = {
            id,
            startX: e.clientX,
            startY: e.clientY,
            startW: target.w,
            startH: target.h,
        };

        window.addEventListener("mousemove", handleMouseMoveResize);
        window.addEventListener("mouseup", handleMouseUpResize);
    };

    const handleMouseMoveResize = (e) => {
        if (!resizingRef.current) return;

        const { id, startX, startY, startW, startH } = resizingRef.current;
        //World coords resize
        const dx = (e.clientX - startX) / view.scale;
        const dy = (e.clientY - startY) / view.scale;

        const newW = Math.max(60 / view.scale, startW + dx);
        const newH = Math.max(40 / view.scale, startH + dy);

        updateSize(id, newW, newH);
    };

    const handleMouseUpResize = () => {
        resizingRef.current = null;
        window.removeEventListener("mousemove", handleMouseMoveResize);
        window.removeEventListener("mouseup", handleMouseUpResize);
    };

    return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents:
          activeTool === "text" || activeTool === "edit" ? "auto" : "none",
        zIndex: 50,
      }}
      onMouseDown={handleBoardClick}
    >
      {texts.map((t) => {
        const screenX = t.x * view.scale + view.offsetX;
        const screenY = t.y * view.scale + view.offsetY;

        return (
          <div
            key={t.id}
            onMouseDown={(e) =>
              activeTool === "edit" && handleMouseDownDrag(e, t.id)
            }
            style={{
              position: "absolute",
              transform: `translate(${screenX}px, ${screenY}px) scale(${view.scale})`,
              width: t.w,
              height: t.h,
              transformOrigin: "0 0",
              border: activeTool === "edit" ? "2px solid #2196F3" : "none",
              background: "transparent",
              fontSize: "16px",
              cursor: activeTool === "edit" ? "move" : "default",
            }}
          >
            <div
              className="wb-text-editable"
              contentEditable={
                activeTool === "edit" || activeTool === "" || activeTool == null
              }
              suppressContentEditableWarning
              style={{
                width: "100%",
                height: "100%",
                outline: "none",
                padding: "4px",
                cursor: "text",
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                background: "transparent",
                color: "#000",
                fontFamily:
                  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                lineHeight: "1.4",
              }}
              ref={(el) => {
                if (
                  el &&
                  el.textContent !== t.text &&
                  !document.activeElement.isSameNode(el)
                ) {
                  el.textContent = t.text;
                }
              }}
              onBlur={(e) => updateText(t.id, e.target.textContent)}
              onMouseDown={(e) => e.stopPropagation()}
            />

            {activeTool === "edit" && (
              <>
                <div
                  className="resize-handle"
                  onMouseDown={(e) => handleMouseDownResize(e, t.id)}
                  style={{
                    position: "absolute",
                    bottom: "-5px",
                    right: "-5px",
                    width: "12px",
                    height: "12px",
                    background: "#2196F3",
                    border: "2px solid white",
                    borderRadius: "50%",
                    cursor: "nwse-resize",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }}
                />
                <button
                  className="delete-button"
                  onClick={() => removeText(t.id)}
                  style={{
                    position: "absolute",
                    top: "-10px",
                    right: "-10px",
                    fontSize: "14px",
                    border: "2px solid white",
                    background: "#f44336",
                    color: "white",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    fontWeight: "bold",
                    lineHeight: "1",
                  }}
                >
                  ×
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}