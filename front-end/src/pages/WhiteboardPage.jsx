import { useState, useEffect, useRef } from "react";
import { nanoid } from "nanoid";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Whiteboard from "../components/Whiteboard";
import Toolbar from "../components/toolbar";
import TopNav from "../components/TopNav";

import "./WhiteboardPage.css";

function WhiteboardPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { fileId } = useParams();

    const undoRef = useRef();
    const redoRef = useRef();
    const clearRef = useRef();

    // ---- State ----
    const initialBoard = fileId
        ? { id: fileId, strokes: [] }
        : { id: nanoid(), strokes: [] };

    const [boards, setBoards] = useState([initialBoard]);
    const [activeBoard, setActiveBoard] = useState(initialBoard.id);

    const [activeTool, setActiveTool] = useState("pen");


    // ---- Effect: sync URL with active board ----
    useEffect(() => {
        if (fileId && fileId !== activeBoard) {
            setActiveBoard(fileId);

            // auto-add board if missing
            if (!boards.find((b) => b.id === fileId)) {
                setBoards((prev) => [...prev, { id: fileId, strokes: [] }]);
            }
            navigate(`/whiteboard/${fileId}`, { replace: true });
        }
    }, [location.search]);

    // ---- Actions ----
    const addBoard = () => {
        const whiteboardId = nanoid();
        const newBoard = { id: whiteboardId, strokes: [] };
        setBoards([...boards, newBoard]);
        setActiveBoard(whiteboardId);
        setShowWelcome(false);
        navigate(`/whiteboard/${newId}`);
    };

    const updateStrokes = (id, newStrokes) => {
        setBoards((prev) =>
            prev.map((board) =>
                board.id === id ? { ...board, strokes: newStrokes } : board
            )
        );
    };

    const activeBoardData = boards.find((b) => b.id === activeBoard);



    // ---- Render ----
    return (
        <div className="whiteboard-app">
            <TopNav />
            <Navbar
                boards={boards}
                activeBoard={activeBoard}
                onSelectBoard={setActiveBoard}
                onAddBoard={addBoard}
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
                    {activeBoardData && (
                        <div key={activeBoardData.id} className="active-board">
                            <div className="board-header">
                                <h2 className="board-title">
                                    Whiteboard {activeBoardData.id}
                                </h2>
                            </div>
                            <div className="whiteboard-container">
                                <Whiteboard
                                    fileId={activeBoardData.id} // pass file id to whiteboard
                                    strokes={activeBoardData.strokes}
                                    activeTool={activeTool}
                                    onChange={(newStrokes) =>
                                        updateStrokes(activeBoardData.id, newStrokes)
                                    }
                                    onUndo={undoRef}
                                    onRedo={redoRef}
                                    onClear={clearRef}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default WhiteboardPage;
