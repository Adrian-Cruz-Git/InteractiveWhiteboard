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
    const error = new Error("Not found");
    error.status = 404;
    throw error;
  }
  if (!role) {
    const error = new Error("Forbidden");
    error.status = 403;
    throw error;
  }
  return role; // "owner" | "editor" | "viewer"
}





async function assertEditor(fileId, uid) {
  const role = await assertAnyAccess(fileId, uid);
  if (role === "viewer") {
    const error = new Error("Insufficient permissions");
    error.status = 403;
    throw error;
  }
  return role;
}






// GET /api/whiteboards/:fileId
router.get('/:fileId', async (req, res) => {
  try {

    const uid = getUid(req);
    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { fileId } = req.params;
    await assertAnyAccess(fileId, uid);

    const { data, error } = await supabase.from('whiteboards').select('content').eq('file_id', fileId).single();
    if (error || !data) {
      return res.status(400).json({ error: error.message });
    }

    return res.json(data || { content: [] });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
});

// PUT /api/whiteboards/:fileId  body: { content }
router.put('/:fileId/content', async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { fileId } = req.params;
    const { content } = req.body;

    await assertEditor(fileId, uid);

    // Check if the row exists
    const { data: existing, existingError } = await supabase.from("whiteboards").select("file_id").eq("file_id", fileId).maybeSingle();

    if (existingError) {
      return res.status(400).json({ error: existingError.message });
    }

    // q = update or insert
    let query;
    if (existing) {
      // Update existing row
      query = supabase.from("whiteboards").update({ content }).eq("file_id", fileId);
    } else {
      // In case the row wasn't created yet (should normally exist from /api/files/whiteboards)
      query = supabase.from("whiteboards").insert({ file_id: fileId, content });
    }

    const { error } = await query;
    if (error) {
      return res.status(400).json({ error: error.message });
    }


    return res.json(data);
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
});

module.exports = router;
