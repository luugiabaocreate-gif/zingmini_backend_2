import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// === Cấu hình Multer để upload ảnh ===
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// === Lấy danh sách người dùng ===
router.get("/", verifyToken, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách người dùng" });
  }
});

// === Cập nhật thông tin người dùng (tên, avatar, v.v.) ===
router.put("/:id", verifyToken, upload.single("avatar"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    let avatarUrl;

    if (req.file) {
      avatarUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.avatar) {
      avatarUrl = req.body.avatar;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { ...(name && { name }), ...(avatarUrl && { avatar: avatarUrl }) },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.json(updatedUser);
  } catch (err) {
    console.error("Lỗi khi cập nhật user:", err);
    res.status(500).json({ message: "Lỗi server khi cập nhật thông tin" });
  }
});

export default router;
