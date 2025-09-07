const express = require("express");
const multer = require("multer");
const verifyJWT = require("../middleware/verifyJWT");
const supabase = require("../config/supabase");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", verifyJWT, upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const filePath = `${req.user}/${Date.now()}_${file.originalname}`;

    const { error } = await supabase.storage
      .from("user-files")
      .upload(filePath, file.buffer, { contentType: file.mimetype });

    if (error) throw error;

    res.status(201).json({ path: filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
