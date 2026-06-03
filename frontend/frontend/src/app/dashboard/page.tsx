"use client";

import { useEffect, useState } from "react";
import ClientShell from "@/components/clientShell";
import { getDashboardSummary, getTransactionHistory } from "@/lib/api";
import { useProtectedPage } from "@/lib/hooks";
import { Link, useParams } from "react-router-dom";
import { withTenantPath } from "@/lib/tenant";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function DashboardPage() {
  const { isReady } = useProtectedPage();
  const { tenant } = useParams();
  const tenantPath = (path: string) => withTenantPath(path, tenant);
  const [range, setRange] = useState<"daily" | "monthly" | "yearly">("daily");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [recentTx, setRecentTx] = useState<any[]>([]);

  useEffect(() => {
    if (!isReady) return;
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, isReady]);

  async function loadSummary() {
    try {
      setLoading(true);
      const data = await getDashboardSummary(range);
      setSummary(data);

      try {
        const tx = await getTransactionHistory({ limit: 5, offset: 0 });
        setRecentTx(tx.transactions || tx.items || []);
      } catch (e) {
        console.error("Failed load recent transactions", e);
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  }

  const chartData = {
    labels: summary?.incomeChart?.map((c: any) => c.label) || [],
    datasets: [
      {
        label: "Pemasukan",
        data: summary?.incomeChart?.map((c: any) => c.value) || [],
        backgroundColor: "rgba(59, 130, 246, 0.85)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions: any = {
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
      y: {
        beginAtZero: true,
        ticks: {
          color: "#64748b",
          font: { size: 11 },
          callback: (v: any) => Number(v).toLocaleString("id-ID"),
        },
        grid: { color: "#e2e8f0" },
      },
      x: {
        ticks: { color: "#64748b", font: { size: 11 } },
        grid: { display: false },
      },
    },
  };

  if (!isReady) {
    return (
      <ClientShell
  title={
    <div className="flex items-center gap-2">
      <img
        src="/Logo.png"
        alt="Kalako"
        className="h-10 w-auto"
      />
      <span>Dashboard</span>
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
      <span className="text-3xl">Dashboard</span>
    </div>
  }
>
      {/* Wrapper responsive yang konsisten */}
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-4">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          {/* Range Selector: auto layout (no fixed width) */}
          <div className="flex justify-center">
            <div className="w-full max-w-xl inline-flex items-center bg-slate-200 rounded-full p-1 shadow-sm">
              <button
                onClick={() => setRange("daily")}
                className={`flex-1 text-center px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold transition-all duration-150 rounded-full focus:outline-none ${
                  range === "daily"
                    ? "bg-white text-slate-900 shadow-md"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Hari ini
              </button>
              <button
                onClick={() => setRange("monthly")}
                className={`flex-1 text-center px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold transition-all duration-150 rounded-full focus:outline-none ${
                  range === "monthly"
                    ? "bg-white text-slate-900 shadow-md"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Bulan
              </button>
              <button
                onClick={() => setRange("yearly")}
                className={`flex-1 text-center px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold transition-all duration-150 rounded-full focus:outline-none ${
                  range === "yearly"
                    ? "bg-white text-slate-900 shadow-md"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Tahun
              </button>
            </div>
          </div>

          {/* Stats Cards: konsisten semua device */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Stok"
              value={summary?.totalStock ?? 0}
              iconPath="/icons/box.svg"
              color="from-blue-500 to-blue-600"
            />
            <StatCard
              title="Total Terjual"
              value={summary?.totalSold ?? 0}
              iconPath="/icons/card.svg"
              color="from-green-500 to-green-600"
            />
            <StatCard
              title="Total Customer"
              value={summary?.totalCustomers ?? 0}
              iconPath="/icons/history.svg"
              color="from-amber-500 to-amber-600"
            />
            <StatCard
              title="Pemasukan"
              value={`Rp ${Number(summary?.incomeTotal || 0).toLocaleString("id-ID")}`}
              iconPath="/icons/report.svg"
              color="from-purple-500 to-purple-600"
            />
          </div>

          {/* Chart + Recent Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-5 sm:p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <img
                    src="/icons/report.svg"
                    alt="grafik"
                    className="w-[18px] h-[18px]"
                  />
                  <span>Grafik Pemasukan</span>
                </h3>
                <span className="text-xs text-slate-500">
                  {range === "daily" ? "Hari ini" : range === "monthly" ? "Bulan ini" : "Tahun ini"}
                </span>
              </div>

              {/* tinggi chart konsisten semua device */}
              <div className="h-64 sm:h-72">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-500 font-medium">
                      ⏳ Memuat data grafik...
                    </p>
                  </div>
                ) : (
                  <Bar data={chartData} options={chartOptions} />
                )}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-lg p-5 sm:p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <img
                    src="/icons/history.svg"
                    alt="histori"
                    className="w-4 h-4"
                  />
                  <span>Riwayat Transaksi</span>
                </h4>
                <Link
                  to={tenantPath("/transaksi/histori")}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  View all
                </Link>
              </div>

              <div className="space-y-2">
                {recentTx.length === 0 ? (
                  <p className="text-xs text-slate-500">Belum ada transaksi</p>
                ) : (
                  recentTx.map((t: any) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">
                            #{t.id} — Rp {Number(t.total_amount).toLocaleString("id-ID")}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {t.item_count} item •{" "}
                            {new Date(t.created_at).toLocaleString("id-ID")}
                          </div>
                        </div>
                        <div className="text-xs text-slate-600 whitespace-nowrap">
                          {t.cashier_name || "—"}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientShell>
  );
}

/* COMPONENT: STAT CARD */
function StatCard({
  title,
  value,
  iconPath,
  icon,
  color,
}: {
  title: string;
  value: any;
  iconPath?: string;
  icon?: string;
  color: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-2xl shadow-lg p-5 sm:p-6 text-white hover:shadow-xl transition`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm opacity-90">{title}</p>
          <p className="text-2xl font-semibold mt-2 truncate">{value}</p>
        </div>
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          {iconPath ? (
            <img
              src={iconPath}
              alt={title}
              className="object-contain filter brightness-0 invert w-[34px] h-[34px]"
            />
          ) : (
            <span className="text-3xl">{icon}</span>
          )}
        </div>
      </div>
    </div>
  );
}
