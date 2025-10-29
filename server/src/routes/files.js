const express = require("express")
const router = express.Router();
router.use(express.json());


const supabase = require("../config/supabase");

const getUid = (req) => req.user?.uid;




// ensure that a user has a root folder, return its id
async function ensureRoot(uid) {
  // Try user_roots first
  const { data: userRoots, error: userRootsError } = await supabase.from("user_roots").select("root_id").eq("owner", uid).maybeSingle();


  if (!userRootsError && userRoots) {
    return ur.root_id;
  }

  if (userRoots?.root_id) {
    return userRoots.root_id;
  }

  // Look for an existing root-like row (folder with parent_id null)
  const { data: existingRoot, error: existingRootError } = await supabase.from("files").select("id").eq("owner", uid).is("parent_id", null).eq("type", "folder").maybeSingle();

  if (existingRootError) {
    throw existingRootError;
  }

  let rootId = existingRoot?.id;

  if (!rootId) {
    // Create a new root folder
    const { data: root, error: rootError } = await supabase.from("files").insert({ name: "Root", type: "folder", owner: uid, parent_id: null }).select().single();

    if (rootError) {
      throw rootError;
    }

    rootId = root.id;
  }

  // Upsert user_roots
  const { error: upsertUserError } = await supabase.from("user_roots").upsert({ owner: uid, root_id: rootId }, { onConflict: "owner" });
  if (upsertUserError) {
    throw upsertUserError;
  }

  return rootId;
}





// Check access: owner or shared via board_users(board_id)
async function accessRole(fileId, uid) {
  // Owner?
  const { data: file, error: fileError } = await supabase.from("files").select("id, owner").eq("id", fileId).single();

  if (fileError || !file) {
    return { role: null, found: false };
  }

  if (file.owner === uid) {
    return { role: "owner", found: true };
  }

  // Shared?
  const { data: BoardUsers, error: BoardUsersError } = await supabase.from("board_users").select("permission").eq("board_id", fileId).eq("user_id", uid).maybeSingle();

  if (BoardUsersError) {
    return { role: null, found: true };
  }

  if (BoardUsers?.permission) {
    return { role: BoardUsers.permission, found: true };
  }

  return { role: null, found: true };
}






// guard used by read/rename/delete where needed
async function assertOwnerOrMember(fileId, uid) {
  const { role, found } = await accessRole(fileId, uid);
  if (!found) {
    const e = new Error("Not found");
    e.status = 404;
    throw e;
  }
  if (!role) {
    const e = new Error("Forbidden");
    e.status = 403;
    throw e;
  }
  return role; // "owner" | "editor" | "viewer"
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
      await supabase.from("files").delete().eq("id", child.id);
    } else {
      // any other leaf type
      await supabase.from("files").delete().eq("id", child.id);
    }
  }

  const { error } = await supabase.from("files").delete().eq("id", fileId);

  if (error) {
    throw error;
  }
}






// GET /api/files/:id/permissions 
router.get("/:id/permissions", async (req, res) => {
  try {
    const uid = getUid(req);

    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const fileId = req.params.id;

    // find owner permissions
    const { data: dataOwner, error: ownerError } = await supabase.from("files").select("id, owner").eq("id", fileId).single();

    if (ownerError) {
      return res.status(400).json({ error: errorOwner.message });
    }

    if (!dataOwner) {
      return res.status(404).json({ error: "File not found" });
    }

    if (dataOwner.owner === uid) {
      return res.json({ permissions: "owner" });
    }

    const { data, error } = await supabase.from("board_users").select("permission").eq("board_id", fileId).eq("user_id", uid).maybeSingle();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (data?.permissions) {
      return res.json({ permissions: data.permissions }); // edit, view perms
    }

    return res.json({ permissions: none });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});





// GET /api/files?parent_id=...
router.get("/", async (req, res) => {
  try {
    //parent id for finding files through user
    const uid = getUid(req);

    // unauthorized if no uid
    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let parent_id = req.query.parent_id ?? null;


    // ensure root folder exists if no parent_id provided
    if (parent_id === undefined || parent_id === null || parent_id === "" || parent_id === "null") {
      parent_id = await ensureRoot(uid);
    }

    /// Base query: restrict to items owned by the user
    const { data, error } = await supabase.from("files").select("id, name, type, parent_id, owner").eq("parent_id", parent_id).order("type", { ascending: true }).order("name", { ascending: true });

    // respond with data or error
    if (error) {
      console.log(error.message);
      return res.status(400).json({ error: error.message });
    }

    const { data: userInvitedBoards, error: userInvitedBoardsError } = await supabase.from("board_users").select("board_id").eq("user_id", uid);

    if (userInvitedBoardsError) {
      return res.status(400).json({ error: userInvitedBoardsError.message });
    }

    const sharedIds = new Set((userInvitedBoards || []).map((r) => r.board_id));

    // Filter to items the user owns OR are explicitly shared
    const allowed = (children || []).filter((f) => f.owner === uid || sharedIds.has(f.id));

    return res.json(allowed);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});





// GET /api/files/breadcrumb/:id
router.get("/breadcrumb/:id", async (req, res) => {
  try {
    const uid = getUid(req);

    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const startId = req.params.id;

    // Must have access to the start node
    const role = await assertOwnerOrMember(startId, uid);

    const trail = [];
    let current = startId;

    // loop until we reach the root
    while (current) {
      // supabase call to find the files inside thats eq to the file id of the user
      const { data, error } = await supabase.from("files").select("id, name, parent_id").eq("id", current).single();

      if (error) {
        console.log(error.message);
        return res.status(400).json({ error: error.message });
      }

      // prepend to trail
      trail.unshift({ id: data.id, name: data.name });
      current = data.parent_id;
    }
    return res.json(trail);
  } catch (e) {
    const status = e.status || 500;
    return res.status(status).json({ error: e.message });
  }
});





// POST /api/files/folders
router.post("/folders", async (req, res) => {
  try {
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
      parent_id = await ensureRoot(uid);
    } else {
      await assertOwnerOrMember(parent_id, uid);
    }

    // insert folder into files table
    const { data, error } = await supabase.from("files").insert({ name, parent_id, type: "folder", owner: uid }).select().single();

    if (error) {
      console.log(error.message);
      return res.status(400).json({ error: error.message });
    }
    return res.status(201).json(data);
  } catch (e) {
    const status = e.status || 500;
    return res.status(status).json({ error: e.message });
  }
});





// POST /api/files/whiteboards
router.post("/whiteboards", async (req, res) => {
  try {
    const uid = getUid(req);

    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let { name, parent_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: "name required" });
    }

    if (parent_id === undefined || parent_id === null || parent_id === "" || parent_id === "null") {
      parent_id = await ensureRoot(uid);
    } else {
      await assertOwnerOrMember(parent_id, uid);
    }

    // insert into files and whiteboards table 
    const { data: file, error: filError } = await supabase.from("files").insert({ name, parent_id, type: "whiteboard", owner: uid }).select().single();

    if (filError) {
      console.log(filError.message);
      return res.status(400).json({ error: filError.message });
    }

    // create corresponding whiteboard entry
    const { error: whiteboardError } = await supabase.from("whiteboards").insert({ file_id: file.id, content: [] });

    if (whiteboardError) {
      console.log(whiteboardError.message);
      return res.status(400).json({ error: whiteboardError.message });
    }

    return res.status(201).json(file);
  } catch (e) {
    const status = e.status || 500;
    return res.status(status).json({ error: e.message });
  }
});





// PUT /api/files/:id/rename
router.put("/:id/rename", async (req, res) => {
  try {
    const uid = getUid(req);

    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const id = req.params.id;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "name required" });
    }

    const role = await assertOwnerOrMember(id, uid);

    if (role === "viewer") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    // proceed to rename
    const { error } = await supabase.from("files").update({ name }).eq("id", id).eq("id", id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ ok: true });
  } catch (e) {
    const status = e.status || 500;
    return res.status(status).json({ error: e.message });
  }
});






// GET /api/files/:id
router.get("/:id", async (req, res) => {

  const uid = getUid(req);

  if (!uid) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.params;
  await assertOwnerOrMember(id, uid);



  const { data, error } = await supabase.from("files").select("id, name, type, parent_id, owner").eq("id", id).single();

  if (error || !data) {
    return res.status(404).json({ error: "Not found" });
  }
  res.json(data);
});





// delete files
router.delete("/:id", async (req, res) => {
  try {
    const uid = getUid(req)

    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const id = req.params.id;

    // find the item first
    const { data: item, error: itemError } = await supabase.from("files").select("id, owner, type").eq("id", id).single();

    if (itemError) {
      return res.status(400).json({ error: itemError.message });
    }

    if (!item) {
      return res.status(404).json({ error: "Not found" });
    }

    if (item.owner !== uid) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // proceed to delete recursively
    await deleteRecursively(id);
    return res.json({ ok: true });
  } catch (e) {
    const status = e.status || 500;
    return res.status(status).json({ error: e.message });
  }
});




module.exports = router;