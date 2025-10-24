import React, { useState, useEffect } from "react";
import StickyNote from "../StickyNote";
import { useView } from "../ViewContext";

export default function StickyNotesLayer({ activeTool, setActiveTool, boardRef, notes, focusNoteId, setFocusNoteId, addNote, removeNote, moveNote, resizeNote, typeNote }) {
    const [stickyColor, setStickyColor] = useState("#FFEB3B");
    const [draggingNote, setDraggingNote] = useState(false);
    const { view } = useView();// new view context for zooming and panning

    // listen for color picker
    useEffect(() => {
        const handler = (e) => setStickyColor(e.detail.color);
        window.addEventListener("wb:sticky-select-color", handler);
        return () => window.removeEventListener("wb:sticky-select-color", handler);
    }, []);

    const handleMoveNote = (id, pos) => {
        setDraggingNote(true);
        moveNote(id, pos);
    };

    const handleMouseUpBoard = () => {
        setTimeout(() => setDraggingNote(false), 50);
    };

    const handleBoardClick = async (e) => {
        if (draggingNote) return;
        if (activeTool !== "sticky") return;

        const rect = boardRef.current.getBoundingClientRect();
        const x = boardRef.current.scrollLeft + (e.clientX - rect.left);
        const y = boardRef.current.scrollTop + (e.clientY - rect.top);

        // Convert to world space
        const worldX = (clientX - view.offsetX) / view.scale;
        const worldY = (clientY - view.offsetY) / view.scale;

        const DEFAULT_W = 180;
        const DEFAULT_H = 160;

        const newNote = {
            x: worldX - DEFAULT_W / 2,
            y: worldY - DEFAULT_H / 2,
            w: DEFAULT_W,
            h: DEFAULT_H,
            color: stickyColor,
            text: "",
        };

        try {
            const saved = await addNote(newNote);
            if (saved?.id) setFocusNoteId(saved.id);
        } finally {
            // switch back to pen no matter what
            setActiveTool?.("pen");
            // keep Toolbar in sync too 
            window.__WB_TOOL__ = "pen";
            window.dispatchEvent(new CustomEvent("wb:select-tool", { detail: { tool: "pen" } }));
        }
    };

    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: activeTool === "sticky" ? "auto" : "none",
            }}
            onMouseDown={handleBoardClick}
            onMouseUp={handleMouseUpBoard}
        >
            {notes.map((note) => {
                // Compute transformed position and size based on view state
                //new global view model
                const screenX = note.x * view.scale + view.offsetX;
                const screenY = note.y * view.scale + view.offsetY;

                return (
                    <div
                        key={note.id}
                        style={{
                            position: "absolute",
                            transform: `translate(${screenX}px, ${screenY}px)`,
                            width: note.w * view.scale,
                            height: note.h * view.scale,
                            transformOrigin: "0 0",
                            // Optional: keep text readable even when zoomed
                            fontSize: `${14 * (1 / view.scale)}px`,
                        }}
                    >
                        <StickyNote
                            id={note.id}
                            color={note.color}
                            text={note.text}
                            autoFocus={focusNoteId === note.id}
                            onMove={handleMoveNote}
                            onChangeSize={resizeNote}
                            onChangeText={typeNote}
                            onRemove={removeNote}
                        />
                    </div>
                );
            })}
        </div>
    );
}