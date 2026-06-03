// backend/src/routes/products.js
import express from 'express';
import { query } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/products
 * butuh Authorization: Bearer <token>
 * dan harus dari subdomain client (misal: http://toko-maju.kalako.local:4000)
 */

export default router;
