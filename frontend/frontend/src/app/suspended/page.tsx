"use client";

import React, { useState } from "react";
import { useParams } from "react-router-dom";
import ImageUploader from "@/components/imageUploader";
import { submitPayment, getApiBase } from "@/lib/api";
import { withTenantPath } from "@/lib/tenant";

export default function SuspendedPage() {
  const { tenant } = useParams();
  const tenantPath = (path: string) => withTenantPath(path, tenant);
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState("");
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function formatAmount(value: string) {
    const digitsOnly = value.replace(/\D/g, "");
    return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numericAmount = Number(String(amount).replace(/\./g, ""));
    if (!numericAmount || !proofUrl) {
      alert("Isi jumlah dan unggah bukti pembayaran");
      return;
    }

    try {
      setLoading(true);
      await submitPayment({ amount: numericAmount, note, proof_url: proofUrl });
      alert("Pembayaran dikirim. Menunggu approval super admin.");
      setAmount('');
      setNote('');
      setProofUrl(null);
    } catch (err: any) {
      alert(err.message || "Gagal mengirim pembayaran");
    } finally {
      setLoading(false);
    }
  }

  // If tenant is already active/trial (approved), redirect accordingly:
  React.useEffect(() => {
    (async () => {
      try {
        const base = getApiBase();
        const res = await fetch(`${base}/api/tenant/status`, { cache: 'no-store' });
        if (!res.ok) return;
        const info = await res.json();
        const status = (info.status || '').toLowerCase();
        if (status === 'active' || status === 'trial') {
          // If user has a token (logged in) go to dashboard, otherwise to login
          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
          window.location.href = token
            ? withTenantPath('/dashboard', tenant)
            : withTenantPath('/login', tenant);
        }
      } catch (err) {
        // ignore — keep showing suspended page
        console.debug('suspended status check failed', err);
      }
    })();
  }, [tenant]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-black">
      <div className="max-w-3xl w-full bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">Akun Anda Ditangguhkan</h1>
        <p className="text-sm text-black mb-4">
          Layanan untuk subdomain ini ditangguhkan karena tagihan belum dibayar. Untuk mengaktifkan kembali, silakan unggah bukti pembayaran di bawah.
        </p>

        <div className="mb-6 border rounded p-4 bg-slate-50">
          <h2 className="font-medium mb-2">Instruksi Pembayaran</h2>
          <ol className="list-decimal list-inside text-sm text-black space-y-1">
            <li>Transfer sesuai tagihan ke rekening yang tersedia.</li>
            <li>Simpan bukti transfer (foto/scan).</li>
            <li>Unggah bukti di bawah dan masukkan jumlah serta catatan.</li>
            <li>Tim admin akan meninjau dan mengaktifkan kembali jika valid.</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black">Jumlah (Rp)</label>
            <input
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(formatAmount(e.target.value))}
              className="mt-1 block w-full rounded border px-3 py-2 text-black placeholder:text-black"
              placeholder="100.000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black">Catatan (opsional)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2 text-black placeholder:text-black" />
          </div>

          <div>
            <label className="block text-sm font-medium">Unggah Bukti Pembayaran</label>
            <div className="mt-2">
              <ImageUploader onUploaded={(url) => setProofUrl(url)} />
            </div>
            {proofUrl && <div className="mt-2 text-sm text-black">Preview: <a className="underline text-black" href={proofUrl} target="_blank" rel="noreferrer">lihat</a></div>}
          </div>

          <div className="flex items-center gap-3">
            <button disabled={loading} type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">
              {loading ? 'Mengirim...' : 'Kirim Bukti Pembayaran'}
            </button>
            <a href={tenantPath('/login')} className="text-sm text-black">Kembali ke login</a>
          </div>
        </form>
      </div>
    </div>
  );
}
