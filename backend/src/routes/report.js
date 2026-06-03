import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  exportProductReport,
  getMonthlySales,
  getProductReport,
} from "../controllers/reportController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/products", getProductReport);
router.get("/products/export", exportProductReport);
router.get("/monthly-sales", getMonthlySales);

export default router;
