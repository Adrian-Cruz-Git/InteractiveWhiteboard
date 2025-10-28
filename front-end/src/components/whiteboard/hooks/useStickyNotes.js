import { useState, useEffect } from "react";
import { api } from "../../../config/api";


export function useStickyNotes(fileId, client, whiteboardId) {
  const [notes, setNotes] = useState([]);
  const [focusNoteId, setFocusNoteId] = useState(null);

  const loadNotes = async (forceClear = false) => {
    if (!fileId) return;
    if (forceClear) setNotes([]);
    try {
      const data = await api(`/sticky-notes?fileId=${encodeURIComponent(fileId)}`);
      setNotes(data || []);
    } catch (e) {
      console.error("Error loading sticky notes:", e.message);
    }
  };

  useEffect(() => { loadNotes(true); }, [fileId]);

  //Ably subscriptions for real-time sticky note updates
  useEffect(() => {
    if (!client || !whiteboardId) return;

    const channel = client.channels.get(`whiteboard-objects-${whiteboardId}`);

    const handleAdd = (msg) => {
      if (msg.clientId === client.auth.clientId) return; // ignore self
      setNotes((prev) => [...prev, msg.data.note]);
    };

    const handleRemove = (msg) => {
      if (msg.clientId === client.auth.clientId) return; // ignore self
      setNotes((prev) => prev.filter((n) => n.id !== msg.data.id));
    };

    const handleMove = (msg) => {
      if (msg.clientId === client.auth.clientId) return; // ignore self
      setNotes((prev) =>
        prev.map((n) => (n.id === msg.data.id ? { ...n, x: msg.data.x, y: msg.data.y } : n))
      );
    };
    const handleResize = (msg) => {
      if (msg.clientId === client.auth.clientId) return; // ignore self}
      setNotes((prev) =>
        prev.map((n) =>
          n.id === msg.data.id ? { ...n, width: msg.data.width, height: msg.data.height } : n
        )
      );
    }
    const handleType = (msg) => {
      if (msg.clientId === client.auth.clientId) return; // ignore self
      setNotes((prev) =>
        prev.map((n) => (n.id === msg.data.id ? { ...n, text: msg.data.text } : n))
      );
    }
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


  const addNote = async (note) => {
    const toInsert = { ...note, file_id: fileId };
    const created = await api(`/sticky-notes`, { method: "POST", body: toInsert });
    setNotes((prev) => [...prev, created]);

    //Ably publish add note event
    const channel = client?.channels.get(`whiteboard-objects-${whiteboardId}`);
    channel?.publish("note-add", { note: created });

    return created;
  };

  const removeNote = async (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await api(`/sticky-notes/${id}`, { method: "DELETE" });
      //Ably publish remove note event
      const channel = client?.channels.get(`whiteboard-objects-${whiteboardId}`);
      channel?.publish("note-remove", { id });
    } catch (e) {
      console.error("Error deleting sticky note:", e.message);
    }
  };

  const moveNote = async (id, { x, y }) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
    try {
      await api(`/sticky-notes/${id}`, { method: "PATCH", body: { x, y } });
      //Ably publish move note event
      const channel = client?.channels.get(`whiteboard-objects-${whiteboardId}`);
      channel?.publish("note-move", { id, x, y });
    } catch (e) {
      console.error("Error moving sticky note:", e.message);
    }
  };

  const resizeNote = async (id, { width, height }) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, width, height } : n)));
    try {
      await api(`/sticky-notes/${id}`, { method: "PATCH", body: { width, height } });
      //Ably publish resize note event
      const channel = client?.channels.get(`whiteboard-objects-${whiteboardId}`);
      channel?.publish("note-resize", { id, width, height });
    } catch (e) {
      console.error("Error resizing sticky note:", e.message);
    }
  };

  const typeNote = async (id, text) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)));
    try {
      await api(`/sticky-notes/${id}`, { method: "PATCH", body: { text } });
      //Ably publish type note event
      const channel = client?.channels.get(`whiteboard-objects-${whiteboardId}`);
      channel?.publish("note-type", { id, text });
    } catch (e) {
      console.error("Error typing sticky note:", e.message);
    }
  };

  return { notes, setNotes, focusNoteId, setFocusNoteId, loadNotes, addNote, removeNote, moveNote, resizeNote, typeNote };
}
