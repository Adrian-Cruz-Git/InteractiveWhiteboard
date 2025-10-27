const express = require("express")
const router = express.Router();
router.use(express.json());
const supabase = require("../config/supabase");





// helper: get uid from req.user (if any) or from Authorization header (dev)
function getUid(req) {
  if (req.user && req.user.uid) {
    return req.user.uid;
  }

  const auth = req.headers.authorization || "";

  if (auth.startsWith("Bearer ")) {
    return auth.slice(7);
  }

  return null;
}




// ensure that a user has a root folder, return its id
async function ensureRoot(uid) {
  // Try user_roots first
  const { data: ur, error: urErr } = await supabase
    .from("user_roots").select("root_id").eq("owner", uid).single();
  if (!urErr && ur) return ur.root_id;

  // Look for an existing root-like row (folder with parent_id null)
  const { data: existingRoot } = await supabase.from("files").select("id").eq("owner", uid).is("parent_id", null).eq("type", "folder").single();

  let rootId = existingRoot?.id;

  if (!rootId) {
    // Create a new root folder
    const { data: root, error: rootErr } = await supabase.from("files").insert({ name: "Root", type: "folder", owner: uid, parent_id: null }).select().single();

    if (rootErr) {
      throw rootErr;
    }

    rootId = root.id;
  }

  // Upsert user_roots
  const { error: upErr } = await supabase.from("user_roots").upsert({ owner: uid, root_id: rootId }, { onConflict: "owner" });
  if (upErr) {
    throw upErr;
  }

  return rootId;
}





// the helper function for deletion
// recursive function that goes through if there are any folders within the folder 
async function deleteRecursively(fileId) {
  // find children
  const { data: children, error: childrenError } = await supabase.from("files").select("id, type").eq("parent_id", fileId);

  if (childrenError) {
    throw childrenError;
  }

  for (const child of children || []) {
    if (child.type === "folder") {
      await deleteRecursively(child.id);
    } else if (child.type === "whiteboards") {
      await supabase.from("whiteboard").delete().eq("file_id", child.id);
      await supabase.from("sticky_notes").delete().eq("file_id", child.id);
    }
  }

  const { error } = await supabase.from("files").delete().eq("id", fileId);

  if (error) {
    throw error;
  }
}





// GET /api/files?parent_id=...
router.get("/", async (req, res) => {
  //parent id for finding files through user

  const uid = getUid(req);
  let parent_id = req.query.parent_id ?? null;
  console.log(parent_id);

  // unauthorized if no uid
  if (!uid) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // ensure root folder exists if no parent_id provided
  if (parent_id === undefined || parent_id === null || parent_id === "" || parent_id === "null") {
    try {
      parent_id = await ensureRoot(uid);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }

  /// Base query: restrict to items owned by the user
  const { data, error } = await supabase.from("files").select("*").eq("owner", uid).eq("parent_id", parent_id).order("type", { ascending: true }).order("name", { ascending: true });

  // respond with data or error
  if (error){
    console.log(error.message);
    return res.status(400).json({ error: error.message });
  } 
  res.json(data || []);
});





// GET /api/files/breadcrumb/:id
router.get("/breadcrumb/:id", async (req, res) => {
  const id = req.params.id;
  const trail = [];
  let current = id;

  // loop until we reach the root
  while (current) {
    // supabase call to find the files inside thats eq to the file id of the user
    const { data, error } = await supabase.from("files").select("id,name,parent_id").eq("id", current).single();

    if (error) {
      console.log(error.message);
      return res.status(400).json({ error: error.message });
    }

    // prepend to trail
    trail.unshift({ id: data.id, name: data.name });
    current = data.parent_id;
  }
  res.json(trail);
});





// POST /api/files/folders
router.post("/folders", async (req, res) => {
  const uid = getUid(req);

  // unauthorized if no uid
  if (!uid) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let { name, parent_id } = req.body;

  if (!name) {
    return res.status(400).json({ error: "name and parent Id required" });
  }

  if (parent_id === undefined || parent_id === null || parent_id === "" || parent_id === "null") {
    try {
      parent_id = await ensureRoot(uid);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }

  // insert folder into files table
  const { data, error } = await supabase.from("files").insert({ name, parent_id, type: "folder", owner: uid }).select().single();
  if (error) {
    console.log(error.message);
    return res.status(400).json({ error: error.message });
  }
  res.status(201).json(data);
});





// POST /api/files/whiteboards
router.post("/whiteboards", async (req, res) => {
  const uid = getUid(req);
  if (!uid) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  let { name, parent_id } = req.body;

  if (!name) {
    return res.status(400).json({ error: "name required" });
  }

  if (parent_id === undefined || parent_id === null || parent_id === "" || parent_id === "null") {
    try {
      parent_id = await ensureRoot(uid);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }

  // insert into files and whiteboards table 
  const { data: file, error: filError } = await supabase.from("files").insert({ name, parent_id, type: "whiteboard", owner: uid }).select().single();

  if (filError) {
    console.log(filError.message);
    return res.status(400).json({ error: filError.message });
  }

  // create corresponding whiteboard entry
  const { error: wbError } = await supabase.from("whiteboards").insert({ file_id: file.id, content: [] });

  if (wbError) {
    console.log(wbError.message);
    return res.status(400).json({ error: wbError.message });
  }

  res.status(201).json(file);
});





// PUT /api/files/:id/rename
router.put("/:id/rename", async (req, res) => {
  const uid = getUid(req);

  if (!uid) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const id = req.params.id;
  const { name } = req.body;
  const { error } = await supabase.from("files").update({ name }).eq("id", id).eq("owner", uid);

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.json({ ok: true });
});






// delete files
router.delete("/:id", async (req, res) => {
  const uid = getUid(req)
  if (!uid) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // find the item first
  const { data: item, error: findErr } = await supabase.from("files").select("id, owner, type").eq("id", req.params.id).single();

  if (findErr) {
    return res.status(400).json({ error: findErr.message });
  }

  if (item.owner !== uid) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // proceed to delete recursively
  try {
    await deleteRecursively(req.params.id);
    res.json({ ok: true })

  } catch (errors) {
    res.status(400).json({ error: errors.message });
  }
});




module.exports = router;