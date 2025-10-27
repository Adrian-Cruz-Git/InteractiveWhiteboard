import React, { useState, useRef, useEffect } from "react";

export default function TextLayer({
    activeTool,
    setActiveTool,
    boardRef,
    texts,
    setTexts,
}) {
    const [dragging, setDragging] = useState(false);
    const justPlacedRef = useRef(false); // track if we just placed a new text box
    const resizingRef = useRef(null); // track which text is being resized

    //Text state management functions
    const addText = (newText) => setTexts((prev) => [...prev, newText]); // add new text box
    const updateText = (id, text) => // update text content
        setTexts((prev) => prev.map((t) => (t.id === id ? { ...t, text } : t)));
    const updateSize = (id, w, h) => // rezise text box
        setTexts((prev) => prev.map((t) => (t.id === id ? { ...t, w, h } : t)));
    const removeText = (id) => setTexts((prev) => prev.filter((t) => t.id !== id)); // remove text box

    // handle new text placement
    const handleBoardClick = (e) => {
        if (dragging || activeTool !== "text") return;

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
        setActiveTool("edit"); // after placing, switch to edit mode (default mode)
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

    // Resize Logic 
    const handleMouseDownResize = (e, id) => {  // when mouse click , start resizing
        e.stopPropagation();
        e.preventDefault();
        resizingRef.current = { id, startX: e.clientX, startY: e.clientY };

        const target = texts.find((t) => t.id === id);
        resizingRef.current.startW = target.w;
        resizingRef.current.startH = target.h;

        window.addEventListener("mousemove", handleMouseMoveResize);
        window.addEventListener("mouseup", handleMouseUpResize);
    };

    const handleMouseMoveResize = (e) => {  // called by mousemove event (mousedown starts it) , resize box
        if (!resizingRef.current) return;

        const { id, startX, startY, startW, startH } = resizingRef.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        const newW = Math.max(60, startW + dx);
        const newH = Math.max(40, startH + dy);

        updateSize(id, newW, newH);
    };

    const handleMouseUpResize = () => { // stop resizing
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
                    style={{
                        position: "absolute",
                        left: `${t.x}px`,
                        top: `${t.y}px`,
                        width: `${t.w}px`,
                        height: `${t.h}px`,
                        border: "1px dashed #ccc",
                        background: "white",
                        fontSize: "14px",
                        zIndex: 50,
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
                            cursor:
                                activeTool === "edit" ||
                                    activeTool === "" ||
                                    activeTool == null
                                    ? "text"
                                    : "default",
                            whiteSpace: "pre-wrap",
                            wordWrap: "break-word",
                            overflow: "auto",
                            background: "transparent",
                            color: "black",
                            fontFamily: "sans-serif",
                        }}
                        ref={(el) => {
                            {/* Only set text if it is different from original text*/}
                            if (el && el.textContent !== t.text && !document.activeElement.isSameNode(el)){
                                // Only set text if not currently being edited
                                el.textContent = t.text;
                            }
                        }}
                        onBlur={(e) => updateText(t.id, e.target.textContent)}
                    />
                    {/* Resize Handle */}
                    {activeTool === "edit" && (
                        <div
                            onMouseDown={(e) => handleMouseDownResize(e, t.id)}
                            style={{
                                position: "absolute",
                                bottom: "-4px",
                                right: "-4px",
                                width: "10px",
                                height: "10px",
                                background: "rgba(0,0,0,0.5)",
                                borderRadius: "2px",
                                cursor: "nwse-resize",
                            }}
                        />
                    )}
                    {/* Delete Button */}
                    {activeTool === "edit" && (
                        <button
                            onClick={() => removeText(t.id)}
                            style={{
                                position: "absolute",
                                top: "-8px",
                                right: "-8px",
                                fontSize: "10px",
                                border: "none",
                                background: "red",
                                color: "white",
                                borderRadius: "50%",
                                width: "16px",
                                height: "16px",
                                cursor: "pointer",
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
