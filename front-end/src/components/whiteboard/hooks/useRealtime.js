import { useEffect, useMemo, useState } from "react";
import { Realtime } from "ably";
import { nanoid } from "nanoid";
import { config } from "../../../config";

export function useRealtime(user, whiteboardId, addStroke, handleUndo, handleRedo, clearBoard) {
  const [client, setClient] = useState(null);

  useEffect(() => {
    if (!user) return;
    const ablyClient = new Realtime({ key: config.ABLY_KEY, clientId: user.email || nanoid() });
    setClient(ablyClient);
    return () => ablyClient.close();
  }, [user]);

  const strokesChannel = useMemo(
    () => client?.channels.get(`whiteboard-strokes-${whiteboardId}`),
    [client, whiteboardId]
  );
  const eventsChannel = useMemo(
    () => client?.channels.get(`whiteboard-events-${whiteboardId}`),
    [client, whiteboardId]
  );

  // Subscriptions
  useEffect(() => {
    if (!strokesChannel) return;
    const handler = (msg) => addStroke(msg.data.stroke);
    strokesChannel.subscribe("new-stroke", handler);
    return () => strokesChannel.unsubscribe("new-stroke", handler);
  }, [strokesChannel, addStroke]);

  useEffect(() => {
    if (!eventsChannel) return;
    const handleClear = () => clearBoard();
    const handleUndo = () => handleUndo();
    const handleRedo = () => handleRedo();
    eventsChannel.subscribe("clear", handleClear);
    eventsChannel.subscribe("undo", handleUndo);
    eventsChannel.subscribe("redo", handleRedo);
    return () => {
      eventsChannel.unsubscribe("clear", handleClear);
      eventsChannel.unsubscribe("undo", handleUndo);
      eventsChannel.unsubscribe("redo", handleRedo);
    };
  }, [eventsChannel, handleUndo, handleRedo, clearBoard]);

  return { client, strokesChannel, eventsChannel };
}
