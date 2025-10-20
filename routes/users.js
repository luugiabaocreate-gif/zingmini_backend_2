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

// === Cập nhật avatar hoặc thông tin người dùng ===
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

    // === Cập nhật avatar hoặc thông tin người dùng ===
    router.put(
      "/:id",
      verifyToken,
      upload.single("avatar"),
      async (req, res) => {
        try {
          const { id } = req.params;
          const { name } = req.body;

          // ✅ Ghi log để kiểm tra
          console.log("🧩 PUT /api/users/:id body:", req.body);
          console.log("🧩 req.file:", req.file);

          let avatarUrl = null;

          // Nếu có file upload thì tạo đường dẫn public
          if (req.file) {
            avatarUrl = `/uploads/${req.file.filename}`;
          } else if (req.body.avatar) {
            avatarUrl = req.body.avatar; // cho phép cập nhật bằng URL trực tiếp
          }

          // Chuẩn bị dữ liệu cập nhật
          const updateData = {};
          if (name) updateData.name = name;
          if (avatarUrl) updateData.avatar = avatarUrl;

          console.log("🧩 updateData:", updateData);

          // Nếu không có gì để cập nhật
          if (Object.keys(updateData).length === 0) {
            return res
              .status(400)
              .json({ message: "Không có dữ liệu để cập nhật." });
          }

          const updatedUser = await User.findByIdAndUpdate(id, updateData, {
            new: true,
          });

          if (!updatedUser) {
            return res
              .status(404)
              .json({ message: "Không tìm thấy người dùng" });
          }

          console.log("✅ Avatar updated:", updatedUser.avatar);

          // ✅ Trả về dữ liệu đầy đủ, bao gồm avatar
          res.json({
            success: true,
            avatar: updatedUser.avatar || null,
            user: updatedUser.toObject ? updatedUser.toObject() : updatedUser,
          });
        } catch (err) {
          console.error("❌ Lỗi khi cập nhật user:", err);
          res
            .status(500)
            .json({ message: "Lỗi server khi cập nhật thông tin" });
        }
      }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    console.log("✅ Avatar updated:", updatedUser.avatar);

    res.json({
      success: true,
      avatar: updatedUser.avatar,
      user: updatedUser.toObject ? updatedUser.toObject() : updatedUser,
    });
  } catch (err) {
    console.error("Lỗi khi cập nhật user:", err);
    res.status(500).json({ message: "Lỗi server khi cập nhật thông tin" });
  }
});

export default router;
