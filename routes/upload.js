// routes/upload.js — ZingMini Upload (Cloudinary + Avatar Sync + Story)
import express from "express";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const router = express.Router();

// ===== Cloudinary config =====
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  secure: true,
});

// ===== Multer setup =====
const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: "zingmini_uploads",
    resource_type: file.mimetype.startsWith("video/") ? "video" : "image",
  }),
});
const upload = multer({ storage });

// ===== 1️⃣ Upload ảnh/video bài đăng =====
router.post("/media", upload.single("file"), async (req, res) => {
  try {
    if (!req.file?.path) return res.status(400).json({ success: false });
    res.json({
      success: true,
      url: req.file.path,
      type: req.file.mimetype,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false });
  }
});

// ===== 2️⃣ Upload avatar + cập nhật vào database =====
router.post("/avatar", upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file?.path) return res.status(400).json({ success: false });
    const userId = req.body.userId;

    // cập nhật ảnh đại diện
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: req.file.path },
      { new: true }
    );

    res.json({
      success: true,
      avatar: req.file.path,
      user: updatedUser,
    });
  } catch (err) {
    console.error("Avatar upload error:", err);
    res.status(500).json({ success: false });
  }
});

// ===== 3️⃣ Upload story =====
router.post("/story", upload.single("image"), async (req, res) => {
  try {
    if (!req.file?.path) return res.status(400).json({ success: false });

    // Tạo story tạm trong MongoDB
    const Story = mongoose.model(
      "Story",
      new mongoose.Schema({
        userId: String,
        imageUrl: String,
        createdAt: { type: Date, default: Date.now },
      })
    );

    const story = await Story.create({
      userId: req.body.userId,
      imageUrl: req.file.path,
    });

    res.json({ success: true, story });
  } catch (err) {
    console.error("Story upload error:", err);
    res.status(500).json({ success: false });
  }
});

export default router;
