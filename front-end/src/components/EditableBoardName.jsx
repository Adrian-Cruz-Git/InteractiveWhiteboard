import { useState } from "react";

export default function EditableBoardName({ initialName, onNameChange }) {
  const [name, setName] = useState(initialName);
  const [isEditing, setIsEditing] = useState(false);

  const handleBlur = () => {
    setIsEditing(false);
    // onNameChange?.(name); // future API hook
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
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
      }}
    >
      {isEditing ? (
        <input
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
        <h2
          style={{
            fontSize: "16px",
            margin: 0,
            cursor: "text",
            userSelect: "none",
          }}
          onClick={() => setIsEditing(true)}
        >
          {name || "Untitled Board"}
        </h2>
      )}
    </div>
  );
}
