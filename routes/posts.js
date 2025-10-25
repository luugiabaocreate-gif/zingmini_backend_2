import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { verifyToken } from "../middleware/auth.js";
import Post from "../models/Post.js";

const router = express.Router();

// Cloudinary setup
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// ====================== UPLOAD CONFIG (Cloudinary) ======================
const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: "zingmini_posts",
    resource_type: file.mimetype.startsWith("video/") ? "video" : "image",
  }),
});

const upload = multer({ storage });

// ====================== LẤY TẤT CẢ BÀI ĐĂNG ======================
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "name avatar")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error("❌ Lỗi khi tải bài viết:", err);
    res.status(500).json({ message: "Lỗi khi tải bài viết" });
  }
});

// ====================== TẠO BÀI ĐĂNG MỚI ======================
router.post("/", verifyToken, upload.single("media"), async (req, res) => {
  try {
    console.log("📩 Body:", req.body);
    console.log("📎 File:", req.file);

    if (!req.user?.id) {
      return res.status(401).json({ message: "Thiếu token hoặc token sai!" });
    }

    if (!req.body.content && !req.file) {
      return res.status(400).json({ message: "Thiếu nội dung hoặc file!" });
    }

    const file = req.file || {};
    let imageUrl = null;
    let videoUrl = null;

    if (file && file.mimetype) {
      if (file.mimetype.startsWith("video/")) {
        videoUrl = file.path;
      } else if (file.mimetype.startsWith("image/")) {
        imageUrl = file.path;
      } else {
        // file khác: pdf, docx, zip...
        imageUrl = file.path;
      }
    }

    const newPost = new Post({
      user: req.user.id,
      content: req.body.content || "",
      image: imageUrl,
      video: videoUrl,
      createdAt: new Date(),
    });

    await newPost.save();
    const populated = await newPost.populate("user", "name avatar");
    res.status(201).json(populated);
  } catch (err) {
    console.error("🔥 Lỗi đăng bài:", err);
    res.status(500).json({ message: "Không thể đăng bài", error: err.message });
  }
});

export default router;
