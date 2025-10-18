import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import Post from "../models/Post.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Cấu hình multer storage để lưu file trực tiếp lên Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "zingmini_uploads",
    allowed_formats: ["jpg", "png", "jpeg", "gif", "mp4", "webm"],
    transformation: [{ quality: "auto" }],
  },
});

const upload = multer({ storage });

// ===================
// GET ALL POSTS
// ===================
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().populate("user").sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    console.error("Lỗi tải bài viết:", err);
    res.status(500).json({ message: "Lỗi server khi tải bài viết." });
  }
});

// ===================
// CREATE POST
// ===================
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const { content } = req.body;
    const user = req.user.id;

    const newPost = new Post({
      user,
      content,
      image: req.file ? req.file.path : null, // đường dẫn Cloudinary
    });

    await newPost.save();
    const populated = await newPost.populate("user");

    res.status(201).json(populated);
  } catch (err) {
    console.error("Lỗi tạo bài viết:", err);
    res.status(500).json({ message: "Lỗi server khi đăng bài." });
  }
});

// ===================
// DELETE POST (tùy chọn)
// ===================
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post)
      return res.status(404).json({ message: "Không tìm thấy bài viết." });
    if (post.user.toString() !== req.user.id)
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa bài này." });

    await post.deleteOne();
    res.status(200).json({ message: "Đã xóa bài viết." });
  } catch (err) {
    console.error("Lỗi xóa bài viết:", err);
    res.status(500).json({ message: "Lỗi server khi xóa bài viết." });
  }
});

export default router;
