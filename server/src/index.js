const http = require('http');
const express = require('express');
const cors = require("cors");
const cookieParser = require("cookie-parser");
const requireAuth = require("./middleware/firebaseAuth");


// Create an instance of Express
const app = express();
const server = http.createServer(app); // Create an HTTP server using the Express app


// Middleware
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true, credentials: true }));
app.use(express.json({ limit: "10mb" }))
app.use(cookieParser({ extended: true, limit: "10mb" }));

app.get('/api/health', (req, res) => res.json({ ok: true }));


app.use('/api/session', require('./routes/firebaseSession'));

app.use('/api/files', requireAuth, require('./routes/files'));
app.use('/api/whiteboards', requireAuth, require('./routes/whiteboards'));
app.use('/api/sticky-notes', requireAuth, require('./routes/stickyNotes'));
app.use("/api/invitations", requireAuth, require("./routes/invitations"));

// Allow requests from frontend
const PORT = process.env.NODE_PORT || 5000;


server.listen(PORT, (connections, req) => {

  console.log(`Server is listening on port ${PORT}`);

});
