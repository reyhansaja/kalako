import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { sendEmail } from '../utils/sendEmail.js';

const router = express.Router();

// Step 1: Request reset - send OTP to email
router.post('/request-reset', async (req, res) => {
	const { email } = req.body;

	if (!email) return res.status(400).json({ message: 'Email wajib diisi' });

	const normalizedEmail = String(email).trim().toLowerCase();

	try {
		const clientRes = await query('SELECT id FROM clients WHERE LOWER(email) = $1', [normalizedEmail]);
		if (clientRes.rowCount === 0) {
			return res.status(404).json({ message: 'Email tidak ditemukan' });
		}

		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 menit

		// hapus otp lama lalu simpan yang baru
		await query('DELETE FROM email_otp_codes WHERE email = $1', [normalizedEmail]);
		await query(
			'INSERT INTO email_otp_codes (email, otp, expires_at) VALUES ($1,$2,$3)',
			[normalizedEmail, otp, expiresAt]
		);

		await sendEmail(
			normalizedEmail,
			'Kode OTP Reset Password Kalako',
			`Kode OTP Anda: ${otp}\n\nKode ini berlaku selama 5 menit.`
		);

		res.json({ message: 'OTP telah dikirim ke email Anda' });
	} catch (err) {
		console.error('[Request Reset Error]:', err);
		res.status(500).json({ message: 'Terjadi kesalahan server' });
	}
});

// Step 2: Reset password dengan email + OTP
router.post('/reset-password', async (req, res) => {
	const { email, otp, newPassword } = req.body;

	if (!email || !otp || !newPassword) {
		return res.status(400).json({ message: 'Email, OTP, dan password baru wajib diisi' });
	}

	if (newPassword.length < 6) {
		return res.status(400).json({ message: 'Password minimal 6 karakter' });
	}

	const normalizedEmail = String(email).trim().toLowerCase();

	try {
		const otpRes = await query(
			`SELECT * FROM email_otp_codes
			 WHERE email = $1 AND otp = $2 AND expires_at > NOW()
			 ORDER BY id DESC LIMIT 1`,
			[normalizedEmail, otp]
		);

		if (otpRes.rowCount === 0) {
			return res.status(400).json({ message: 'OTP salah atau kadaluarsa' });
		}

		const clientRes = await query('SELECT id FROM clients WHERE LOWER(email) = $1', [normalizedEmail]);
		if (clientRes.rowCount === 0) {
			return res.status(404).json({ message: 'Email tidak ditemukan' });
		}

		const clientId = clientRes.rows[0].id;
		const passwordHash = await bcrypt.hash(newPassword, 10);

		const userRes = await query(
			`UPDATE users
             SET password_hash = $1
             WHERE client_id = $2 AND role = $3`,
            [passwordHash, clientId, 'client_admin']
        );

        if (userRes.rowCount === 0) {

		await query('DELETE FROM email_otp_codes WHERE email = $1', [normalizedEmail]);

		res.json({ message: 'Password berhasil direset' });
	} catch (err) {
		console.error('[Reset Password Error]:', err);
		res.status(500).json({ message: 'Terjadi kesalahan server' });
	}
});

export default router;
