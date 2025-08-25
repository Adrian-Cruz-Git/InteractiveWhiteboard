const http = require('http');
const express = require('express');
const { WebSocketServer } = require('ws');
const app = express(); // Create an instance of Express
const server = http.createServer(app); // Create an HTTP server using the Express app
const wsServer = new WebSocketServer({ server });

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});



