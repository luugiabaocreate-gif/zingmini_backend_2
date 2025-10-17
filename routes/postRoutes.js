import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "cloudinary";
import jwt from "jsonwebtoken";
import Post from "../models/Post.js";
import User from "../models/User.js";

const router = express.Router();

// Cloudinary config
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: { folder: "zingmini_uploads" },
});
const upload = multer({ storage });

// Middleware auth
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Get all posts
router.get("/", async (req, res) => {
  const posts = await Post.find().populate("user").sort({ createdAt: -1 });
  res.json(posts);
});

// Create post
router.post("/", auth, upload.array("images", 3), async (req, res) => {
  const user = await User.findById(req.user);
  const images = req.files?.map((f) => f.path);
  const newPost = await Post.create({
    user,
    content: req.body.content,
    images,
  });
  const post = await newPost.populate("user");
  req.io.emit("new_post", post);
  res.json(post);
});

export default router;
