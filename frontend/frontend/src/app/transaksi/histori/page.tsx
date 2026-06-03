"use client";

import { useEffect, useState } from "react";
import ClientShell from "@/components/clientShell";
import { useProtectedPage } from "@/lib/hooks";
import { getTransactionHistory, getTransactionItems, getApiBase, getClientInfo } from "@/lib/api";
import { FileSpreadsheet, FileText } from "lucide-react";

interface Transaction {
  id: number;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  created_at: string;
  cashier_name: string;
  item_count: number;
}

interface TransactionItem {
  id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_name: string;
  unit: string;
}

export default function HistoriTransaksiPage() {
  const { isReady } = useProtectedPage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };
  
  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState(getTodayDate());
  const [currentPage, setCurrentPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState<number | null>(
    null
  );
  const [selectedItems, setSelectedItems] = useState<TransactionItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  const limit = 10;

  // =========================
  // Helpers
  // =========================
  const formatRupiah = (val: number | string) =>
    `Rp ${Number(val || 0).toLocaleString("id-ID")}`;

  const formatQty = (qty: number | string, unit: string) => {
    const n = Number(qty || 0);
    const u = (unit || "").toLowerCase().trim();

    // Jika unit = pcs dan data tersimpan x1000 (mis: 3000 = 3 pcs)
    if (u === "pcs" || u === "pc") {
      const displayed = n >= 1000 ? n / 1000 : n;
      // tampilkan tanpa desimal jika bilangan bulat
      return Number.isInteger(displayed) ? displayed : displayed.toFixed(2);
    }

    // Unit lain biarkan normal (maks 3 desimal, tanpa ribuan aneh)
    return n.toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    });
  };

  function openReceiptPrint({
    store,
    tx,
    detailItems,
  }: {
    store: { name?: string; address?: string; city?: string; district?: string; sub_district?: string; province?: string; phone?: string };
    tx: Transaction;
    detailItems: { name: string; unit: string; quantity: number; unit_price: number; subtotal: number }[];
  }) {
    const storeName = store.name || "Toko";
    const addressParts = [store.address, store.sub_district, store.district, store.city, store.province].filter(Boolean);
    const addressLine = addressParts.join(", ");
    const created = tx.created_at ? new Date(tx.created_at) : new Date();
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
            ${addressLine ? `<div style=\"font-size:12px;color:#444; margin-top:2px;\">${addressLine}</div>` : ""}
            ${store.phone ? `<div style=\"font-size:12px;color:#444;\">Telp: ${store.phone}</div>` : ""}
          </div>
          <div class="sep"></div>
          <div style="font-size:12px;display:flex;justify-content:space-between;">
            <span>ID: ${tx.id}</span>
            <span>${dateStr} ${timeStr}</span>
          </div>
          <div class="sep"></div>
          ${itemsHtml}
          <div class="sep"></div>
          <div style="font-size:13px;display:flex;justify-content:space-between;font-weight:700;">
            <span>Total</span>
            <span>${formatRp(tx.total_amount)}</span>
          </div>
          <div style="font-size:13px;display:flex;justify-content:space-between;">
            <span>Bayar</span>
            <span>${formatRp(tx.paid_amount)}</span>
          </div>
          <div style="font-size:13px;display:flex;justify-content:space-between;color:#0a0;">
            <span>Kembalian</span>
            <span>${formatRp(tx.change_amount)}</span>
          </div>
          <div class="sep"></div>
          <div style="text-align:center;font-size:12px;color:#333;">Terima kasih telah berbelanja<br></div>
          <div style="text-align:center;font-size:12px;color:#333;"><br><br>Powered by PT. Karya Mulya Korpora - KALAKO</div>
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

  async function loadTransactions() {
    setLoading(true);
    try {
      const res = await getTransactionHistory({
        limit,
        offset: currentPage * limit,
        startDate,
        endDate,
      });
      setTransactions(res.transactions || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error("Error loading transactions:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setCurrentPage(0);
  }, [startDate, endDate]);

  useEffect(() => {
    if (!isReady) return;
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, startDate, endDate, isReady]);

  async function handleViewDetail(transactionId: number) {
    if (selectedTransaction === transactionId) {
      setSelectedTransaction(null);
      setSelectedItems([]);
      return;
    }

    setSelectedTransaction(transactionId);
    setItemsLoading(true);
    try {
      const res = await getTransactionItems(transactionId);
      setSelectedItems(res.items || []);
    } catch (err) {
      console.error("Error loading items:", err);
    } finally {
      setItemsLoading(false);
    }
  }

  async function handleViewReceipt(tx: Transaction) {
    try {
      const store = await getClientInfo();
      const res = await getTransactionItems(tx.id);
      const items: TransactionItem[] = res.items || [];
      const detailItems = items.map((it) => ({
        name: it.product_name,
        unit: it.unit,
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price),
        subtotal: Number(it.subtotal),
      }));
      openReceiptPrint({ store, tx, detailItems });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal membuka struk";
      alert("❌ " + msg);
    }
  }

  async function handleExport(format: "pdf" | "excel") {
    try {
      const base = getApiBase();
      const url = `${base}/api/transactions/export?startDate=${startDate}&endDate=${endDate}&format=${format}`;
      const token = localStorage.getItem("token");
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error("Gagal export laporan");
      }
      
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `laporan-${startDate}-${endDate}.${format === "pdf" ? "pdf" : "xlsx"}`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Export error:", err);
      const msg = err instanceof Error ? err.message : "Gagal export laporan";
      alert("Gagal export: " + msg);
    }
  }

  const totalPages = Math.ceil(total / limit);

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
            <span className="text-3xl">Histori Transaksi</span>
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
          <span className="text-3xl">Histori Transaksi</span>
        </div>
      }
    >
      <div className="w-full">
        {/* Date Filter */}
        <div className="mb-4 sm:mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex flex-col gap-3">
              {/* Date inputs row */}
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                     Dari:
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 sm:flex-initial px-3 py-2 rounded-lg text-black text-sm bg-slate-50 border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                  />
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                    Sampai:
                  </span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 sm:flex-initial px-3 py-2 rounded-lg text-black text-sm bg-slate-50 border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                  />
                </div>
                
                <button
                  onClick={() => {
                    setStartDate(getTodayDate());
                    setEndDate(getTodayDate());
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Refresh
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport("pdf")}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText size={16} />
                    Export PDF
                  </button>
                  
                  <button
                    onClick={() => handleExport("excel")}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileSpreadsheet size={16} />
                    Export Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
          {/* Table Header */}
          <div className="hidden md:grid bg-slate-100 grid-cols-6 text-slate-800 font-bold border-b border-slate-200 text-sm">
            <div className="py-3 px-15 border-r border-slate-200">ID</div>
            <div className="py-3 px-15 border-r border-slate-200">Kasir</div>
            <div className="py-3 px-4 border-r border-slate-200 text-right">
              Total
            </div>
            <div className="py-3 px-4 border-r border-slate-200 text-right">
              Items
            </div>
            <div className="py-3 px-4 border-r border-slate-200">Waktu</div>
            <div className="py-3 px-4 text-center">Aksi</div>
          </div>

          {/* Table Body */}
          {loading ? (
            <div className="px-6 py-12 text-center text-slate-500">
              ⏳ Memuat data...
            </div>
          ) : transactions.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">
              ❌ Tidak ada transaksi
            </div>
          ) : (
            <div>
              {transactions.map((tx) => (
                <div key={tx.id} className="border-b border-slate-100">
                  {/* Desktop Row */}
                  <div
                    onClick={() => handleViewDetail(tx.id)}
                    className="hidden md:grid grid-cols-6 hover:bg-slate-50 cursor-pointer transition"
                  >
                    <div className="py-3 px-15 border-r border-slate-200 font-mono font-bold text-blue-600">
                      {tx.id}
                    </div>
                    <div className="py-3 px-15 border-r border-slate-200 text-slate-700">
                      {tx.cashier_name || "Unknown"}
                    </div>
                    <div className="py-3 px-4 border-r border-slate-200 text-black text-right font-bold">
                      {formatRupiah(tx.total_amount)}
                    </div>
                    <div className="py-3 px-4 border-r border-slate-200 text-right text-slate-600">
                      {tx.item_count} item
                    </div>
                    <div className="py-3 px-4 border-r border-slate-200 text-sm text-slate-600">
                      {new Date(tx.created_at).toLocaleString("id-ID")}
                    </div>
                    <div className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleViewDetail(tx.id); }}
                          className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200"
                        >
                          {selectedTransaction === tx.id ? "▼" : "▶"}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleViewReceipt(tx); }}
                          className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                          title="Lihat Struk"
                        >
                          🧾 Struk
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Card */}
                  <div
                    onClick={() => handleViewDetail(tx.id)}
                    className="md:hidden px-4 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-mono font-bold text-blue-600 text-lg">
                            {tx.id}
                          </div>
                          <div className="text-sm text-slate-600 mt-1">
                            {tx.cashier_name || "Unknown"}
                          </div>
                        </div>
                        <button className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors">
                          {selectedTransaction === tx.id ? "▼" : "▶"}
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-lg p-2 border border-blue-200">
                          <div className="text-xs text-blue-600 font-bold">
                            Total
                          </div>
                          <div className="font-bold text-slate-900">
                            {formatRupiah(tx.total_amount)}
                          </div>
                        </div>
                        <div className="bg-linear-to-br from-green-50 to-green-100 rounded-lg p-2 border border-green-200">
                          <div className="text-xs text-green-600 font-bold">
                            Items
                          </div>
                          <div className="font-bold text-slate-900">
                            {tx.item_count}
                          </div>
                        </div>
                        <div className="bg-linear-to-br from-amber-50 to-amber-100 rounded-lg p-2 border border-amber-200">
                          <div className="text-xs text-amber-600 font-bold">
                            Waktu
                          </div>
                          <div className="font-bold text-xs text-slate-900">
                            {new Date(tx.created_at).toLocaleDateString("id-ID")}
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleViewReceipt(tx); }}
                            className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700"
                          >
                            🧾 Lihat Struk
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detail Rows - Items */}
                  {selectedTransaction === tx.id && (
                    <div className="bg-blue-50 px-4 sm:px-6 py-4 border-t border-blue-100">
                      {itemsLoading ? (
                        <div className="text-center text-slate-600 py-4">
                          ⏳ Memuat detail...
                        </div>
                      ) : selectedItems.length === 0 ? (
                        <div className="text-center text-slate-600 py-4">
                          ❌ Tidak ada item
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="font-bold text-slate-900 text-sm">
                            📦 Detail Item Transaksi
                          </div>

                          {selectedItems.map((item) => (
                            <div
                              key={item.id}
                              className="bg-white rounded-lg p-2 sm:p-3 grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 text-xs sm:text-sm border border-slate-200"
                            >
                              {/* Nama Barang */}
                              <div className="text-slate-800 font-semibold col-span-2 sm:col-span-1 wrap-break-word">
                                {item.product_name}
                              </div>

                              {/* Qty (PCS jadi 3, bukan 3.000) */}
                              <div className="text-right text-slate-600 font-medium">
                                {formatQty(item.quantity, item.unit)}{" "}
                                {item.unit}
                              </div>

                              {/* Harga Satuan (full rupiah, tanpa rb, tanpa @) */}
                              <div className="hidden sm:block text-right text-slate-600 font-medium">
                                {formatRupiah(item.unit_price)}
                              </div>

                              {/* Subtotal */}
                              <div className="text-right font-bold text-slate-900">
                                {formatRupiah(item.subtotal)}
                              </div>

                              <div></div>
                            </div>
                          ))}

                          {/* Summary */}
                          <div className="bg-blue-100 rounded-lg p-3 mt-2 grid grid-cols-5 gap-3 border-2 border-blue-400">
                            <div></div>
                            <div></div>
                            <div></div>
                            <div className="text-right font-bold text-slate-900">
                              Subtotal:
                            </div>
                            <div className="text-right font-bold text-blue-700">
                              {formatRupiah(tx.total_amount)}
                            </div>
                          </div>

                          {/* Payment Info */}
                          <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-3">
                            <div className="bg-white rounded-lg p-2 sm:p-3 border border-green-200">
                              <div className="text-xs text-green-600 font-bold">
                                💳 DIBAYAR
                              </div>
                              <div className="text-sm sm:text-lg font-bold text-green-700">
                                {formatRupiah(tx.paid_amount)}
                              </div>
                            </div>

                            <div className="bg-white rounded-lg p-2 sm:p-3 border border-blue-200">
                              <div className="text-xs text-blue-600 font-bold">
                                🔄 KEMBALIAN
                              </div>
                              <div className="text-sm sm:text-lg font-bold text-blue-600">
                                {formatRupiah(tx.change_amount)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-sm text-slate-600 text-center md:text-left">
              Menampilkan {currentPage * limit + 1} -{" "}
              {Math.min((currentPage + 1) * limit, total)} dari {total} transaksi
            </div>

            <div className="flex flex-col sm:flex-row gap-2 items-center justify-center md:justify-end">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg bg-linear-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all w-full sm:w-auto"
              >
                ◀ Sebelumnya
              </button>

              <div className="flex items-center gap-1 flex-wrap justify-center">
                {Array.from({ length: totalPages }).map((_, i) => {
                  if (
                    totalPages > 5 &&
                    Math.abs(i - currentPage) > 1 &&
                    i !== 0 &&
                    i !== totalPages - 1
                  ) {
                    return null;
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-bold text-sm transition-all ${
                        currentPage === i
                          ? "bg-linear-to-r from-blue-600 to-blue-700 text-white"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
                }
                disabled={currentPage === totalPages - 1}
                className="px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg bg-linear-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all w-full sm:w-auto"
              >
                Selanjutnya ▶
              </button>
            </div>
          </div>
        )}
      </div>
    </ClientShell>
  );
}
