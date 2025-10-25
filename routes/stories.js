import express from "express";
import { verifyToken } from "../middleware/auth.js";
import Story from "../models/Story.js";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinary } from "../utils/cloudinary.js";

const router = express.Router();

// === Cấu hình Cloudinary upload ===
const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: "zingmini_stories",
    resource_type: file.mimetype.startsWith("video/") ? "video" : "image",
  }),
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
    const fileUrl = req.file.path; // ✅ Cloudinary URL thật

    const story = await Story.create({
      userId: req.user.id,
      mediaUrl: fileUrl,
      type: isVideo ? "video" : "image",
      createdAt: new Date(),
      expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
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
