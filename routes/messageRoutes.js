// routes/messageRoutes.js
import express from "express";
const router = express.Router();

// optional: saved messages endpoints if you want (left minimal)
router.get("/", (req, res) => res.json({ message: "messageRoutes alive" }));

export default router;
