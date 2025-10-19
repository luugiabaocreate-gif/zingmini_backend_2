// routes/comments.js
import express from "express";
import Post from "../models/Post.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// === Tạo bình luận cho bài viết ===
router.post("/:postId", verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const user = req.user;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Nội dung bình luận không được để trống." });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết." });

    const newComment = {
      user: user.id,
      userName: user.name || "Người dùng",
      text: text.trim(),
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();

    res.status(201).json({
      message: "Bình luận thành công!",
      comment: newComment,
      postId: post._id,
    });
  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ message: "Lỗi server khi thêm bình luận." });
  }
});

// === Lấy danh sách bình luận của bài viết ===
router.get("/:postId", verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết." });
    res.json({ comments: post.comments || [] });
  } catch (err) {
    console.error("Get comments error:", err);
    res.status(500).json({ message: "Lỗi server khi lấy bình luận." });
  }
});

export default router;
