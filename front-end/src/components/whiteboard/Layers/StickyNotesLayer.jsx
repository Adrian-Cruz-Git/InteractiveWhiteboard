import React, { useState, useEffect } from "react";
import StickyNote from "../StickyNote";

export default function StickyNotesLayer({ activeTool, setActiveTool, boardRef, notes, focusNoteId, setFocusNoteId, addNote, removeNote, moveNote, resizeNote, typeNote }) {
    const [stickyColor, setStickyColor] = useState("#FFEB3B");
    const [draggingNote, setDraggingNote] = useState(false);

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

        const DEFAULT_W = 180;
        const DEFAULT_H = 160;

        const newNote = {
            x: x - DEFAULT_W / 2,
            y: y - DEFAULT_H / 2,
            w: DEFAULT_W,
            h: DEFAULT_H,
            color: stickyColor,
            text: "",
        };

        // Save to Supabase, hook will update `notes` state
        try {
            const saved = await addNote(newNote);
            if (saved?.id) setFocusNoteId(saved.id);
        } finally {
            // switch back to pen no matter what
            setActiveTool?.("pen");
            // keep Toolbar in sync too (optional)
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
                width: 5000,
                height: 5000,
                pointerEvents: activeTool === "sticky" ? "auto" : "none",
            }}
            onMouseDown={handleBoardClick}
            onMouseUp={handleMouseUpBoard}
        >
            {notes.map((note) => (
                <StickyNote
                    key={note.id}
                    id={note.id}
                    x={note.x}
                    y={note.y}
                    w={note.w}
                    h={note.h}
                    color={note.color}
                    text={note.text}
                    boundsRef={boardRef}
                    autoFocus={focusNoteId === note.id}
                    onMove={handleMoveNote}
                    onChangeSize={resizeNote}
                    onChangeText={typeNote}
                    onRemove={removeNote}
                />
            ))}
        </div>
    );
}
