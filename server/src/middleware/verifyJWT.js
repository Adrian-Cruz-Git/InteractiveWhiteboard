const jwt = require("jsonwebtoken");
require("dotenv").config();

// Middleware function to verify JWT in request headers

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.sendStatus(401); // Unauthorized if no auth header
    console.log("Auth Header: ", authHeader); //testing // look like "Bearer token"
    const token = authHeader.split(' ')[1]; // Split "Bearer token" and get token part
    //Verfiy token
    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET, // Secret used to sign the token // Check token against it
        (err, decoded) => { // Callback function - err if invalid, decoded if valid
            if (err) return res.sendStatus(403); // Invalid token - 403 Forbidden
            req.user = decoded.username; // Add username to request object
            next(); // Pass to next middleware or route handler
        }
    );

}
//Export the middleware
module.exports = verifyJWT;