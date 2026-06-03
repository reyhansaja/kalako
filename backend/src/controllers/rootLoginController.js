import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../db.js";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config.js";

export async function rootLogin(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email dan password wajib diisi" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const clientRes = await query(
      "SELECT id, subdomain, status, email FROM clients WHERE LOWER(email) = $1",
      [normalizedEmail]
    );

    if (clientRes.rowCount === 0) {
      return res.status(401).json({ message: "Email tidak ditemukan" });
    }

    const client = clientRes.rows[0];

    const userRes = await query(
      "SELECT id, username, password_hash, role FROM users WHERE client_id = $1 AND role = $2",
      [client.id, "client_admin"]
    );

    if (userRes.rowCount === 0) {
      return res.status(401).json({ message: "User tidak ditemukan" });
    }

    const user = userRes.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ message: "Password salah" });
    }

    const token = jwt.sign(
      { userId: user.id, clientId: client.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      message: "Login berhasil",
      subdomain: client.subdomain,
      token,
      status: client.status,
    });
  } catch (err) {
    console.error("[Root Login Error]:", err);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
}
