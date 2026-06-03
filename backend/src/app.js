import express from 'express';
import cors from 'cors';
import { tenantMiddleware } from './middleware/tenant.js';
import { suspensionMiddleware } from './middleware/suspension.js';
import authRoutes from './routes/auth.js';
import rootLoginRoutes from './routes/rootLogin.js';
import passwordResetRoutes from './routes/passwordReset.js';
import uploadRoutes from "./routes/upload.js";
import retailRoutes from "./routes/retail.js";
import transactionRoutes from "./routes/transaction.js";
import dashboardRoutes from "./routes/dashboard.js";
import reportRoutes from "./routes/report.js";
import cookieParser from "cookie-parser";
import adminRoutes from "./routes/admin.js";

const app = express();

app.use(cookieParser());
// Enable CORS with credentials so browser fetches from the admin front-end
// (e.g. https://kalako.local:3000 in dev) can include cookies when calling the API
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(tenantMiddleware);
app.use(suspensionMiddleware);

app.use("/api/auth", authRoutes);
app.use("/api/root-login", rootLoginRoutes);
app.use("/api/password-reset", passwordResetRoutes);
app.use("/api/retail", retailRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/upload", uploadRoutes);         // ⬅️ dan ini
app.use("/api/admin", adminRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Kalako backend with email OTP',
    tenant: req.client?.subdomain || null
  });
});

app.use("/uploads", express.static("uploads"));  // serve file
import paymentsRoutes from "./routes/payments.js";
import tenantRoutes from "./routes/tenant.js";
app.use("/api/payments", paymentsRoutes);
app.use("/api/tenant", tenantRoutes);
app.use("/api/upload", uploadRoutes);

export default app;