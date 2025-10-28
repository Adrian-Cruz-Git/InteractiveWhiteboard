const express = require('express');
const router = express.Router();
router.use(express.json());
const supabase = require("../config/supabase");


// helper: get uid from req.user (if any) or from Authorization header (dev)
function getUid(req) {
    if (req.user && req.user.uid) return req.user.uid;
    const auth = req.headers.authorization || "";
    if (auth.startsWith("Bearer ")) {
        try {
            const token = JSON.parse(Buffer.from(auth.split(" ")[1].split(".")[1], "base64").toString());
            if (token && token.sub) {
                return token.sub;
            }
            if (token && token.user_id) {
                return token.user_id;
            }
        } catch {
            // ignore
        }
    }
    return null;
}




// get permissions for a given file and user
router.get('/me/:boardId', async (req, res) => {
    const uid = getUid(req);
    const { fileId } = req.params;
    if (!uid) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { } = await supabase.from("board_users").select("permission").eq("board_id", bpardId).eq("user_id", uid).maybeSingle();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json(data || { permission: null });
});

// list all users on a board
router.get("/:boardId", async (req, res) => {
    const uid = getUid(req);
    const { boardId } = req.params;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    // must be a member
    const { data: me, error: meErr } = await supabase.from("board_users").select("permission").eq("board_id", boardId).eq("user_id", uid).maybeSingle();
    if (meErr) return res.status(500).json({ error: meErr.message });
    if (!me) return res.status(403).json({ error: "Not a member" });

    const { data, error } = await supabase.from("board_users").select("user_id, permission, created_at").eq("board_id", boardId).order("created_at");
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// update a member permission (owner only)
router.post("/update", async (req, res) => {
    const uid = getUid(req);
    const { board_id, target_user_id, permission } = req.body || {};
    if (!uid) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (!board_id || !target_user_id || !permission) {
        return res.status(400).json({ error: "Missing fields" });
    }

    const { data: me, error: meErr } = await supabase.from("board_users").select("permission").eq("board_id", board_id).eq("user_id", uid).maybeSingle();
    if (meErr) {
        return res.status(500).json({ error: meErr.message });
    }
    
    if (!me || me.permission !== "owner") {
        return res.status(403).json({ error: "Only owner can change roles" });
    }

    const { data, error } = await supabase.from("board_users").update({ permission }).eq("board_id", board_id).eq("user_id", target_user_id).select().single();
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    res.json(data);
});

module.exports = router;