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

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: "zingmini_uploads" },
});

const upload = multer({ storage });

// Lấy tất cả bài đăng
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().populate("user", "name avatar").sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi tải bài viết" });
  }
});

// Tạo bài đăng mới
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const newPost = new Post({
      user: req.user.id,
      content: req.body.content,
      image: req.file ? req.file.path : null,
    });
    await newPost.save();
    const populated = await newPost.populate("user", "name avatar");
    res.status(201).json(populated);
  } catch (err) {
    console.error("Lỗi đăng bài:", err);
    res.status(500).json({ message: "Không thể đăng bài" });
  }
});

export default router;
