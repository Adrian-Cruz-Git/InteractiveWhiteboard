const express = require("express");
const crypto = require("crypto");
const router = express.Router();
router.use(express.json());

const supabase = require("../config/supabase");
const getUid = (req) => req.user?.uid;
const getEmail = (req) => req.user?.email;

async function assertOwnerOrEditor(boardId, uid) {
    // owner?
    const { data: file } = await supabase.from("files").select("owner").eq("id", boardId).single();
    if (file?.owner === uid) return "owner";
    // shared editor?
    const { data: bu } = await supabase.from("board_users").select("permission").eq("board_id", boardId).eq("user_id", uid).maybeSingle();
    if (bu?.permission === "editor") return "editor";
    const e = new Error("Forbidden"); e.status = 403; throw e;
}





/** POST /api/invitations  { board_id, email, permission } -> {link} */
router.post("/", async (req, res) => {
    try {
        const uid = getUid(req);
        if (!uid) return res.status(401).json({ error: "Unauthorized" });

        let { board_id, email, permission } = req.body || {};
        if (!board_id || !email || !permission) {
            return res.status(400).json({ error: "Missing fields" });
        }

        // normalize + validate
        email = String(email).trim().toLowerCase();
        if (!["editor", "viewer"].includes(permission)) {
            return res.status(400).json({ error: "Invalid permission" });
        }

        // Only owners/editors may invite
        await assertOwnerOrEditor(board_id, uid);

        // Prevent inviting yourself 
        if (email === (getEmail(req) || "").toLowerCase()) {
            return res.status(400).json({ error: "You cannot invite yourself" });
        }

        const token = crypto.randomBytes(24).toString("base64url");

        const { error } = await supabase.from("invitations").insert({ board_id, email, permission, token });

        if (error) {
            if (error.code === "23505") {
                return res.status(409).json({ error: "An invite is already pending for this email" });
            }
            return res.status(400).json({ error: error.message });
        }

        const base = process.env.CLIENT_ORIGIN || "http://localhost:5173";
        const link = `${base}/invite/${token}`;
        return res.status(201).json({ link, token });
    } catch (e) {
        return res.status(e.status || 500).json({ error: e.message });
    }
});





/** POST /api/invitations/accept { token } -> adds to board_users */
router.post("/accept", async (req, res) => {
    try {
        const uid = getUid(req);
        const email = (getEmail(req) || "").toLowerCase();
        if (!uid || !email) return res.status(401).json({ error: "Unauthorized" });

        const { token } = req.body || {};
        if (!token) return res.status(400).json({ error: "Missing token" });

        const { data: inv, error: invErr } = await supabase
            .from("invitations")
            .select("id, board_id, email, permission, expires_at, accepted")
            .eq("token", token)
            .maybeSingle();

        if (invErr || !inv) return res.status(404).json({ error: "Invalid invite" });
        if (inv.accepted) return res.json({ ok: true, alreadyAccepted: true });

        // check expiry
        if (inv.expires_at && new Date(inv.expires_at) < new Date()) {
            return res.status(410).json({ error: "Invite expired" });
        }

        // check email matches
        if (inv.email.toLowerCase() !== email) {
            return res.status(403).json({ error: "Invite email does not match your account" });
        }

        // Upsert membership
        const { error: upErr } = await supabase
            .from("board_users")
            .upsert(
                { board_id: inv.board_id, user_id: uid, permission: inv.permission },
                { onConflict: "board_id,user_id" }
            );
        if (upErr) return res.status(400).json({ error: upErr.message });

        // Mark as accepted (also set accepted_at if the column exists)
        const updates = { accepted: true };
        updates.accepted_at = new Date().toISOString();

        const { error: accErr } = await supabase
            .from("invitations")
            .update(updates)
            .eq("id", inv.id);
        if (accErr) return res.status(400).json({ error: accErr.message });

        return res.json({ ok: true, board_id: inv.board_id, permission: inv.permission });
    } catch (e) {
        return res.status(e.status || 500).json({ error: e.message });
    }
});





router.post("/promote-pending", async (req, res) => {
    try {
        const uid = req.user?.uid;
        const email = (req.user?.email || "").toLowerCase();
        if (!uid || !email) return res.status(401).json({ error: "Unauthorized" });

        // 1) find all *pending* invites for this email
        const { data: invites, error: invErr } = await supabase
            .from("invitations")
            .select("id, board_id, permission")
            .eq("email", email)
            .eq("accepted", false);

        if (invErr) return res.status(400).json({ error: invErr.message });
        if (!invites?.length) return res.json({ ok: true, accepted: 0, board_ids: [] });

        const boardIds = [];
        // 2) upsert membership for each invite
        for (const inv of invites) {
            const up = await supabase
                .from("board_users")
                .upsert(
                    { board_id: inv.board_id, user_id: uid, permission: inv.permission },
                    { onConflict: "board_id,user_id" }
                );
            if (up.error) return res.status(400).json({ error: up.error.message });

            const acc = await supabase
                .from("invitations")
                .update({ accepted: true /*, accepted_at: new Date().toISOString()*/ })
                .eq("id", inv.id);
            if (acc.error) return res.status(400).json({ error: acc.error.message });

            boardIds.push(inv.board_id);
        }

        return res.json({ ok: true, accepted: invites.length, board_ids: boardIds });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

module.exports = router;
