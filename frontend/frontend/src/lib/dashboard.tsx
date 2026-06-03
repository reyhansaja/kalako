// lib/dashboard.ts
import { getApiBase, authHeaders, tenantHeader } from "@/lib/api";
export type RangeType = "daily" | "monthly" | "yearly";

export type DashboardSummary = {
  totalStock: number;
  totalSold: number;
  totalCustomers: number;
  incomeTotal: number; // total uang (mis: hari ini / bulan ini)
  incomeOrders: number; // jumlah order
  incomeChart: { label: string; value: number }[];
};

export type RecentTransaction = {
  id: number;
  title: string;
  date: string; // "17 Sep 2023"
  time: string; // "11:21 AM"
  amount: number;
  status: "pending" | "confirmed" | "canceled";
};

// Gunakan API global melalui helper

export async function fetchDashboard(range: RangeType): Promise<DashboardSummary> {
  const base = getApiBase();

  const res = await fetch(`${base}/api/dashboard/summary?range=${range}`, {
    headers: { "Content-Type": "application/json", ...authHeaders(), ...tenantHeader() },
  });

  if (!res.ok) {
    throw new Error("Gagal mengambil data dashboard");
  }

  return res.json();
}

export async function fetchRecentTransactions(
  range: RangeType
): Promise<RecentTransaction[]> {
  const base = getApiBase();

  const res = await fetch(
    `${base}/api/dashboard/recent-transactions?range=${range}`,
    {
      headers: { "Content-Type": "application/json", ...authHeaders(), ...tenantHeader() },
    }
  );

  if (!res.ok) {
    throw new Error("Gagal mengambil data transaksi");
  }

  return res.json();
}
