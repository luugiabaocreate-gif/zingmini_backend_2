// routes/comments.js
import express from "express";
import Comment from "../models/Comment.js"; // model ở /models/Comment.js
import Post from "../models/Post.js"; // nếu cần kiểm tra post tồn tại
import { authenticate } from "../middleware/auth.js"; // nếu bạn có middleware auth

const router = express.Router();

// Tạo comment mới
router.post("/", async (req, res) => {
  try {
    const { postId, text } = req.body;
    if (!postId || !text) return res.status(400).json({ message: "postId và text bắt buộc" });

    // (tuỳ backend) optional: kiểm tra post tồn tại
    // const post = await Post.findById(postId);
    // if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = new Comment({
      postId,
      text,
      user: req.user?._id || req.body.userId || null,
      userName: req.user?.name || req.body.userName || "Ẩn danh",
      createdAt: new Date(),
    });

    await comment.save();
    return res.status(201).json(comment);
  } catch (err) {
    console.error("Create comment error:", err);
    return res.status(500).json({ message: "Lỗi server khi tạo comment" });
  }
});

// Lấy comment theo post
router.get("/post/:postId", async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId }).sort({ createdAt: 1 }); // cũ->mới
    return res.json(comments);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// Tuỳ chọn: xoá comment
router.delete("/:id", async (req, res) => {
  try {
    const c = await Comment.findByIdAndDelete(req.params.id);
    if (!c) return res.status(404).json({ message: "Không tìm thấy comment" });
    return res.json({ message: "Đã xoá" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

export default router;
