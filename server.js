import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";
import userRoutes from "./routes/users.js"; // hoặc bỏ dòng này nếu không dùng

dotenv.config();

const app = express();
const httpServer = createServer(app);

// ✅ Cấu hình CORS để frontend trên Render truy cập được
app.use(
  cors({
    origin: [
      "https://zingmini-frontend-2.onrender.com", // Frontend Render
      "http://localhost:5500", // Cho test local
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

// ✅ Kết nối MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Routes chính
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);

// ✅ Route kiểm tra backend hoạt động
app.get("/", (req, res) => {
  res.send("🎉 ZingMini backend đang hoạt động ngon lành!");
});

// ✅ Socket.io realtime
const io = new Server(httpServer, {
  cors: {
    origin: [
      "https://zingmini-frontend-2.onrender.com",
      "http://localhost:5500",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🔌 New user connected");
  socket.on("disconnect", () => {
    console.log("❌ User disconnected");
  });
});

// ✅ Khởi động server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
