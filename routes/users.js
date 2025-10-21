import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// === Cấu hình Multer để upload ảnh ===
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
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

    console.log("📩 PUT /api/users/:id body:", req.body);
    console.log("📸 req.file:", req.file);

    let avatarUrl = null;

    // ✅ Nếu có file upload thì tạo HTTPS URL tuyệt đối (Render yêu cầu)
    if (req.file && req.file.filename) {
      const baseUrl = `https://${req.get("host")}`; // ép luôn HTTPS
      avatarUrl = `${baseUrl}/uploads/${req.file.filename}`;
      console.log("✅ Uploaded avatar:", avatarUrl);
    } else if (req.body.avatar) {
      avatarUrl = req.body.avatar;
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (avatarUrl) updateData.avatar = avatarUrl;

    if (Object.keys(updateData).length === 0)
      return res.status(400).json({ message: "Không có dữ liệu để cập nhật." });

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    }).select("-password");

    if (!updatedUser)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    console.log("🎉 Avatar updated OK:", updatedUser.avatar);

    // ✅ Trả kết quả rõ ràng cho frontend
    res.json({
      success: true,
      avatar: updatedUser.avatar,
      user: updatedUser,
    });
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật user:", err);
    res.status(500).json({ message: "Lỗi server khi cập nhật thông tin" });
  }
});

export default router;
