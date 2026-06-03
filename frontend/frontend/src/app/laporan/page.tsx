"use client";

import { useEffect, useState } from "react";
import ClientShell from "@/components/clientShell";
import { useProtectedPage } from "@/lib/hooks";
import {
  getProductReport,
  getMonthlySalesData,
  exportProductReport,
  authHeaders,
} from "@/lib/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { FileSpreadsheet, FileText } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function LaporanPage() {
    const { isReady } = useProtectedPage();
    const [range, setRange] = useState<"daily" | "monthly" | "yearly">("monthly");
    const [rows, setRows] = useState<any[]>([]);
    const [chartData, setChartData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isReady) return;
        fetchData();
    }, [range, isReady]);

  const formatIDR = (val: any) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(val || 0));

  const rangeLabel: Record<"daily" | "monthly" | "yearly", string> = {
    daily: "Hari Ini",
    monthly: "Bulan Ini",
    yearly: "Tahun Ini",
  };

  const titleTopProduk = `Top Produk (${rangeLabel[range]})`;
  const titleChart = `Penjualan ${rangeLabel[range]}`;
  const datasetLabel = `Penjualan ${rangeLabel[range]} (Rp)`;

  useEffect(() => {
    if (!isReady) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, isReady]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res: any = await getProductReport({ range, limit: 100 });
      setRows(res.rows || []);

      try {
        const monthlyRes: any = await getMonthlySalesData();
        const data = monthlyRes.chart || [];

        const colors = ["rgba(59,130,246,0.85)", "rgba(16,185,129,0.85)"];
        const borderColors = ["rgb(59,130,246)", "rgb(16,185,129)"];

        setChartData({
          labels: data.map((d: any) => d.bulan),
          datasets: [
            {
              label: datasetLabel,
              data: data.map((d: any) => d.total),
              backgroundColor: data.map((_: any, idx: number) => colors[idx % 2]),
              borderColor: data.map((_: any, idx: number) => borderColors[idx % 2]),
              borderWidth: 1,
              borderRadius: 10,
              barThickness: 16,
            },
          ],
        });
      } catch (e) {
        console.error("Failed to fetch monthly sales:", e);
        setChartData(null);
      }
    } catch (e: any) {
      console.error("Error fetching report:", e);
      setError(
        e.message ||
          "Gagal memuat laporan. Pastikan backend sudah running di port 4000."
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  function handleExport(format: "pdf" | "excel") {
    const url = exportProductReport(range, format);
    const headers = authHeaders();
    fetch(url, { headers })
      .then((r) => {
        if (!r.ok) throw new Error("Export failed");
        return r.blob();
      })
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `laporan_${range}.${format === "pdf" ? "pdf" : "xlsx"}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);
      })
      .catch((e) => console.error(e));
  }

  const totalJumlah = rows.reduce((s, r) => s + (r.jumlah || 0), 0);
  const totalPendapatan = rows.reduce(
    (s, r) => s + (r.total_pendapatan || 0),
    0
  );

  if (!isReady) {
    return (
      <ClientShell title="Laporan Penjualan">
        <div className="flex items-center justify-center h-48 text-slate-600">
          Memverifikasi akses...
        </div>
      </ClientShell>
    );
  }

  if (error) {
    return (
      <ClientShell
        title={
          <div className="flex items-center gap-2">
            <img
              src="/Logo.png"
              alt="Kalako"
              className="h-12 w-auto"
            />
            <span className="text-3xl">Laporan Penjualan</span>
          </div>
        }
      >
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          <p className="font-bold">⚠️ Terjadi Error</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={() => fetchData()}
            className="mt-3 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold"
          >
            Coba Lagi
          </button>
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
          <span className="text-3xl">Laporan Penjualan</span>
        </div>
      }
    >
      {/* ✅ wrapper max width supaya desktop & mobile terasa sama */}
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Range Switch (auto width, centered) */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-xl inline-flex items-center bg-slate-200 rounded-full p-1 shadow-sm">
              <button
                onClick={() => setRange("daily")}
                className={`flex-1 text-center px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold transition-all duration-150 rounded-full focus:outline-none ${
                  range === "daily"
                    ? "bg-white text-slate-900 shadow-md"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Harian
              </button>
              <button
                onClick={() => setRange("monthly")}
                className={`flex-1 text-center px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold transition-all duration-150 rounded-full focus:outline-none ${
                  range === "monthly"
                    ? "bg-white text-slate-900 shadow-md"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Bulanan
              </button>
              <button
                onClick={() => setRange("yearly")}
                className={`flex-1 text-center px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold transition-all duration-150 rounded-full focus:outline-none ${
                  range === "yearly"
                    ? "bg-white text-slate-900 shadow-md"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Tahunan
              </button>
            </div>
          </div>

          {/* Summary Cards (tetap 1 gaya, grid hanya melebar) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center hover:shadow-md transition">
              <p className="text-xs font-semibold text-slate-500">Total Jumlah</p>
              <p className="text-3xl font-extrabold mt-2 text-slate-900">
                {totalJumlah}
              </p>
              <p className="text-xs text-slate-400 mt-1">Total item terjual</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center hover:shadow-md transition">
              <p className="text-xs font-semibold text-slate-500">Total Pendapatan</p>
              <p className="text-3xl font-extrabold mt-2 text-slate-900">
                {formatIDR(totalPendapatan)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Akumulasi omzet</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center hover:shadow-md transition">
              <p className="text-xs font-semibold text-slate-500 mb-3">Export Laporan</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  onClick={() => handleExport("pdf")}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition flex items-center justify-center gap-2"
                >
                  <FileText size={16} />
                  Export PDF
                </button>
                <button
                  onClick={() => handleExport("excel")}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  <FileSpreadsheet size={16} />
                  Export Excel
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">Unduh laporan periode {rangeLabel[range]}</p>
            </div>
          </div>

          {/* Table + Chart (layout konsisten) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Table */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {titleTopProduk}
                </h3>
                <span className="text-xs text-slate-500">{rows.length} data</span>
              </div>

              {/* ✅ biar mobile gak aneh: kasih min width table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="text-left bg-slate-50 border-y border-slate-200 text-slate-700">
                      <th className="py-3 px-2 w-12">No</th>
                      <th className="py-3 px-2">Nama Produk</th>
                      <th className="py-3 px-2 w-28 text-right">Jumlah</th>
                      <th className="py-3 px-2 w-44 text-right">Pendapatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500">
                          Memuat...
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500">
                          Tidak ada data
                        </td>
                      </tr>
                    ) : (
                      rows.map((r, idx) => (
                        <tr
                          key={r.id}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="py-3 px-2 text-slate-600">{idx + 1}.</td>
                          <td className="py-3 px-2 text-slate-900 font-medium">
                            {r.name}
                          </td>
                          <td className="py-3 px-2 text-right text-slate-700">
                            {r.jumlah}
                          </td>
                          <td className="py-3 px-2 text-right font-semibold text-slate-900">
                            {formatIDR(r.total_pendapatan)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition">
              <h4 className="text-base sm:text-lg font-extrabold mb-3 text-slate-900">
                {titleChart}
              </h4>

              {/* ✅ tinggi chart stabil di mobile & desktop */}
              {loading ? (
                <div className="flex items-center justify-center h-64 text-slate-500">
                  Memuat chart...
                </div>
              ) : chartData ? (
                <div className="h-64">
                  <Bar
                    data={chartData}
                    options={{
                      indexAxis: "y" as const,
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: (ctx: any) =>
                              `Rp ${Number(ctx.raw || 0).toLocaleString("id-ID")}`,
                          },
                        },
                      },
                      scales: {
                        x: {
                          beginAtZero: true,
                          ticks: {
                            callback: (val: any) =>
                              `Rp ${Number(val).toLocaleString("id-ID")}`,
                          },
                        },
                        y: {
                          ticks: {
                            autoSkip: false,
                            maxRotation: 0,
                            font: { size: 12, weight: "bold" as any },
                          },
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-slate-500">Tidak ada data chart</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ClientShell>
  );
}
