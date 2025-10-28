import { useEffect, useState, useRef } from "react";
import { Realtime } from "ably";
import "../config";
import "./Chat.css";
import { config } from "../config";

const ABLY_KEY = config.ABLY_KEY;

function Chat({ open, onClose, user, fileId }) {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [input, setInput] = useState("");
  const clientRef = useRef(null);
  const channelRef = useRef(null);
  const typingTimeoutRef = useRef({}); // per-user removal timers
  const stopTypingPublishTimerRef = useRef(null); // debounce for our "stop typing" publish

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

    // subscribe to typing events
    channel.subscribe("typing", (msg) => {
      const { sender, typing } = msg.data || {};
      if (!sender || sender === user?.email) return; // ignore our own events

      if (typing) {
        setTypingUsers(prev => (prev.includes(sender) ? prev : [...prev, sender]));
        // reset removal timer for this sender
        if (typingTimeoutRef.current[sender]) clearTimeout(typingTimeoutRef.current[sender]);
        typingTimeoutRef.current[sender] = setTimeout(() => {
          setTypingUsers(prev => prev.filter(s => s !== sender));
          delete typingTimeoutRef.current[sender];
        }, 3000); // remove after 3s of no typing updates
      } else {
        setTypingUsers(prev => prev.filter(s => s !== sender));
        if (typingTimeoutRef.current[sender]) {
          clearTimeout(typingTimeoutRef.current[sender]);
          delete typingTimeoutRef.current[sender];
        }
      }
    });

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
      try {
        if (channel && userId) channel.publish("typing", { user: userId, typing: false });
      } catch (e) {
        /* ignore */
      }
      channel.unsubscribe();
      ably.close();
      // clear timers
      Object.values(typingTimeoutRef.current || {}).forEach(t => clearTimeout(t));
      if (stopTypingPublishTimerRef.current) clearTimeout(stopTypingPublishTimerRef.current);
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
    if (input.trim() && channelRef.current) {
      channelRef.current.publish("message", {
        text: input,
        sender: user?.email || "Anonymous",
        time: new Date().toISOString(),
      });
      // tell others we stopped typing when we send
      channelRef.current.publish("typing", { sender: user?.email || "Anonymous", typing: false });
      setInput("");
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
      <div className="chat-messages"> {/*update messages to dispaly as "Me" if sender is current user*/}
        {messages.map((m, i) => {
          const isMe = m.sender === (user?.email || "Anonymous");
          const displayName = isMe ? "Me" : m.sender;
          return (
            <div key={i} className={`chat-message ${isMe ? "chat-message--me" : ""}`}>
              <b>{displayName}:</b> {m.text}
            </div>
          );
        })}
      </div>

      {/* typing indicator for other users */}
      {typingUsers.length > 0 && (
        <div className="typing-indicator" style={{ fontSize: "0.9rem", color: "#666", margin: "6px 12px" }}>
          {typingUsers.join(", ")} typing...
        </div>
      )}
      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (!channelRef.current) return;
            // publish that we're typing and debounce a stop-typing publish
            channelRef.current.publish("typing", { sender: user?.email || "Anonymous", typing: true });
            if (stopTypingPublishTimerRef.current) clearTimeout(stopTypingPublishTimerRef.current);
            stopTypingPublishTimerRef.current = setTimeout(() => {
              if (channelRef.current) channelRef.current.publish("typing", { sender: user?.email || "Anonymous", typing: false });
            }, 2000); // 2s inactivity -> stop typing
          }}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
export default Chat;