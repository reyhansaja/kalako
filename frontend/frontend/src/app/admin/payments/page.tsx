"use client";

import React, { useEffect, useState } from "react";
import {
  getAdminPendingPayments,
  approvePayment,
  rejectPayment,
  getApiBase,
} from "@/lib/api";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getAdminPendingPayments();
      // Expect array
      setPayments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load pending payments:", err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleApprove(id: number) {
    if (!confirm("Approve payment and unsuspend tenant?")) return;
    setActionLoading(id);
    try {
      await approvePayment(id);
      alert("Payment approved");
      await load();
    } catch (err: any) {
      alert(err.message || "Gagal approve pembayaran");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: number) {
    const note = prompt("Alasan penolakan (opsional):") || "";
    if (!confirm("Tolak pembayaran ini?")) return;
    setActionLoading(id);
    try {
      await rejectPayment(id, note || undefined);
      alert("Payment rejected");
      await load();
    } catch (err: any) {
      alert(err.message || "Gagal reject pembayaran");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="p-4 bg-white">
      <h1 className="text-2xl font-bold mb-4">Pending Payments</h1>

      {loading && <div>Loading pending payments…</div>}

      {!loading && payments.length === 0 && (
        <div className="text-sm text-slate-600">Tidak ada pembayaran pending.</div>
      )}

      <div className="space-y-4">
        {payments.map((p) => (
          <div key={p.id} className="bg-white border rounded p-4 shadow-sm">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="text-sm text-slate-600">Toko: <strong>{p.subdomain || p.store_name || p.client_subdomain}</strong></div>
                <div className="text-sm text-slate-600">Jumlah: <strong>Rp {p.amount?.toLocaleString?.() ?? p.amount}</strong></div>
                <div className="text-sm text-slate-600">Catatan: <span>{p.note || '-'}</span></div>
                <div className="text-xs text-gray-400">Tanggal: {p.created_at ? new Date(p.created_at).toLocaleString() : '-'}</div>
              </div>

              <div className="w-48 flex-shrink-0">
                {p.proof_url ? (
                  (() => {
                    const base = getApiBase();
                    const maybeUrl = (p.proof_url || "").toString();
                    const imgUrl = maybeUrl.startsWith("http") ? maybeUrl : `${base}${maybeUrl.startsWith("/") ? "" : "/"}${maybeUrl}`;
                    return (
                      <a href={imgUrl} target="_blank" rel="noreferrer">
                        <img src={imgUrl} alt="proof" className="w-full h-32 object-cover rounded" />
                      </a>
                    );
                  })()
                ) : (
                  <div className="w-full h-32 bg-slate-100 rounded flex items-center justify-center text-sm text-slate-500">No image</div>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => handleApprove(p.id)}
                disabled={actionLoading !== null}
                className="px-3 py-2 rounded bg-green-600 text-white text-sm disabled:opacity-60"
              >
                {actionLoading === p.id ? 'Processing...' : 'Approve'}
              </button>

              <button
                onClick={() => handleReject(p.id)}
                disabled={actionLoading !== null}
                className="px-3 py-2 rounded bg-red-600 text-white text-sm disabled:opacity-60"
              >
                {actionLoading === p.id ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
