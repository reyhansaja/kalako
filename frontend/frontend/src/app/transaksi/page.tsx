"use client";

import { useEffect, useState } from "react";
import ClientShell from "@/components/clientShell";
import { useProtectedPage } from "@/lib/hooks";
import { getRetailProducts, createTransaction, getClientInfo } from "@/lib/api";

/* ============================================================
 * MAIN TRANSACTION PAGE
 * ============================================================ */

export default function TransaksiPage() {
  const { isReady } = useProtectedPage();
  const [search, setSearch] = useState("");
  type RetailProduct = { id: number; name: string; selling_price: number; unit: string; stock?: number | string };
  const [searchResults, setSearchResults] = useState<RetailProduct[]>([]);
  const [items, setItems] = useState<
    {
      product_id: number;
      name: string;
      price: number;
      unit: string;
      qty: number;
      discountPercent?: number;
    }[]
  >([]);

  const [showPayModal, setShowPayModal] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!search) {
        setSearchResults([]);
        return;
      }
      const res = await getRetailProducts({ search });
      setSearchResults(res.items || []);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  function addItem(p: RetailProduct) {
    setItems((prev) => [
      ...prev,
      {
        product_id: p.id,
        name: p.name,
        price: p.selling_price,
        unit: p.unit,
        qty: 1,
        discountPercent: 0,
      },
    ]);
    setSearch("");
    setSearchResults([]);
  }

  function updateQty(index: number, qty: number) {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, qty } : it))
    );
  }

  function updateDiscount(index: number, discountPercent: number) {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, discountPercent } : it))
    );
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const total = items.reduce((acc, it) => {
    const disc = it.discountPercent ? Number(it.discountPercent) : 0;
    const line =
      it.qty * it.price * (1 - Math.max(0, Math.min(100, disc)) / 100);
    return acc + line;
  }, 0);

  // Tampilkan loading saat check auth
  if (!isReady) {
    return (
      <ClientShell
        title={
          <div className="flex items-center gap-2">
            <img
              src="/Logo.png"
              alt="Kalako"
              className="h-12 w-auto"
            />
            <span className="text-3xl">Transaksi Kasir</span>
          </div>
        }
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin text-4xl mb-2">⏳</div>
            <p className="text-slate-600">Memverifikasi akses...</p>
          </div>
        </div>
      </ClientShell>
    );
  }

  return (
    <ClientShell
      title={
        <div className="flex items-center gap-2">
          <img
            src="/Logo.png"
            alt="Kalako"
            className="h-12 w-auto"
          />
          <span className="text-3xl">Transaksi Kasir</span>
        </div>
      }
    >
      <div className="space-y-6">
        {/* SEARCH BAR (minimal, non-card) */}
        <div className="space-y-3">
          {/* <label className="block text-sm font-semibold text-slate-900">
            🔍 Cari Produk
          </label> */}

          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="opacity-90"
              >
                <path
                  d="M21 21l-4.35-4.35"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="11"
                  cy="11"
                  r="5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>

            <input
              type="text"
              className="w-full pl-10 pr-12 py-3 rounded-full text-black text-sm bg-white border border-slate-200 shadow-sm focus:shadow-md focus:outline-none focus:border-amber-400 transition-all"
              placeholder="Ketik nama produk untuk menambahkan ke keranjang..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 bg-white hover:bg-slate-100 rounded-full p-1.5 shadow-sm"
                aria-label="clear"
                title="Bersihkan"
              >
                ✖
              </button>
            )}
          </div>

          {/* SEARCH RESULTS (card) */}
          {searchResults.length > 0 && (
            <div className="mt-3 border border-slate-200 rounded-xl bg-white shadow-sm max-h-48 overflow-y-auto">
              {searchResults.map((p) => {
                const numericStock = Number(p.stock);
                const stockDisplay = Number.isNaN(numericStock)
                  ? p.stock
                  : numericStock.toString();

                return (
                  <div
                    key={p.id}
                    onClick={() => addItem(p)}
                    className="px-3 py-3 sm:px-4 cursor-pointer text-sm sm:text-base border-b border-slate-200 last:border-b-0 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-900 truncate">
                        {p.name}
                      </span>
                      <span className="text-green-600 font-bold">
                        Rp {Number(p.selling_price).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <span className="text-sm text-slate-500">
                      Stok: {stockDisplay} {p.unit}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ITEMS TABLE */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <colgroup>
                <col style={{ width: 56 }} />
                <col />
                <col style={{ width: 120 }} />
                <col style={{ width: 96 }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 140 }} />
                <col style={{ width: 140 }} />
                <col style={{ width: 72 }} />
              </colgroup>

              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-200">
                  <th className="py-3 px-4 text-left border-r border-slate-200">
                    No
                  </th>
                  <th className="py-3 px-4 text-left border-r border-slate-200">
                    Nama Produk
                  </th>
                  <th className="py-3 px-14 text-left border-r border-slate-200">
                    Qty
                  </th>
                  <th className="py-3 px-4 text-left border-r border-slate-200">
                    Diskon %
                  </th>
                  <th className="py-3 pr-6 pl-3 text-right border-r border-slate-200 whitespace-nowrap">
                    Harga Satuan
                  </th>
                  <th className="py-3 pr-15 pl-7 text-left border-r border-slate-200 whitespace-nowrap">
                    Subtotal
                  </th>
                  <th className="py-3 px-4 text-left border-r border-slate-200">
                    Aksi
                  </th>
                  <th className="py-3 px-3 text-xs font-semibold uppercase tracking-wide last:rounded-tr-xl"></th>
                </tr>
              </thead>

              <tbody>
                {items.map((it, i) => {
                  const disc = it.discountPercent
                    ? Number(it.discountPercent)
                    : 0;
                  const lineSubtotal = Math.round(
                    it.qty *
                      it.price *
                      (1 - Math.max(0, Math.min(100, disc)) / 100)
                  );
                  return (
                    <tr
                      key={i}
                      className="hover:bg-slate-50 last:border-b last:border-slate-200"
                    >
                      <td className="py-3 px-4 text-slate-700 border-r border-slate-200 whitespace-nowrap">
                        {`${i + 1}.`}
                      </td>

                      <td className="py-3 px-4 text-slate-700 border-r border-slate-200">
                        {it.name}
                      </td>

                      <td className="py-3 px-4 text-slate-700 border-r border-slate-200">
                        <input
                          type="text"
                          inputMode={it.unit === "KG" ? "decimal" : "numeric"}
                          pattern={
                            it.unit === "KG" ? "[0-9]*[.,]?[0-9]*" : "[0-9]*"
                          }
                          className="w-20 sm:w-24 border border-slate-200 px-2 py-1 rounded-md text-sm text-center focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-100 transition-all"
                          value={it.qty === 0 ? "" : String(it.qty)}
                          onChange={(e) => {
                            const raw = String(e.target.value);
                            // allow digits and dot for decimal units
                            const cleaned =
                              it.unit === "KG"
                                ? raw.replace(/[^0-9.]/g, "")
                                : raw.replace(/\D/g, "");
                            const num = cleaned === "" ? 0 : Number(cleaned);
                            updateQty(i, Number.isNaN(num) ? 0 : num);
                          }}
                        />
                      </td>

                      <td className="py-3 px-4 text-slate-700 border-r border-slate-200">
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="w-16 sm:w-20 pr-8 border border-white px-2 py-1 rounded-md text-sm text-center focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-100 transition-all"
                            value={disc === 1 ? "" : String(disc)}
                            onChange={(e) => {
                              const raw = String(e.target.value);
                              const cleaned = raw.replace(/\D/g, "");
                              const num = cleaned === "" ? 0 : Number(cleaned);
                              updateDiscount(i, Number.isNaN(num) ? 0 : num);
                            }}
                          />

                          <span className="absolute inset-y-0 right-2 flex items-center text-sm text-slate-700 pointer-events-none">
                            %
                          </span>
                        </div>
                      </td>

                      <td className="py-3 pr-6 pl-3 text-right text-green-600 text-base border-r border-slate-100 whitespace-nowrap">
                        Rp {Number(it.price).toLocaleString("id-ID")}
                      </td>

                      <td className="py-3 pr-15 pl-7 text-right text-slate-700 text-base border-r border-slate-200 whitespace-nowrap">
                        Rp {Number(lineSubtotal).toLocaleString("id-ID")}
                      </td>

                      <td className="text-center py-3 px-3 border-r border-slate-100">
                        <button
                          onClick={() => removeItem(i)}
                          title="Hapus item"
                          aria-label="Hapus item"
                          className="w-9 h-9 inline-flex items-center justify-center rounded-md bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-300"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="text-white"
                          >
                            <path
                              d="M3 6h18"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M10 11v6M14 11v6"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </td>

                      <td className="py-3 px-3" />
                    </tr>
                  );
                })}

                {items.length === 0 && (
                  <tr>
                    <td
                      className="text-center text-slate-500 py-12 text-sm sm:text-base"
                      colSpan={8}
                    >
                      ❌ Belum ada item. Gunakan pencarian di atas untuk
                      menambahkan produk.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* TOTAL */}
          {items.length > 0 && (
            <div className="bg-white p-4 flex flex-col sm:flex-row sm:justify-end">
              <div className="text-right w-full sm:w-auto">
                <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">
                  Total Belanja:
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-blue-700 mb-3">
                  Rp {total.toLocaleString("id-ID")}
                </p>
                <div className="flex gap-2 justify-center sm:justify-end">
                  <button
                    onClick={() => {
                      if (!confirm("Batal transaksi dan kosongkan keranjang?"))
                        return;
                      setItems([]);
                    }}
                    className="px-4 sm:px-6 py-2 bg-linear-to-r from-red-500 to-red-600 text-white font-bold text-sm sm:text-base rounded-lg hover:from-red-600 hover:to-red-700 hover:shadow-lg transition-all shadow-md"
                  >
                    ❌ Batal
                  </button>

                  <button
                    onClick={() => setShowPayModal(true)}
                    className="px-4 sm:px-6 py-2 bg-linear-to-r from-green-600 to-green-700 text-white font-bold text-sm sm:text-base rounded-lg hover:from-green-700 hover:to-green-800 hover:shadow-lg transition-all shadow-md"
                  >
                    💳 Proses Pembayaran
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showPayModal && (
        <PayModal
          total={total}
          items={items}
          onClose={() => setShowPayModal(false)}
          onSuccess={() => {
            setItems([]);
            setShowPayModal(false);
          }}
        />
      )}
    </ClientShell>
  );
}

/* ============================================================
 * PAYMENT MODAL
 * ============================================================ */

function PayModal({
  total,
  items,
  onClose,
  onSuccess,
}: {
  total: number;
  items: { product_id: number; qty: number }[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [paid, setPaid] = useState(0);
  const [paidInput, setPaidInput] = useState("");
  const change = paid - total;

  function openReceiptPrint({
    store,
    trx,
    detailItems,
    paidAmount,
    changeAmount,
  }: {
    store: { name?: string; address?: string; city?: string; district?: string; sub_district?: string; province?: string; phone?: string };
    trx: { id: number; invoice_code?: string | null; created_at?: string | Date; total_amount: number; paid_amount: number; change_amount: number };
    detailItems: { name: string; unit: string; quantity: number; unit_price: number; subtotal: number }[];
    paidAmount: number;
    changeAmount: number;
  }) {
    const storeName = store.name || "Toko";
    const addressParts = [store.address, store.sub_district, store.district, store.city, store.province].filter(Boolean);
    const addressLine = addressParts.join(", ");
    const created = trx.created_at ? new Date(trx.created_at) : new Date();
    const dateStr = created.toLocaleDateString("id-ID");
    const timeStr = created.toLocaleTimeString("id-ID");

    const formatRp = (n: number) => `Rp ${Number(n || 0).toLocaleString("id-ID")}`;

    let itemsHtml = "";
    for (const it of detailItems) {
      itemsHtml += `
        <div style="margin:6px 0;">
          <div style="display:flex;justify-content:space-between;">
            <span style="font-weight:600;">${it.name}</span>
            <span>${formatRp(it.subtotal)}</span>
          </div>
          <div style="font-size:11px;color:#444;">${it.quantity} ${it.unit} x ${formatRp(it.unit_price)}</div>
        </div>
      `;
    }

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Struk Pembayaran</title>
          <style>
            body { font-family: Arial, sans-serif; width: 80mm; margin: 0; padding: 10px; }
            .sep { border-top: 1px dashed #999; margin: 8px 0; }
          </style>
        </head>
        <body>
          <div style="text-align:center">
            <div style="font-size:16px;font-weight:700;">${storeName}</div>
            ${addressLine ? `<div style="font-size:12px;color:#444; margin-top:2px;">${addressLine}</div>` : ""}
            ${store.phone ? `<div style="font-size:12px;color:#444;">Telp: ${store.phone}</div>` : ""}
          </div>
          <div class="sep"></div>
          <div style="font-size:12px;display:flex;justify-content:space-between;">
            <span>No: ${trx.invoice_code || `INV-${trx.id}`}</span>
            <span>${dateStr} ${timeStr}</span>
          </div>
          <div class="sep"></div>
          ${itemsHtml}
          <div class="sep"></div>
          <div style="font-size:13px;display:flex;justify-content:space-between;font-weight:700;">
            <span>Total</span>
            <span>${formatRp(trx.total_amount)}</span>
          </div>
          <div style="font-size:13px;display:flex;justify-content:space-between;">
            <span>Bayar</span>
            <span>${formatRp(paidAmount)}</span>
          </div>
          <div style="font-size:13px;display:flex;justify-content:space-between;color:#0a0;">
            <span>Kembalian</span>
            <span>${formatRp(changeAmount)}</span>
          </div>
          <div class="sep"></div>
          <div style="text-align:center;font-size:12px;color:#333;">Terima kasih telah berbelanja</div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    const w = window.open("", "_blank", "width=400,height=600");
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
    }
  }

  async function handlePay() {
    if (paid < total) return alert("❌ Nominal kurang!");

    try {
      const resp = await createTransaction({
        items: items.map((it) => ({
          product_id: it.product_id,
          quantity: it.qty,
        })),
        paid_amount: paid,
      });
      // resp: { transaction, items }
      const store = await getClientInfo();
      const trx = resp?.transaction || { id: 0, total_amount: total, paid_amount: paid, change_amount: Math.max(paid - total, 0) };
      const detail = Array.isArray(resp?.items) ? resp.items : [];

      openReceiptPrint({
        store,
        trx,
        detailItems: detail,
        paidAmount: paid,
        changeAmount: Math.max(paid - total, 0),
      });

      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transaksi gagal";
      alert("❌ " + msg);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl  overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-slate-900 to-slate-800 px-6 py-4">
          <h2 className="font-bold text-lg text-white">💳 Proses Pembayaran</h2>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="bg-linear-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
            <p className="text-sm text-black font-medium">Total Belanja:</p>
            <p className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-green-600 to-emerald-600">
              Rp {total.toLocaleString("id-ID")}
            </p>
          </div>

          <div>
  <label className="block text-sm font-bold text-slate-900 mb-2">
    💵 Nominal Pembayaran
  </label>

  <input
    type="text"
    inputMode="numeric"
    className="border-2 border-slate-300 w-full px-4 py-3 rounded-lg text-lg font-semibold
               focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all"
    value={paidInput}
    onChange={(e) => {
      // Ambil angka saja
      const raw = e.target.value.replace(/\D/g, "");

      // Simpan angka murni
      const numericValue = raw ? Number(raw) : 0;
      setPaid(numericValue);

      // Format rupiah bertitik
      const formatted = raw
        ? numericValue.toLocaleString("id-ID")
        : "";

      setPaidInput(formatted);
    }}
    placeholder="0"
    autoFocus
  />
</div>


          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm text-black font-medium mb-1">
              Kembalian :
            </p>
            <p
              className={`text-2xl font-bold ${
                change < 0
                  ? "text-red-600"
                  : "text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-blue-700"
              }`}
            >
              Rp {Math.max(change, 0).toLocaleString("id-ID")}
            </p>
            {change < 0 && (
              <p className="text-xs text-red-600 font-medium mt-1">
                ⚠️ Nominal pembayaran kurang Rp{" "}
                {Math.abs(change).toLocaleString("id-ID")}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex justify-end gap-3">
          <button
            className="px-4 py-2 text-sm font-bold border-2 border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-all"
            onClick={onClose}
          >
            ❌ Batal
          </button>

          <button
            className="px-4 py-2 text-sm font-bold bg-linear-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 hover:shadow-lg transition-all disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed"
            disabled={paid < total}
            onClick={handlePay}
          >
            ✅ Bayar Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
