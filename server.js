import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Cho phép frontend truy cập
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

// Parse JSON body
app.use(express.json());

// Kết nối MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes API
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);

// Kiểm tra backend có hoạt động không
app.get("/", (req, res) => {
  res.send("🎉 Backend ZingMini đang hoạt động!");
});

// Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: [
      "https://zingmini-frontend-2.onrender.com",
      "http://localhost:5500",
    ],
  },
});

io.on("connection", (socket) => {
  console.log("🔌 User connected");
  socket.on("disconnect", () => console.log("❌ User disconnected"));
});

// Render cung cấp PORT qua biến môi trường
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
