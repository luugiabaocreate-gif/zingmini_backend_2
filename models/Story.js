import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  mediaUrl: String,
  type: { type: String, enum: ["image", "video"], required: true },
  createdAt: { type: Date, default: Date.now },
  expireAt: { type: Date, index: { expires: "24h" } },
});

export default mongoose.model("Story", storySchema);
