import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../config/supabase";

export function useStrokes(fileId, onUndoRedo, onChange) {
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

    return { undoStack, redoStack, addStroke, undo, redo, setUndoStack };
}
