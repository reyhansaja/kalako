import nodemailer from 'nodemailer';
import { EMAIL_USER, EMAIL_PASS } from '../config.js';
import { createClient } from '@supabase/supabase-js';

// Inisialisasi koneksi ke Supabase (menggunakan URL & Key yang sudah diset di ENV Anda)
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_KEY || '');

/**
 * Fungsi kirim email dinamis berdasarkan clientId
 * @param {string} to - Email tujuan (user/pelanggan)
 * @param {string} subject - Subjek email
 * @param {string} text - Isi teks/pesan OTP
 * @param {number|string} clientId - ID klien/toko yang sedang melakukan request (Opsional)
 */
export async function sendEmail(to, subject, text, clientId = null) {
  let configUser = EMAIL_USER;
  let configPass = EMAIL_PASS;
  let configHost = 'smtp.gmail.com';
  let configPort = 587;
  let useService = 'gmail';

  // 1. Jika ada clientId, cari data SMTP kustom milik toko tersebut di Supabase
  if (clientId) {
    try {
      const { data: client, error } = await supabase
        .from('clients')
        .select('smtp_host, smtp_port, smtp_user, smtp_pass')
        .eq('id', clientId)
        .single();

      // Jika data kustom klien ditemukan dan kolom USER & PASS di database tidak kosong
      if (client && client.smtp_user && client.smtp_pass) {
        configUser = client.smtp_user;
        configPass = client.smtp_pass;
        configHost = client.smtp_host || 'smtp.gmail.com';
        configPort = client.smtp_port || 587;
        useService = ''; // Matikan preset default gmail jika memakai host kustom
        console.log(`[SMTP] Menggunakan email kustom klien ID ${clientId}: ${configUser}`);
      }
    } catch (err) {
      console.error('[SMTP Error] Gagal mengambil data klien dari Supabase, beralih ke email sistem:', err);
    }
  }

  // 2. Proteksi jika email sistem utama abang juga belum diisi
  if (!configUser || !configPass) {
    console.warn('[SMTP Warning] Konfigurasi email kosong, surat dibatalkan.');
    console.log({ to, subject, text });
    return;
  }

  // 3. Buat transporter secara dinamis setiap kali fungsi ini dipanggil
  const transportOptions = useService 
    ? { service: useService, auth: { user: configUser, pass: configPass } }
    : { host: configHost, port: Number(configPort), auth: { user: configUser, pass: configPass }, secure: Number(configPort) === 465 };

  const dynamicTransporter = nodemailer.createTransport(transportOptions);

  // 4. Eksekusi pengiriman email
  await dynamicTransporter.sendMail({
    from: `"Kalako ERP" <${configUser}>`,
    to,
    subject,
    text
  });
}