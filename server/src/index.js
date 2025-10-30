const http = require('http');
const express = require('express');
const cors = require("cors");
const cookieParser = require("cookie-parser");
const requireAuth = require("./middleware/firebaseAuth");

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/session', require('./routes/firebaseSession'));

// Comment out each route to find which one is broken
// console.log('Loading members route...');
// app.use("/api/files", requireAuth, require("./routes/members"));

console.log('Loading files route...');
app.use('/api/files', requireAuth, require('./routes/files'));

console.log('Loading whiteboards route...');
app.use('/api/whiteboards', requireAuth, require('./routes/whiteboards'));

console.log('Loading sticky-notes route...');
app.use('/api/sticky-notes', requireAuth, require('./routes/stickyNotes'));

console.log('Loading invitations route...');
app.use("/api/invitations", requireAuth, require("./routes/invitations"));

console.log('All routes loaded successfully!');

const PORT = process.env.NODE_PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});