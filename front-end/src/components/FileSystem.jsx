import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../config/api";
import { useAuth } from "../contexts/useAuth";
import "./FileSystem.css";

export default function FileSystem() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [workingId, setWorkingId] = useState(null);

  // ---- minimal helper to add auth header to every call ----
  const withAuth = (init = {}) => ({
    ...init,

    // add auth header 
    headers: { ...(init.headers || {}), Authorization: `Bearer ${user?.uid || ""}` },
  });

  const loadItems = async (folderId = null) => {
    setLoading(true);
    try {
      const qs = folderId ? `?parent_id=${encodeURIComponent(folderId)}` : "";
      const data = await api(`/files${qs}`, withAuth());
      setItems(data || []);

      if (folderId) {
        const trail = await api(`/files/breadcrumb/${folderId}`, withAuth());
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
    if (!name?.trim()) {
      return;
    }
    try {
      const body = { name };

      if (currentFolder !== null) {
        body.parent_id = currentFolder;
      }

      await api(`/files/folders`, withAuth({ method: "POST", body: currentFolder === null ? { name } : { name, parent_id: currentFolder } }));
      loadItems(currentFolder);
    } catch (e) {
      console.error("Error creating folder:", e.message);
    }
  };

  const createWhiteboard = async () => {
    const name = prompt("Whiteboard name:");
    if (!name?.trim()) return;

    try {
      const body = { name };

      if (currentFolder !== null) {
        body.parent_id = currentFolder;
      }

      const created = await api(`/files/whiteboards`, withAuth({ method: "POST", body: currentFolder === null ? { name } : { name, parent_id: currentFolder } }));
      loadItems(currentFolder);
      if (created?.id) navigate(`/whiteboards/${created.id}`);
    } catch (e) {
      console.error("Error creating whiteboard:", e.message);
    }
  };

  const deleteItem = async (id) => {
    if (!confirm("Delete this item and all its contents?")) return;
    setWorkingId(id);
    try {
      await api(`/files/${id}`, withAuth({ method: "DELETE" }));
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
      await api(`/files/${id}/rename`, withAuth({ method: "PUT", body: { name } }));
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, name } : it)));
    } catch (e) {
      alert(e.message);
    }
  };

  const openItem = (item) => {
    if (item.type === "folder") {
      setCurrentFolder(item.id);
    }
    if (item.type === "whiteboard") { // dont fuk with the naming shits confusing af
      console.log("Navigating to whiteboard", item.id);
      navigate(`/whiteboards/${item.id}`);
    }
  };

  const goRoot = () => {
    setCurrentFolder(null);
    setBreadcrumb([{ id: null, name: "Root" }]);
  };

  const goToCrumb = (i) => {
    const target = breadcrumb[i];
    setCurrentFolder(target?.id ?? null);
    setBreadcrumb(breadcrumb.slice(0, i + 1));
  };

  return (
    <div className="filesystem">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <button type="button" onClick={goRoot}>Root</button>
        {breadcrumb.map((c, i) => (
          <span key={c.id}>
            {" › "}
            <button type="button" onClick={() => goToCrumb(i)}>{c.name}</button>
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="actions">
        <button type="button" onClick={createFolder} className="folder-btn">+ Folder</button>
        <button type="button" onClick={createWhiteboard} className="whiteboard-btn">+ Whiteboard</button>
      </div>

      {/* Grid of items */}
      <ul className="items-grid">
        {items.map((item) => {
          const isFolder = item.type === "folder";
          const isDeleting = workingId === item.id;
          return (
            <li key={item.id} className="item-card">
              {/* Main clickable row */}
              <div className="item-row" onClick={() => openItem(item)}>
                <div className="icon" aria-hidden="true">
                  {isFolder ? "📁" : "📝"}
                </div>
                <div className="name" title={item.name || "Untitled"}>
                  {item.name || "Untitled"}
                </div>
              </div>

              {/* Action buttons */}
              <div className="item-actions">
                <button
                  type="button"
                  className="btn btn-small"
                  onClick={(e) => {
                    e.stopPropagation();
                    openItem(item);
                  }}
                  disabled={isDeleting}
                  title={isFolder ? "Open folder" : "Open whiteboard"}
                >
                  Open
                </button>

                <button
                  type="button"
                  className="btn btn-small btn-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteItem(item.id); {/* ← call the defined deleter */ }
                  }}
                  disabled={isDeleting}
                  title={isFolder ? "Delete folder and all contents" : "Delete whiteboard"}
                >
                  {isDeleting ? "Deleting…" : "Delete"}
                </button>

                <button onClick={() => renameItem(item.id, item.name)}>Rename</button>
              </div>
            </li>
          );
        })}
        {items.length === 0 && <li className="empty">No items here yet.</li>}
      </ul>
    </div>
  );
}
