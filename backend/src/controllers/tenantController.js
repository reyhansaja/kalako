export function getTenantStatus(req, res) {
  try {
    const client = req.client || null;
    if (!client) return res.status(404).json({ message: "Tenant not found" });

    return res.json({
      id: client.id,
      subdomain: client.subdomain,
      status: client.status,
      trial_ends_at: client.trial_ends_at,
      suspended_at: client.suspended_at,
      suspension_reason: client.suspension_reason,
    });
  } catch (err) {
    console.error("tenant status error:", err);
    return res.status(500).json({ message: "Error fetching tenant status" });
  }
}
