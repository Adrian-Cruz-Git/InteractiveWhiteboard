import React, { useEffect, useRef, useState, useMemo } from "react";
import CursorSvg from "./CursorSvg.jsx";
import { useAuth } from "../contexts/useAuth";
import { colors } from "../config.js"; // your Ably key

export default function LiveCursors({ canvasRef, client, channel, whiteboardId }) { // get all the ably stuff from whiteboard 

  const whiteboardRef = useRef(null); // optional if you want a separate div
  const [members, setMembers] = useState({}); // Set members of cursor group
  const { currentUser } = useAuth(); // currentUser should have email or username


  const userName = currentUser?.displayName || currentUser?.email || "Anonymous"; // set name on cursor tag to logged in user or default to anon

  // Random cursor colour for each user from config.js
  // Could be improved to be consistent for each user by hashing userId to a number and using that to pick a color
  // But this is simpler for now
  const userColor = useMemo(
    () => colors[Math.floor(Math.random() * colors.length)].cursorColor,
    []
  );



  // Publish own cursor (with throttling)
  useEffect(() => {
    if (!canvasRef.current) return;
    let lastSent = 0;
    const interval = 50; // ms between updates- ably limited to 50 every second - currently 20 updates a second

    const handleMouseMove = (e) => { // Publish cursor update on mouse movement
      const now = Date.now(); // get date for now
      if (now - lastSent < interval) return; // if havent been 50ms since last update, dont update
      lastSent = now; // if it has, send channel update, and update the last sent time to now
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      //console.log("Publishing cursor update:", { x, y, name: userName }); // DEBUG PRINT REMOVE IN PRODUCTION

      channel.publish("cursor-update", {
        clientId: client.auth.clientId,
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

    const canvas = canvasRef.current; // add reference to current canvas
    canvas.addEventListener("mousemove", handleMouseMove); // add listener for moving a mouse 
    canvas.addEventListener("mouseleave", handleMouseLeave); // add listener for mouse leave (when mouse goes off the canvas)

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [canvasRef, client, channel, userName, userColor]);

  // Subscribe to other cursors
  useEffect(() => {
    const callback = (msg) => {
      //console.log("Received cursor update:", msg.data); // DEBUG PRINT REMOVE IN PRODUCTION
      const { clientId, state } = msg.data; //  use ably payload as is

      // console.log("Local clientId:", client.auth.clientId); // DEBUG PRINT REMOVE IN PRODUCTION
      // console.log("Received clientId:", clientId);
      if (!clientId) return; // ignore malformed events

      setMembers((prev) => {
        const updated = { ...prev };
        if (state === "leave") delete updated[clientId];
        else updated[clientId] = { ...msg.data };
        return updated;
      });
    };


    channel.subscribe("cursor-update", callback);
    return () => channel.unsubscribe("cursor-update", callback);
  }, [channel]);

  return (
    <>
      {Object.values(members)
        .filter((m) => m.clientId !== client.auth.clientId) // dont display your own cursor
        .map((m) => (
          <div
            key={m.clientId}
            style={{
              position: "absolute",
              left: m.x,
              top: m.y,
              pointerEvents: "none",
              maxWidth: 100, // width of cursor name tag
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
