import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  createTransaction,
  exportTransactions,
  getTransactionItems,
  listTransactions,
} from "../controllers/transactionController.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createTransaction);
router.get("/", listTransactions);
router.get("/export", exportTransactions);
router.get("/:id/items", getTransactionItems);

export default router;
