import express from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 5000;

// Allow requests from frontend
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

// 🔹 Upload endpoint
app.post("/api/files/upload", authMiddleware, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;

  res.json({
    id: req.file.filename,
    name: req.file.originalname,
    url: fileUrl,
  });
});

// 🔹 List files endpoint
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

  res.json(files);
});

// Start server
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});
