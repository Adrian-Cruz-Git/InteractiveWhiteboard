import { useEffect, useState, useRef } from "react";
import { Realtime } from "ably";
import "../config";
import "./Chat.css";
import { config } from "../config";

const ABLY_KEY = config.ABLY_KEY;

function Chat({ open, onClose, user, fileId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const clientRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const ably = new Realtime({
      key: ABLY_KEY,
      clientId: user?.email,
    });
    clientRef.current = ably;

    const channel = ably.channels.get(`chat:whiteboard-chat-${fileId}`);
    channelRef.current = channel;

    // Load last 100 messages from history

  (async () => {
    try {
      const page = await channel.history({ limit: 100, direction: "forwards" });
      const historyMessages = page.items.map(msg => msg.data);
      setMessages(historyMessages);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  })();

    // Subscribe to new messages
    channel.subscribe("message", (msg) => {
      setMessages((prev) => {
        if (
          prev.some(
            (m) => m.time === msg.data.time && m.sender === msg.data.sender
          )
        ) {
          return prev; // skip duplicate
        }
        return [...prev, msg.data];
      });
    });

    return () => {
      channel.unsubscribe();
      ably.close();
    };
  }, [open, user, fileId]);

  const sendMessage = () => {
    if (input.trim() && channelRef.current) {
      channelRef.current.publish("message", {
        text: input,
        sender: user?.email || "Anonymous",
        time: new Date().toISOString(),
      });
      setInput("");
    }
  };

  if (!open) return null;

  return (
    <div className="chat-modal">
      <div className="chat-header">
        <span>Live Chat</span>
        <button onClick={onClose} className="chat-close">
          ×
        </button>
      </div>
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className="chat-message">
            <b>{m.sender}:</b> {m.text}
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default Chat;
