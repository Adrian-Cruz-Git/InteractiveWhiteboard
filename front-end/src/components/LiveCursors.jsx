import React, { useEffect, useRef, useState, useMemo } from "react";
import CursorSvg from "./CursorSvg.jsx";
import { useAuth } from "../contexts/useAuth";
import { colors } from "../config.js"; // your Ably key
import { useView } from "./whiteboard/ViewContext";

export default function LiveCursors({ boardRef, client, channel, whiteboardId }) { // get all the ably stuff from whiteboard 

  const [members, setMembers] = useState({}); // Set members of cursor group
  const { currentUser } = useAuth(); // currentUser should have email or username
  const cursorContainerRef = useRef(null);
  const [containerStyle, setContainerStyle] = useState({});

  const { view } = useView();// new view context for zooming and panning

  const userName = useMemo(() => {
    // Try to get from client first, then fallback
    return client?.auth?.clientId || currentUser?.email || "Anonymous";
  }, [client, currentUser]);// set name on cursor tag to logged in user or default to anon

  // Random cursor colour for each user from config.js
  // Could be improved to be consistent for each user by hashing userId to a number and using that to pick a color
  // But this is simpler for now
  const userColor = useMemo(
    () => colors[Math.floor(Math.random() * colors.length)].cursorColor,
    []
  );

  // Get client ID consistently
  const clientId = useMemo(() => {
    return client?.auth?.clientId || client?.clientId;
  }, [client]);

 // Style the cursor container to overlay the board
  useEffect(() => {
  if (!boardRef.current) return;

  setContainerStyle({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 9999,
    overflow: 'visible',
  });
}, [boardRef]);


  // Publish own cursor (with throttling)
  useEffect(() => {
    // if (!canvasRef.current || !client || !channel) return;
    if (!boardRef.current || !client || !channel) return;
    let lastSent = 0;
    const interval = 50; // ms between updates- ably limited to 50 every second - currently 20 updates a second

    const handleMouseMove = (e) => { // Publish cursor update on mouse movement
      const now = Date.now(); // get date for now
      if (now - lastSent < interval) return; // if havent been 50ms since last update, dont update
      lastSent = now; // if it has, send channel update, and update the last sent time to now

      // new live cursors with zooming support
      const rect = boardRef.current.getBoundingClientRect();
      // Convert screen position to world position
      // Mouse position relative to canvas
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;

      // Convert to world coordinates
      const worldX = (canvasX - view.offsetX) / view.scale;
      const worldY = (canvasY - view.offsetY) / view.scale;

      // console.log("Publishing cursor update:", { x, y, name: userName }); // DEBUG PRINT REMOVE IN PRODUCTION

      channel.publish("cursor-update", {
        clientId: clientId,
        x: worldX,
        y: worldY,
        name: userName,
        color: userColor,
        state: "move",
      });
    };

    const handleMouseLeave = () => {
      // console.log("Publishing cursor leave"); // DEBUG PRINT REMOVE IN PRODUCTION
      channel.publish("cursor-update", {
        clientId: clientId,
        state: "leave",
      });
    };

    const board = boardRef.current; // add reference to current canvas
    board.addEventListener("mousemove", handleMouseMove); // add listener for moving a mouse 
    board.addEventListener("mouseleave", handleMouseLeave); // add listener for mouse leave (when mouse goes off the canvas)

    return () => {
      board.removeEventListener("mousemove", handleMouseMove);
      board.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [boardRef, client, channel, userName, userColor, clientId, view]); // publish cursor position on mouse move with zoom and pan support (view)

  // Subscribe to other cursors
  useEffect(() => {
    if (!channel || !client) return;

    const callback = (msg) => {
      // console.log("Received cursor update:", msg.data); // DEBUG PRINT REMOVE IN PRODUCTION
      const { clientId: msgClientId, state } = msg.data; //  use ably payload , set incoming message clientid to msgclientid

      if (!msgClientId) return; // ignore malformed events

      // console.log("Local clientId:", client.auth.clientId); // DEBUG PRINT REMOVE IN PRODUCTION
      // console.log("Received clientId:", clientId);

      // Don't process our own cursor updates
      if (msgClientId === clientId) return;

      setMembers((prev) => {
        const updated = { ...prev };
        if (state === "leave") delete updated[msgClientId];
        else updated[msgClientId] = { ...msg.data };
        return updated;
      });
    };


    channel.subscribe("cursor-update", callback);
    return () => channel.unsubscribe("cursor-update", callback);
  }, [channel, clientId]);

  return (
    <div
      ref={cursorContainerRef}
      style={containerStyle}
    >
      {Object.values(members).map((m) => { // render each cursor
        const screenX = m.x * view.scale + view.offsetX;
        const screenY = m.y * view.scale + view.offsetY;
        return (
          <div
            key={m.clientId}
            style={{
              position: "absolute",
              left: `${screenX}px`,
              top: `${screenY}px`,
              display: "flex",
              alignItems: "center",
              gap: "4px",
              pointerEvents: "none",
              zIndex: 9999,
              transform: "translate(-2px, -2px)", // offset to position cursor tip correctly
            }}
          >
            {/* Actual cursor styling*/}
            <CursorSvg cursorColor={m.color} />
            <div
              style={{
                backgroundColor: m.color,
                color: "white",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "12px",
                whiteSpace: "nowrap",
              }}
            >
              {m.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
