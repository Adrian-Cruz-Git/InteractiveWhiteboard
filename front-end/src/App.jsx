import React, { useState } from "react";
import Navbar from "./components/Navbar";
import Whiteboard from "./components/Whiteboard";

function App() {
    const [boards, setBoards] = useState([{ id: 1, strokes: [] }]);
    const [activeBoard, setActiveBoard] = useState(1);

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
        <div>
            <Navbar
                boards={boards}
                activeBoard={activeBoard}
                onSelectBoard={setActiveBoard}
                onAddBoard={addBoard}
            />

            <div style={{ padding: "1rem" }}>
                {activeBoardData && (
                    <div key={activeBoardData.id}>
                        <h2>Whiteboard {activeBoardData.id}</h2>
                        <Whiteboard
                            strokes={activeBoardData.strokes}
                            onChange={(newStrokes) =>
                                updateStrokes(activeBoardData.id, newStrokes)
                            }
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
