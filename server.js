// server.js — ZingMini Backend FINAL (Realtime + Auth Fix)
import express from "express";
import http from "http";
import cors from "cors"; // ✅ chỉ import 1 lần ở đây thôi
import dotenv from "dotenv";
import mongoose from "mongoose";
import Short from "./models/Short.js";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import messageRoutes from "./routes/messageRoutes.js";
import commentRoutes from "./routes/comments.js";
import uploadRoutes from "./routes/upload.js";
import storyRoutes from "./routes/stories.js";
// === VIDEO STORAGE FOR SHORTS ===
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

// ⚙️ Nạp biến môi trường TRƯỚC khi config Cloudinary
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// 🧪 Log kiểm tra khi khởi động server
console.log("✅ Cloudinary ready for:", process.env.CLOUD_NAME);

const storageVideo = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "zingmini_shorts",
    resource_type: "video", // 👈 Quan trọng: cho phép upload video
  },
});

const uploadShort = multer({ storage: storageVideo });

process.on("uncaughtException", (err) => console.error("🔥 Uncaught:", err));
process.on("unhandledRejection", (err) => console.error("🔥 Unhandled:", err));

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ========== Middlewares ==========

const allowedOrigins = [
  "https://zingmini-frontend-2.onrender.com",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed for this origin"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ✅ giúp multer đọc form-data chuẩn

// === Cho phép truy cập ảnh trong thư mục /uploads (Render friendly) ===
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đảm bảo tồn tại thư mục uploads (và con của nó)
const uploadDir = path.join(__dirname, "uploads");
const storyDir = path.join(uploadDir, "stories");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(storyDir)) fs.mkdirSync(storyDir);

// ⚙️ Cho phép Express phục vụ tĩnh từ thư mục uploads
app.use("/uploads", express.static(uploadDir, { fallthrough: true }));

// ========== MongoDB ==========
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ========== Routes ==========
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/stories", storyRoutes);
// === SHORT VIDEO API ===

// Tạo route upload short video
app.post("/api/uploadShort", uploadShort.single("video"), async (req, res) => {
  try {
    const videoUrl = req.file.path; // Đường dẫn video Cloudinary
    const { userId, userName, userAvatar, description } = req.body;

const short = await Short.create({
  userId: userId || null,
  userName: userName || "Người dùng",
  userAvatar: userAvatar || "https://i.pravatar.cc/150?u=guest",
  videoUrl,
  description,
  createdAt: new Date(),
});

    res.status(201).json({ success: true, short });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi upload short video" });
  }
});

// Lấy danh sách short video (mới nhất trước)
app.get("/api/getShorts", async (req, res) => {
  try {
    const shorts = await Short.find().sort({ createdAt: -1 });
    res.json(shorts);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi tải danh sách short" });
  }
});

// ========== Socket.IO (with JWT auth) ==========
const onlineUsers = new Map();

io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token || socket.handshake.query?.token || null;
    if (!token) return next(new Error("No token provided"));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    console.error("Socket auth error:", err.message);
    next(new Error("Authentication failed"));
  }
});

io.on("connection", (socket) => {
  console.log(`🟢 ${socket.userId} connected (${socket.id})`);
  onlineUsers.set(socket.userId, socket.id);
  // Gửi danh sách user online cho tất cả client (mảng id)
  io.emit("online_users", Array.from(onlineUsers.keys()));

  // Reaction realtime
  socket.on("reaction", (data) => {
    socket.broadcast.emit("reaction", data);
  });

  // Private chat realtime
  socket.on("private_chat", (msg) => {
    const targetId = msg.to;
    const targetSocket = onlineUsers.get(targetId);
    if (targetSocket) {
      io.to(targetSocket).emit("private_chat", msg);
    }
    // Gửi lại cho chính người gửi (để sync UI)
    socket.emit("private_chat", msg);
  });
  socket.on("new-story", (story) => {
    socket.broadcast.emit("new-story", story);
  });
  // === VOICE CALL SIGNALING (NEW) ===
  socket.on("call-offer", (data) => {
    const targetSocket = onlineUsers.get(data.to);
    if (targetSocket) {
      io.to(targetSocket).emit("call-offer", data);
    }
  });

  socket.on("call-answer", (data) => {
    const targetSocket = onlineUsers.get(data.to);
    if (targetSocket) {
      io.to(targetSocket).emit("call-answer", data);
    }
  });

  socket.on("call-ice", (data) => {
    const targetSocket = onlineUsers.get(data.to);
    if (targetSocket) {
      io.to(targetSocket).emit("call-ice", data);
    }
  });

  socket.on("call-end", (data) => {
    const targetSocket = onlineUsers.get(data.to);
    if (targetSocket) {
      io.to(targetSocket).emit("call-end", data);
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔴 ${socket.userId} disconnected`);
    onlineUsers.delete(socket.userId);
    // Cập nhật danh sách online khi user rời
    io.emit("online_users", Array.from(onlineUsers.keys()));
  });
});

// ========== Root ==========
app.get("/", (req, res) => {
  res.send("🚀 ZingMini Backend Final đang hoạt động tốt!");
});

// ========== Start ==========
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
