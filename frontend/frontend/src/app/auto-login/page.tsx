"use client";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { setToken } from "@/lib/auth";
import { withTenantPath } from "@/lib/tenant";

export default function AutoLoginPage() {
  const { tenant } = useParams();
  const [message, setMessage] = useState("Menyiapkan tokomu...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get("token") || searchParams.get("auto_token");
    const next = searchParams.get("next") || "/dashboard";

    if (!token) {
      setError("Token tidak ditemukan. Silakan login kembali.");
      setMessage("");
      return;
    }

    try {
      if (tenant) {
        localStorage.setItem("tenant_subdomain", tenant);
      }
      setToken(token);
      setMessage("Toko diverifikasi, mengarahkan...");
      setTimeout(() => {
        window.location.replace(withTenantPath(next, tenant));
      }, 150);
    } catch (e: any) {
      setError(e?.message || "Gagal menyimpan sesi");
      setMessage("");
    }
  }, [tenant]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-6 border border-slate-200 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
            <svg className="w-6 h-6 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" opacity="0.25" />
              <path d="M22 12a10 10 0 0 1-10 10" />
            </svg>
          </div>
        </div>
        {message && <p className="text-sm text-slate-700">{message}</p>}
        {error && (
          <div className="mt-3 text-sm text-red-600">
            {error} <a href={withTenantPath('/login', tenant)} className="underline text-blue-700">Kembali ke login</a>
          </div>
        )}
      </div>
    </main>
  );
}
