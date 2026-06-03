import nodemailer from 'nodemailer';
import { EMAIL_USER, EMAIL_PASS } from '../config.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',             // atau SMTP lain
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

export async function sendEmail(to, subject, text) {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn('EMAIL_USER / EMAIL_PASS belum diset, email tidak dikirim.');
    console.log({ to, subject, text });
    return;
  }

  await transporter.sendMail({
    from: `"Kalako ERP" <${EMAIL_USER}>`,
    to,
    subject,
    text
  });
}
