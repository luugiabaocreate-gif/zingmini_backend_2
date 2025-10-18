import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";
import usersRoutes from "./routes/users.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// CORS
app.use(
  cors({
    origin: [
      "https://zingmini-frontend-2.onrender.com",
      "http://localhost:5500",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use("/uploads", express.static("uploads")); // serve images

// Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", usersRoutes);

// Health check
app.get("/", (req, res) =>
  res.send("🎉 Backend ZingMini đang hoạt động realtime!")
);

// Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: [
      "https://zingmini-frontend-2.onrender.com",
      "http://localhost:5500",
    ],
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("chat", (msg) => {
    io.emit("chat", { ...msg, ts: Date.now() });
    io.emit("notification", {
      type: "chat",
      title: `${msg.user} vừa gửi tin nhắn`,
      ts: Date.now(),
    });
  });

  socket.on("like", (data) => {
    io.emit("like", { ...data, ts: Date.now() });
    io.emit("notification", {
      type: "like",
      title: `${data.user} đã thích 1 bài viết`,
      postId: data.postId,
      ts: Date.now(),
    });
  });

  socket.on("comment", (data) => {
    io.emit("comment", { ...data, ts: Date.now() });
    io.emit("notification", {
      type: "comment",
      title: `${data.user} bình luận: "${String(data.text).slice(0, 30)}"`,
      postId: data.postId,
      ts: Date.now(),
    });
  });

  socket.on("disconnect", () =>
    console.log("❌ User disconnected:", socket.id)
  );
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
