const express = require("express");
const admin = require("../config/firebase");
const router = express.Router();

// POST /api/session/login
router.post("/login", async (req, res) => {
    try {
        const { idToken } = req.body || {};
        if (!idToken) {
            return res.status(400).json({ error: "idToken required" });
        }

        // Verify first to ensure it’s legit
        const decoded = await admin.auth().verifyIdToken(idToken, true);

        // Simpler: store the idToken itself for short-lived sessions:
        const sessionCookie = idToken;

        const isProd = process.env.NODE_ENV === "production";
        res.cookie("__session", sessionCookie, { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "lax", path: "/", });

        return res.json({ ok: true, uid: decoded.uid });
    } catch (e) {
        return res.status(401).json({ error: "Login failed" });
    }
});

/**
 * POST /api/session/logout
 * Clears the cookie
 */
router.post("/logout", (_req, res) => {
    res.clearCookie("__session", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", path: "/", });
    res.json({ ok: true });
});

module.exports = router;
