import bcrypt from "bcrypt";
import { sendEmail } from "../utils/sendEmail.js";
import {
  createOtp,
  deleteOtpsByEmail,
  findClientByEmail,
  findValidOtp,
  updateClientAdminPassword,
} from "../models/passwordResetModel.js";

export async function requestReset(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email wajib diisi" });

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const clientRes = await findClientByEmail(normalizedEmail);
    if (clientRes.rowCount === 0) {
      return res.status(404).json({ message: "Email tidak ditemukan" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await deleteOtpsByEmail(normalizedEmail);
    await createOtp(normalizedEmail, otp, expiresAt);

    await sendEmail(
      normalizedEmail,
      "Kode OTP Reset Password Kalako",
      `Kode OTP Anda: ${otp}\n\nKode ini berlaku selama 5 menit.`
    );

    return res.json({ message: "OTP telah dikirim ke email Anda" });
  } catch (err) {
    console.error("[Request Reset Error]:", err);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
}

export async function resetPassword(req, res) {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: "Email, OTP, dan password baru wajib diisi" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password minimal 6 karakter" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const otpRes = await findValidOtp(normalizedEmail, otp);
    if (otpRes.rowCount === 0) {
      return res.status(400).json({ message: "OTP salah atau kadaluarsa" });
    }

    const clientRes = await findClientByEmail(normalizedEmail);
    if (clientRes.rowCount === 0) {
      return res.status(404).json({ message: "Email tidak ditemukan" });
    }

    const clientId = clientRes.rows[0].id;
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const userRes = await updateClientAdminPassword(passwordHash, clientId);
    if (userRes.rowCount === 0) {
      return res.status(500).json({ message: "Gagal mengubah password" });
    }

    await deleteOtpsByEmail(normalizedEmail);
    return res.json({ message: "Password berhasil direset" });
  } catch (err) {
    console.error("[Reset Password Error]:", err);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
}
