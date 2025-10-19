import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// Đăng ký
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email đã tồn tại" });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const user = new User({ name, email, password: hashed });
    await user.save();
    res.status(201).json({ message: "Đăng ký thành công" });
  } catch (err) {
    console.error("Đăng ký lỗi:", err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
});

// Đăng nhập
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Sai mật khẩu" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (err) {
    console.error("Đăng nhập lỗi:", err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
});

export default router;
