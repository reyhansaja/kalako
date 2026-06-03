import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getClientInfo, getDashboardSummary } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/client-info", authMiddleware, getClientInfo);
router.get("/summary", authMiddleware, getDashboardSummary);

export default router;
