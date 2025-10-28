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
            if (token && token.user_id){
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

    const {} = await supabase.from("board_users").select("permission").eq("board_id", bpardId).eq("user_id", uid).maybeSingle();

    if (error){
        return res.status(500).json({ error: error.message });
    }

    res.json(data || {permission: null});
});

// list all users on a board



// update a member permissions for owner



module.exports = router;