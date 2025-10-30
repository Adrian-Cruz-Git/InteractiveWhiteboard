const admin = require("../config/firebase");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const bearerToken = header.startsWith("Bearer ") ? header.slice(7) : null;
    const cookieToken = req.cookies?.__session || null;

    const idToken = cookieToken || bearerToken;
    if (!idToken) {
      return res.status(401).json({ error: "Missing auth token" });
    }

    const decoded = await admin.auth().verifyIdToken(idToken, true);
    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
      name: decoded.name || null,
    };
    return next();
  } catch (err) {
    // Token expired/invalid/etc.
    return res.status(401).json({ error: "Invalid or expired auth token" });
  }
}

module.exports = requireAuth;