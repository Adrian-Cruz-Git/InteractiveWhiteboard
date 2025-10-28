const express = require("express");
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




// Create an invitation (owner/editor only)
router.post("/", async (req, res) => {
    const uid = getUid(req);
    const { boardId, email, permission } = req.body || {};
    if (!uid) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!boardId || !email || !permission) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: member, error: memberError } = await supabase.from("board_users").select("permission").eq("board_id", boardId).eq("user_id", uid).maybeSingle();

    if (memberError) {
        return res.status(500).json({ error: memberError.message });
    }

    if (!member || (member.permission !== "owner" && member.permission !== "editor")) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    // Create invitation
    const { data: invitation, error: invitationError } = await supabase.from("invitations").insert([{ board_id, email, permission }]).select().single();

    if (invitationError) {
        return res.status(500).json({ error: invitationError.message });
    }

    res.status(201).json(invitation);
});





// verify inviter is member with sufficient permission



// List invitations for a board (members only)




// Accept invitation by email (after login)


module.exports = router;