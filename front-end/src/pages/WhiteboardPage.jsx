import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import Navbar from "../components/Navbar";
import Whiteboard from "../components/Whiteboard";
import Toolbar from "../components/toolbar";
import TopNav from "../components/TopNav";
import "./WhiteboardPage.css";

function WhiteboardApp() {
    const [boards, setBoards] = useState([]);
    const [activeBoard, setActiveBoard] = useState(null);
    const [activeTool, setActiveTool] = useState("pen");
    const [showWelcome, setShowWelcome] = useState(true);
    const navigate = useNavigate();

    const addBoard = () => {
        const newId = boards.length + 1;
        const newBoard = { id: newId, strokes: [] };
        setBoards([...boards, newBoard]);
        setActiveBoard(newId);
        setShowWelcome(false);
    };

    const openFromFiles = () => {
        // This would typically open a file picker or show saved whiteboards
        // For now, we'll just create a sample board and hide welcome screen
        const sampleBoard = { id: 1, strokes: [] };
        setBoards([sampleBoard]);
        setActiveBoard(1);
        setShowWelcome(false);
        navigate('/files');

        // TODO: Replace with actual file opening logic
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

    // Welcome Screen Component
    const WelcomeScreen = () => (
        <div className="welcome-screen">
            <div className="welcome-card">
                <h1 className="welcome-title">Welcome to Interactive Online Whiteboard</h1>

                <p className="welcome-subtitle">
                    How would you like to get started?
                </p>

                <div className="welcome-buttons">
                    <button
                        onClick={openFromFiles}
                        className="welcome-btn open-files"
                    >
                        📂 Open from Files
                    </button>

                    <button
                        onClick={addBoard}
                        className="welcome-btn create-new"
                    >
                        ✨ Create New
                    </button>
                </div>

                <div className="welcome-tip">
                    <p>
                        💡 <strong>Tip:</strong> You can always create additional whiteboards or open saved ones using the navigation bar above.
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="whiteboard-app">
            <TopNav />

            {/* Show welcome screen or regular whiteboard interface */}
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

                        {/* Whiteboard content */}
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