"use client";

import { useEffect, useState } from "react";
import { setToken } from "@/lib/auth";
import { Eye, EyeOff } from "lucide-react";
import { getApiBase } from "@/lib/api";

function readPublicEnv(name: string): string {
  const env = (import.meta as any).env ?? {};
  const value = env[name];
  return typeof value === "string" ? value : "";
}

export default function RootLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("rootLoginRemember");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { email?: string; password?: string };
      setRememberMe(true);
      setEmail(parsed.email || "");
      setPassword(parsed.password || "");
    } catch (e) {
      // ignore parsing issues
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (rememberMe) {
      localStorage.setItem("rootLoginRemember", JSON.stringify({ email, password }));
    } else {
      localStorage.removeItem("rootLoginRemember");
    }
  }, [rememberMe, email, password]);
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/root-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Login gagal" }));
        setError(data.message || "Login gagal");
        setLoading(false);
        return;
      }

      const data = await res.json();

      // Simpan token (localStorage + cookie) dulu di root domain
      setToken(data.token);

      // Redirect ke tenant path dan langsung auto-set token
      const baseDomain = readPublicEnv("VITE_BASE_DOMAIN") || readPublicEnv("NEXT_PUBLIC_BASE_DOMAIN") || window.location.hostname;
      // Default port only for local/dev; leave empty in production domains
      const isLocal = baseDomain.endsWith(".local") || baseDomain === "localhost";
      const frontendPort = readPublicEnv("VITE_FRONTEND_PORT") || readPublicEnv("NEXT_PUBLIC_FRONTEND_PORT") || (isLocal ? "5173" : "");
      const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";
      const portPart = frontendPort ? `:${frontendPort}` : "";
      const targetHost = baseDomain;
      const tenantPath = `/${encodeURIComponent(data.subdomain)}`;
      const targetUrl = `${protocol}//${targetHost}${portPart}${tenantPath}/auto-login?token=${encodeURIComponent(
        data.token
      )}&next=${encodeURIComponent('/dashboard')}`;
      window.location.href = targetUrl;
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl ring-1 ring-gray-200 p-8">
        <div className="text-center mb-8">
          <img
            src="/Logo.png"
            alt="Kalako logo"
            className="mx-auto h-20 w-auto mb-3"
          />
          <h2 className="text-3xl font-bold text-gray-800">Kalako</h2>
          <p className="text-gray-600 mt-2">Login ke akun Anda</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DF0093] text-gray-800"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DF0093] text-gray-800"
                placeholder="Masukkan password Anda"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <label className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#9F0069] focus:ring-[#DF0093]"
              />
              <span>Ingat saya</span>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#9F0069] hover:bg-[#800054] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2 text-sm text-gray-600">
          <p>
            Belum punya akun?{" "}
            <a href="/register" className="text-[#9F0069] hover:text-[#800054] font-semibold">
              Daftar sekarang
            </a>
          </p>
          <p>
            <a href="/forgot-password" className="text-[#9F0069] hover:text-[#800054] font-semibold">
              Lupa password?
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
