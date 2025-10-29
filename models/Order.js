import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    buyerId: String,
    buyerName: String,
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 1 },
      },
    ],
    total: Number,
    status: { type: String, enum: ["pending", "confirmed", "delivered"], default: "pending" },
    address: String,
    phone: String,
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
