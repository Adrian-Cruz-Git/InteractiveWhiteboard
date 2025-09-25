import { useState, useRef } from "react";
// import { nanoid } from "nanoid"; // old import
import { useParams } from "react-router-dom";
import Whiteboard from "../components/Whiteboard";
import Toolbar from "../components/toolbar";
import TopNav from "../components/TopNav";

import "./WhiteboardPage.css";

function WhiteboardPage() {
  const { id } = useParams();

  const undoRef = useRef();
  const redoRef = useRef();
  const clearRef = useRef();

  const [strokes, setStrokes] = useState([]);
  const [activeTool, setActiveTool] = useState("pen");

  // ---- Render ----
  return (
    <div className="whiteboard-app">
      <TopNav />

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
              <div className="board-header">
                <h2 className="board-title">
                  Whiteboard {id}
                </h2>
              </div>
              <div className="whiteboard-container">
                <Whiteboard
                  fileId={id} // pass file id to whiteboard
                  strokes={strokes}
                  activeTool={activeTool}
                  onChange={(newStrokes) =>
                    setStrokes(id, newStrokes)
                  }
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
