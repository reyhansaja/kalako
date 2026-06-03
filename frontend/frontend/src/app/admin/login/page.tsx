"use client";

import { FormEvent, useState } from "react";
import { loginAdmin } from "@/lib/api";
import { setToken } from "@/lib/auth";

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);

    try {
      const resp: any = await loginAdmin({
        username: String(fd.get("username") || ""),
        password: String(fd.get("password") || ""),
      });

      if (resp && resp.token) {
        setToken(resp.token);
        // also set an explicit admin cookie so edge middleware recognizes admin session
        try {
          const { setAdminToken } = await import("@/lib/auth");
          setAdminToken(resp.token);
        } catch (e) {
          console.warn('Failed to set admin token cookie:', e);
        }
        // slight delay for cookie propagation
        await new Promise((r) => setTimeout(r, 100));
        window.location.href = "/admin";
      } else {
        setError('Login admin gagal');
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="w-full text-black min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow rounded-lg border border-slate-200 overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">Admin Login</h1>
            <p className="text-sm text-slate-600 mb-4">Masuk sebagai super admin</p>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Username</label>
                <input name="username" className="w-full border border-slate-300 rounded-md px-4 py-2 text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Password</label>
                <input name="password" type="password" className="w-full border border-slate-300 rounded-md px-4 py-2 text-sm" />
              </div>

              <button type="submit" disabled={loading} className="w-full h-11 rounded-md bg-black text-white">
                {loading ? 'Memproses...' : 'Masuk sebagai Admin'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
