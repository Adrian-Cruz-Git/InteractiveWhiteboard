import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabase";
import { useAuth } from "../contexts/useAuth";

export default function FileSystem() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState(null); // null = root
  const [breadcrumb, setBreadcrumb] = useState([]);         // [{id, name}...]

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

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm mb-6 space-x-2 text-gray-600">
        <button onClick={goRoot} className="hover:underline font-medium">
          Root
        </button>
        {breadcrumb.map((c, i) => (
          <span key={c.id} className="flex items-center space-x-2">
            <span>›</span>
            <button
              onClick={() => goToCrumb(i)}
              className="hover:underline font-medium"
            >
              {c.name}
            </button>
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex space-x-3 mb-6">
        <button
          onClick={createFolder}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow"
        >
          + Folder
        </button>
        <button
          onClick={createWhiteboard}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow"
        >
          + Whiteboard
        </button>
      </div>

      {/* Items */}
      <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <li
            key={item.id}
            onClick={() => openItem(item)}
            className="border rounded-lg shadow-sm px-4 py-6 flex flex-col items-center justify-center cursor-pointer hover:shadow-md hover:bg-gray-50 transition"
          >
            <div className="text-3xl mb-2">
              {item.type === "folder" ? "📁" : "📝"} {item.name}
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-gray-400 italic col-span-full text-center">
            No items here yet.
          </li>
        )}
      </ul>
    </div>
  );
}
