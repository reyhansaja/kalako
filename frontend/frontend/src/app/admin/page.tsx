"use client";

import React, { useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { getUserFromToken, removeToken } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const me = getUserFromToken();
        if (!me || me.role !== 'super_admin') {
          setError('Akses terbatas: silakan login sebagai super_admin');
          setLoading(false);
          return;
        }

        const resp = await apiGet('/api/admin/dashboard');
        setData(resp);
      } catch (err: any) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Memuat dashboard admin...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }


  async function handleLogout() {
    try {
      await apiPost('/api/auth/logout', {});
    } catch (err) {
      // ignore network errors, still clear client token
      console.warn('Logout API error', err);
    }
    removeToken();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="min-h-screen p-8 bg-slate-50 text-black">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Dashboard Admin</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-600">Selamat datang, Super Admin</div>
            <button
              onClick={handleLogout}
              className="text-sm bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-white rounded shadow">
            <div className="text-sm text-slate-500">Total Clients</div>
            <div className="text-2xl font-bold">{data.totalClients}</div>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <div className="text-sm text-slate-500">Total Product Stock</div>
            <div className="text-2xl font-bold">{data.totalProducts}</div>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <div className="text-sm text-slate-500">Transactions</div>
            <div className="text-2xl font-bold">{data.totalTransactions}</div>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <div className="text-sm text-slate-500">Total Revenue</div>
            <div className="text-2xl font-bold">Rp {Number(data.totalRevenue || 0).toLocaleString()}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded shadow p-4">
            <h2 className="font-semibold mb-3">Recent Clients</h2>
            {data.recentClients && data.recentClients.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="text-slate-500 text-left">
                  <tr>
                    <th className="pb-2">ID</th>
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Subdomain</th>
                    <th className="pb-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentClients.map((c: any) => (
                    <tr key={c.id} className="border-t">
                      <td className="py-2">{c.id}</td>
                      <td className="py-2">{c.name}</td>
                      <td className="py-2">{c.subdomain}</td>
                      <td className="py-2">{new Date(c.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-sm text-slate-500">Tidak ada client baru</div>
            )}
          </div>

          <div className="bg-white rounded shadow p-4">
            <h2 className="font-semibold mb-3">Recent Transactions</h2>
            {data.recentTransactions && data.recentTransactions.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="text-slate-500 text-left">
                  <tr>
                    <th className="pb-2">ID</th>
                    <th className="pb-2">Client</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTransactions.map((t: any) => (
                    <tr key={t.id} className="border-t">
                      <td className="py-2">{t.id}</td>
                      <td className="py-2">{t.client_id}</td>
                      <td className="py-2">Rp {Number(t.total_amount).toLocaleString()}</td>
                      <td className="py-2">{new Date(t.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-sm text-slate-500">Tidak ada transaksi</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
