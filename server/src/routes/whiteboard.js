// backend/routes/whiteboards.js

// This route responds to REST api calls from the front end to create a new whiteboard

const express = require("express");
const supabase = require("../config/supabase");
const verifyJWT = require("../middleware/verifyJWT"); //  auth middleware

const router = express.Router();

// POST /api/whiteboards
router.post("/", verifyJWT, async (req, res) => {
  const { name, parentId } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    // 1️ Insert file entry
    const { data: fileData, error: fileError } = await supabase
      .from("files")
      .insert([{ name, type: "whiteboard", owner: req.user.uid, parent_id: parentId || null }])
      .select();
    if (fileError) throw fileError;

    const file = fileData[0];

    // 2️ Insert whiteboard entry
    const { error: wbError } = await supabase
      .from("whiteboards")
      .insert([{ file_id: file.id, content: "[]" }]);
    if (wbError) throw wbError;

    // 3️ Respond with the created file (frontend uses it to update UI)
    res.status(201).json(file);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create whiteboard" });
  }
});

module.exports = router;
