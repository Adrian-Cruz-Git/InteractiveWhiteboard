const express = require("express");
const multer = require("multer");
const { db, bucket } = require("../config/firebase");
const verifyJWT = require("../middleware/verifyJWT");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload file
router.post("/upload", verifyJWT, upload.single("file"), async (req, res) => {
    try {
        const userId = req.user;
        const file = req.file;

        const blob = bucket.file(`${userId}/${Date.now()}_${file.originalname}`);
        const blobStream = blob.createWriteStream({ resumable: false });

        blobStream.on("error", (err) => res.status(500).send({ error: err.message }));
        blobStream.on("finish", async () => {
            const fileUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

            const fileDoc = await db.collection("users")
                .doc(userId)
                .collection("files")
                .add({
                    name: file.originalname,
                    url: fileUrl,
                    uploadedAt: new Date(),
                });

            res.status(201).json({ id: fileDoc.id, name: file.originalname, url: fileUrl });
        });

        blobStream.end(file.buffer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// List files
router.get("/", verifyJWT, async (req, res) => {
    try {
        const userId = req.user;
        const snapshot = await db.collection("users").doc(userId).collection("files").get();

        const files = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(files);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
