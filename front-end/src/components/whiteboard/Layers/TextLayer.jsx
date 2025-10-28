import React, { useState, useRef, useEffect } from "react";

export default function TextLayer({
    activeTool,
    setActiveTool,
    boardRef,
    texts,
    setTexts,
}) {
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
        const x = e.clientX - rect.left + boardRef.current.scrollLeft;
        const y = e.clientY - rect.top + boardRef.current.scrollTop;

        const newText = {
            id: crypto.randomUUID(),
            x,
            y,
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
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

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
        resizingRef.current = { id, startX: e.clientX, startY: e.clientY };

        const target = texts.find((t) => t.id === id);
        resizingRef.current.startW = target.w;
        resizingRef.current.startH = target.h;

        window.addEventListener("mousemove", handleMouseMoveResize);
        window.addEventListener("mouseup", handleMouseUpResize);
    };

    const handleMouseMoveResize = (e) => {
        if (!resizingRef.current) return;

        const { id, startX, startY, startW, startH } = resizingRef.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        const newW = Math.max(60, startW + dx);
        const newH = Math.max(40, startH + dy);

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
            {texts.map((t) => (
                <div
                    key={t.id}
                    onMouseDown={(e) => activeTool === "edit" && handleMouseDownDrag(e, t.id)}
                    style={{
                        position: "absolute",
                        left: `${t.x}px`,
                        top: `${t.y}px`,
                        width: `${t.w}px`,
                        height: `${t.h}px`,
                        border: activeTool === "edit" ? "2px solid #2196F3" : "none",
                        background: "transparent",
                        fontSize: "16px",
                        zIndex: 50,
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
                            overflow: "visible",
                            background: "transparent",
                            color: "#000",
                            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                            lineHeight: "1.4",
                        }}
                        ref={(el) => {
                            if (el && el.textContent !== t.text && !document.activeElement.isSameNode(el)){
                                el.textContent = t.text;
                            }
                        }}
                        onBlur={(e) => updateText(t.id, e.target.textContent)}
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                    {/* Resize Handle */}
                    {activeTool === "edit" && (
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
                    )}
                    {/* Delete Button */}
                    {activeTool === "edit" && (
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
                    )}
                </div>
            ))}
        </div>
    );
}