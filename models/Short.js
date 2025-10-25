import mongoose from "mongoose";

const shortSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  userName: { type: String },
  userAvatar: { type: String },
  videoUrl: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Short", shortSchema);
