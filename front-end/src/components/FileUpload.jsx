import { useState } from "react";

export default function FileUpload({ token, refreshFiles }) {
  const [file, setFile] = useState(null);

  const uploadFile = async () => {
    const formData = new FormData();
    formData.append("file", file);

    await fetch("http://localhost:5000/api/files/upload", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData,
    });

    refreshFiles();
  };

  return (
    <div>
      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <button onClick={uploadFile}>Upload</button>
    </div>
  );
}
//         <button onClick={handleGoogleLogin} className="login-button red-btn">