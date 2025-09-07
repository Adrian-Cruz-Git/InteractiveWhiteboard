// const jwt = require("jsonwebtoken");
// require("dotenv").config();

const { admin } = require("../config/firebase");

// Middleware function to verify JWT in request headers


async function verifyJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.sendStatus(401); // Unauthorized if no auth header
    console.log("Auth Header: ", authHeader); //testing // look like "Bearer token"
    const token = authHeader.split(' ')[1]; // Split "Bearer token" and get token part
    //Verfiy token
    /* 
    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET, // Secret used to sign the token // Check token against it
        (err, decoded) => { // Callback function - err if invalid, decoded if valid
            if (err) return res.sendStatus(403); // Invalid token - 403 Forbidden
            req.user = decoded.username; // Add username to request object
            next(); // Pass to next middleware or route handler
        }
    );
    */
    try {
        const decode = await admin.auth().verifyIdToken(token);
        req.user = decode;
        next();
    } catch (error) {
        console.error("Error verifying Firebase ID token:", error);
        return res.sendStatus(403); // Invalid token - 403 Forbidden
    }
}
//Export the middleware
module.exports = verifyJWT;