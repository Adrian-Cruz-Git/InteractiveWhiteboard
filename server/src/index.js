const http = require('http');
const express = require('express');
const { WebSocketServer } = require('ws');
const app = express(); // Create an instance of Express
const server = http.createServer(app); // Create an HTTP server using the Express app
const wsServer = new WebSocketServer({ server });
//Cant use import syntax unless type: module in package.json
const cors = require("cors"); // Rules for front end requests to back end
const { v4: uuidv4 } = require("uuid"); // For generating unique IDs (websoccket connections)
const url = require("url");

// -------------------------------------------
// Lots of old code in this file
// -------------------------------------------


// Allow requests from frontend

const connections = {}; // Object to store user connections, using UUID as keys
const users = {}; // Object to store user information, using username as keys


const PORT = process.env.NODE_PORT || 5000;

// Middleware
app.use(cors());

// Serve uploaded files as static
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Fake authentication middleware (replace with real token check)
function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

//  Upload endpoint
app.post("/api/files/upload", authMiddleware, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;

  res.json({
    id: req.file.filename,
    name: req.file.originalname,
    url: fileUrl,
  });
});

//  List files endpoint
app.get("/api/files", authMiddleware, (req, res) => {
  const fs = require("fs");
  const uploadDir = path.join(__dirname, "uploads");

  if (!fs.existsSync(uploadDir)) {
    return res.json([]);
  }

  const files = fs.readdirSync(uploadDir).map((filename) => ({
    id: filename,
    name: filename.split("-").slice(1).join("-"), // original name
    url: `http://localhost:${PORT}/uploads/${filename}`,
  }));


// api endpoint to respond to response to get all the users on a whiteboard permissions
// containts supabase call to select all from board_user table
//front end calls route /api/bourdUsers with the board ID , and we return all users with permissions for that board
app.get("/api/boardUsers", async (req, res) => {
  const { data, error } = await supabase
    .from("board_user")
    .select("*");

  if (error) {
    console.error("Error fetching board_user data:", error);
    return res.status(500).json({ error: "Failed to fetch data" });
  }

  res.json(data);
});

//another endpoint to upload a new board user permission
// Contains Supabase call to insert data into table board_user
// insert fields = id (uuid), board_id (uuid), user_id (text), permission (text: owner, editor, viewer)
app.post("/api/boardUsers", async (req, res) => {
  const { board_id, user_id, permission } = req.body; // Expecting these fields in the request body (from front end)
  const { data, error } = await supabase
    .from("board_user")
    .insert([{ board_id, user_id, permission }]);
  if (error) {
    console.error("Error inserting board_user data:", error);
    return res.status(500).json({ error: "Failed to insert data" });
  }
  res.status(201).json(data);
});



//Websocket connection handling - (not ably)
//OLD
const broadcastUsers = () => {
  //Send message to all connected users except the sender
  Object.keys(connections).forEach(uuid => { // Iterate over all connections
    const connection = connections[uuid]; // Get the connection for the user
    const message = JSON.stringify(users); // Convert users object to JSON string for sending over WebSocket
    connection.send(message); // Send the message to the user
  });
}

//OLD
const handleMessage = (bytes, uuid) => {
  //Copy object, and replace the state of the user with the new state
  const message = JSON.parse(bytes.toString()); // Convert bytes to string // Get bytes from the server
  const user = users[uuid]; // Get the user object using the UUID
  user.state = message; // Update the user's state with the new message , can do that here because only have one message type for now
  console.log(`Received message from ${user.username}:`, message); // Log the received message

  broadcastUsers();

  console.log(`${user.username} updated their state :, ${JSON.stringify(user.state)}`); // Log the updated state of the user
}


//OLD
const handleClose = (uuid) => {
  console.log(`Client disconnected: ${users[uuid].username} ${uuid}`); // Log the disconnection of the user

  delete connections[uuid]; // Remove the connection from the connections object
  delete users[uuid]; // Remove the user from the users object

  broadcastUsers(); // Broadcast the updated users list to all remaining connections
}

// OLD - george - not using ably - keeping track of connections (to the server) manually
// When client connects to sever
wsServer.on('connection', async (connection, req) => {
  const query = new URL(req.url, `http://${req.headers.host}`).searchParams; // Query passed by frontend, with firebase auth token
  const idToken = query.get("token");

  if (!idToken) {
    connection.close(4001, "No token provided");
    return;
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const username = decodedToken.email || decodedToken.uid; 

    const uuid = uuidv4();
    console.log(`New client connected: ${username} ${uuid}`);

    connections[uuid] = connection;
    users[uuid] = { username, state: {} };

    connection.on("message", message => handleMessage(message, uuid));
    connection.on("close", () => handleClose(uuid));

  } catch (err) {
    console.error("Invalid token", err);
    connection.close(4002, "Invalid token");
  }
});

//Testing
const uid = "test-user"; // Can be any string
const customToken = await admin.auth().createCustomToken(uid);
console.log("Custom token:", customToken);


server.listen(PORT, (connections, req) => {

  console.log(`Server is listening on port ${PORT}`);

});



