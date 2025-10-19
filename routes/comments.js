// routes/comments.js
import express from "express";
import Comment from "../models/Comment.js";
import Post from "../models/Post.js";

const router = express.Router();

// === Tạo comment mới ===
router.post("/", async (req, res) => {
  try {
    const { postId, text, userName, userId } = req.body;

    if (!postId || !text) {
      return res
        .status(400)
        .json({ message: "Thiếu postId hoặc nội dung bình luận" });
    }

    // (tuỳ chọn) kiểm tra bài viết tồn tại
    const postExists = await Post.findById(postId);
    if (!postExists) {
      return res.status(404).json({ message: "Bài viết không tồn tại" });
    }

    const comment = new Comment({
      postId,
      text,
      user: userId || null,
      userName: userName || "Ẩn danh",
    });

    await comment.save();
    return res.status(201).json(comment);
  } catch (err) {
    console.error("Lỗi khi tạo comment:", err);
    return res.status(500).json({ message: "Lỗi server khi lưu bình luận" });
  }
});

// === Tạo comment mới theo postId (cho frontend đang dùng) ===
router.post("/:postId", async (req, res) => {
  try {
    const { text, userName, userId } = req.body;
    const { postId } = req.params;

    if (!postId || !text) {
      return res
        .status(400)
        .json({ message: "Thiếu postId hoặc nội dung bình luận" });
    }

    const postExists = await Post.findById(postId);
    if (!postExists) {
      return res.status(404).json({ message: "Bài viết không tồn tại" });
    }

    const comment = new Comment({
      postId,
      text,
      user: userId || null,
      userName: userName || "Ẩn danh",
    });

    await comment.save();
    return res.status(201).json(comment);
  } catch (err) {
    console.error("Lỗi khi tạo comment theo postId:", err);
    return res.status(500).json({ message: "Lỗi server khi lưu bình luận" });
  }
});

// === Lấy tất cả comment của 1 bài viết ===
router.get("/post/:postId", async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId }).sort({
      createdAt: 1,
    }); // cũ -> mới
    return res.json(comments);
  } catch (err) {
    console.error("Lỗi khi tải comment:", err);
    return res.status(500).json({ message: "Không thể tải comment" });
  }
});

// === (tuỳ chọn) Xoá comment ===
router.delete("/:id", async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "Không tìm thấy comment" });
    }
    return res.json({ message: "Đã xoá bình luận" });
  } catch (err) {
    console.error("Lỗi khi xoá comment:", err);
    return res.status(500).json({ message: "Lỗi server khi xoá" });
  }
});

export default router;
