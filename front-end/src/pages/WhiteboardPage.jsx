import { act, useState } from "react";
import Navbar from "../components/Navbar";
import Whiteboard from "../components/Whiteboard";
import Toolbar from "../components/toolbar";

function WhiteboardApp() {

    const [boards, setBoards] = useState([{ id: 1, strokes: [], stickyNotes: [] }]);
    const [activeBoard, setActiveBoard] = useState(1);
    const [activeTool, setActiveTool] = useState("pen"); //pen
    const [stickyNotes, setStickyNotes] = useState([]); //sticky notes

    const addBoard = () => {
        const newId = boards.length + 1;
        setBoards([...boards, { id: newId, strokes: [], stickyNotes: [] }]);
        setActiveBoard(newId);
    };

    const updateStrokes = (id, newStrokes) => {
        setBoards((prev) =>
            prev.map((board) =>
                board.id === id ? { ...board, strokes: newStrokes } : board
            )
        );
    };

    const addStickyNote = (x,y) => {
        setBoards((prev) =>
            prev.map((board) =>
                board.id === activeBoard 
                ? { 
                    ...board, 
                    stickyNotes: [...board.stickyNotes, 
                        { id: Date.now(), x, y, text: "" }] 
                  } 
                : board
            )
        );
    };
    
    const updateStickyNote = (id, newText, newX, newY) => {
        setBoards((prev) =>
            prev.map((board) =>
                board.id === activeBoard
                    ? {
                          ...board,
                          stickyNotes: board.stickyNotes.map((note) =>
                              note.id === id 
                          ? { 
                            ...note, 
                            text: newText !== undefined ? newText : note.text,
                            x: newX !== undefined ? newX : note.x,
                            y: newY !== undefined ? newY : note.y
                            }
                            :note
                          ),
                      }
                    : board
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

            <div style={{ flex: 1, display: "flex", background: "#fff" }}>
                <div style={{
                    display: "flex",
                    alignItems: "center", //vertically center
                    height: "100vh",      //full viewport height
                    position: "fixed",    //fix to left side
                    left: 0,
                    top: 0,
                    zIndex: 10,
                    padding: "1rem" //makes toolbar stick to wall or not
                }}>
                    <Toolbar activeTool={activeTool} setActiveTool={setActiveTool}  />
                </div>
                <div style={{ flex: 1, marginLeft: "80px", padding: "1rem" }}>
                    {activeBoardData && (
                        <div key={activeBoardData.id}>
                            <h2>Whiteboard {activeBoardData.id}</h2>
                            <Whiteboard
                                strokes={activeBoardData.strokes}
                                activeTool={activeTool}  // set active tool
                                onChange={(newStrokes) =>
                                    updateStrokes(activeBoardData.id, newStrokes)
                                }
                                stickyNotes={activeBoardData.stickyNotes} //makes notes only for one board or active baord
                                onAddStickyNote={addStickyNote} //add sticky note
                                onUpdateStickyNote={(draggedNoteId, newText, x, y) =>
                                    updateStickyNote(draggedNoteId, newText, x, y)
                                } //update sticky note
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default WhiteboardApp;