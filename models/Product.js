import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    image: String,
    stock: { type: Number, default: 0 },
    category: { type: String, default: "Khác" },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // 👈 sửa "Seller" thành "User"
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
