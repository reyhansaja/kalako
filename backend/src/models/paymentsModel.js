import { query } from "../db.js";

export async function resolveClientByRequest(req) {
  if (req.client?.id) return req.client;

  const host = String(req.headers.host || "").split(":")[0];
  const xTenant = req.headers["x-tenant"] || null;
  let subdomain = null;

  if (xTenant) {
    subdomain = String(xTenant).toLowerCase().trim();
  } else if (host && host.includes(".")) {
    const parts = host.split(".");
    if (parts.length > 2) subdomain = parts[0];
  }

  if (!subdomain) return null;

  const result = await query("SELECT * FROM clients WHERE subdomain = $1 LIMIT 1", [subdomain]);
  if (result.rowCount === 0) return null;
  return result.rows[0];
}

export function createPayment({ clientId, amount, paymentDate, proofUrl, note }) {
  return query(
    `INSERT INTO payments (client_id, amount, payment_date, method, status, proof_url, proof_uploaded_at, review_note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [clientId, amount, paymentDate, "bank_transfer", "pending", proofUrl, paymentDate, note || null]
  ).then((result) => query("SELECT * FROM payments WHERE id = ?", [result.insertId]));
}

export function listPaymentsByClient(clientId) {
  return query("SELECT * FROM payments WHERE client_id = $1 ORDER BY payment_date DESC", [clientId]);
}
