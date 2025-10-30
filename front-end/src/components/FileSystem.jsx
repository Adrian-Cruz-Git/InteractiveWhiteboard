import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../config/api";
import { useAuth } from "../contexts/useAuth";
import "./FileSystem.css";

export default function FileSystem() {
  const { user, loading: authLoading, sessionReady } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [workingId, setWorkingId] = useState(null);
  const [creating, setCreating] = useState(false);

  const loadBreadcrumb = useCallback(async (folderId) => {
    try {
      const trail = await api(`/files/breadcrumb/${folderId}`);
      setBreadcrumb(trail || []);
    } catch (e) {
      console.error("breadcrumb error:", e);
      setBreadcrumb([]);
    }
  }, []);

  const loadItems = useCallback(async (parentId = null) => {
    setLoading(true);
    try {
      // parentId: null → server will ensure root and return its children
      const qs = parentId === null || parentId === undefined || parentId === "null" ? "" : `?parent_id=${encodeURIComponent(parentId)}`;
      const list = await api(`/files${qs}`);
      setItems(list || []);

      // If we asked for explicit parent, show its breadcrumb
      // If null (root), server returned children of ensured root; grab first item’s parent if any,
      // else fallback to keeping current breadcrumb.
      if (parentId) {
        await loadBreadcrumb(parentId);
      } else if (Array.isArray(list) && list.length > 0) {
        // Try to infer parent from any child entry’s parent_id
        const inferredParent = list[0]?.parent_id ?? null;
        if (inferredParent) {
          await loadBreadcrumb(inferredParent);
        } else {
          setBreadcrumb([]); // brand new/empty root
        }

      } else {
        setBreadcrumb([]);
      }
    } catch (e) {
      console.error("list error:", e);
      setItems([]);
      setBreadcrumb([]);
    } finally {
      setLoading(false);
    }
  }, [loadBreadcrumb]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      return; // show nothing until logged in
    }

    if (!sessionReady) {
      return; // wait for session to be ready
    }

    loadItems(currentFolder);
  }, [authLoading, user, sessionReady, currentFolder, loadItems]);

  const enterFolder = async (folderId) => {
    setCurrentFolder(folderId);
    await loadItems(folderId);
  };


  const createFolder = async () => {
    const name = prompt("Folder name?");
    if (!name) {
      return;
    }
    setCreating(true);
    try {
      await api(`/files/folders`, { method: "POST", body: { name: name.trim(), parent_id: currentFolder ?? null }, });
      await loadItems(currentFolder);
    } catch (e) {
      alert(e.message || "Failed to create folder");
    } finally {
      setCreating(false);
    }
  };

  const createWhiteboard = async () => {
    const name = prompt("Whiteboard name?");
    if (!name) {
      return;
    }

    setCreating(true);
    try {
      const wbFile = await api(`/files/whiteboards`, { method: "POST", body: { name: name.trim(), parent_id: currentFolder ?? null }, });
      // Navigate straight into the whiteboard page
      if (wbFile?.id) {
        navigate(`/whiteboards/${wbFile.id}`);
      } else {
        await loadItems(currentFolder);
      }

    } catch (e) {
      alert(e.message || "Failed to create whiteboard");
    } finally {
      setCreating(false);
    }
  };

  const deleteItem = async (id) => {
    if (!confirm(`Delete "${name}" and all its contents?`)) {
      return;
    }

    setWorkingId(id);
    try {
      await api(`/files/${id}`, { method: "DELETE" });
      await loadItems(currentFolder);
    } catch (e) {
      alert(e.message || "Delete failed");
    } finally {
      setWorkingId(null);
    }
  };

  const renameItem = async (id, currentName) => {
    const name = prompt("New name:", oldName || "");
    const trimmed = (name || "").trim();
    if (!trimmed || trimmed === oldName) {
      return;
    }

    setWorkingId(id);
    try {
      await api(`/files/${id}/rename`, { method: "PUT", body: { name: trimmed }, });
      await loadItems(currentFolder);
    } catch (e) {
      alert(e.message || "Rename failed");
    } finally {
      setWorkingId(null);
    }
  };

  const openItem = (item) => {
    if (item.type === "folder") {
      enterFolder(item.id);
    } else if (item.type === "whiteboard") {
      navigate(`/whiteboards/${item.id}`);
    }
  };

  const goToCrumb = async (folderId) => {
    setCurrentFolder(folderId);
    await loadItems(folderId);
  };

  return (
    <div className="filesystem">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        {/* Root crumb */}
        <span
          className={`crumb ${!breadcrumb.length ? "active" : ""}`}
          onClick={() => goToCrumb(null)}
        >
          Root
        </span>
        {breadcrumb.map((c, i) => (
          <span key={c.id}>
            <span className="sep"> / </span>
            <span
              className={`crumb ${i === breadcrumb.length - 1 ? "active" : ""}`}
              onClick={() => goToCrumb(c.id)}
            >
              {c.name}
            </span>
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
                <button type="button" className="btn btn-small"
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

                {/* <button onClick={() => renameItem(item.id, item.name)}>Rename</button> */}
              </div>
            </li>
          );
        })}
        {items.length === 0 && <li className="empty">No items here yet.</li>}
      </ul>
    </div>
  );
}
