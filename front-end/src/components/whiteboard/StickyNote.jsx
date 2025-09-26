// StickyNote.jsx
// - Resizable via CSS (resize: both)
// - Drag via top handle
// - Text is black, LTR, and NOT reversed
// - Size updates via ResizeObserver
// - BIG FIX: We use a hidden textarea for all typing, and a visible,
//            mirrored div for display. This bypasses the contenteditable bug.
// - NEW FIX: Adds a visible blinking cursor to the display div when focused.

import { useRef, useEffect } from 'react';

// Define the blinking cursor styles
const cursorStyles = `
  @keyframes blink-animation {
    to {
      visibility: hidden;
    }
  }
  .blinking-cursor::after {
    content: '|';
    animation: blink-animation 1s steps(2, start) infinite;
    margin-left: 2px;
  }
  /* Style for the close button */
  .sticky-note__close-button {
    position: absolute;
    top: 2px;
    right: 2px;
    background: #e74c3c; /* Red background */
    color: white;
    border: none;
    border-radius: 4px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    z-index: 1; /* Ensure it's above other elements */
    padding: 0;
    line-height: 1;
  }
  .sticky-note__close-button:hover {
    background: #c0392b; /* Darker red on hover */
  }
`;

export default function StickyNote({
  id, x, y, w, h, color, text,
  boundsRef,
  autoFocus,
  onMove,
  onChangeSize,
  onChangeText,
  onRemove,
}) {
  const rootRef = useRef(null);
  const editorRef = useRef(null);
  const displayRef = useRef(null);
  const dragging = useRef(null);

  // Add a style tag for the cursor animation
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = cursorStyles;
    document.head.appendChild(styleEl);
    return () => document.head.removeChild(styleEl);
  }, []);

  // ---------- helpers ----------
  const clampToBounds = (nx, ny, el) => {
    const bounds = boundsRef?.current?.getBoundingClientRect?.();
    if (!bounds || !el) return { x: Math.max(0, nx), y: Math.max(0, ny) };
    const maxX = Math.max(0, bounds.width - el.offsetWidth);
    const maxY = Math.max(0, bounds.height - el.offsetHeight);
    return { x: Math.max(0, Math.min(nx, maxX)), y: Math.max(0, Math.min(ny, maxY)) };
  };

  const ancestorFlippedX = (el) => {
    let node = el?.parentElement;
    while (node && node !== document.documentElement) {
      const t = getComputedStyle(node).transform;
      if (t && t !== 'none') {
        if (t.startsWith('matrix3d(')) {
          const m = t.slice(9, -1).split(',').map(parseFloat);
          if (m[0] < 0) return true;
        } else if (t.startsWith('matrix(')) {
          const m = t.slice(7, -1).split(',').map(parseFloat);
          if (m[0] < 0) return true;
        } else if (/scaleX\(\s*-1\s*\)/.test(t) || /rotateY\(\s*180deg\s*\)/.test(t)) {
          return true;
        }
      }
      node = node.parentElement;
    }
    return false;
  };

  // ---------- apply initial position/size ----------
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
  }, [x, y, w, h]);

  // ---------- focus when created ----------
  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus();
    }
  }, [autoFocus]);

  // ---------- keep size via ResizeObserver ----------
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      const bounds = boundsRef?.current?.getBoundingClientRect?.();
      if (bounds) {
        let newW = Math.min(rect.width, bounds.width - (el.offsetLeft ?? 0));
        let newH = Math.min(rect.height, bounds.height - (el.offsetTop ?? 0));
        newW = Math.max(newW, 120);
        newH = Math.max(newH, 100);
        onChangeSize?.(id, { w: Math.round(newW), h: Math.round(newH) });
      } else {
        onChangeSize?.(id, { w: Math.round(rect.width), h: Math.round(rect.height) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [boundsRef, id, onChangeSize]);

  // ---------- drag via header, clamped ----------
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const header = el.querySelector('.sticky-note__header');
    if (!header) return;

    const onDown = (e) => {
      e.preventDefault();
      dragging.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: el.offsetLeft,
        origY: el.offsetTop,
      };
      document.addEventListener('mousemove', onMoveDoc, true);
      document.addEventListener('mouseup', onUpDoc, true);
    };

    const onMoveDoc = (e) => {
      if (!dragging.current) return;
      const dx = e.clientX - dragging.current.startX;
      const dy = e.clientY - dragging.current.startY;
      const nx = dragging.current.origX + dx;
      const ny = dragging.current.origY + dy;
      const clamped = clampToBounds(nx, ny, el);
      onMove?.(id, { x: Math.round(clamped.x), y: Math.round(clamped.y) });
    };

    const onUpDoc = () => {
      dragging.current = null;
      document.removeEventListener('mousemove', onMoveDoc, true);
      document.removeEventListener('mouseup', onUpDoc, true);
    };

    header.addEventListener('mousedown', onDown, true);
    return () => header.removeEventListener('mousedown', onDown, true);
  }, [boundsRef, id, onMove]);

  // ---------- FIX REVERSED TYPING ----------
  useEffect(() => {
    const el = rootRef.current;
    const displayEl = displayRef.current;
    if (!el || !displayEl) return;
    const flipped = ancestorFlippedX(el);

    if (flipped) {
      el.style.transform = 'scaleX(-1)';
      displayEl.style.transform = 'scaleX(-1)';
      displayEl.style.transformOrigin = 'right center';
    } else {
      el.style.transform = 'none';
      displayEl.style.transform = 'none';
      displayEl.style.transformOrigin = 'left center';
    }
  }, [boundsRef]);

  // ---------- text updates ----------
  const handleInput = (e) => {
    const newText = e.target.value;
    onChangeText?.(id, newText);
  };
  
  // This useEffect ensures the display div always shows the latest text
  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.innerText = text;
    }
  }, [text]);

  // Handle focus and blur to show/hide the cursor
  const handleFocus = () => {
    if (displayRef.current) {
      displayRef.current.classList.add('blinking-cursor');
    }
  };

  const handleBlur = () => {
    if (displayRef.current) {
      displayRef.current.classList.remove('blinking-cursor');
    }
  };

  const handleRemoveClick = (e) => {
    e.stopPropagation();
    onRemove?.(id);
  };

  return (
    <div
      ref={rootRef}
      className="sticky-note"
      style={{
        position: 'absolute',
        pointerEvents: 'auto',
        background: color,
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        borderRadius: 6,
        minWidth: 120,
        minHeight: 100,
        resize: 'both',
        overflow: 'hidden',
        userSelect: 'text',
      }}
    >
      {/* drag handle */}
      <div
        className="sticky-note__header"
        style={{
          position: 'relative',
          height: 18,
          cursor: 'move',
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          background: 'rgba(0,0,0,0.06)',
        }}
      >
        {/* REMOVE BUTTON */}
        <button
          className="sticky-note__close-button"
          onClick={handleRemoveClick}
          aria-label="Remove sticky note"
        >
          &times;
        </button>
      </div>
      {/* Hidden textarea for handling all input */}
      <textarea
        ref={editorRef}
        value={text}
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{
          position: 'absolute',
          top: 18, left: 0,
          width: '100%', height: 'calc(100% - 18px)',
          padding: 8,
          opacity: 0.0001,
          resize: 'none',
          color: 'transparent',
          caretColor: 'transparent',
          background: 'transparent',
          border: 'none',
          overflow: 'hidden',
          font: 'inherit',
          lineHeight: 'inherit',
        }}
      />
      {/* Visible div for displaying the text */}
      <div
        ref={displayRef}
        style={{
          position: 'absolute',
          top: 18, left: 0,
          width: '100%', height: 'calc(100% - 18px)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontSize: 14,
          lineHeight: 1.35,
          fontFamily: 'system-ui, sans-serif',
          padding: 8,
          color: '#000',
          direction: 'ltr',
          unicodeBidi: 'embed',
          writingMode: 'horizontal-tb',
          textAlign: 'left',
          pointerEvents: 'none',
        }}
      >
        {text}
      </div>
    </div>
  );
}