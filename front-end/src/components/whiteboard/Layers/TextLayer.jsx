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
        setActiveTool("cursor");
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

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                pointerEvents:
                    activeTool === "text" || activeTool === "cursor" ? "auto" : "none",
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
                            activeTool === "cursor" || activeTool === "" || activeTool == null
                        }
                        suppressContentEditableWarning
                        style={{
                            width: "100%",
                            height: "100%",
                            outline: "none",
                            padding: "4px",
                            cursor:
                                activeTool === "cursor" ||
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
                            if (el && el.textContent !== t.text) {
                                // Only set text if not currently being edited
                                el.textContent = t.text;
                            }
                        }}
                        onBlur={(e) => updateText(t.id, e.target.textContent)}
                    />

                    {activeTool === "cursor" && (
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
