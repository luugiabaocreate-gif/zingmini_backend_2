// server.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";
import messageRoutes from "./routes/messageRoutes.js";

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const httpServer = createServer(app);

// static uploads (images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// CORS - adjust frontend origin if different
app.use(
  cors({
    origin: [
      "https://zingmini-ws2r.onrender.com", // frontend mới của bạn
      "https://zingme-frontend-5.onrender.com",
      "http://localhost:5500",
    ],
    credentials: true,
  })
);

app.use(express.json());

// MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err.message));

// Routes
app.get("/", (req, res) => res.send("🚀 ZingMini backend alive"));
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/messages", messageRoutes);

// Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: ["https://zingme-frontend-5.onrender.com", "http://localhost:5500"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🟢 socket connected", socket.id);

  socket.on("register_user", (user) => {
    if (user && user.name) {
      onlineUsers.set(socket.id, user.name);
      io.emit("online_users", Array.from(onlineUsers.values()));
      console.log("✅ user registered:", user.name);
    }
  });

  socket.on("send_message", (data) => {
    const sender = onlineUsers.get(socket.id) || "Ẩn danh";
    const msg = {
      user: sender,
      text: data.text,
      time: new Date().toLocaleTimeString(),
    };
    io.emit("receive_message", msg);
  });

  socket.on("disconnect", () => {
    const left = onlineUsers.get(socket.id);
    if (left) {
      onlineUsers.delete(socket.id);
      io.emit("online_users", Array.from(onlineUsers.values()));
      console.log("🔴 user disconnected:", left);
    }
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`🚀 Server listening on ${PORT}`));
