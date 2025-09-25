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
import clearIcon from '../assets/clear.png';

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

export default function Toolbar({ activeTool, setActiveTool, onUndo, onRedo, onClear }) {
  const [showPalette, setShowPalette] = useState(false);
  const paletteRef = useRef(null);

  // one-time globals for sticky + eraser
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
    setActiveTool(tool);
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
      {/* Cursor */}
      <button onClick={() => selectTool('cursor')} title="Cursor" aria-label="Cursor">
        <img src={cursorIcon} alt="Cursor" style={{ width: 25, height: 25 }} />
      </button>

      {/* Pen */}
      <button onClick={() => selectTool("pen")} title="Pen" aria-label="Pen">
        <img src={penIcon} alt="Pen" style={{ width: 25, height: 25 }} />
      </button>

      {/* Highlighter (placeholder) */}
      <button onClick={() => selectTool("highlighter")} title="Highlighter" aria-label="Highlighter">
        <img src={highlightIcon} alt="Highlighter" style={{ width: 25, height: 25 }} />
      </button>

      {/* Eraser */}
      <button onClick={() => selectTool("eraser")} title="Eraser" aria-label="Eraser">
        <img src={eraserIcon} alt="Eraser" style={{ width: 25, height: 25 }} />
      </button>

      {/* Sticky Note (with palette) */}
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

      {/* Shapes */}
      <button onClick={() => selectTool("shapes")} title="Shapes" aria-label="Shapes">
        <img src={shapesIcon} alt="Shapes" style={{ width: 25, height: 25 }} />
      </button>

      {/* Text */}
      <button onClick={() => selectTool("text")} title="Text" aria-label="Text">
        <img src={textIcon} alt="Text" style={{ width: 25, height: 25 }} />
      </button>

      {/* Image */}
      <button onClick={() => selectTool("image")} title="Image" aria-label="Image">
        <img src={imageIcon} alt="Image" style={{ width: 25, height: 25 }} />
      </button>

      {/* Undo */}
      <button onClick={onUndo} title="Undo" aria-label="Undo">
        <img src={undoIcon} alt="Undo" style={{ width: 25, height: 25 }} />
      </button>

      {/* Redo */}
      <button onClick={onRedo} title="Redo" aria-label="Redo">
        <img src={redoIcon} alt="Redo" style={{ width: 25, height: 25 }} />
      </button>

      {/* Clear */}
      <button
        onClick={() => {
          if (window.confirm('Are you sure you want to clear the whiteboard? This action cannot be undone.')) {
            onClear();
          } else {
            console.log('Clear whiteboard action cancelled.');
          }
        }}
        title="Clear Whiteboard"
        aria-label="Clear Whiteboard"
      >
        <img src={clearIcon} alt="Clear" style={{ width: 25, height: 25 }} />
      </button>
    </div>
  );
}