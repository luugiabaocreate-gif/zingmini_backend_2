import express from "express";
import Message from "../models/Message.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Lưu tin nhắn
router.post("/", verifyToken, async (req, res) => {
  try {
    const { from, to, text } = req.body;
    const msg = new Message({ from, to, text });
    await msg.save();
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lưu tin nhắn" });
  }
});

// Lấy lịch sử chat
router.get("/:from/:to", verifyToken, async (req, res) => {
  try {
    const { from, to } = req.params;
    const msgs = await Message.find({
      $or: [
        { from, to },
        { from: to, to: from },
      ],
    }).sort({ createdAt: 1 });
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ message: "Không tải được lịch sử chat" });
  }
});

export default router;
