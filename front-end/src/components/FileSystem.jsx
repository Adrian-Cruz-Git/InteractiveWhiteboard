import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabase";
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

  const deleteFolderRecursively = async (folderId) => {
    const { data: children, error } = await supabase
      .from("files")
      .select("id, type")
      .eq("parent_id", folderId);
    if (error) throw error;

    for (const child of children) {
      if (child.type === "folder") {
        await deleteFolderRecursively(child.id);
      } else {
        await supabase.from("whiteboards").delete().eq("file_id", child.id);
        await supabase.from("files").delete().eq("id", child.id);
      }
    }

    await supabase.from("files").delete().eq("id", folderId);
  };

  const loadItems = async (folderId = null) => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase.from("files").select("*").eq("owner", user.uid);
      query = folderId ? query.eq("parent_id", folderId) : query.is("parent_id", null);
      const { data, error } = await query.order("created_at", { ascending: true });
      if (error) throw error;
      setItems(data || []);
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
      const { data, error } = await supabase
        .from("files")
        .insert([{ name, type: "folder", owner: user.uid, parent_id: currentFolder || null }])
        .select();
      if (error) throw error;
      setItems((prev) => [...prev, data[0]]);
    } catch (e) {
      console.error("Error creating folder:", e.message);
    }
  };

  const createWhiteboard = async () => {
    const name = prompt("Whiteboard name:");
    if (!name?.trim()) return;
    try {
      const { data: fileData, error: fileError } = await supabase
        .from("files")
        .insert([{ name, type: "whiteboard", owner: user.uid, parent_id: currentFolder || null }])
        .select();
      if (fileError) throw fileError;
      const file = fileData[0];

      const { error: wbError } = await supabase
        .from("whiteboards")
        .insert([{ file_id: file.id, content: "[]" }]);
      if (wbError) throw wbError;

      setItems((prev) => [...prev, file]);
    } catch (e) {
      console.error("Error creating whiteboard:", e.message);
    }
  };

  const openItem = (item) => {
    if (item.type === "folder") {
      setBreadcrumb((b) => [...b, { id: item.id, name: item.name }]);
      setCurrentFolder(item.id);
    } else {
      navigate(`/whiteboard/${item.id}`);
    }
  };

  const goRoot = () => {
    setBreadcrumb([]);
    setCurrentFolder(null);
  };

  const goToCrumb = (idx) => {
    if (idx < 0) return goRoot();
    const target = breadcrumb[idx];
    setBreadcrumb(breadcrumb.slice(0, idx + 1));
    setCurrentFolder(target.id);
  };

  const handleDeleteWhiteboard = async (item, e) => {
    e?.stopPropagation?.();
    if (!user || !item) return;

    const itemName = item.name || "Untitled";
    const confirmed = window.confirm(
      item.type === "folder"
        ? `Delete folder “${itemName}” and all its contents?`
        : `Delete whiteboard “${itemName}”? This cannot be undone.`
    );
    if (!confirmed) return;

    setWorkingId(item.id);
    try {
      if (item.type === "folder") {
        await deleteFolderRecursively(item.id);
      } else {
        // delete content first (safe if none)
        const { error: wbErr } = await supabase
          .from("whiteboards")
          .delete()
          .eq("file_id", item.id);
        if (wbErr) throw wbErr;

        // delete file row (owner guard)
        const { error: fErr } = await supabase
          .from("files")
          .delete()
          .eq("id", item.id)
          .eq("owner", user.uid);
        if (fErr) throw fErr;
      }

      await loadItems(currentFolder);
    } catch (err) {
      console.error("Delete failed:", err.message);
      alert("Failed to delete. Please try again.");
    } finally {
      setWorkingId(null);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="filesystem">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <button onClick={goRoot}>Root</button>
        {breadcrumb.map((c, i) => (
          <span key={c.id}>
            {" › "}
            <button onClick={() => goToCrumb(i)}>{c.name}</button>
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="actions">
        <button onClick={createFolder} className="folder-btn">+ Folder</button>
        <button onClick={createWhiteboard} className="whiteboard-btn">+ Whiteboard</button>
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
                <div className="icon" aria-hidden>
                  {isFolder ? "📁" : "📝"}
                </div>
                <div className="name" title={item.name || "Untitled"}>
                  {item.name || "Untitled"}
                </div>
              </div>

              {/* Action buttons (Open / Delete) */}
              <div className="item-actions">
                <button
                  className="btn btn-small"
                  onClick={(e) => {
                    e.stopPropagation(); // prevent triggering openItem twice
                    openItem(item);
                  }}
                  disabled={isDeleting}
                  title={isFolder ? "Open folder" : "Open whiteboard"}
                >
                  Open
                </button>

                {/* Delete works for both whiteboards and folders */}
                <button
                  className="btn btn-small btn-danger"
                  onClick={(e) => handleDeleteWhiteboard(item, e)}
                  disabled={isDeleting}
                  title={isFolder ? "Delete folder and all contents" : "Delete whiteboard"}
                >
                  {isDeleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </li>
          );
        })}
        {items.length === 0 && <li className="empty">No items here yet.</li>}
      </ul>
    </div>
  );
}