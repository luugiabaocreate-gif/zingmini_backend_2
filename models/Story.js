// models/Story.js
import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mediaUrl: { type: String, required: true },
    type: { type: String, enum: ["image", "video"], default: "image" },
    createdAt: { type: Date, default: Date.now, expires: 86400 }, // auto delete sau 24h
  },
  { timestamps: true }
);

export default mongoose.model("Story", storySchema);
