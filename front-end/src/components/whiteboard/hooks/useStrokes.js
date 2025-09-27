import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../config/supabase";

export function useStrokes(fileId, onUndoRedo, onChange, loadNotes, setNotes) {
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const [loaded, setLoaded] = useState(false);

    // Fetch strokes
    useEffect(() => {
        const fetchStrokes = async () => {
            if (!fileId) return;
            const { data, error } = await supabase
                .from("whiteboards")
                .select("content")
                .eq("file_id", fileId)
                .single();

            if (!error && data) {
                console.log("Loaded strokes:", data.content);
                setUndoStack(data.content || []);
                setRedoStack([]);
            }
            setLoaded(true);
        };
        fetchStrokes();
    }, [fileId]);

    // Save strokes
    useEffect(() => {
        if (!fileId || !loaded) return;
        const saveStrokes = async () => {
            if (!fileId) return;
            await supabase
                .from("whiteboards")
                .upsert(
                    { file_id: fileId, content: undoStack },
                    { onConflict: "file_id" }
                );
        };
        saveStrokes();
        onChange && onChange(undoStack);
    }, [undoStack, fileId, onChange, loaded]);

    const addStroke = useCallback((stroke) => {
        setUndoStack((prev) => [...prev, stroke]);
        setRedoStack([]);
    }, []);

    const undo = useCallback(() => {
        setUndoStack((prev) => {
            if (!prev.length) return prev;
            const last = prev[prev.length - 1];
            setRedoStack((r) => [...r, last]);
            return prev.slice(0, -1);
        });
    }, []);

    const redo = useCallback(() => {
        setRedoStack((prev) => {
            if (!prev.length) return prev;
            const last = prev[prev.length - 1];
            setUndoStack((u) => [...u, last]);
            return prev.slice(0, -1);
        });
    }, []);

    const clear = useCallback(async () => {
        // local clear
        setUndoStack([]);
        setRedoStack([]);
        if (typeof onChange === "function") onChange([]);

        if (typeof setNotes === "function") {
            setNotes([]); // 🔥 wipe notes instantly
        }

        if (fileId) {
            const { error: strokesError } = await supabase
                .from("whiteboards")
                .update({ content: [] })
                .eq("file_id", fileId);
            if (strokesError) {
                console.error("Error clearing strokes:", strokesError.message);
            }

            const { error: stickynoteError } = await supabase
                .from("sticky_notes")
                .delete()
                .eq("file_id", fileId);
            if (stickynoteError) {
                console.error("Error clearing sticky notes:", stickynoteError.message);
            }
        }
    }, [fileId, onChange, setNotes, loadNotes]);

    return { undoStack, redoStack, addStroke, undo, redo, setUndoStack, clear };
}
