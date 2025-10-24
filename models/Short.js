import mongoose from "mongoose";

const shortSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  videoUrl: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Short", shortSchema);
