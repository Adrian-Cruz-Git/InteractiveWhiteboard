import { useState } from "react";
import Navbar from "../components/Navbar";
import Whiteboard from "../components/Whiteboard";
import Toolbar from "../components/toolbar";
import TopNav from "../components/TopNav";
import { nanoid } from "nanoid";
import { useNavigate } from "react-router-dom";


function WhiteboardApp() {
    const navigate = useNavigate(); // for each time a whiteboard is created, to switch to that url



    const [boards, setBoards] = useState([{ id: 1, strokes: [] }]);
    const [activeBoard, setActiveBoard] = useState(1);

    const addBoard = () => {
        const whiteboardId = nanoid(); // create random id for the whiteboard

        const newId = boards.length + 1;
        setBoards([...boards, { id: newId, strokes: [] }]);
        setActiveBoard(newId);

        navigate(`/whiteboard?id=${whiteboardId}`); // navigate to new board with the new whiteboard id
    };

    // const updateStrokes = (id, newStrokes) => {
    //     setBoards((prev) =>
    //         prev.map((board) =>
    //             board.id === id ? { ...board, strokes: newStrokes } : board
    //         )
    //     );
    // };
    const updateStrokes = (id, newStroke) => {
    setBoards(prev =>
        prev.map(board =>
            board.id === id ? { ...board, strokes: [...board.strokes, newStroke] } : board
        )
    );
};


    const activeBoardData = boards.find((b) => b.id === activeBoard);

    return (
        <>
            <TopNav />
            <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
                <Navbar
                    boards={boards}
                    activeBoard={activeBoard}
                    onSelectBoard={setActiveBoard}
                    onAddBoard={addBoard}
                />

                <div style={{ flex: 1, display: "flex", background: "#fff", marginTop: "3rem" }}>
                    <Toolbar />
                    <div style={{ flex: 1, padding: "1rem" }}>
                        {activeBoardData && (
                            <div key={activeBoardData.id}>
                                <h2 style={{color:"black"}}>Whiteboard {activeBoardData.id}</h2>
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
            </div>
        </>
    );
}

export default WhiteboardApp;