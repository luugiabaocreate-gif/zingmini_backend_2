// routes/users.js
import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Lấy danh sách tất cả user
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi lấy danh sách user" });
  }
});

// Lấy thông tin chi tiết 1 user
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi lấy thông tin user" });
  }
});

export default router;
