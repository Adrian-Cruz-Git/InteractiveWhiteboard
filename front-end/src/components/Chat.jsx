import { useEffect, useState, useRef } from "react";
import { Realtime } from "ably";
import "../config";
import "./Chat.css";
import { config } from "../config";

const ABLY_KEY = config.ABLY_KEY;

function Chat({ open, onClose, user, fileId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typingUsers, setTypingUsers] = useState([]); // list of other users currently typing
  const clientRef = useRef(null);
  const channelRef = useRef(null);
  const readSentRef = useRef(new Set()); // track which message ids have been read
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
  const handleEscape = (e) => {
    if (e.key === "Escape") onClose();
  };
  document.addEventListener("keydown", handleEscape);
  return () => document.removeEventListener("keydown", handleEscape);
}, [onClose]);


  useEffect(() => {
    if (!open) return;

    const userId = user?.email || "Anonymous";

    const ably = new Realtime({
      key: ABLY_KEY,
      clientId: userId,
    });
    clientRef.current = ably;

    const channel = ably.channels.get(`chat:whiteboard-chat-${fileId}`);
    channelRef.current = channel;

    // Load last 100 messages from history
    (async () => {
      try {
        const page = await channel.history({ limit: 100, direction: "forwards" });
        const historyMessages = page.items.map((msg) => {
          const data = msg.data || {};
          return {
            id: data.id || `${data.time || msg.timestamp || Date.now()}-${data.sender || "unknown"}`,
            text: data.text || "",
            sender: data.sender || "Anonymous",
            time: data.time || msg.timestamp || new Date().toISOString(),
            seenBy: data.seenBy || [],
          };
        });
        setMessages(historyMessages);

        // any messages from others, publish the read receipts so senders know they were seen
        for (const m of historyMessages) {
          if (m.sender !== userId && !readSentRef.current.has(m.id)) {
            try {
              channel.publish("read", { messageId: m.id, reader: userId });
              readSentRef.current.add(m.id);
            } catch (err) {
              console.error("Error publishing read receipt for history message:", err);
            }
          }
        }
      } catch (err) {
        console.error("Error loading chat history:", err);
      }
    })();

    // Subscribe to new messages, read receipts, and typing events
    const subscriber = (msg = {}) => {
      const name = msg.name; // "message", "read", or "typing"
      const data = msg.data || {};

      if (name === "message") {
        const newMessage = {
          id:
            data.id ||
            `${data.time || new Date().toISOString()}-${data.sender || "unknown"}-${Math.random()
              .toString(36)
              .slice(2, 7)}`,
          text: data.text || "",
          sender: data.sender || "Anonymous",
          time: data.time,
          seenBy: data.seenBy || [],
        };
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) return prev; // avoid duplicates
          return [...prev, newMessage];
        });

        // if the message is from others, publish a read receipt once
        if (newMessage.sender !== userId && !readSentRef.current.has(newMessage.id)) {
          try {
            channel.publish("read", { messageId: newMessage.id, reader: userId });
            readSentRef.current.add(newMessage.id);
          } catch (err) {
            console.error("Error publishing read receipt:", err);
          }
        }
      } else if (name === "read") {
        const { messageId, reader } = data;
        if (!messageId || !reader) return;
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId) return m;
            const seen = new Set([...(m.seenBy || []), reader]);
            return { ...m, seenBy: Array.from(seen) };
          })
        );
      } else if (name === "typing") {
        const { user: typingUser, typing } = data;
        if (!typingUser) return;
        // ignore our own typing events
        if (typingUser === userId) return;

        setTypingUsers((prev) => {
          const s = new Set(prev || []);
          if (typing) s.add(typingUser);
          else s.delete(typingUser);
          return Array.from(s);
        });
      }
    };

    channel.subscribe(subscriber);

    // ensure we clear typing indicator on unmount / close
    return () => {
      try {
        if (channel && userId) channel.publish("typing", { user: userId, typing: false });
      } catch (e) {
        /* ignore */
      }
      channel.unsubscribe(subscriber);
      ably.close();
      readSentRef.current.clear();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [open, user, fileId]);

  // helper to publish typing events (debounced auto-clear)
  const publishTyping = (isTyping) => {
    const userId = user?.email || "Anonymous";
    if (!channelRef.current) return;
    try {
      channelRef.current.publish("typing", { user: userId, typing: isTyping });
    } catch (err) {
      console.error("Failed to publish typing event:", err);
    }
  };

  const onInputChange = (value) => {
    setInput(value);

    // send "typing: true"
    publishTyping(true);

    // reset debounce to send typing:false after 2s of inactivity
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      publishTyping(false);
      typingTimeoutRef.current = null;
    }, 2000);
  };

  const sendMessage = () => {
    const userId = user?.email || "Anonymous";
    if (input.trim() && channelRef.current) {
      const msg = {
        id: `${new Date().toISOString()}-${Math.random().toString(36).slice(2, 7)}`,
        text: input,
        sender: userId,
        time: new Date().toISOString(),
        seenBy: [], // recipients will add themselves when they receive and read
      };
      channelRef.current.publish("message", msg);
      setMessages((prev) => [...prev, msg]);
      setInput("");
      // stop typing indicator for ourselves immediately after send
      publishTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  if (!open) return null;

  // prepare typing indicator text (exclude current user)
  const otherTypers = typingUsers.filter((t) => t !== (user?.email || "Anonymous"));
  const typingText =
    otherTypers.length === 0
      ? ""
      : otherTypers.length === 1
      ? `${otherTypers[0]} is typing...`
      : `${otherTypers.join(", ")} are typing...`;

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
          <div key={m.id || i} className="chat-message">
            <div>
              {m.sender ? <b>{m.sender}:</b> : null} {m.text}
            </div>
            {/* show seen indicator only for messages I sent and that have others in seenBy */}
            {m.sender === (user?.email || "Anonymous") && m.seenBy && m.seenBy.length > 0 && (
              <div style={{ fontSize: "0.8rem", color: "#666", marginTop: 4 }}>
                Seen by {m.seenBy.join(", ")}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* typing indicator */}
      {typingText && (
        <div style={{ padding: "0 1rem 0.5rem 1rem", color: "#666", fontSize: "0.9rem" }}>
          {typingText}
        </div>
      )}

      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
            // optionally announce typing on keydown as well
          }}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
export default Chat;