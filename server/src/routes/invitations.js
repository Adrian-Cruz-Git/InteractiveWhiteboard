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
            if (token && token.user_id){
                return token.user_id;
            }
        } catch {
            // ignore
        }
    }
    return null;
}




// Create an invitation (owner/editor only)



// verify inviter is member with sufficient permission



// List invitations for a board (members only)




// Accept invitation by email (after login)


module.exports = router;