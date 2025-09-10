import React, { useEffect, useRef, useState, useMemo } from "react";
import { Realtime } from "ably";
import { nanoid } from "nanoid";
import CursorSvg from "./CursorSvg.jsx";
import { config, mockNames, colors } from "../config.js"; // must export these

export default function LiveCursors({ canvasRef }) {
  const whiteboardRef = useRef(null); // optional if you want a separate div
  const [members, setMembers] = useState({});

  const whiteboardId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") || "default";
  }, []);

  const userName = useMemo(
    () => mockNames[Math.floor(Math.random() * mockNames.length)],
    []
  );
  const userColor = useMemo(
    () => colors[Math.floor(Math.random() * colors.length)].cursorColor,
    []
  );

  const client = useMemo(
    () => new Realtime({ key: config.ABLY_KEY, clientId: nanoid() }),
    []
  );
  const channel = useMemo(
    () => client.channels.get(`whiteboard-cursors-${whiteboardId}`),
    [client, whiteboardId]
  );
  console.log("Ably channel name:", channel.name);

  // Publish own cursor
  useEffect(() => {
    if (!canvasRef.current) return;

    const handleMouseMove = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      console.log("Publishing cursor update:", { x, y, name: userName });

      channel.publish("cursor-update", {
        clientId: client.clientId,
        x,
        y,
        name: userName,
        color: userColor,
        state: "move",
      });
    };

    const handleMouseLeave = () => {
      channel.publish("cursor-update", {
        clientId: client.clientId,
        state: "leave",
      });
    };

    const canvas = canvasRef.current;
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [canvasRef, client, channel, userName, userColor]);

  // Subscribe to other cursors
  useEffect(() => {
    const callback = (msg) => {
      console.log("Received cursor update:", msg.data);
      setMembers((prev) => {
        const updated = { ...prev };
        if (msg.data.state === "leave") delete updated[msg.data.clientId];
        else updated[msg.data.clientId] = msg.data;
        return updated;
      });
    };

    channel.subscribe("cursor-update", callback);
    return () => channel.unsubscribe("cursor-update", callback);
  }, [channel]);

  return (
    <>
      {Object.values(members).map((m) => (
        <div
          key={m.clientId}
          style={{
            position: "absolute",
            left: m.x,
            top: m.y,
            pointerEvents: "none",
          }}
        >
          <CursorSvg cursorColor={m.color} />
          <div
            style={{
              backgroundColor: m.color,
              color: "white",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "12px",
              position: "relative",
              top: "-20px",
              left: "8px",
              whiteSpace: "nowrap",
            }}
          >
            {m.name}
          </div>
        </div>
      ))}
    </>
  );
}
