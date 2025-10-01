import React, { useEffect, useRef, useState, useMemo } from "react";
import CursorSvg from "./CursorSvg.jsx";
import { useAuth } from "../contexts/useAuth";
import { colors } from "../config.js"; // your Ably key

export default function LiveCursors({ canvasRef, client, channel, whiteboardId }) { // get all the ably stuff from whiteboard 

  const [members, setMembers] = useState({}); // Set members of cursor group
  const { currentUser } = useAuth(); // currentUser should have email or username
  const cursorContainerRef = useRef(null);
  const [containerStyle, setContainerStyle] = useState({});

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

  // Update container position to match canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const updateContainerPosition = () => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();

      setContainerStyle({
        position: 'fixed',
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        pointerEvents: 'none',
        zIndex: 9999
      });
    };

    // Update initially
    updateContainerPosition();

    // Update on resize and scroll
    window.addEventListener('resize', updateContainerPosition);
    window.addEventListener('scroll', updateContainerPosition);

    // Also update when the canvas might resize (using MutationObserver)
    const resizeObserver = new ResizeObserver(updateContainerPosition);
    resizeObserver.observe(canvasRef.current);

    return () => {
      window.removeEventListener('resize', updateContainerPosition);
      window.removeEventListener('scroll', updateContainerPosition);
      resizeObserver.disconnect();
    };
  }, [canvasRef]);

  // Publish own cursor (with throttling)
  useEffect(() => {
    if (!canvasRef.current || !client || !channel) return;
    let lastSent = 0;
    const interval = 50; // ms between updates- ably limited to 50 every second - currently 20 updates a second

    const handleMouseMove = (e) => { // Publish cursor update on mouse movement
      const now = Date.now(); // get date for now
      if (now - lastSent < interval) return; // if havent been 50ms since last update, dont update
      lastSent = now; // if it has, send channel update, and update the last sent time to now
      const rect = canvasRef.current.getBoundingClientRect();

      // Calculate relative position within canvas
      const x = ((e.clientX - rect.left) / rect.width) * 100; // Percentage for scaling
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      console.log("Cursor coords:", x, y, "Canvas rect:", rect, "Mouse:", e.clientX, e.clientY);

      // console.log("Publishing cursor update:", { x, y, name: userName }); // DEBUG PRINT REMOVE IN PRODUCTION

      channel.publish("cursor-update", {
        clientId: clientId,
        x,
        y,
        name: userName,
        color: userColor,
        state: "move",
      });
    };

    const handleMouseLeave = () => {
      console.log("Publishing cursor leave"); // DEBUG PRINT REMOVE IN PRODUCTION
      channel.publish("cursor-update", {
        clientId: clientId,
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
  }, [canvasRef, client, channel, userName, userColor, clientId]);

  // Subscribe to other cursors
  useEffect(() => {
    if (!channel || !client) return;

    const callback = (msg) => {
      console.log("Received cursor update:", msg.data); // DEBUG PRINT REMOVE IN PRODUCTION
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

      {Object.values(members).map((m) => (
        <div
          key={m.clientId}
          style={{
            position: "absolute",
            left: `${m.x}%`, // Use percentage for scaling
            top: `${m.y}%`,
            display: "flex",
            alignItems: "center",
            gap: "4px",
            pointerEvents: "none",
            zIndex: 9999,
            transform:"translate(0,0)" 
          }}
        >
          {/* Actual cursor */}
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
      ))}
    </div>
  );
}