import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { JWT_SECRET, JWT_EXPIRES_IN, BASE_DOMAIN } from '../config.js';

const router = express.Router();

function getAllowedAdminHosts() {
  const normalizedBase = String(BASE_DOMAIN || '').replace(/^https?:\/\//, '').split(':')[0].toLowerCase();
  const hosts = new Set(['localhost', '127.0.0.1']);
  if (normalizedBase) {
    hosts.add(normalizedBase);
    if (normalizedBase.startsWith('api.')) {
      hosts.add(normalizedBase.slice(4));
    }
  }
  return hosts;
}

function resolveCookieDomain(baseDomain) {
  const host = String(baseDomain || '').replace(/^https?:\/\//, '').split(':')[0].toLowerCase();
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  return host.startsWith('api.') ? `.${host.slice(4)}` : `.${host}`;
}

function hostIsAllowed(req) {
  const host = String(req.headers.host || '').split(':')[0];
  return getAllowedAdminHosts().has(host);
}

function requestFromPortoreyAdmin(req){
  const origin = String(req.headers.origin || '');
  const referer = String(req.headers.referer || '');

  // Jika referer ada, cek apakah berasal dari ROOT_DOMAIN dan path dimulai /admin
  try {
    if (referer) {
      const u = new URL(referer);
      if (getAllowedAdminHosts().has(u.hostname) && u.pathname.startsWith('/admin')) return true;
    }
  } catch (e) {
    // ignore
  }

  // Jika Origin ada (fetch dari browser), cek hostname saja (halaman bisa membuat fetch ke API)
  try {
    if (origin) {
      const o = new URL(origin);
      if (getAllowedAdminHosts().has(o.hostname)) return true;
    }
  } catch (e) {
    // ignore
  }

  return false;
}

// POST /api/admin/login
// Hanya untuk super_admin dan hanya diakses dari ROOT_DOMAIN/admin/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi' });
  }

  // Cek sumber request: request harus berasal dari halaman/admin di ROOT_DOMAIN
  if (!hostIsAllowed(req) && !requestFromPortoreyAdmin(req)) {
    console.warn('Denied admin login due to origin/referer mismatch', {
      host: req.headers.host,
      origin: req.headers.origin,
      referer: req.headers.referer,
    });
    return res.status(403).json({ message: `Akses login admin hanya dari domain admin yang valid` });
  }

  try {
    const userRes = await query("SELECT * FROM users WHERE username = $1 AND role = 'super_admin'", [username]);
    if (userRes.rowCount === 0) {
      return res.status(403).json({ message: 'Akun tidak ditemukan atau bukan super_admin' });
    }

    const user = userRes.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(400).json({ message: 'Username atau password salah' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    const cookieDomain = resolveCookieDomain(BASE_DOMAIN);
    const cookieOptions = {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
    if (cookieDomain) {
      cookieOptions.domain = cookieDomain;
    }

    res.cookie('token', token, cookieOptions);

    return res.json({ message: 'Login admin berhasil', token, role: user.role });
  } catch (err) {
    console.error('admin login error:', err);
    return res.status(500).json({ message: 'Gagal memproses login admin' });
  }
});

// GET /api/admin/dashboard
// Hanya untuk super_admin
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Akses terbatas untuk super_admin' });
    }

    // Hitung berbagai metrik global
    let totalClients = 0;
    let totalProducts = 0;
    let totalTransactions = 0;
    let totalRevenue = 0;
    let recentClients = [];
    let recentTransactions = [];

    try {
      const r = await query('SELECT COUNT(*) AS total FROM clients');
      totalClients = Number(r.rows[0].total || 0);
    } catch (e) {
      console.warn('clients table missing or error:', e.message || e);
    }

    try {
      const r = await query('SELECT COALESCE(SUM(stock),0) AS total_stock FROM products');
      totalProducts = Number(r.rows[0].total_stock || 0);
    } catch (e) {
      console.warn('products table missing or error:', e.message || e);
    }

    try {
      const r = await query('SELECT COUNT(*) AS total, COALESCE(SUM(total_amount),0) AS revenue FROM sales_transactions');
      totalTransactions = Number(r.rows[0].total || 0);
      totalRevenue = Number(r.rows[0].revenue || 0);
    } catch (e) {
      console.warn('sales_transactions table missing or error:', e.message || e);
    }

    try {
      const r = await query('SELECT id, name, subdomain, created_at FROM clients ORDER BY created_at DESC LIMIT 5');
      recentClients = r.rows;
    } catch (e) {
      recentClients = [];
    }

    try {
      const r = await query('SELECT id, client_id, total_amount, created_at FROM sales_transactions ORDER BY created_at DESC LIMIT 5');
      recentTransactions = r.rows;
    } catch (e) {
      recentTransactions = [];
    }

    return res.json({
      totalClients,
      totalProducts,
      totalTransactions,
      totalRevenue,
      recentClients,
      recentTransactions,
    });
  } catch (err) {
    console.error('admin dashboard error:', err);
    return res.status(500).json({ message: 'Gagal mengambil data dashboard admin' });
  }
});

// Suspend a client (set suspended_at and status)
router.post('/clients/:id/suspend', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'super_admin') return res.status(403).json({ message: 'Akses terbatas' });
    const clientId = Number(req.params.id);
    const { reason } = req.body || {};
    await query('UPDATE clients SET suspended_at = NOW(), suspension_reason = $1, status = $2 WHERE id = $3', [reason || 'suspended', 'suspended', clientId]);
    return res.json({ message: 'Client disuspend' });
  } catch (err) {
    console.error('suspend client error:', err);
    return res.status(500).json({ message: 'Gagal suspend client' });
  }
});

// Unsuspend a client
router.post('/clients/:id/unsuspend', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'super_admin') return res.status(403).json({ message: 'Akses terbatas' });
    const clientId = Number(req.params.id);
    await query('UPDATE clients SET suspended_at = NULL, suspension_reason = NULL, status = $1 WHERE id = $2', ['active', clientId]);
    return res.json({ message: 'Client diaktifkan kembali' });
  } catch (err) {
    console.error('unsuspend client error:', err);
    return res.status(500).json({ message: 'Gagal unsuspend client' });
  }
});

// Admin: list pending payments
router.get('/payments/pending', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'super_admin') return res.status(403).json({ message: 'Akses terbatas' });
    const r = await query("SELECT p.*, c.subdomain, c.name AS client_name FROM payments p LEFT JOIN clients c ON c.id = p.client_id WHERE p.status = 'pending' ORDER BY p.payment_date DESC");
    return res.json(r.rows);
  } catch (err) {
    console.error('list pending payments error:', err);
    return res.status(500).json({ message: 'Gagal mengambil pending payments' });
  }
});

// Admin: approve payment -> set payment success and unsuspend client
router.post('/payments/:id/approve', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'super_admin') return res.status(403).json({ message: 'Akses terbatas' });
    const paymentId = Number(req.params.id);
    const reviewerId = req.user.id;
    const now = new Date();

    // Get payment
    const p = await query('SELECT * FROM payments WHERE id = $1', [paymentId]);
    if (p.rowCount === 0) return res.status(404).json({ message: 'Payment not found' });
    const payment = p.rows[0];

    await query('UPDATE payments SET status = $1, reviewed_by = $2, reviewed_at = $3 WHERE id = $4', ['success', reviewerId, now, paymentId]);

    // Unsuspend client and set next due date 30 days from now so tenant remains
    // active for the next billing cycle. Clear any immediate suspension fields.
    if (payment.client_id) {
      await query(
        `UPDATE clients SET suspended_at = NULL, suspension_reason = NULL,
         trial_ends_at = DATE_ADD(NOW(), INTERVAL 30 DAY), status = ? WHERE id = ?`,
        ['active', payment.client_id]
      );
    }

    // Fetch updated client row to return to the caller for immediate verification
    let updatedClient = null;
    try {
      const c = await query('SELECT id, subdomain, status, suspended_at, suspension_reason, trial_ends_at FROM clients WHERE id = $1', [payment.client_id]);
      if (c.rowCount > 0) updatedClient = c.rows[0];
    } catch (e) {
      console.warn('Failed to fetch updated client after approve:', e.message || e);
    }

    return res.json({ message: 'Payment approved and client activated', client: updatedClient });
  } catch (err) {
    console.error('approve payment error:', err);
    return res.status(500).json({ message: 'Gagal approve payment' });
  }
});

// Admin: reject payment
router.post('/payments/:id/reject', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'super_admin') return res.status(403).json({ message: 'Akses terbatas' });
    const paymentId = Number(req.params.id);
    const reviewerId = req.user.id;
    const { note } = req.body || {};
    const now = new Date();

    await query('UPDATE payments SET status = $1, reviewed_by = $2, reviewed_at = $3, review_note = $4 WHERE id = $5', ['rejected', reviewerId, now, note || null, paymentId]);

    return res.json({ message: 'Payment rejected' });
  } catch (err) {
    console.error('reject payment error:', err);
    return res.status(500).json({ message: 'Gagal reject payment' });
  }
});

export default router;

