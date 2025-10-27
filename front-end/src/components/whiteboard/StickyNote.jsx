import { useRef, useEffect } from "react";
import { useView } from "./ViewContext";

const cursorStyles = `
  @keyframes blink-animation {
    to { visibility: hidden; }
  }
  .blinking-cursor::after {
    content: '|';
    animation: blink-animation 1s steps(2, start) infinite;
    margin-left: 2px;
  }
  .sticky-note__close-button {
    position: absolute;
    top: 2px;
    right: 2px;
    background: #e74c3c;
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
    z-index: 1;
    padding: 0;
    line-height: 1;
  }
  .sticky-note__close-button:hover {
    background: #c0392b;
  }
`;

export default function StickyNote({
  id,
  x,
  y,
  w,
  h,
  color,
  text,
  autoFocus,
  activeTool,
  onRemove,
  onChangeText,
  onChangeSize,
  onDragMove,
  onDragEnd,
}) {
  const rootRef = useRef(null);
  const editorRef = useRef(null);
  const displayRef = useRef(null);
  const dragging = useRef(null);
  const { view } = useView();

  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = cursorStyles;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus();
    }
  }, [autoFocus]);

  // ResizeObserver - reports size in world units
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    let lastReportedSize = { w, h };

    const ro = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const rect = entry.target.getBoundingClientRect();
        
        // The element is scaled by view.scale via parent transform
        // So we need to divide by scale to get world units
        const scale = view?.scale ?? 1;
        const worldW = rect.width / scale;
        const worldH = rect.height / scale;

        const minW = 120;
        const minH = 100;

        const finalW = Math.max(worldW, minW);
        const finalH = Math.max(worldH, minH);

        const roundedW = Math.round(finalW);
        const roundedH = Math.round(finalH);

        // Only update if size actually changed (avoid infinite loops)
        if (roundedW !== lastReportedSize.w || roundedH !== lastReportedSize.h) {
          lastReportedSize = { w: roundedW, h: roundedH };
          onChangeSize?.(id, { w: roundedW, h: roundedH });
        }
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [id, onChangeSize, w, h, view?.scale]);

  // Drag handler
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const header = el.querySelector(".sticky-note__header");
    if (!header) return;

    const handleMouseDown = (e) => {
      // Only allow dragging with edit tool
      if (activeTool !== "edit") return;
      
      // console.log("Starting drag setup"); // debug
      e.stopPropagation();
      e.preventDefault();

      document.body.style.cursor = "grabbing";

      const scale = view?.scale ?? 1;
      const offsetX = view?.offsetX ?? 0;
      const offsetY = view?.offsetY ?? 0;

      // Convert screen position to world position
      const startWorldX = (e.clientX - offsetX) / scale;
      const startWorldY = (e.clientY - offsetY) / scale;

      dragging.current = {
        startWorldX,
        startWorldY,
        origX: x,
        origY: y,
      };

      // console.log("Dragging state set:", dragging.current); // debug
      // console.log("Adding event listeners"); //debug

      const handleMouseMove = (e) => {
        // console.log("MouseMove fired, dragging.current :", dragging.current); // debug
        if (!dragging.current) return;

        const scale = view?.scale ?? 1;
        const offsetX = view?.offsetX ?? 0;
        const offsetY = view?.offsetY ?? 0;

        const currWorldX = (e.clientX - offsetX) / scale;
        const currWorldY = (e.clientY - offsetY) / scale;

        // console.log("World coords:", { currWorldX, currWorldY }); // debug

        if (!Number.isFinite(currWorldX) || !Number.isFinite(currWorldY)) return;

        const dx = currWorldX - dragging.current.startWorldX;
        const dy = currWorldY - dragging.current.startWorldY;

        const nx = dragging.current.origX + dx;
        const ny = dragging.current.origY + dy;

        // console.log("Calling onDragMove with:", { nx, ny }); // debug
        onDragMove?.(id, { x: nx, y: ny });
      };

      const handleMouseUp = () => {
        // console.log("MouseUp fired"); //debug
        document.body.style.cursor = "default";

        if (dragging.current) {
          onDragEnd?.(id);
        }

        dragging.current = null;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    };

    header.addEventListener("mousedown", handleMouseDown);
    return () => {
      header.removeEventListener("mousedown", handleMouseDown);
    };
  }, [activeTool, id, onDragMove, onDragEnd, view, x, y]);

  const handleInput = (e) => {
    onChangeText?.(id, e.target.value);
  };

  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.innerText = text;
    }
  }, [text]);

  const handleFocus = () => {
    displayRef.current?.classList.add("blinking-cursor");
  };
  const handleBlur = () => {
    displayRef.current?.classList.remove("blinking-cursor");
  };

  const handleRemoveClick = (e) => {
    e.stopPropagation();
    onRemove?.(id);
  };

  return (
    <div
      ref={rootRef}
      onMouseDown={(e) => e.stopPropagation()}
      className="sticky-note"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: color,
        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
        borderRadius: 6,
        minWidth: 120,
        minHeight: 100,
        resize: "both",
        overflow: "hidden",
        userSelect: "text",
        cursor: activeTool === "edit" ? "grab" : "default",
      }}
    >
      <div
        className="sticky-note__header"
        style={{
          position: "relative",
          height: 18,
          cursor: activeTool === "edit" ? "move" : "default",
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          background: "rgba(0,0,0,0.06)",
        }}
      >
        <button
          className="sticky-note__close-button"
          onClick={handleRemoveClick}
          aria-label="Remove sticky note"
        >
          &times;
        </button>
      </div>

      <textarea
        ref={editorRef}
        value={text}
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{
          position: "absolute",
          top: 18,
          left: 0,
          width: "100%",
          height: "calc(100% - 18px)",
          padding: 8,
          opacity: 0.0001,
          resize: "none",
          color: "transparent",
          caretColor: "transparent",
          background: "transparent",
          border: "none",
          overflow: "hidden",
          font: "inherit",
          lineHeight: "inherit",
        }}
      />

      <div
        ref={displayRef}
        style={{
          position: "absolute",
          top: 18,
          left: 0,
          width: "100%",
          height: "calc(100% - 18px)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontSize: 14,
          lineHeight: 1.35,
          fontFamily: "system-ui, sans-serif",
          padding: 8,
          color: "#000",
          direction: "ltr",
          unicodeBidi: "embed",
          writingMode: "horizontal-tb",
          textAlign: "left",
          pointerEvents: "none",
        }}
      >
        {text}
      </div>
    </div>
  );
}