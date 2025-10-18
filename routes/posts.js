import express from "express";
import multer from "multer";
import path from "path";
import Post from "../models/Post.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + ext);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// auth middleware
async function authFromHeader(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: "Thiếu token" });
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User không tồn tại" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
}

// get posts
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error("get posts err", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// create post
router.post("/", authFromHeader, upload.single("image"), async (req, res) => {
  try {
    const { content } = req.body;
    const post = new Post({ user: req.user._id, content: content || "" });
    if (req.file) post.image = `/uploads/${req.file.filename}`;
    await post.save();
    const p = await Post.findById(post._id).populate("user", "name email");
    res.status(201).json(p);
  } catch (err) {
    console.error("create post err", err);
    res.status(500).json({ message: "Lỗi khi tạo bài" });
  }
});

export default router;
