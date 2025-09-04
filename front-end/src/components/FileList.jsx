import { useEffect, useState } from "react";

export default function FileList({ token }) {
    const [files, setFiles] = useState([]);

    const loadFiles = async () => {
        const res = await fetch("http://localhost:5000/api/files", {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setFiles(data);
    };

    useEffect(() => { loadFiles(); }, [token]);

    return (
        <div>
            <h3>Your Files</h3>
            <ul>
                {files.map(f => (
                    <li key={f.id}>
                        <a href={f.url} target="_blank" rel="noopener noreferrer">{f.name}</a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
