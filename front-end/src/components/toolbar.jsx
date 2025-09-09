// Toolbar.jsx
// Keeps the same look. Only Pen & Eraser work.
// Selecting a tool persists until another tool is clicked.
// We set a single source of truth: window.__WB_TOOL__ = 'pen' | 'eraser' | null
// and also emit events for compatibility.

import './toolbar.css';
import cursorIcon from '../assets/cursor.png';
import penIcon from '../assets/pen.png';
import highlightIcon from '../assets/highlight.png';
import eraserIcon from '../assets/eraser.png';
import stickyNoteIcon from '../assets/stickyNote.png';
import shapesIcon from '../assets/shapes.png';
import textIcon from '../assets/text.png';
import imageIcon from '../assets/image.png';
import undoIcon from '../assets/undo.png';
import redoIcon from '../assets/redo.png';

export default function Toolbar() {
  // ensure a global place to store the current tool (survives re-mounts)
  if (typeof window !== 'undefined' && window.__WB_TOOL__ === undefined) {
    window.__WB_TOOL__ = null;      // start with NO tool selected
    window.__WB_ERASE__ = false;    // legacy flag (some code may read this)
  }

  const selectTool = (tool) => {
    // persist selected tool globally
    window.__WB_TOOL__ = tool;                  // 'pen' | 'eraser'
    window.__WB_ERASE__ = tool === 'eraser';    // legacy flag kept in sync

    // notify listeners (Whiteboard listens to wb:select-tool)
    window.dispatchEvent(new CustomEvent('wb:select-tool', { detail: { tool } }));
    // legacy event for any older listeners
    window.dispatchEvent(new CustomEvent('wb:toggle-erase', { detail: { on: tool === 'eraser' } }));

    console.log('[Toolbar] tool ->', tool.toUpperCase());
  };

  return (
    <div className="toolbar">
      {/* 1. Cursor (no-op; visual only) */}
      <button title="Cursor" aria-label="Cursor">
        <img src={cursorIcon} alt="Cursor" style={{ width: '25px', height: '25px' }} />
      </button>

      {/* 2. Pen */}
      <button onClick={() => selectTool('pen')} title="Pen" aria-label="Pen">
        <img src={penIcon} alt="Pen" style={{ width: '25px', height: '25px' }} />
      </button>

      {/* 3. Highlighter (placeholder) */}
      <button title="Highlighter" aria-label="Highlighter">
        <img src={highlightIcon} alt="Highlighter" style={{ width: '25px', height: '25px' }} />
      </button>

      {/* 4. Eraser */}
      <button onClick={() => selectTool('eraser')} title="Eraser" aria-label="Eraser">
        <img src={eraserIcon} alt="Eraser" style={{ width: '25px', height: '25px' }} />
      </button>

      {/* 5. Sticky Note (placeholder) */}
      <button title="Sticky Note" aria-label="Sticky Note">
        <img src={stickyNoteIcon} alt="Sticky Note" style={{ width: '25px', height: '25px' }} />
      </button>

      {/* 6. Shapes (placeholder) */}
      <button title="Shapes" aria-label="Shapes">
        <img src={shapesIcon} alt="Shapes" style={{ width: '25px', height: '25px' }} />
      </button>

      {/* 7. Text (placeholder) */}
      <button title="Text" aria-label="Text">
        <img src={textIcon} alt="Text" style={{ width: '25px', height: '25px' }} />
      </button>

      {/* 8. Image (placeholder) */}
      <button title="Image" aria-label="Image">
        <img src={imageIcon} alt="Image" style={{ width: '25px', height: '25px' }} />
      </button>

      {/* 9. Undo (placeholder) */}
      <button title="Undo" aria-label="Undo">
        <img src={undoIcon} alt="Undo" style={{ width: '25px', height: '25px' }} />
      </button>

      {/* 10. Redo (placeholder) */}
      <button title="Redo" aria-label="Redo">
        <img src={redoIcon} alt="Redo" style={{ width: '25px', height: '25px' }} />
      </button>
    </div>
  );
}
