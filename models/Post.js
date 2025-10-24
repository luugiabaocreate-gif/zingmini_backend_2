// models/Post.js
import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String },
    image: { type: String },
    video: { type: String }, // ✅ thêm dòng này, đừng thay gì khác
  },
  { timestamps: true }
);

export default mongoose.model("Post", postSchema);
