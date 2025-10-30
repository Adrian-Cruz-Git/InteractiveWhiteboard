import { useState, useRef, useEffect } from "react";
// import { nanoid } from "nanoid"; // old import
import { useParams } from "react-router-dom";
import Whiteboard from "../components/whiteboard/Whiteboard";
import Toolbar from "../components/toolbar";
import TopNav from "../components/TopNav";
import Chat from "../components/Chat"; //importing chat
import { FaComments } from "react-icons/fa"; //chat icon
import { auth } from "../firebase";
import { useRealtime } from "../components/whiteboard/hooks/useRealtime";
import { api } from "../config/api";

import "./WhiteboardPage.css";

function WhiteboardPage() {
    const user = auth.currentUser;
    const { id } = useParams();
    const [boardName, setBoardName] = useState("");
    const fileId = id; 

    const undoRef = useRef();
    const redoRef = useRef();
    const clearRef = useRef();

    const [activeTool, setActiveTool] = useState("edit"); // change default tool to "edit" mode
    const [isChatOpen, setIsChatOpen] = useState(false); //chat state
    //instantiate ably client in whiteboardpage, so I can pass to topnav and onlineusers , as well as whiteboard component
    const { client, strokesChannel, eventsChannel } = useRealtime(
        user,
        id,
        () => { },
        () => { },
        () => { }
    );

    useEffect(() => {
        (async () => {
            const f = await api(`/files/${fileId}`);
            setBoardName(f?.name || "Untitled Board");
        })();
    }, [fileId]);


    // ---- Render ----
    return (
        <div className="whiteboard-app">
            {/* Give client and boardId to topnav to display active users */}
            <TopNav client={client} boardId={fileId} boardName={boardName} onRename={setBoardName} />
            {/*Chat Icon/Button*/}
            <button
                className="chat-btn"
                style={{
                    position: "fixed",
                    right: "20px",
                    bottom: "20px",
                    zIndex: 1000,
                    backgroundColor: "#667eea",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "50px",
                    height: "50px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                    cursor: "pointer",
                }}
                onClick={() => setIsChatOpen(true)}
                aria-label="Open Chat"
            >
                <FaComments />
            </button>

            {/* Chat Modal*/}
            <Chat
                open={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                user={user}
                fileId={id}
            />

            <div className="whiteboard-interface">
                {/* Toolbar */}
                <div className="toolbar-container">
                    <Toolbar
                        activeTool={activeTool}
                        setActiveTool={setActiveTool}
                        onUndo={() => undoRef.current && undoRef.current()}
                        onRedo={() => redoRef.current && redoRef.current()}
                        onClear={() => clearRef.current && clearRef.current()}
                    />
                </div>

                {/* Whiteboard */}
                <div className="whiteboard-content">
                    <div className="active-board">
                        <div className="whiteboard-container">
                            <Whiteboard
                                client={client}
                                fileId={id} // pass file id to whiteboard
                                activeTool={activeTool}
                                setActiveTool={setActiveTool}
                                onUndo={undoRef}
                                onRedo={redoRef}
                                onClear={clearRef}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WhiteboardPage;
