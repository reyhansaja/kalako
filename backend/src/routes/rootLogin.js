import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config.js';

const router = express.Router();

async function handleRootLogin(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    // Cari client berdasarkan email
    const clientRes = await query(
      'SELECT id, subdomain, status, email FROM clients WHERE LOWER(email) = $1',
      [normalizedEmail]
    );

    if (clientRes.rowCount === 0) {
      return res.status(401).json({ message: 'Email tidak ditemukan' });
    }

    const client = clientRes.rows[0];

    // Cari user dengan role client_admin untuk client ini
    const userRes = await query(
      'SELECT id, username, password_hash, role FROM users WHERE client_id = $1 AND role = $2',
      [client.id, 'client_admin']
    );

    if (userRes.rowCount === 0) {
      return res.status(401).json({ message: 'User tidak ditemukan' });
    }

    const user = userRes.rows[0];

    // Verifikasi password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Password salah' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, clientId: client.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return subdomain dan token untuk redirect & auto-login
    res.json({
      message: 'Login berhasil',
      subdomain: client.subdomain,
      token,
      status: client.status
    });

  } catch (err) {
    console.error('[Root Login Error]:', err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
}

/**
 * Root login endpoint - login menggunakan email & password
 * Mengembalikan subdomain dan JWT token untuk auto-login
 */
router.post('/', handleRootLogin);
router.post('/root-login', handleRootLogin);

export default router;
