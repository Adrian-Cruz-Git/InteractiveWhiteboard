const http = require('http');
const express = require('express');
const app = express(); // Create an instance of Express
const server = http.createServer(app); // Create an HTTP server using the Express app

//Cant use import syntax unless type: module in package.json
const cors = require("cors"); // Rules for front end requests to back end
const { v4: uuidv4 } = require("uuid"); // For generating unique IDs (websoccket connections)
const url = require("url");


// server.js
const whiteboardRoutes = require("./routes/whiteboard");


app.use("/api/whiteboards", whiteboardRoutes);

// Allow requests from frontend



const PORT = process.env.NODE_PORT || 5000;

// Middleware
app.use(cors());



server.listen(PORT, (connections, req) => {

  console.log(`Server is listening on port ${PORT}`);

});


