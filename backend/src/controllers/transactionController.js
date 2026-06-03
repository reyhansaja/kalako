import { pool } from "../db.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

let hasInvoiceCodeColumnCache = null;

async function hasInvoiceCodeColumn(dbClient) {
  if (hasInvoiceCodeColumnCache !== null) {
    return hasInvoiceCodeColumnCache;
  }

  const check = await dbClient.query(
    "SHOW COLUMNS FROM sales_transactions LIKE 'invoice_code'"
  );

  hasInvoiceCodeColumnCache = (check.rowCount || 0) > 0;
  return hasInvoiceCodeColumnCache;
}

export async function createTransaction(req, res) {
  const clientId = req.client.id;
  const cashierId = req.user.id;
  const { items, paid_amount } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Item transaksi kosong" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let total = 0;
    const detailRows = [];

    for (const it of items) {
      const { product_id, quantity } = it;
      const qty = Number(quantity);
      if (!product_id || !qty || qty <= 0) throw new Error("Item tidak valid");

      const prodRes = await client.query(
        `SELECT id, name, selling_price, stock, unit FROM products
         WHERE id=$1 AND client_id=$2 FOR UPDATE`,
        [product_id, clientId]
      );

      if (prodRes.rowCount === 0) throw new Error("Produk tidak ditemukan");

      const prod = prodRes.rows[0];
      const newStock = Number(prod.stock) - qty;
      if (newStock < 0) throw new Error(`Stok ${prod.name} tidak mencukupi`);

      const unitPrice = Number(prod.selling_price);
      const subtotal = unitPrice * qty;
      total += subtotal;

      await client.query("UPDATE products SET stock=$1, last_out_at=NOW() WHERE id=$2", [newStock, product_id]);

      detailRows.push({
        product_id,
        quantity: qty,
        unit_price: unitPrice,
        subtotal,
        name: prod.name,
        unit: prod.unit,
      });
    }

    const paid = Number(paid_amount);
    if (Number.isNaN(paid) || paid < total) throw new Error("Uang bayar kurang dari total");
    const change = paid - total;

    // Generate invoice code: INV-TOKONAMA-YYYYMMDD-NOMORURUT
    const clientRes = await client.query("SELECT name FROM clients WHERE id = $1", [clientId]);
    const clientName = (clientRes.rows[0]?.name || "TOKO").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const countRes = await client.query(
      "SELECT COUNT(*) as cnt FROM sales_transactions WHERE DATE(created_at) = CURDATE()"
    );
    const dailyCount = String((countRes.rows[0]?.cnt || 0) + 1).padStart(2, "0");
    const invoiceCode = `INV-${clientName}-${dateStr}-${dailyCount}`;

    const useInvoiceCode = await hasInvoiceCodeColumn(client);

    const trxRes = useInvoiceCode
      ? await client.query(
          `INSERT INTO sales_transactions (invoice_code, client_id, cashier_id, total_amount, paid_amount, change_amount)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [invoiceCode, clientId, cashierId, total, paid, change]
        )
      : await client.query(
          `INSERT INTO sales_transactions (client_id, cashier_id, total_amount, paid_amount, change_amount)
           VALUES ($1,$2,$3,$4,$5)`,
          [clientId, cashierId, total, paid, change]
        );

    const trxId = Number(trxRes.insertId);
    if (!trxId) {
      throw new Error("Gagal membuat transaksi: id transaksi tidak ditemukan");
    }

    // Read using the same connection so the inserted row is visible before COMMIT.
    const trxLookup = await client.query("SELECT * FROM sales_transactions WHERE id = $1", [trxId]);
    const trx = trxLookup.rows[0] || {
      id: trxId,
      invoice_code: useInvoiceCode ? invoiceCode : null,
      client_id: clientId,
      cashier_id: cashierId,
      total_amount: total,
      paid_amount: paid,
      change_amount: change,
    };

    for (const d of detailRows) {
      await client.query(
        `INSERT INTO sales_transaction_items (transaction_id, product_id, quantity, unit_price, subtotal)
         VALUES ($1,$2,$3,$4,$5)`,
        [trxId, d.product_id, d.quantity, d.unit_price, d.subtotal]
      );
    }

    await client.query("COMMIT");
    return res.status(201).json({ transaction: trx, items: detailRows });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(400).json({ message: err.message || "Gagal simpan transaksi" });
  } finally {
    client.release();
  }
}

export async function listTransactions(req, res) {
  const clientId = req.client.id;
  const { startDate = "", endDate = "" } = req.query;

  // MySQL LIMIT/OFFSET must be numeric values, not quoted strings.
  const parsedLimit = Number.parseInt(String(req.query.limit ?? "50"), 10);
  const parsedOffset = Number.parseInt(String(req.query.offset ?? "0"), 10);
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 200) : 50;
  const offset = Number.isFinite(parsedOffset) ? Math.max(parsedOffset, 0) : 0;

  try {
    let sql = `
      SELECT st.id, st.total_amount, st.paid_amount, st.change_amount, st.created_at,
             u.username as cashier_name, COUNT(sti.id) as item_count
      FROM sales_transactions st
      LEFT JOIN users u ON st.cashier_id = u.id
      LEFT JOIN sales_transaction_items sti ON st.id = sti.transaction_id
      WHERE st.client_id = $1`;
    const params = [clientId];

    if (startDate) {
      sql += ` AND DATE(st.created_at) >= $${params.length + 1}`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND DATE(st.created_at) <= $${params.length + 1}`;
      params.push(endDate);
    }

    sql += " GROUP BY st.id, st.total_amount, st.paid_amount, st.change_amount, st.created_at, u.username";
    sql += " ORDER BY st.created_at DESC";
    sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(sql, params);

    let countSql = "SELECT COUNT(*) as total FROM sales_transactions st WHERE st.client_id = $1";
    const countParams = [clientId];

    if (startDate) {
      countSql += ` AND DATE(st.created_at) >= $${countParams.length + 1}`;
      countParams.push(startDate);
    }
    if (endDate) {
      countSql += ` AND DATE(st.created_at) <= $${countParams.length + 1}`;
      countParams.push(endDate);
    }

    const countResult = await pool.query(countSql, countParams);

    return res.json({
      transactions: result.rows,
      total: parseInt(countResult.rows[0].total, 10),
      limit,
      offset,
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: err.message || "Gagal fetch transaksi" });
  }
}

export async function getTransactionItems(req, res) {
  const clientId = req.client.id;
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT sti.id, sti.quantity, sti.unit_price, sti.subtotal, p.name as product_name, p.unit
       FROM sales_transaction_items sti
       LEFT JOIN products p ON sti.product_id = p.id
       WHERE sti.transaction_id = $1
       AND EXISTS (SELECT 1 FROM sales_transactions WHERE id = $2 AND client_id = $3)`,
      [id, id, clientId]
    );

    return res.json({ items: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: err.message || "Gagal fetch detail transaksi" });
  }
}

export async function exportTransactions(req, res) {
  const clientId = req.client.id;
  const { startDate, endDate, format = "excel" } = req.query;

  try {
    const clientRes = await pool.query("SELECT name FROM clients WHERE id = $1", [clientId]);
    const clientName = clientRes.rows[0]?.name || "Toko";

    let sql = `
      SELECT p.name as product_name, p.unit,
             SUM(sti.quantity) as total_quantity,
             AVG(sti.unit_price) as avg_price,
             SUM(sti.subtotal) as total_revenue
      FROM sales_transaction_items sti
      LEFT JOIN products p ON sti.product_id = p.id
      LEFT JOIN sales_transactions st ON sti.transaction_id = st.id
      WHERE st.client_id = $1`;
    const params = [clientId];

    if (startDate) {
      sql += ` AND DATE(st.created_at) >= $${params.length + 1}`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND DATE(st.created_at) <= $${params.length + 1}`;
      params.push(endDate);
    }

    sql += " GROUP BY p.name, p.unit ORDER BY total_revenue DESC";

    const result = await pool.query(sql, params);
    const items = result.rows;
    const totalRevenue = items.reduce((sum, item) => sum + Number(item.total_revenue || 0), 0);

    const formatDate = (dateStr) => {
      if (!dateStr) return "-";
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
    };

    const periodText = `${formatDate(startDate)} - ${formatDate(endDate)}`;

    if (String(format).toLowerCase() === "pdf") {
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=laporan-transaksi-${startDate}-${endDate}.pdf`);
      doc.pipe(res);

      doc.fontSize(20).text(clientName, { align: "center" });
      doc.fontSize(14).text("Laporan Transaksi", { align: "center" });
      doc.fontSize(10).text(periodText, { align: "center" });
      doc.moveDown(2);

      const tableTop = doc.y;
      const colWidths = [30, 180, 80, 100, 100];
      const cols = ["No", "Nama Produk", "Qty", "Harga Rata-rata", "Total"];

      doc.fontSize(9).font("Helvetica-Bold");
      let x = 50;
      cols.forEach((col, i) => {
        doc.text(col, x, tableTop, { width: colWidths[i], align: i === 0 ? "center" : "left" });
        x += colWidths[i];
      });

      doc.moveTo(50, tableTop + 15).lineTo(540, tableTop + 15).stroke();
      doc.font("Helvetica");

      let y = tableTop + 20;
      items.forEach((item, index) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        const formatRupiah = (val) => `Rp ${Number(val || 0).toLocaleString("id-ID")}`;
        const formatQty = (qty, unit) => {
          const n = Number(qty || 0);
          const u = (unit || "").toLowerCase().trim();
          if (u === "pcs" || u === "pc") {
            const displayed = n >= 1000 ? n / 1000 : n;
            return Number.isInteger(displayed) ? `${displayed} ${unit}` : `${displayed.toFixed(2)} ${unit}`;
          }
          return `${n.toFixed(2)} ${unit}`;
        };

        x = 50;
        doc.text(String(index + 1), x, y, { width: colWidths[0], align: "center" });
        x += colWidths[0];
        doc.text(item.product_name || "-", x, y, { width: colWidths[1] });
        x += colWidths[1];
        doc.text(formatQty(item.total_quantity, item.unit), x, y, { width: colWidths[2] });
        x += colWidths[2];
        doc.text(formatRupiah(item.avg_price), x, y, { width: colWidths[3] });
        x += colWidths[3];
        doc.text(formatRupiah(item.total_revenue), x, y, { width: colWidths[4] });
        y += 20;
      });

      doc.moveTo(50, y).lineTo(540, y).stroke();
      y += 10;
      doc.fontSize(11).font("Helvetica-Bold");
      doc.text(`Total Penghasilan: Rp ${totalRevenue.toLocaleString("id-ID")}`, 50, y, { align: "right" });
      doc.end();
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Laporan Transaksi");

    worksheet.mergeCells("A1:E1");
    worksheet.getCell("A1").value = clientName;
    worksheet.getCell("A1").font = { size: 16, bold: true };
    worksheet.getCell("A1").alignment = { horizontal: "center" };

    worksheet.mergeCells("A2:E2");
    worksheet.getCell("A2").value = "Laporan Transaksi";
    worksheet.getCell("A2").font = { size: 12, bold: true };
    worksheet.getCell("A2").alignment = { horizontal: "center" };

    worksheet.mergeCells("A3:E3");
    worksheet.getCell("A3").value = periodText;
    worksheet.getCell("A3").font = { size: 10 };
    worksheet.getCell("A3").alignment = { horizontal: "center" };

    worksheet.addRow([]);
    const headerRow = worksheet.addRow(["No", "Nama Produk", "Qty", "Harga Rata-rata", "Total"]);
    headerRow.font = { bold: true };

    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD3D3D3" } };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    items.forEach((item, index) => {
      const formatQty = (qty, unit) => {
        const n = Number(qty || 0);
        const u = (unit || "").toLowerCase().trim();
        if (u === "pcs" || u === "pc") {
          const displayed = n >= 1000 ? n / 1000 : n;
          return Number.isInteger(displayed) ? `${displayed} ${unit}` : `${displayed.toFixed(2)} ${unit}`;
        }
        return `${n.toFixed(2)} ${unit}`;
      };

      const row = worksheet.addRow([
        index + 1,
        item.product_name || "-",
        formatQty(item.total_quantity, item.unit),
        Number(item.avg_price || 0),
        Number(item.total_revenue || 0),
      ]);

      row.getCell(4).numFmt = "Rp #,##0";
      row.getCell(5).numFmt = "Rp #,##0";
    });

    worksheet.addRow([]);
    const totalRow = worksheet.addRow(["", "", "", "Total Penghasilan:", totalRevenue]);
    totalRow.font = { bold: true };
    totalRow.getCell(5).numFmt = "Rp #,##0";

    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 15;
    worksheet.getColumn(4).width = 20;
    worksheet.getColumn(5).width = 20;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=laporan-transaksi-${startDate}-${endDate}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Gagal export laporan" });
  }
}
