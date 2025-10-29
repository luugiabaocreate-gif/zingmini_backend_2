import Seller from "../models/Seller.js";
import bcrypt from "bcryptjs";

export const registerSeller = async (req, res) => {
  try {
    const { name, email, password, shopName } = req.body;
    const exist = await Seller.findOne({ email });
    if (exist) return res.status(400).json({ message: "Email đã tồn tại" });
    const hash = await bcrypt.hash(password, 10);
    const seller = await Seller.create({ name, email, password: hash, shopName });
    res.status(201).json(seller);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getSellers = async (req, res) => {
  try {
    const sellers = await Seller.find();
    res.json(sellers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
