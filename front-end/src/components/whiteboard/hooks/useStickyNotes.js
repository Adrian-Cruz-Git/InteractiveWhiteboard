import { useState, useEffect } from "react";
import { api } from "../../../config/api";

export function useStickyNotes(fileId, client, whiteboardId) {
  const [notes, setNotes] = useState([]);
  const [focusNoteId, setFocusNoteId] = useState(null);

  const loadNotes = async (forceClear = false) => {
    if (!fileId) return;
    if (forceClear) setNotes([]);
    try {
      // Server expects /:fileId (not ?fileId=)
      const data = await api(`/sticky-notes/${encodeURIComponent(fileId)}`);
      setNotes(data || []);
    } catch (e) {
      console.error("Error loading sticky notes:", e?.message || e);
    }
  };

  useEffect(() => {
    loadNotes(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  // ---- Ably subscriptions for real-time sticky note updates ----
  useEffect(() => {
    if (!client || !whiteboardId) return;

    const channel = client.channels.get(`whiteboard-objects-${whiteboardId}`);

    const handleAdd = (msg) => {
      if (msg.clientId === client.auth.clientId) return; // ignore self
      setNotes((prev) => [...prev, msg.data.note]);
    };

    const handleRemove = (msg) => {
      if (msg.clientId === client.auth.clientId) return;
      setNotes((prev) => prev.filter((n) => n.id !== msg.data.id));
    };

    const handleMove = (msg) => {
      if (msg.clientId === client.auth.clientId) return;
      setNotes((prev) =>
        prev.map((n) => (n.id === msg.data.id ? { ...n, x: msg.data.x, y: msg.data.y } : n))
      );
    };

    const handleResize = (msg) => {
      if (msg.clientId === client.auth.clientId) return;
      // Ably payload uses width/height; keep state in width/height for the UI
      setNotes((prev) =>
        prev.map((n) =>
          n.id === msg.data.id ? { ...n, width: msg.data.width, height: msg.data.height } : n
        )
      );
    };

    const handleType = (msg) => {
      if (msg.clientId === client.auth.clientId) return;
      setNotes((prev) => (prev.map((n) => (n.id === msg.data.id ? { ...n, text: msg.data.text } : n))));
    };

    channel.subscribe("note-add", handleAdd);
    channel.subscribe("note-remove", handleRemove);
    channel.subscribe("note-move", handleMove);
    channel.subscribe("note-resize", handleResize);
    channel.subscribe("note-type", handleType);

    return () => {
      channel.unsubscribe("note-add", handleAdd);
      channel.unsubscribe("note-remove", handleRemove);
      channel.unsubscribe("note-move", handleMove);
      channel.unsubscribe("note-resize", handleResize);
      channel.unsubscribe("note-type", handleType);
    };
  }, [client, whiteboardId]);

  // ---- CRUD helpers ----

  const addNote = async (note) => {
    try {
      // Map UI width/height to DB w/h
      const toInsert = {
        file_id: fileId,
        x: note.x,
        y: note.y,
        w: note.width ?? note.w ?? 160,
        h: note.height ?? note.h ?? 120,
        text: note.text ?? "",
        color: note.color ?? "#FFD966",
      };
      const created = await api(`/sticky-notes`, { method: "POST", body: toInsert });
      // keep UI width/height keys in state
      const createdForState = { ...created, width: created.w, height: created.h };
      delete createdForState.w; delete createdForState.h;
      setNotes((prev) => [...prev, createdForState]);

      // Ably
      const channel = client?.channels.get(`whiteboard-objects-${whiteboardId}`);
      channel?.publish("note-add", { note: createdForState });

      return createdForState;
    } catch (e) {
      console.error("Error creating sticky note:", e?.message || e);
      throw e;
    }
  };

  const removeNote = async (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await api(`/sticky-notes/${id}`, { method: "DELETE" });
      const channel = client?.channels.get(`whiteboard-objects-${whiteboardId}`);
      channel?.publish("note-remove", { id });
    } catch (e) {
      console.error("Error deleting sticky note:", e?.message || e);
    }
  };

  const moveNote = async (id, { x, y }) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
    try {

      const body = {};

      if (typeof x === "number") {
        body.x = x;
      }

      if (typeof y === "number") {
        body.y = y;
      }

      if (Object.keys(body).length === 0) {
        return;
      }

      await api(`/sticky-notes/${id}`, { method: "PUT", body });

      const channel = client?.channels.get(`whiteboard-objects-${whiteboardId}`);
      channel?.publish("note-move", { id, x, y });
    } catch (e) {
      console.error("Error moving sticky note:", e?.message || e);
    }
  };

  const resizeNote = async (id, { width, height }) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, width, height } : n)));
    try {
      const body = {};

      if (typeof width === "number") {
        body.w = width;
      } 
      if (typeof height === "number") {
        body.h = height;
      }

      if (Object.keys(body).length === 0) {
        return;
      }

      await api(`/sticky-notes/${id}`, { method: "PUT", body });

      const channel = client?.channels.get(`whiteboard-objects-${whiteboardId}`);
      channel?.publish("note-resize", { id, width, height });
    } catch (e) {
      console.error("Error resizing sticky note:", e?.message || e);
    }
  };

  const typeNote = async (id, text) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)));
    try {
      if (typeof text !== "string") {
        return;
      }

      await api(`/sticky-notes/${id}`, { method: "PUT", body: { text } });

      const channel = client?.channels.get(`whiteboard-objects-${whiteboardId}`);
      channel?.publish("note-type", { id, text });
    } catch (e) {
      console.error("Error typing sticky note:", e?.message || e);
    }
  };

  return {
    notes,
    setNotes,
    focusNoteId,
    setFocusNoteId,
    loadNotes,
    addNote,
    removeNote,
    moveNote,
    resizeNote,
    typeNote,
  };
}
