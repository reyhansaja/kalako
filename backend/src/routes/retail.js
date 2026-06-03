import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  createCategory,
  createProduct,
  createUnit,
  deleteProduct,
  listCategories,
  listProducts,
  listUnits,
  updateProduct,
} from "../controllers/retailController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/products", listProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

router.get("/categories", listCategories);
router.post("/categories", createCategory);

router.get("/units", listUnits);
router.post("/units", createUnit);

export default router;
