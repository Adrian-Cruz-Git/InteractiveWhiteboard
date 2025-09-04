const { admin } = require("../config/firebase");
require("dotenv").config();

// Middleware function to verify JWT in request headers

const verifyJWT = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) return res.sendStatus(401); // Unauthorized if no auth header

    console.log("Auth Header: ", authHeader); //testing // look like "Bearer token"
    const token = authHeader.split(' ')[1]; // Split "Bearer token" and get token part

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken.uid; // Firebase UID
        next();
    } catch (err) {
        console.error("JWT verification failed:", err);
        res.sendStatus(403);
    }

}
//Export the middleware
module.exports = verifyJWT;