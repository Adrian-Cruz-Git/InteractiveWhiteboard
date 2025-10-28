const http = require('http');
const express = require('express');

// Create an instance of Express
const app = express();

const server = http.createServer(app); // Create an HTTP server using the Express app
//Cant use import syntax unless type: module in package.json
const cors = require("cors"); // Rules for front end requests to back end
const url = require("url");

const path = require('path');
const fs = require('fs');

// Allow requests from frontend
const PORT = process.env.NODE_PORT || 5001;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));


app.use('/api/files', require('./routes/files'));
app.use('/api/whiteboards', require('./routes/whiteboards'));
app.use('/api/sticky-notes', require('./routes/stickyNotes'));

//Websocket connection handling - (not ably)

server.listen(PORT, (connections, req) => {

  console.log(`Server is listening on port ${PORT}`);

});
