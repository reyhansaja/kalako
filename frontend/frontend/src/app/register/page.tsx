"use client";

import { FormEvent, useEffect, useState } from "react";
import { sendOtpEmail, signupClientWithOtp, checkEmailAvailability } from "@/lib/api";
import ImageUploader from "@/components/imageUploader";

const RequiredMark = () => <span className="ml-1 text-red-600">*</span>;

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [storePhotoUrl, setStorePhotoUrl] = useState("");
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Debounced email availability check on change
  useEffect(() => {
    setEmailError(null);
    setEmailAvailable(null);
    if (!email) return;

    const handler = setTimeout(async () => {
      try {
        setCheckingEmail(true);
        const { available } = await checkEmailAvailability(email);
        setEmailAvailable(available);
        setEmailError(available ? null : "Email sudah dipakai");
      } catch (e: any) {
        // fallback: don't block UI
        setEmailAvailable(null);
        setEmailError(null);
      } finally {
        setCheckingEmail(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [email]);

  async function handleSendOtp() {
    setError(null);
    setSuccess(null);

    if (!email) {
      setError("Email wajib diisi");
      return;
    }

    if (emailAvailable === false) {
      setError("Email sudah digunakan");
      return;
    }

    try {
      setSendingOtp(true);
      await sendOtpEmail(email);
      setOtpSent(true);
      setSuccess("OTP telah dikirim ke email anda.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);

    try {
      const resp = await signupClientWithOtp({
        store_name: String(fd.get("store_name") || ""),
        owner_name: String(fd.get("owner_name") || ""),
        owner_id_number: String(fd.get("owner_id_number") || ""),
        address: String(fd.get("address") || ""),
        phone: String(fd.get("phone") || ""),
        email: String(fd.get("email") || ""),
        username: String(fd.get("username") || ""),
        password: String(fd.get("password") || ""),
        otp: String(fd.get("otp") || ""),
        city: String(fd.get("city") || ""),
        district: String(fd.get("district") || ""),
        sub_district: String(fd.get("sub_district") || ""),
        province: String(fd.get("province") || ""),
        store_photo_url: String(fd.get("store_photo_url") || ""),
      });

      setSuccess("Pendaftaran berhasil, mengalihkan ke halaman login toko...");

      // Redirect langsung ke root-login localhost setelah daftar
      window.location.href = "https://erp.infistream.id/root-login";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ fontFamily: 'Futura, "Trebuchet MS", Arial, sans-serif' }} className="w-full min-h-screen bg-slate-900">
      {/* 2 kolom imbang */}
      <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] min-h-screen">
        {/* LEFT PANEL: Daftarkan toko - bg #1A202C */}
        <div className="relative flex flex-col justify-center px-10 py-12 bg-[#66023c] text-slate-100">
          <div className="text-5xl mb-4">
            <div className="absolute top-6 left-6">
              <a href="https://erp.infistream.id/">
                <img src="/kalako_putih.png" alt="Kalako logo" className="h-17 w-auto" />
              </a>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-10 text-white">
            Daftarkan Toko Anda
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-6 max-w-md">
            Mulai mengelola bisnis retail Anda dengan sistem ERP KALAKO yang
            terintegrasi, dan mudah digunakan!
          </p>

          <ul className="space-y-3 text-sm md:text-base text-slate-200 mt-30">
            {/* <li className="flex items-center gap-2">
              <span className="text-xl">✅</span> Satu akun untuk banyak cabang
            </li>
            <li className="flex items-center gap-2">
              <span className="text-xl">⚙️</span> Atur user dan role karyawan sendiri
            </li> */}
            <li className="flex items-center gap-2">
              <span className="text-xl">📊</span> Dashboard realtime untuk pemilik
            </li>
            <li className="flex items-center gap-2">
              <span className="text-xl">💰</span> Kelola stok dan penjualan dengan mudah
            </li>
          </ul>
        </div>

        {/* RIGHT PANEL: Buat akun toko - FULL PANEL (bukan card) */}
        <div className="bg-white px-6 sm:px-12 lg:px-20 py-8 lg:py-10 lg:h-screen overflow-y-auto flex items-start justify-center">
          <div className="w-full max-w-xl lg:max-w-3xl">
            {/* Header sederhana, tanpa gradient biru */}
            <header className="mb-6 border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-semibold text-slate-900">
                Buat Akun Toko
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Lengkapi data di bawah untuk mulai menggunakan KALAKO.
              </p>
            </header>

            {/* Alert error / success */}
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium flex items-center gap-2">
                <span>❌</span>
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 font-medium flex items-center gap-2">
                <span>✅</span>
                {success}
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    👤 Nama Pemilik / PIC
                    <RequiredMark />
                  </label>
                  <input
                    name="owner_name"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                    placeholder="Nama lengkap"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    🏪 Nama Toko / Brand
                    <RequiredMark />
                  </label>
                  <input
                    name="store_name"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                    placeholder="Contoh: Toko Maju Sejahtera"
                    required
                  />
                </div>
              </div>

              {/* Email + OTP */}
              <div className="space-y-2">
                <label className="block text-sm text-black font-semibold text-slate-800 mb-1">
                  📧 Email
                  <RequiredMark />
                </label>
                <div className="flex gap-2">
                  <input
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                    placeholder="email@example.com"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={!email || sendingOtp || emailAvailable === false || checkingEmail}
                    className="px-4 py-2 text-xs sm:text-sm text-black font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all disabled:bg-slate-400 disabled:cursor-not-allowed"
                  >
                    {sendingOtp
                      ? "Mengirim..."
                      : otpSent
                        ? "Kirim Ulang"
                        : "Kirim OTP"}
                  </button>
                </div>
                {email && (checkingEmail || emailAvailable !== null) && (
                  <p className={`text-xs mt-1 ${emailAvailable ? 'text-green-600' : 'text-red-600'}`}>
                    {checkingEmail ? 'Memeriksa email…' : emailAvailable ? 'Email tersedia' : 'Email sudah dipakai'}
                  </p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-black font-semibold text-slate-800 mb-2">
                    🔐 Kode OTP
                    <RequiredMark />
                  </label>
                  <input
                    name="otp"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                    placeholder="6 digit dari email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-black font-semibold text-slate-800 mb-2">
                    🔑 Password
                    <RequiredMark />
                  </label>
                  <input
                    name="password"
                    type="password"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                    placeholder="Minimal 6 karakter"
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-black font-semibold text-slate-800 mb-2">
                    📱 Nomor Whatsapp
                    <RequiredMark />
                  </label>
                  <input
                    name="phone"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                    placeholder="62812xxxxxxxx"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-black font-semibold text-slate-800 mb-2">
                    🔐 Nama Pengguna Login
                    <RequiredMark />
                  </label>
                  <input
                    name="username"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                    placeholder="username (unik per toko)"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-black font-semibold text-slate-800 mb-2">
                  🪪 Nomor KTP (opsional)
                </label>
                <input
                  name="owner_id_number"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                  placeholder="NIK pemilik"
                />
              </div>

              {/* Alamat & lokasi */}
              <div>
                <label className="block text-sm text-black font-semibold text-slate-800 mb-2">
                  📍 Alamat Lengkap
                  <RequiredMark />
                </label>
                <textarea
                  name="address"
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-white resize-none"
                  placeholder="Jalan, RT/RW, No, dsb."
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-black font-semibold text-slate-800 mb-2">
                    🏙️ Kota / Kabupaten
                    <RequiredMark />
                  </label>
                  <input
                    name="city"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                    placeholder="Jakarta"
                  />
                </div>
                <div>
                  <label className="block text-sm text-black font-semibold text-slate-800 mb-2">
                    🗺️ Provinsi
                    <RequiredMark />
                  </label>
                  <input
                    name="province"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                    placeholder="DKI Jakarta"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-black font-semibold text-slate-800 mb-2">
                    📌 Kecamatan
                    <RequiredMark />
                  </label>
                  <input
                    name="district"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                    placeholder="Senayan"
                  />
                </div>
                <div>
                  <label className="block text-sm text-black font-semibold text-slate-800 mb-2">
                    📍 Kelurahan / Desa
                    <RequiredMark />
                  </label>
                  <input
                    name="sub_district"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                    placeholder="Gelora"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm text-black font-semibold text-slate-800 mb-3">
                  📸 Foto Toko (opsional)
                </label>
                <ImageUploader onUploaded={(url) => setStorePhotoUrl(url)} />
                <input type="hidden" name="store_photo_url" value={storePhotoUrl} />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || emailAvailable === false || checkingEmail}
                className="w-full h-11 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all disabled:bg-slate-400 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? "Mendaftar..." : "Daftar Sekarang"}
              </button>
            </form>

            {/* Footer teks di panel kanan */}
            <footer className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500 text-center">
              &copy; {new Date().getFullYear()} PT. Karya Mulya Korpora - KALAKO - Teman Pintar Usaha Kamu!
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
