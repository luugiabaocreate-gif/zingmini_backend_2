import express from "express";
import multer from "multer";
import { verifyToken } from "../middleware/auth.js";
import Story from "../models/Story.js";
import path from "path";
import fs from "fs";

const router = express.Router();

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

// POST /api/stories
router.post("/", verifyToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Thiếu file story!" });
    }
    const type = req.file.mimetype.startsWith("video") ? "video" : "image";
    const fileUrl = `/uploads/stories/${req.file.filename}`;
    const story = await Story.create({
      userId: req.user.id,
      mediaUrl: fileUrl,
      type,
      createdAt: new Date(),
      expireAt: Date.now() + 24 * 60 * 60 * 1000, // auto-expire 24h
    });
    res.json({ success: true, story });
  } catch (err) {
    console.error("🔥 Lỗi khi tải story:", err);
    res.status(500).json({ message: "Không thể tải story", error: err.message });
  }
});

// GET /api/stories
router.get("/", async (req, res) => {
  try {
    const stories = await Story.find()
      .populate("userId", "name avatar")
      .sort({ createdAt: -1 });
    res.json(stories);
  } catch (err) {
    console.error("🔥 Lỗi lấy story:", err);
    res.status(500).json({ message: "Không thể lấy story" });
  }
});

export default router;
