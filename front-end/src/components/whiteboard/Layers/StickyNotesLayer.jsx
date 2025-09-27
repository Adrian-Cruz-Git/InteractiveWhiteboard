// StickyNotesLayer.jsx
import React, { useState, useEffect } from "react";
import StickyNote from "../StickyNote";
import { useStickyNotes } from "../hooks/useStickyNotes";

// Layer that manages and renders sticky notes on the whiteboard
export default function StickyNotesLayer({ activeTool, boardRef, fileId, notes, setNotes, focusNoteId, setFocusNoteId, addNote, removeNote, moveNote, resizeNote, typeNote }) {

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
        const saved = await addNote(newNote);
        if (saved?.id) {
            setFocusNoteId(saved.id);
        }
    };

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                pointerEvents: activeTool === "sticky" ? "auto" : "none",
            }}
            onClick={handleBoardClick}
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
