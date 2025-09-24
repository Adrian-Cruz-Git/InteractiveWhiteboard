import { useState, useEffect } from "react";
import { nanoid } from "nanoid";
import { useNavigate, useLocation } from "react-router-dom";

import Navbar from "../components/Navbar";
import Whiteboard from "../components/Whiteboard";
import Toolbar from "../components/toolbar";
import TopNav from "../components/TopNav";

import "./WhiteboardPage.css";

function WhiteboardApp() {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const idFromUrl = searchParams.get("id");

    // ---- State ----
    const initialBoard = idFromUrl
        ? { id: idFromUrl, strokes: [] }
        : { id: nanoid(), strokes: [] };

    const [boards, setBoards] = useState([initialBoard]);
    const [activeBoard, setActiveBoard] = useState(initialBoard.id);

    const [activeTool, setActiveTool] = useState("pen");
    const [showWelcome, setShowWelcome] = useState(!idFromUrl); // show welcome only if no ?id

    // ---- Effect: sync URL with active board ----
    useEffect(() => {
        if (idFromUrl && idFromUrl !== activeBoard) {
            setActiveBoard(idFromUrl);

            // auto-add board if missing
            if (!boards.find((b) => b.id === idFromUrl)) {
                setBoards((prev) => [...prev, { id: idFromUrl, strokes: [] }]);
            }
        }
    }, [location.search]);

    // ---- Actions ----
    const addBoard = () => {
        const whiteboardId = nanoid();
        const newBoard = { id: whiteboardId, strokes: [] };
        setBoards([...boards, newBoard]);
        setActiveBoard(whiteboardId);
        setShowWelcome(false);
        navigate(`/whiteboard?id=${whiteboardId}`);
    };

    const openFromFiles = () => {
        // Placeholder: load from storage
        const sampleBoard = { id: nanoid(), strokes: [] };
        setBoards([sampleBoard]);
        setActiveBoard(sampleBoard.id);
        setShowWelcome(false);
        navigate("/files");
        console.log("Opening from files...");
    };

    const updateStrokes = (id, newStrokes) => {
        setBoards((prev) =>
            prev.map((board) =>
                board.id === id ? { ...board, strokes: newStrokes } : board
            )
        );
    };

    const activeBoardData = boards.find((b) => b.id === activeBoard);

    // ---- Welcome Screen ----
    const WelcomeScreen = () => (
        <div className="welcome-screen">
            <div className="welcome-card">
                <h1 className="welcome-title">
                    Welcome to Interactive Online Whiteboard
                </h1>
                <p className="welcome-subtitle">
                    How would you like to get started?
                </p>
                <div className="welcome-buttons">
                    <button onClick={openFromFiles} className="welcome-btn open-files">
                        📂 Open from Files
                    </button>
                    <button onClick={addBoard} className="welcome-btn create-new">
                        ✨ Create New
                    </button>
                </div>
                <div className="welcome-tip">
                    <p>
                        💡 <strong>Tip:</strong> You can always create additional whiteboards
                        or open saved ones using the navigation bar above.
                    </p>
                </div>
            </div>
        </div>
    );

    // ---- Render ----
    return (
        <div className="whiteboard-app">
            <TopNav />

            {showWelcome ? (
                <WelcomeScreen />
            ) : (
                <>
                    <Navbar
                        boards={boards}
                        activeBoard={activeBoard}
                        onSelectBoard={setActiveBoard}
                        onAddBoard={addBoard}
                    />

                    <div className="whiteboard-interface">
                        {/* Toolbar */}
                        <div className="toolbar-container">
                            <Toolbar activeTool={activeTool} setActiveTool={setActiveTool} />
                        </div>

                        {/* Whiteboard */}
                        <div className="whiteboard-content">
                            {activeBoardData && (
                                <div key={activeBoardData.id} className="active-board">
                                    <div className="board-header">
                                        <h2 className="board-title">
                                            Whiteboard {activeBoardData.id}
                                        </h2>
                                    </div>
                                    <div className="whiteboard-container">
                                        <Whiteboard
                                            strokes={activeBoardData.strokes}
                                            activeTool={activeTool}
                                            onChange={(newStrokes) =>
                                                updateStrokes(activeBoardData.id, newStrokes)
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default WhiteboardApp;
