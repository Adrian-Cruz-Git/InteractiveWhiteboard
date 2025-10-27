import { useState, useRef, useEffect } from "react";

export default function EditableBoardName({ initialName, onNameChange }) {
  const [name, setName] = useState(initialName);
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef(null);

  // Automatically select all text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    onNameChange?.(name);
  };

  const handleKeyDown = (e) => { // Handle Enter and Escape keys , finish editing
    if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault();
      handleBlur();
    }
  };
  

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "4px 8px",
        position: "relative",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            fontSize: "16px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            padding: "4px 8px",
            width: "250px",
          }}
        />
      ) : (
        <div style={{ position: "relative" }}>
          <h2
            style={{
              fontSize: "16px",
              margin: 0,
              cursor: "text",
              userSelect: "none",
              transition: "color 0.2s",
              color: isHovered ? "#b8b8b8ff" : "white",
            }}
            onClick={() => setIsEditing(true)}
          >
            {name || "Untitled Board"}
          </h2>

          {/* Hover tooltip */}
          {isHovered && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: "0",
                background: "rgba(0,0,0,0.75)",
                color: "white",
                fontSize: "12px",
                padding: "4px 6px",
                borderRadius: "4px",
                marginTop: "4px",
                whiteSpace: "nowrap",
              }}
            >
              Click to rename
            </div>
          )}
        </div>
      )}
    </div>
  );
}
