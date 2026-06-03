import { query } from "../db.js";

export function findClientByEmail(email) {
  return query("SELECT id FROM clients WHERE LOWER(email) = $1", [email]);
}

export function deleteOtpsByEmail(email) {
  return query("DELETE FROM email_otp_codes WHERE email = $1", [email]);
}

export function createOtp(email, otp, expiresAt) {
  return query(
    "INSERT INTO email_otp_codes (email, otp, expires_at) VALUES ($1,$2,$3)",
    [email, otp, expiresAt]
  );
}

export function findValidOtp(email, otp) {
  return query(
    `SELECT * FROM email_otp_codes
     WHERE email = $1 AND otp = $2 AND expires_at > NOW()
     ORDER BY id DESC LIMIT 1`,
    [email, otp]
  );
}

export function updateClientAdminPassword(passwordHash, clientId) {
  return query(
    `UPDATE users
     SET password_hash = $1
     WHERE client_id = $2 AND role = $3`,
    [passwordHash, clientId, "client_admin"]
  );
}
