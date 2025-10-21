// server.js — ZingMini Backend FINAL (Realtime + Auth Fix)
import express from "express";
import http from "http";
import cors from "cors"; // ✅ chỉ import 1 lần ở đây thôi
import dotenv from "dotenv";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import messageRoutes from "./routes/messageRoutes.js";
import commentRoutes from "./routes/comments.js";

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

// Nếu chưa có thư mục uploads thì tạo
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

app.use("/uploads", express.static(uploadDir));

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
