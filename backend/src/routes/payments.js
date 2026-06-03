import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// Helper to resolve client id from req.client or headers/host
async function resolveClient(req) {
  if (req.client && req.client.id) return req.client;

  const host = (req.headers.host || '').split(':')[0];
  const xTenant = req.headers['x-tenant'] || null;
  let subdomain = null;
  if (xTenant) subdomain = String(xTenant).toLowerCase().trim();
  else if (host && host.includes('.')) {
    const parts = host.split('.');
    if (parts.length > 2) subdomain = parts[0];
  }

  if (!subdomain) return null;

  const r = await query('SELECT * FROM clients WHERE subdomain = $1 LIMIT 1', [subdomain]);
  if (r.rowCount === 0) return null;
  return r.rows[0];
}

// POST /api/payments - submit payment proof (allowed even when suspended)
router.post('/', async (req, res) => {
  try {
    const client = await resolveClient(req);
    if (!client) return res.status(403).json({ message: 'Tenant not found' });

    const { amount, note, proof_url } = req.body || {};
    if (!amount || !proof_url) return res.status(400).json({ message: 'Amount and proof_url required' });

    const now = new Date();
    const insert = await query(
      `INSERT INTO payments (client_id, amount, payment_date, method, status, proof_url, proof_uploaded_at, review_note)
       VALUES (?,?,?,?,?,?,?,?)`,
      [client.id, amount, now, 'bank_transfer', 'pending', proof_url, now, note || null]
    );

    const newPayment = await query('SELECT * FROM payments WHERE id = ?', [insert.insertId]);
    return res.status(201).json({ message: 'Pembayaran diajukan', payment: newPayment.rows[0] });
  } catch (err) {
    console.error('create payment error:', err);
    return res.status(500).json({ message: 'Gagal mengajukan pembayaran' });
  }
});

// GET /api/payments - list tenant payments (allowed for suspended)
router.get('/', async (req, res) => {
  try {
    const client = await resolveClient(req);
    if (!client) return res.status(403).json({ message: 'Tenant not found' });

    const r = await query('SELECT * FROM payments WHERE client_id = $1 ORDER BY payment_date DESC', [client.id]);
    return res.json({ payments: r.rows });
  } catch (err) {
    console.error('list payments error:', err);
    return res.status(500).json({ message: 'Gagal mengambil daftar pembayaran' });
  }
});

export default router;
