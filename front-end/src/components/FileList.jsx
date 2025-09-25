import { useEffect, useState } from "react";

export default function FileList({ token }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("http://localhost:5000/api/files", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch files: ${res.status}`);
      }

      const data = await res.json();
      setFiles(data);
    } catch (err) {
      console.error("Fetch files error:", err);
      setError(" Could not load files.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [token]);

  if (loading) return <p>Loading files...</p>;
  if (error) return <p>{error}</p>;

  return (
    <ul>
      {files.length > 0 ? (
        files.map((f) => (
          <li key={f.id}>
            <a href={f.url} target="_blank" rel="noopener noreferrer">
              {f.name}
            </a>
          </li>
        ))
      ) : (
        <p>No files uploaded yet.</p>
      )}
    </ul>
  );
}
