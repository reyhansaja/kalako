import { query } from "../db.js";

export async function getClientInfo(req, res) {
  const clientId = req.client.id;
  try {
    const clientRes = await query(
      `SELECT id, name, address, city, district, sub_district, province, phone, email, store_photo_url
       FROM clients WHERE id = $1`,
      [clientId]
    );

    if (clientRes.rowCount === 0) return res.status(404).json({ message: "Client not found" });
    return res.json(clientRes.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching client info" });
  }
}

export async function getDashboardSummary(req, res) {
  const clientId = req.client.id;
  const range = req.query.range || "daily";

  let dateFilter = "DATE(t.created_at) = CURDATE()";
  if (range === "monthly") dateFilter = "DATE_FORMAT(t.created_at, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')";
  if (range === "yearly") dateFilter = "YEAR(t.created_at) = YEAR(CURDATE())";

  try {
    const totalStockRes = await query("SELECT COALESCE(SUM(stock),0) AS total FROM products WHERE client_id=$1", [clientId]);
    const totalSoldRes = await query(
      `SELECT COALESCE(SUM(quantity),0) AS total
       FROM sales_transaction_items i
       JOIN sales_transactions t ON t.id = i.transaction_id
       WHERE t.client_id=$1 AND ${dateFilter}`,
      [clientId]
    );
    const totalCustomersRes = await query("SELECT COUNT(*) AS total FROM customers WHERE client_id=$1", [clientId]).catch(() => ({ rows: [{ total: 0 }] }));

    const incomeRes = await query(
      `SELECT COALESCE(SUM(total_amount),0) AS total, COUNT(*) AS orders
       FROM sales_transactions t
       WHERE t.client_id=$1 AND ${dateFilter}`,
      [clientId]
    );

    const chartRes = await query(
      `SELECT DATE_FORMAT(t.created_at, '%d %b') AS label, SUM(total_amount) AS value
       FROM sales_transactions t
       WHERE t.client_id=$1 AND ${dateFilter}
       GROUP BY label
       ORDER BY MIN(t.created_at)`,
      [clientId]
    );

    return res.json({
      totalStock: Number(totalStockRes.rows[0].total || 0),
      totalSold: Number(totalSoldRes.rows[0].total || 0),
      totalCustomers: Number(totalCustomersRes.rows[0].total || 0),
      incomeTotal: Number(incomeRes.rows[0].total || 0),
      incomeOrders: Number(incomeRes.rows[0].orders || 0),
      incomeChart: chartRes.rows.map((r) => ({ label: r.label, value: Number(r.value) })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error dashboard" });
  }
}
