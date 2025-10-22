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

// === Lấy thông tin 1 người dùng (GET /api/users/:id) ===
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    res.json({ success: true, user });
  } catch (err) {
    console.error("❌ Lỗi khi lấy user:", err);
    res.status(500).json({ message: "Lỗi server khi lấy thông tin user" });
  }
});

// === Cập nhật avatar hoặc thông tin người dùng ===
router.put("/:id", verifyToken, upload.single("avatar"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    console.log("🧩 PUT /api/users/:id body:", req.body);
    console.log("🧩 req.file:", req.file);

    let avatarUrl = null;

    // ✅ Nếu có file upload thì tạo URL tuyệt đối (Render yêu cầu có host)
    if (req.file && req.file.filename) {
      // ✅ Lưu path tương đối để không bị lỗi domain khi deploy
      avatarUrl = `/uploads/${req.file.filename}`;
      console.log("📸 Uploaded file path:", avatarUrl);
    } else if (req.body.avatar) {
      avatarUrl = req.body.avatar;
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (avatarUrl) updateData.avatar = avatarUrl;

    console.log("🧩 updateData:", updateData);

    if (Object.keys(updateData).length === 0)
      return res.status(400).json({ message: "Không có dữ liệu để cập nhật." });

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    }).select("-password");

    if (!updatedUser)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    console.log("✅ Avatar updated:", updatedUser.avatar);

    res.json({
      success: true,
      avatar: updatedUser.avatar || avatarUrl,
      user: updatedUser,
    });
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật user:", err);
    res.status(500).json({ message: "Lỗi server khi cập nhật thông tin" });
  }
});
// === [BỔ SUNG] Endpoint an toàn để frontend fetch avatar mới nhất ===
// Cho phép truy cập public để frontend (F5 / load lại trang) vẫn đồng bộ được avatar
router.get("/public/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    res.json({
      success: true,
      user,
      avatar: user.avatar,
    });
  } catch (err) {
    console.error("❌ Lỗi khi tải user công khai:", err);
    res.status(500).json({ message: "Lỗi server khi tải thông tin user" });
  }
});
export default router;
