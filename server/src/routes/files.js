const express = require("express");
const multer = require("multer");
const verifyJWT = require("../middleware/verifyJWT");
const supabase = require("../config/supabase");
const { db } = require("../config/firebase");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });


 //Debug route
 
router.get("/test", (req, res) => {
  res.json({ message: " Upload route is working" });
});
// file route
router.post("/upload", verifyJWT, upload.single("file"), async (req, res) => {
  try {
    // Check: file exists
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: "Unauthorized: no user info" });
    }

    const file = req.file;
    const filePath = `${req.user}/${Date.now()}_${file.originalname}`;

    console.log(`[UPLOAD] User: ${req.user.uid}, File: ${file.originalname}`);

    // upload to supabase
    const { error: supabaseError } = await supabase.storage
      .from("user-files")
      .upload(filePath, file.buffer, { contentType: file.mimetype });

    if (supabaseError) {
      console.error("Supabase error:", supabaseError);
      return res.status(500).json({ error: "Failed to upload file" });
    }

    await db.collection("users").doc(req.user.uid).collection("files").add({
      name: file.originalname,
      path: filePath,
      type: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
    });

    res.status(201).json({ message: "File uploaded", path: filePath });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Unexpected server error" });
  }
});

// List files for the logged-in user
router.get("/files", verifyJWT, async (req, res) => {
  try {
    const { data, error } = await supabase.storage
      .from("user-files")
      .list(req.user.uid, {
        limit: 100, // limit for safety
        offset: 0,
      });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
