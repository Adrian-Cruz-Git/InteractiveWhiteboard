import React, { useState } from "react";
import TopNav from "../components/TopNav"; // import the navbar
import "./FilesPage.css";

function FilesPage() {
  const [files, setFiles] = useState([ // Replace with real file data later
    { id: 1, name: "Teaching" },
    { id: 2, name: "School" },
    { id: 3, name: "Notes/Presentation" },
  ]);

  const createNewFile = () => {
    const newFile = {
      id: Date.now(),
      name: `NewFile_${files.length + 1}.txt`,
    };
    setFiles([...files, newFile]);
  };

  return (
    <div className="files-page">
      {/* Navbar at top */}
      <TopNav />

      {/* Main content */}
      <div className="files-content">
        <h1>Files</h1>
        <button className="new-file-btn" onClick={createNewFile}>
          + Create New File
        </button>

        <ul className="file-list">
          {files.map((file) => (
            <li key={file.id} className="file-item">
              📄 {file.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default FilesPage;
