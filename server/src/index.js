const dotenv = require("dotenv");
dotenv.config();

const http = require('http');
const express = require('express');
const { WebSocketServer } = require('ws');
const app = express(); // Create an instance of Express
const server = http.createServer(app); // Create an HTTP server using the Express app
const wsServer = new WebSocketServer({ server });
//Cant use import syntax unless type: module in package.json
const cors = require("cors"); // Rules for front end requests to back end
const { v4 : uuidv4 } = require("uuid"); // For generating unique IDs (websoccket connections)

const uploadRoutes = require("./routes/files");


const PORT = process.env.NODE_PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


//      Routes

// Public route - register and auth/login
app.use("/auth", require("./routes/auth"));

app.use("/files", uploadRoutes);


// Protected routes (must pass verifyJWT)
// app.use("/chat", verifyJWT, require("./routes/chatRoutes"));
// app.use("/users", verifyJWT, require("./routes/userRoutes"));


// EXAMPLES
// Simple test route
app.get("/", (req, res) => {
  res.json({ message: "Hello from Express server API is running " });
});


server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});



