import express from "express";
import { verifyToken } from "../middleware/auth.js";
import Story from "../models/Story.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

const router = express.Router();
/* import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// === Tạo thư mục uploads/stories tuyệt đối theo __dirname ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadBase = path.join(__dirname, "../uploads/stories");
if (!fs.existsSync(uploadBase)) fs.mkdirSync(uploadBase, { recursive: true }); */

// === Multer config ===
/* const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadBase);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "_" + file.originalname;
    cb(null, unique);
  },
});
const upload = multer({ storage }); */

// cấu hình cloudinary (dùng env vars)
cloudinary.config({
  cloud_name: process.env.CLOUD_CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

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
    const fileUrl = req.file.path; // Cloudinary trả về URL đầy đủ ở req.file.path

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
