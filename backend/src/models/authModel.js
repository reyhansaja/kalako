import { query, withTransaction } from "../db.js";

function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function isEmailUsed(email) {
  const res = await query("SELECT 1 FROM clients WHERE LOWER(email) = $1", [email]);
  return res.rowCount > 0;
}

export async function insertOtpCode(email, otp, expiresAt) {
  return query(
    "INSERT INTO email_otp_codes (email, otp, expires_at) VALUES ($1,$2,$3)",
    [email, otp, expiresAt]
  );
}

export async function syncOtpSequence() {
  return null;
}

export async function getValidOtp(email, otp) {
  return query(
    `SELECT * FROM email_otp_codes
     WHERE email = $1 AND otp = $2 AND expires_at > NOW()
     ORDER BY id DESC LIMIT 1`,
    [email, otp]
  );
}

export async function deleteOtpsByEmail(email) {
  return query("DELETE FROM email_otp_codes WHERE email = $1", [email]);
}

export async function generateUniqueSubdomain(baseName) {
  let slug = slugify(baseName);
  if (!slug) slug = "client";

  let candidate = slug;
  let counter = 1;

  while (true) {
    const res = await query("SELECT 1 FROM clients WHERE subdomain = $1", [candidate]);
    if (res.rowCount === 0) return candidate;
    counter += 1;
    candidate = `${slug}-${counter}`;
  }
}

export async function createClientWithAdminUser(payload) {
  return withTransaction(async (db) => {
    const clientRes = await db.query(
      `INSERT INTO clients
      (name, owner_name, owner_id_number, address, phone, email, subdomain, status, trial_ends_at,
      city, district, sub_district, province, store_photo_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8, DATE_ADD(NOW(), INTERVAL 30 DAY),
      $9,$10,$11,$12,$13)
      `,
      [
        payload.store_name,
        payload.owner_name,
        payload.owner_id_number || null,
        payload.address,
        payload.phone,
        payload.email,
        payload.subdomain,
        "trial",
        payload.city,
        payload.district,
        payload.sub_district,
        payload.province,
        payload.store_photo_url || null,
      ]
    );

    const clientLookup = await query("SELECT * FROM clients WHERE id = ?", [clientRes.insertId]);
    const client = clientLookup.rows[0];

    const userRes = await db.query(
      `INSERT INTO users (client_id, name, username, password_hash, role)
       VALUES ($1,$2,$3,$4,$5)`,
      [client.id, payload.owner_name, payload.username, payload.passwordHash, "client_admin"]
    );

    return { client, userId: userRes.insertId, clientId: client.id };
  });
}

export async function findUserForTenantLogin(username, clientId) {
  return query("SELECT * FROM users WHERE username = $1 AND client_id = $2", [username, clientId]);
}

export async function findSuperAdminByUsername(username) {
  return query("SELECT * FROM users WHERE username = $1 AND role = 'super_admin'", [username]);
}
