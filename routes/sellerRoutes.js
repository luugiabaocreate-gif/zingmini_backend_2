import express from "express";
import { registerSeller, getSellers } from "../controllers/sellerController.js";

const router = express.Router();

router.post("/register", registerSeller);
router.get("/", getSellers);

export default router;
