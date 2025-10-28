const http = require('http');
const express = require('express');
const cors = require("cors"); // Rules for front end requests to back end

// Create an instance of Express
const app = express();

const server = http.createServer(app); // Create an HTTP server using the Express app


// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));


app.use('/api/files', require('./routes/files'));
app.use('/api/whiteboards', require('./routes/whiteboards'));
app.use('/api/sticky-notes', require('./routes/stickyNotes'));
app.use('/api/invitations', require('./routes/invitations'));
app.use('/api/permissions', require('./routes/permissions'));

//Websocket connection handling - (not ably)

// Allow requests from frontend
const PORT = process.env.NODE_PORT || 5000;

server.listen(PORT, (connections, req) => {

  console.log(`Server is listening on port ${PORT}`);

});
