import { useEffect, useState, useRef, use } from "react";
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
  const readSentRef = useRef(new Set()); //track which message ids have been read

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
      const historyMessages = page.items.map(msg => {
        const data = msg.data || {};
        return {
          id: data.id || `${data.time || msg.timestamp || Date.now()}-${data.sender || "unknown"}`,
          text: data.text,
          sender: data.sender,
          time: data.time,
          seenBy: data.seenBy || [],
        };
      });
      setMessages(historyMessages);

      //any messages from others, publish the read receipts so senders know they were seen
      for (const m of historyMessages) {
        if (m.sender !== userId && !readSentRef.current.has(m.id)) {
          try{
            channel.publish("read", { messageId: m.id, reader: userID})
            readSentRef.current.add(m.id);
          } catch(err){
            console.error("Error publishing read receipt for history message:", err);
          }
        }
      }
    } catch (err) {
      console.error("Error loading chat history:", err);
    }
  })();

    // Subscribe to new messages and read receipts
  const subscriber = (msg) => {
    const name = msg.name; // "message" or "read"
    const data = msg.data || {};

    if (name === "message") {
      const newMessage = {
        id : data.id || `${data.time || new Date().toISOString()}-${data.sender || "unknown"}-${Math.random().toString(36).substr(2, 7)}`,
        text: data.text,
        sender: data.sender,
        time: data.time,
        seenBy: data.seenBy || [],
      };
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev; //avoid duplicates
        return [...prev, newMessage];
      });

      //if the message is from others, publish a read receipt once
      if (newMessage.sender !== userId && !readSentRef.current.has(newMessage.id)) {
        try{
          channel.publish("read", { messageId: newMessage.id, reader: userId });
          readSentRef.current.add(newMessage.id);
        } catch(err){
          console.error("Error publishing read receipt:", err);
        }
      }
    } else if (name === "read") {
      const { messageId, reader } = data;
      if (!messageId || !reader) return;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const seen = new Set([...ABLY_KEY(m.seenBy || []), reader]);
          return { ...m, seenBy: Array.from(seen) };
        })
      );
    }
  };

    channel.subscribe(subscriber);

    return () => {
      channel.unsubscribe(subscriber);
      ably.close();
      readSentRef.current.clear();
    };
  }, [open, user, fileId]);

  const sendMessage = () => {
    const userId = user?.email || "Anonymous";
    if (input.trim() && channelRef.current) {
      const msg = {
        id: `${new Date().toISOString()}-${Math.random().toString(36).slice(2,7)}`,
        text: input,
        sender: userId,
        time: new Date().toISOString(),
        seenBy: [], // recipients will add themselves when they receive and read
      };
      channelRef.current.publish("message", msg);
      setMessages((prev) => [...prev, msg]);
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
          <div key={m.id || i} className="chat-message">
            <div>
              <b>{m.sender}:</b> {m.text}
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