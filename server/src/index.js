const http = require('http');
const express = require('express');
const { WebSocketServer } = require('ws');
const app = express(); // Create an instance of Express
const server = http.createServer(app); // Create an HTTP server using the Express app
const wsServer = new WebSocketServer({ server });
import cors from "cors"; // Rules for front end requests to back end
import { v4 as uuidv4 } from "uuid"; // For generating unique IDs (websoccket connections)




const PORT = process.env.NODE_PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// EXAMPLES
// Simple test route
app.get("/", (req, res) => {
  res.json({ message: "Hello from Express server " });
});

// Example API route
app.get("/api/data", (req, res) => {
  res.json({ items: ["apple", "banana", "cherry"] });
});


server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});



