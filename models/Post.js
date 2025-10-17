// models/Post.js
import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String },
    image: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Post", postSchema);
