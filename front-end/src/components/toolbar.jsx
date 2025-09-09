// Toolbar.jsx
import { useState, useRef, useEffect } from 'react';
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

/* 8 colors for a clean 2×4 symmetric grid */
const NOTE_COLORS = [
  '#FFEB3B', // yellow
  '#FFF59D', // light yellow
  '#FFD54F', // amber
  '#FFAB91', // peach
  '#F48FB1', // pink
  '#90CAF9', // blue
  '#A5D6A7', // green
  '#E1BEE7', // lavender
];

export default function Toolbar() {
  const [showPalette, setShowPalette] = useState(false);
  const paletteRef = useRef(null);

  // one-time globals
  if (typeof window !== 'undefined' && window.__WB_TOOL__ === undefined) {
    window.__WB_TOOL__ = null;
    window.__WB_ERASE__ = false;
  }

  // close palette when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (!paletteRef.current) return;
      if (!paletteRef.current.contains(e.target)) setShowPalette(false);
    };
    document.addEventListener('mousedown', onDocClick, true);
    return () => document.removeEventListener('mousedown', onDocClick, true);
  }, []);

  const selectTool = (tool) => {
    window.__WB_TOOL__ = tool;
    window.__WB_ERASE__ = tool === 'eraser';
    window.dispatchEvent(new CustomEvent('wb:select-tool', { detail: { tool } }));
    window.dispatchEvent(new CustomEvent('wb:toggle-erase', { detail: { on: tool === 'eraser' } }));
    console.log('[Toolbar] tool ->', tool || 'none');
  };

  const startStickyFlow = () => setShowPalette((v) => !v);

  const chooseStickyColor = (color) => {
    window.dispatchEvent(new CustomEvent('wb:sticky-select-color', { detail: { color } }));
    selectTool('sticky');   // Whiteboard will auto-toggle off after placing one note
    setShowPalette(false);
  };

  return (
    <div className="toolbar">
      {/* 1. Cursor (no-op) */}
      <button title="Cursor" aria-label="Cursor">
        <img src={cursorIcon} alt="Cursor" style={{ width: 25, height: 25 }} />
      </button>

      {/* 2. Pen */}
      <button onClick={() => selectTool('pen')} title="Pen" aria-label="Pen">
        <img src={penIcon} alt="Pen" style={{ width: 25, height: 25 }} />
      </button>

      {/* 3. Highlighter (placeholder) */}
      <button title="Highlighter" aria-label="Highlighter">
        <img src={highlightIcon} alt="Highlighter" style={{ width: 25, height: 25 }} />
      </button>

      {/* 4. Eraser */}
      <button onClick={() => selectTool('eraser')} title="Eraser" aria-label="Eraser">
        <img src={eraserIcon} alt="Eraser" style={{ width: 25, height: 25 }} />
      </button>

      {/* 5. Sticky Note (opens symmetric color palette) */}
      <div className="palette-anchor">
        <button onClick={startStickyFlow} title="Sticky Note" aria-label="Sticky Note">
          <img src={stickyNoteIcon} alt="Sticky Note" style={{ width: 25, height: 25 }} />
        </button>

        {showPalette && (
          <div
            ref={paletteRef}
            className="color-picker"
            role="listbox"
            aria-label="Sticky note colors"
          >
            {NOTE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className="color-swatch"
                aria-label={`Color ${c}`}
                style={{ background: c }}
                onClick={() => chooseStickyColor(c)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 6. Shapes (placeholder) */}
      <button title="Shapes" aria-label="Shapes">
        <img src={shapesIcon} alt="Shapes" style={{ width: 25, height: 25 }} />
      </button>

      {/* 7. Text (placeholder) */}
      <button title="Text" aria-label="Text">
        <img src={textIcon} alt="Text" style={{ width: 25, height: 25 }} />
      </button>

      {/* 8. Image (placeholder) */}
      <button title="Image" aria-label="Image">
        <img src={imageIcon} alt="Image" style={{ width: 25, height: 25 }} />
      </button>

      {/* 9. Undo (placeholder) */}
      <button title="Undo" aria-label="Undo">
        <img src={undoIcon} alt="Undo" style={{ width: 25, height: 25 }} />
      </button>

      {/* 10. Redo (placeholder) */}
      <button title="Redo" aria-label="Redo">
        <img src={redoIcon} alt="Redo" style={{ width: 25, height: 25 }} />
      </button>
    </div>
  );
}
