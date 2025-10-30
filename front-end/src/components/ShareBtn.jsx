// src/components/ShareBtn.jsx
import { useState } from "react";
import "./ShareBtn.css"; // keep your styling for the button
import BoardPermissionsManager from "./Users/BoardPermissionsManager";

function ShareBtn({ boardId, activeBoard }) {
  const resolvedBoardId = boardId ?? activeBoard;
  const [open, setOpen] = useState(false);

  // If we don't know which board, don't render
  if (!resolvedBoardId) return null;

  return (
    <>
      <button className="share" onClick={() => setOpen(true)}>
        Share
      </button>

      {/* This is the modal now */}
      <BoardPermissionsManager
        boardId={resolvedBoardId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

export default ShareBtn;