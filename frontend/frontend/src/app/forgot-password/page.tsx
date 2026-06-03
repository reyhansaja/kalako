"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { getApiBase } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/password-reset/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal mengirim OTP");
        setLoading(false);
        return;
      }
      setSuccess("OTP telah dikirim ke email Anda");
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword !== confirmPassword) {
      setError("Password tidak cocok");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }
    setLoading(true);
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/password-reset/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal reset password");
        setLoading(false);
        return;
      }
      setSuccess("Password berhasil direset. Mengalihkan ke login...");
      setTimeout(() => {
        window.location.href = "/root-login";
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center ">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl ring-1 ring-gray-200 p-8">
        <div className="text-center mb-8">
          <img
            src="/Logo.png"
            alt="Kalako logo"
            className="mx-auto h-20 w-auto mb-3"
          />
          <h1 className="text-3xl font-bold text-gray-800">Kalako</h1>
          <p className="text-gray-600 mt-2">Reset Password</p>
        </div>

        {step === "email" ? (
          <form onSubmit={handleRequestReset} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Terdaftar</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DF0093] text-gray-800"
                placeholder="email@example.com"
              />
            </div>
            {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}
            {success && <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm">{success}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#9F0069] hover:bg-[#800054] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Mengirim OTP..." : "Kirim OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Kode OTP</label>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DF0093] text-gray-800"
                placeholder="123456"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password Baru</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DF0093] text-gray-800"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Konfirmasi Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DF0093] text-gray-800"
                placeholder="••••••••"
              />
            </div>
            {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}
            {success && <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm">{success}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#9F0069] hover:bg-[#800054] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Mereset..." : "Reset Password"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setError("");
                setSuccess("");
              }}
              className="w-full text-[#9F0069] hover:text-[#800054] font-semibold py-2"
            >
              Kembali
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          Ingat password? {" "}
          <Link to="/root-login" className="text-[#9F0069] hover:text-[#800054] font-semibold">
            Login di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
