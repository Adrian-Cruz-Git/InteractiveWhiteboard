
const express = require("express");
const router = express.Router();

router.use(express.json());

const supabase = require("../config/supabase");


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



// --- MEMBERS API ---
// GET /api/files/:id/members  -> [{ user_id, email?, display_name?, permission }]
router.get("/:id/members", async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const boardId = req.params.id;

    // load file (to get owner) and ensure requester has any access
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("id, owner")
      .eq("id", boardId)
      .maybeSingle();
    if (fileErr) return res.status(400).json({ error: fileErr.message });
    if (!file)   return res.status(404).json({ error: "Not found" });

    // must be owner OR appear in board_users
    const { data: me, error: meErr } = await supabase
      .from("board_users")
      .select("permission")
      .eq("board_id", boardId)
      .eq("user_id", uid)
      .maybeSingle();
    if (meErr) return res.status(400).json({ error: meErr.message });
    const myRole = (uid === file.owner) ? "owner" : (me?.permission ?? null);
    if (!myRole) return res.status(403).json({ error: "Forbidden" });

    // shared members
    const { data: rows, error: listErr } = await supabase
      .from("board_users")
      .select("user_id, permission")
      .eq("board_id", boardId);
    if (listErr) return res.status(400).json({ error: listErr.message });

    // include owner
    const members = [
      { user_id: file.owner, permission: "owner", is_owner: true },
      ...(rows || []).map(r => ({
        user_id: r.user_id,
        permission: r.permission,
        is_owner: r.user_id === file.owner
      })),
    ];

    // try to enrich from Auth Admin, but never crash if not available
    const tryAdmin = !!(supabase?.auth?.admin?.getUserById);
    const enrich = async (id) => {
      if (!tryAdmin) return { email: null, display_name: null };
      try {
        const { data } = await supabase.auth.admin.getUserById(id);
        const u = data?.user;
        if (!u) return { email: null, display_name: null };
        const meta = u.user_metadata || {};
        return {
          email: u.email ?? null,
          display_name: meta.name || meta.full_name || meta.user_name || null,
        };
      } catch (e) {
        console.error("[members:getUserById]", e?.message || e);
        return { email: null, display_name: null };
      }
    };

    // enrich sequentially (sets are small); or batch parallel if you prefer
    const unique = [...new Set(members.map(m => m.user_id))];
    const info = {};
    for (const id of unique) info[id] = await enrich(id);

    const result = members.map(m => ({
      user_id: m.user_id,
      permission: m.permission,
      is_owner: m.is_owner,
      email: info[m.user_id].email,
      display_name: info[m.user_id].display_name,
    }));

    return res.json(result);
  } catch (e) {
    console.error("[GET /:id/members] fatal:", e);
    return res.status(e.status || 500).json({ error: e.message });
  }
});

// PUT /api/files/:id/members/:userId  { permission }
router.put("/:id/members/:userId", async (req, res) => {
    try {
        const uid = req.user?.uid;
        if (!uid) return res.status(401).json({ error: "Unauthorized" });

        const boardId = req.params.id;
        const targetUserId = req.params.userId;
        const { permission } = req.body || {};
        if (!["owner", "editor", "viewer"].includes(permission)) {
            return res.status(400).json({ error: "Invalid permission" });
        }

        // only owner/editor can change others
        const role = await assertOwnerOrMember(boardId, uid);
        if (role === "viewer") return res.status(403).json({ error: "Forbidden" });
        if (uid === targetUserId) return res.status(400).json({ error: "Cannot change your own role" });

        // owners can set owner/editor/viewer; editors should NOT be able to set owner
        if (role === "editor" && permission === "owner") {
            return res.status(403).json({ error: "Only owner can assign owner" });
        }

        // owner change requires updating files.owner instead of board_users
        if (permission === "owner") {
            const { error: upErr } = await supabase
                .from("files")
                .update({ owner: targetUserId })
                .eq("id", boardId);
            if (upErr) return res.status(400).json({ error: upErr.message });
            return res.json({ ok: true });
        }

        const { error } = await supabase
            .from("board_users")
            .upsert(
                { board_id: boardId, user_id: targetUserId, permission },
                { onConflict: "board_id,user_id" }
            );
        if (error) return res.status(400).json({ error: error.message });

        return res.json({ ok: true });
    } catch (e) {
        return res.status(e.status || 500).json({ error: e.message });
    }
});

// DELETE /api/files/:id/members/:userId
router.delete("/:id/members/:userId", async (req, res) => {
    try {
        const uid = req.user?.uid;
        if (!uid) return res.status(401).json({ error: "Unauthorized" });

        const boardId = req.params.id;
        const targetUserId = req.params.userId;

        const role = await assertOwnerOrMember(boardId, uid);
        if (role === "viewer") return res.status(403).json({ error: "Forbidden" });
        if (uid === targetUserId) return res.status(400).json({ error: "Cannot remove yourself" });

        const { error } = await supabase
            .from("board_users")
            .delete()
            .eq("board_id", boardId)
            .eq("user_id", targetUserId);

        if (error) return res.status(400).json({ error: error.message });
        return res.json({ ok: true });
    } catch (e) {
        return res.status(e.status || 500).json({ error: e.message });
    }
});

module.exports = router;
