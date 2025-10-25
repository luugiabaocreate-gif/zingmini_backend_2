import express from "express";
import multer from "multer";
import { verifyToken } from "../middleware/auth.js";
import Story from "../models/Story.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// === Tạo thư mục uploads/stories tuyệt đối theo __dirname ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadBase = path.join(__dirname, "../uploads/stories");
if (!fs.existsSync(uploadBase)) fs.mkdirSync(uploadBase, { recursive: true });

// === Multer config ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadBase);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "_" + file.originalname;
    cb(null, unique);
  },
});
const upload = multer({ storage });

// === POST /api/stories ===
router.post("/", verifyToken, upload.single("story"), async (req, res) => {
  console.log("🎬 Story upload body:", req.body);
  console.log("🎞 Uploaded story file:", req.file);

  try {
    if (!req.file) {
      return res.status(400).json({ message: "Không có file story!" });
    }

    const isVideo = req.file.mimetype.startsWith("video");
    const fileUrl = `/uploads/stories/${req.file.filename}`;

    const story = await Story.create({
      userId: req.user.id,
      mediaUrl: fileUrl,
      type: isVideo ? "video" : "image",
      createdAt: new Date(),
      expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // hết hạn sau 24h
    });

    console.log("✅ Story created:", story);
    res.json({ success: true, story });
  } catch (err) {
    console.error("🔥 Lỗi khi tải story:", err);
    res
      .status(500)
      .json({ message: "Không thể tải story", error: err.message });
  }
});

// === GET /api/stories ===
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
