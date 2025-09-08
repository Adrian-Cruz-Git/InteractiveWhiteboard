import { useState } from "react";
import Navbar from "../components/Navbar";
import Whiteboard from "../components/Whiteboard";
import Toolbar from "../components/toolbar";

function WhiteboardApp() {


    const [boards, setBoards] = useState([{ id: 1, strokes: [] }]);
    const [activeBoard, setActiveBoard] = useState(1);
    const [activeTool, setActiveTool] = useState('cursor'); // default to cursor/off


    const addBoard = () => {
        const newId = boards.length + 1;
        setBoards([...boards, { id: newId, strokes: [] }]);
        setActiveBoard(newId);
    };

    const updateStrokes = (id, newStrokes) => {
        setBoards((prev) =>
            prev.map((board) =>
                board.id === id ? { ...board, strokes: newStrokes } : board
            )
        );
    };

    const activeBoardData = boards.find((b) => b.id === activeBoard);

    return (

        <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
            <Navbar
                boards={boards}
                activeBoard={activeBoard}
                onSelectBoard={setActiveBoard}
                onAddBoard={addBoard}
            />

            <div style={{ flex: 1, display: "flex", background: "#fff", marginTop: "3rem" }}>
                <Toolbar activeTool={activeTool} setActiveTool={setActiveTool} /> {/*new*/}
                <div style={{ flex: 1, padding: "1rem" }}>
                    {activeBoardData && (
                        <div key={activeBoardData.id}>
                            <h2>Whiteboard {activeBoardData.id}</h2>
                            <Whiteboard
                                strokes={activeBoardData.strokes}
                                activeTool={activeTool}  // set active tool
                                onChange={(newStrokes) =>
                                    updateStrokes(activeBoardData.id, newStrokes)
                                }
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default WhiteboardApp;