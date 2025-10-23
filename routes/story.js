import express from "express";
import multer from "multer";
import Story from "../models/Story.js";
import { verifyToken } from "../middleware/auth.js";
import path from "path";
import fs from "fs";

const router = express.Router();

// cấu hình multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/stories";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "_" + file.originalname;
    cb(null, unique);
  },
});

const upload = multer({ storage });

// === POST /api/story/upload ===
router.post("/upload", verifyToken, upload.single("media"), async (req, res) => {
  try {
    const fileUrl = `/uploads/stories/${req.file.filename}`;
    const type = req.file.mimetype.startsWith("video") ? "video" : "image";
    const story = await Story.create({
      userId: req.user.id,
      mediaUrl: fileUrl,
      type,
    });
    res.json({ success: true, story });
  } catch (err) {
    console.error("Error uploading story:", err);
    res.status(500).json({ message: "Lỗi tải story" });
  }
});

// === GET /api/story ===
router.get("/", async (req, res) => {
  try {
    const stories = await Story.find()
      .populate("userId", "name avatar")
      .sort({ createdAt: -1 });
    res.json(stories);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy story" });
  }
});

export default router;
