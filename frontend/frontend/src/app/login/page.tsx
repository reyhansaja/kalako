"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { login } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { withTenantPath } from "@/lib/tenant";

function readPublicEnv(name: string): string {
  const env = (import.meta as any).env ?? {};
  const value = env[name];
  return typeof value === "string" ? value : "";
}

export default function LoginPage() {
  const { tenant } = useParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setTenantName(tenant || null);

    // Fallback auto login dari root-login via URL param
    const params = new URLSearchParams(window.location.search);
    const autoToken = params.get("auto_token");

    if (autoToken) {
      setToken(autoToken);
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => {
        window.location.href = withTenantPath("/dashboard", tenant);
      }, 100);
    }
  }, [tenant]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);

    try {
      const resp = await login({
        username: String(fd.get("username") || ""),
        password: String(fd.get("password") || ""),
      });

      setToken(resp.token);
      
      // Tunggu sebentar agar cookie sempat tersimpan
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      window.location.href = withTenantPath("/dashboard", tenant);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const subtitle =
    tenantName
      ? `Login untuk toko: ${tenantName}`
      : "Subtitle lagi terkait jusul masuk di atas";

  const baseDomain = readPublicEnv("VITE_BASE_DOMAIN") || readPublicEnv("NEXT_PUBLIC_BASE_DOMAIN") || "localhost";
  const isLocal = baseDomain.endsWith(".local") || baseDomain === "localhost";
  // Gunakan protokol deterministik agar render server & client sama (hindari hydration mismatch)
  const protocol = isLocal ? "http:" : "https:";
  const frontendPort = readPublicEnv("VITE_FRONTEND_PORT") || readPublicEnv("NEXT_PUBLIC_FRONTEND_PORT") || (isLocal ? "5173" : "");
  const portPart = frontendPort ? `:${frontendPort}` : "";
  const registerUrl = `${protocol}//${baseDomain}${portPart}/register`;

  return (
    <main className="w-full min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200">
          {/* HEADER */}
          <div className="px-6 py-8 flex flex-col items-start">
            <div className="w-20 h-16 border border-blue-200 bg-blue-100/40 rounded-md flex items-center justify-center mb-4">
              <span className="text-black text-3xl opacity-90">🖼️</span>
            </div>

            <h1 className="text-2xl font-bold text-black">
              Masuk Untuk Melanjutkan
            </h1>
            <p className="text-black text-sm mt-1">{subtitle}</p>
          </div>

          {/* BODY */}
          <div className="p-6">
            {error && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Username
                </label>
                <input
                  name="username"
                  className="w-full border border-slate-300 rounded-md px-4 py-2 text-black text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none"
                  placeholder="username"
                />
              </div>

              {/* PASSWORD + ICON MATA SVG */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className="w-full border border-slate-300 rounded-md text-black px-4 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none"
                    placeholder="Masukkan password 6 digit dengan kombinasi angka dan huruf"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? (
                      // Eye-off icon
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 15.338 6.828 18 12 18c1.53 0 2.97-.27 4.243-.757M7.757 7.757A5 5 0 0116.243 16.243M9.88 9.88l4.24 4.24M9.879 14.121l4.242-4.242M3 3l18 18"
                        />
                      </svg>
                    ) : (
                      // Eye icon
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12C3.423 7.943 7.36 5 12 5c4.64 0 8.577 2.943 9.964 7-1.387 4.057-5.324 7-9.964 7-4.64 0-8.577-2.943-9.964-7z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-md bg-black text-white text-sm font-semibold hover:bg-neutral-900 transition shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                {loading ? "Memproses..." : "Masuk"}
              </button>
            </form>

            {/* FOOTER LINK */}
            <p className="text-sm text-center text-slate-600 mt-6">
              Belum punya akun?{" "}
              <a
                href={registerUrl}
                className="font-semibold text-blue-700 hover:underline"
              >
                Daftar Disini
              </a>
            </p>
          </div>

          {/* CARD FOOTER */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 text-center">
            <p className="text-xs text-slate-600">
              &copy; {new Date().getFullYear()} KALAKO - Sistem ERP Retail Terpercaya
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
