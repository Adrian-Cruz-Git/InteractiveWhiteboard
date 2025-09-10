import { useEffect, useState } from "react";

export default function FileList({ token }) {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const fetchFiles = async () => {
      const res = await fetch("http://localhost:5000/api/files", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles(await res.json());
    };
    fetchFiles();
  }, [token]);

  return (
    <ul>
      {files.map(f => (
        <li key={f.id}>
          <a href={f.url} target="_blank" rel="noopener noreferrer">
            {f.name}
          </a>
        </li>
      ))}
    </ul>
  );
}
// - //         <button onClick={handleGoogleLogin} className="login-button red-btn">