import { useState } from "react";

export default function FileUpload({ token, refreshFiles }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const uploadFile = async () => {
    if (!file) {
      setMessage(" Please select a file first.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:5000/api/files/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed with status ${res.status}`);
      }

      setMessage("✅ File uploaded successfully!");
      refreshFiles(); // trigger list reload
    } catch (err) {
      console.error("Upload error:", err);
      setMessage(" Upload failed. Please try again.");
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={uploadFile}>Upload</button>
      {message && <p>{message}</p>}
    </div>
  );
}
