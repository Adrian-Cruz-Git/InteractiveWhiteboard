import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabase";
import { useAuth } from "../contexts/useAuth";

export default function FileSystem() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState(null); // null = root
  const [breadcrumb, setBreadcrumb] = useState([]);         // [{id, name}...]

  const loadItems = async (folderId = null) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      let query = supabase.from("files").select("*").eq("owner", currentUser.uid);
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
  }, [currentUser, currentFolder]);

  const createFolder = async () => {
    const name = prompt("Folder name:");
    if (!name?.trim()) return;
    try {
      const { data, error } = await supabase
        .from("files")
        .insert([{ name, type: "folder", owner: currentUser.uid, parent_id: currentFolder || null }])
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
        .insert([{ name, type: "whiteboard", owner: currentUser.uid, parent_id: currentFolder || null }])
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

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-4">
      {/* Breadcrumbs */}
      <div className="text-sm mb-3">
        <button className="underline" onClick={goRoot}>Root</button>
        {breadcrumb.map((c, i) => (
          <span key={c.id}>
            {" "}›{" "}
            <button className="underline" onClick={() => goToCrumb(i)}>{c.name}</button>
          </span>
        ))}
      </div>

      <div className="space-x-2 mb-3">
        <button onClick={createFolder} className="bg-blue-500 text-white px-3 py-1 rounded">+ Folder</button>
        <button onClick={createWhiteboard} className="bg-green-600 text-white px-3 py-1 rounded">+ Whiteboard</button>
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="border rounded px-3 py-2 cursor-pointer hover:bg-gray-50"
            onClick={() => openItem(item)}
          >
            {item.type === "folder" ? "📁" : "📝"} {item.name}
          </li>
        ))}
        {items.length === 0 && <li className="text-gray-500">No items here yet.</li>}
      </ul>
    </div>
  );
}
