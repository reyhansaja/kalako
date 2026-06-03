import express from "express";
import { getTenantStatus } from "../controllers/tenantController.js";

const router = express.Router();

router.get("/status", getTenantStatus);

export default router;
