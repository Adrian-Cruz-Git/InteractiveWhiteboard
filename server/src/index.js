const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.NODE_PORT || 5000;

// Middleware

app.use(cors());
app.use(express.json());

//      Routes
const authRoutes = require("./routes/auth");
const fileRoutes = require("./routes/files");

// Public route - register and auth/login
app.use("/auth", require("./routes/auth"));

app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);


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



