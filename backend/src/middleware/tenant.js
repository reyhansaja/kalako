import { BASE_DOMAIN } from '../config.js';
import { query } from '../db.js';

export async function tenantMiddleware(req, res, next) {
  const host = req.headers.host;
  if (!host) return res.status(400).json({ message: 'Host header missing' });

  const withoutPort = host.split(':')[0];        // e.g. api.kalako.local or tokomaju.kalako.local
  const parts = withoutPort.split('.');

  let subdomain = null;
  
  // 1. Never treat the API host itself as a tenant.
  // For production this is api-erp.infistream.id, for local it can be localhost.
  const normalizedBaseDomain = String(BASE_DOMAIN || '').toLowerCase();
  if (withoutPort !== normalizedBaseDomain) {
    // Keep backward compatibility for tenant subdomain hosts only when they are really distinct
    if (withoutPort.endsWith(`.${normalizedBaseDomain}`) && parts.length > 2) {
      const prefix = parts[0];
      if (prefix && prefix !== 'api') {
        subdomain = prefix;
      }
    }
  }

  // 2. If no subdomain from hostname, try X-Tenant header (for path-based frontend routes)
  if (!subdomain && req.headers['x-tenant']) {
    subdomain = req.headers['x-tenant'].toLowerCase().trim();
  }

  req.subdomain = subdomain;

  if (!subdomain) {
    // No subdomain identified; domain utama / admin
    return next();
  }

  try {
    const result = await query('SELECT * FROM clients WHERE subdomain = $1', [subdomain]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Client not found for this subdomain' });
    }
    req.client = result.rows[0];
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error resolving tenant' });
  }
}
