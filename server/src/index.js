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




const connections = {}; // Object to store user connections, using UUID as keys
const users = {}; // Object to store user information, using username as keys


const PORT = process.env.NODE_PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


//      Routes

// Public route - register and auth/login
app.use("/auth", require("./routes/auth"));


// Protected routes (must pass verifyJWT)
// app.use("/chat", verifyJWT, require("./routes/chatRoutes"));
// app.use("/users", verifyJWT, require("./routes/userRoutes"));


// EXAMPLES
// Simple test route
app.get("/", (req, res) => {
  res.json({ message: "Hello from Express server API is running " }); 
});

//Websocket connection handling - (not ably)

const broadcastUsers = () => {
  //Send message to all connected users except the sender
  Object.keys(connections).forEach(uuid => { // Iterate over all connections
    const connection = connections[uuid]; // Get the connection for the user
    const message = JSON.stringify(users); // Convert users object to JSON string for sending over WebSocket
    connection.send(message); // Send the message to the user
  });
}


const handleMessage = (bytes, uuid) => {
  //Copy object, and replace the state of the user with the new state
  const message = JSON.parse(bytes.toString()); // Convert bytes to string // Get bytes from the server
  const user = users[uuid]; // Get the user object using the UUID
  user.state = message; // Update the user's state with the new message , can do that here because only have one message type for now
  console.log(`Received message from ${user.username}:`, message); // Log the received message

  broadcastUsers();

  console.log(`${user.username} updated their state :, ${JSON.stringify(user.state)}`); // Log the updated state of the user
}



const handleClose = (uuid) => {
  console.log(`Client disconnected: ${users[uuid].username} ${uuid}`); // Log the disconnection of the user

  delete connections[uuid]; // Remove the connection from the connections object
  delete users[uuid]; // Remove the user from the users object

  broadcastUsers(); // Broadcast the updated users list to all remaining connections
}

// When client connects to sever
server.on('connection', async (connection, req) => {
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


