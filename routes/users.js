import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách người dùng" });
  }
});

// === Cập nhật thông tin người dùng (tên, avatar, v.v.) ===
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatar } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, avatar },
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
