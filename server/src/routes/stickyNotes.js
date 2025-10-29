const express = require('express');
const router = express.Router();
router.use(express.json());

const supabase = require('../config/supabase');

const getUid = (req) => req.user?.uid;


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





async function assertAnyAccess(fileId, uid) {
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





async function assertEditor(fileId, uid) {
  const role = await assertAnyAccess(fileId, uid);
  if (role === "viewer") {
    const e = new Error("Insufficient permissions");
    e.status = 403;
    throw e;
  }
  return role;
}





// Helper to get a note and its file_id
async function getNoteWithFile(noteId) {
  const { data: note, error } = await supabase
    .from("sticky_notes")
    .select("id, file_id, x, y, w, h, text, color, created_at, updated_at")
    .eq("id", noteId)
    .single();
  return { note, error };
}





// GET /api/sticky-notes?fileId=...
router.get("/:fileId", async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { fileId } = req.params;
    await assertAnyAccess(fileId, uid);


    const { data, error } = await supabase.from("sticky_notes").select("id, file_id, x, y, w, h, text, color, created_at, updated_at").eq("file_id", fileId).order("created_at", { ascending: true });
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json(data || []);
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
});

// POST /api/sticky-notes
router.post("/", async (req, res) => {
  try {
    const uid = getUid(req);

    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { file_id, x, y, w, h, text = "", color = "#FFD966" } = req.body || {};

    if (!file_id || x === undefined || y === undefined || w === undefined || h === undefined) {
      return res.status(400).json({ error: "file_id, x, y, w, h are required" });
    }

    await assertEditor(file_id, uid);


    const { data, error } = await supabase.from("sticky_notes").insert({ file_id, x, y, w, h, text, color }).select().single();
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json(data);
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
});

// PATCH /api/sticky-notes/:id
router.put("/:id", async (req, res) => {
  try {
    const uid = getUid(req);

    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const { note, error: readError } = await getNoteWithFile(id);

    if (readError) {
      return res.status(400).json({ error: readError.message });
    }

    if (!note) {
      return res.status(404).json({ error: "Not found" });
    }

    await assertEditor(note.file_id, uid);

    const patch = {};
    for (const k of ["x", "y", "w", "h", "text", "color"]) {
      if (req.body[k] !== undefined) {
        patch[k] = req.body[k];
      }
    }

    if (!Object.keys(patch).length) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const { error } = await supabase.from("sticky_notes").update(patch).eq("id", id);
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ ok: true });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
});

// DELETE /api/sticky-notes/:id
router.delete("/:id", async (req, res) => {
  try {
    const uid = getUid(req);

    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const { note, error: readErr } = await getNoteWithFile(id);

    if (readErr) {
      return res.status(400).json({ error: readErr.message });
    }

    if (!note) {
      return res.status(404).json({ error: "Not found" });
    }

    await assertEditor(note.file_id, uid);


    const { error } = await supabase.from('sticky_notes').delete().eq('id', id);
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ ok: true });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
});

module.exports = router;
