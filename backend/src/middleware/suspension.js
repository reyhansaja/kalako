// Middleware to block tenant APIs/pages when tenant is suspended.
export function suspensionMiddleware(req, res, next) {
  try {
    const client = req.client || null;
    if (!client) return next(); // not a tenant

    const status = (client.status || '').toLowerCase();
    if (status !== 'suspended') return next();

    // Allowlist for suspended tenants: they may submit payments and upload proofs and check status
    const allowPaths = [
      '/api/payments',
      '/api/upload',
      '/api/tenant/status'
    ];

    const reqPath = req.path || req.url || '';
    for (const p of allowPaths) {
      if (reqPath.startsWith(p)) return next();
    }

    // For other API requests, return 403 with a clear code
    return res.status(403).json({ message: 'Tenant suspended', code: 'SUSPENDED' });
  } catch (err) {
    console.error('suspensionMiddleware error:', err);
    return res.status(500).json({ message: 'Middleware error' });
  }
}
