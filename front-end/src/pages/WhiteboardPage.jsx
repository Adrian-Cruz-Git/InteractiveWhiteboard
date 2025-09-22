import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Whiteboard from "../components/Whiteboard";
import Toolbar from "../components/toolbar";
import TopNav from "../components/TopNav";
import { nanoid } from "nanoid";
import { useNavigate, useLocation } from "react-router-dom";


function WhiteboardApp() {
    const navigate = useNavigate(); // for each time a whiteboard is created, to switch to that url
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const idFromUrl = searchParams.get("id");

    // Initialize boards based on URL
    const initialBoard = idFromUrl ? { id: idFromUrl, strokes: [] } : { id: nanoid(), strokes: [] };
    const [boards, setBoards] = useState([initialBoard]);
    const [activeBoard, setActiveBoard] = useState(initialBoard.id);

    useEffect(() => {
        if (idFromUrl & idFromUrl !== activeBoard) {
            setActiveBoard(idFromUrl);

            // auto-add board if it doesn't exist yet (but id is in url) rare case
            if (!boards.find(b => b.id === idFromUrl)) {
                setBoards(prev => [...prev, { id: idFromUrl, strokes: [] }]);
            }
        }
    }, [location.search]); // only run when location.search changes



    const addBoard = () => {
        const whiteboardId = nanoid();
        setBoards([...boards, { id: whiteboardId, strokes: [] }]);
        navigate(`/whiteboard?id=${whiteboardId}`);
    };

    // Update strokes for a specific board
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
                                <h2 style={{ color: "black" }}>Whiteboard {activeBoardData.id}</h2>
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