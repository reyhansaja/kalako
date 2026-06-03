import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';
import { query } from '../db.js';

// Blacklist token yang sudah di-logout (in-memory dengan auto-cleanup setelah 1 jam)
// Format: { token: timestamp }
const tokenBlacklist = new Map();

export function addToBlacklist(token) {
  tokenBlacklist.set(token, Date.now());
  console.log(`✅ Token added to blacklist. Total blacklisted: ${tokenBlacklist.size}`);
}

export function isBlacklisted(token) {
  if (!tokenBlacklist.has(token)) return false;
  
  const blacklistedAt = tokenBlacklist.get(token);
  const oneHourMs = 60 * 60 * 1000; // 1 jam dalam ms
  const now = Date.now();
  
  // Jika sudah lewat 1 jam, hapus dari blacklist
  if (now - blacklistedAt > oneHourMs) {
    tokenBlacklist.delete(token);
    console.log(`🧹 Token removed from blacklist (expired after 1 hour)`);
    return false;
  }
  
  return true;
}

// Cleanup scheduler: jalankan setiap 30 menit
setInterval(() => {
  const oneHourMs = 60 * 60 * 1000;
  const now = Date.now();
  let removedCount = 0;
  
  for (const [token, timestamp] of tokenBlacklist.entries()) {
    if (now - timestamp > oneHourMs) {
      tokenBlacklist.delete(token);
      removedCount++;
    }
  }
  
  if (removedCount > 0) {
    console.log(`🧹 Cleaned up ${removedCount} expired tokens from blacklist. Remaining: ${tokenBlacklist.size}`);
  }
}, 30 * 60 * 1000); // Jalankan setiap 30 menit

console.log("✅ Token blacklist auto-cleanup started (1 hour TTL, cleanup every 30 min)");

export function authMiddleware(req, res, next) {
  try {
    // Accept token from Authorization header (Bearer ...) OR cookie `token`
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Cek apakah token sudah di-logout
    if (isBlacklisted(token)) {
      console.log("❌ Token is blacklisted:", token.substring(0, 20) + "...");
      return res.status(401).json({ message: "Token sudah di-logout, silakan login kembali" });
    }

    console.log("✅ Token is valid (not blacklisted):", token.substring(0, 20) + "...");

    const payload = jwt.verify(token, JWT_SECRET);

    // payload harus berisi clientId, sesuaikan dengan proses login
    // misalnya waktu sign token: { userId: user.id, clientId: user.client_id, role: user.role }
    req.user = {
      id: payload.userId,
      role: payload.role,
    };
    req.client = {
      id: payload.clientId,
    };
    req.token = token; // Simpan token di req untuk logout

    return next(); // <-- wajib
  } catch (err) {
    console.error("authMiddleware error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
}

