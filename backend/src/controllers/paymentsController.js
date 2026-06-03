import { createPayment, listPaymentsByClient, resolveClientByRequest } from "../models/paymentsModel.js";

export async function submitPayment(req, res) {
  try {
    const client = await resolveClientByRequest(req);
    if (!client) return res.status(403).json({ message: "Tenant not found" });

    const { amount, note, proof_url } = req.body || {};
    if (!amount || !proof_url) {
      return res.status(400).json({ message: "Amount and proof_url required" });
    }

    const now = new Date();
    const insert = await createPayment({
      clientId: client.id,
      amount,
      paymentDate: now,
      proofUrl: proof_url,
      note,
    });

    return res.status(201).json({ message: "Pembayaran diajukan", payment: insert.rows[0] });
  } catch (err) {
    console.error("create payment error:", err);
    return res.status(500).json({ message: "Gagal mengajukan pembayaran" });
  }
}

export async function getPayments(req, res) {
  try {
    const client = await resolveClientByRequest(req);
    if (!client) return res.status(403).json({ message: "Tenant not found" });

    const result = await listPaymentsByClient(client.id);
    return res.json({ payments: result.rows });
  } catch (err) {
    console.error("list payments error:", err);
    return res.status(500).json({ message: "Gagal mengambil daftar pembayaran" });
  }
}
