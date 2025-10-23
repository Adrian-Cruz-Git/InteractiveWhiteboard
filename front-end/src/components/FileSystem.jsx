import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {api} from "../config/api";
import { useAuth } from "../contexts/useAuth";
import "./FileSystem.css";

export default function FileSystem() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState(null); // null = root
  const [breadcrumb, setBreadcrumb] = useState([]);         // [{id, name}...]
  const [workingId, setWorkingId] = useState(null);         // item currently being deleted

  const loadItems = async (folderId = null) => {
    setLoading(true);
    try {
      const qs = folderId ? `?parent_id=${encodeURIComponent(folderId)}` : `?parent_id=null`;
      const data = await api(`/files${qs}`);
      setItems(data || []);
      if (folderId) {
        const trail = await api(`/files/breadcrumb/${folderId}`);
        setBreadcrumb([{ id: null, name: "Root" }, ...trail]);
      } else {
        setBreadcrumb([{ id: null, name: "Root" }]);
      }
    } catch (e) {
      console.error("Error fetching items:", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems(currentFolder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentFolder]);

  const createFolder = async () => {
    const name = prompt("Folder name:");
    if (!name?.trim()) return;
    try {
      await api(`/files/folders`, { method: "POST", body: { name, parent_id: currentFolder } });
      loadItems(currentFolder);
    } catch (e) {
      console.error("Error creating folder:", e.message);
    }
  };

  const createWhiteboard = async () => {
    const name = prompt("Whiteboard name:");
    if (!name?.trim()) return;
    try {
      const created = await api(`/files/whiteboards`, { method: "POST", body: { name, parent_id: currentFolder } });
      loadItems(currentFolder);
      navigate(`/whiteboard/${created.id}`);
    } catch (e) {
      console.error("Error creating whiteboard:", e.message);
    }
  };

  const deleteItem = async (id) => {
    if (!confirm("Delete this item and all its contents?")) return;
    setWorkingId(id);
    try {
      await api(`/files/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch (e) {
      alert(e.message);
    } finally {
      setWorkingId(null);
    }
  };

  const renameItem = async (id, currentName) => {
    const name = prompt("New name:", currentName);
    if (!name || name === currentName) return;
    try {
      await api(`/files/${id}`, { method: "PATCH", body: { name } });
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, name } : it)));
    } catch (e) { alert(e.message); }
  };


  const openItem = (item) => {
    if (item.type === "folder") {
      setCurrentFolder(item.id);
    }
    if (item.type === "whiteboard") {
      navigate(`/whiteboard/${item.id}`);
    }
  };

 return (
    <div className="file-system">
      <div className="fs-toolbar">
        <button onClick={() => setCurrentFolder(null)}>Root</button>
        <button onClick={createFolder}>+ Folder</button>
        <button onClick={createWhiteboard}>+ Whiteboard</button>
      </div>

      <div className="fs-breadcrumb">
        {breadcrumb.map((b, i) => (
          <span key={b.id ?? 'root'} onClick={() => setCurrentFolder(b.id)}>
            {b.name}{i < breadcrumb.length - 1 ? " / " : ""}
          </span>
        ))}
      </div>

      {loading ? <div>Loading...</div> : (
        <ul className="fs-grid">
          {items.map((item) => (
            <li key={item.id} className={`fs-item fs-${item.type}`}>
              <div className="fs-item-main" onDoubleClick={() => openItem(item)}>
                <div className="fs-item-name">{item.name}</div>
              </div>
              <div className="fs-item-actions">
                <button onClick={() => renameItem(item.id, item.name)}>Rename</button>
                <button disabled={workingId === item.id} onClick={() => deleteItem(item.id)}>
                  {workingId === item.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
