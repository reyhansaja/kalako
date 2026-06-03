import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { pool } from "../db.js";

function getDateFilter(range) {
  if (range === "monthly") return "DATE_FORMAT(t.created_at, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')";
  if (range === "weekly") return "YEARWEEK(t.created_at, 1) = YEARWEEK(CURDATE(), 1)";
  if (range === "yearly") return "YEAR(t.created_at) = YEAR(CURDATE())";
  return "DATE(t.created_at) = CURDATE()";
}

export async function getProductReport(req, res) {
  const clientId = req.client.id;
  const range = req.query.range || "daily";
  const limit = parseInt(req.query.limit, 10) || 25;
  const offset = parseInt(req.query.offset, 10) || 0;
  const dateFilter = getDateFilter(range);

  try {
    const dataRes = await pool.query(
      `SELECT p.id, p.name, COALESCE(SUM(i.quantity),0) AS jumlah, COALESCE(SUM(i.subtotal),0) AS total_pendapatan
       FROM sales_transaction_items i
       JOIN sales_transactions t ON t.id = i.transaction_id
       JOIN products p ON p.id = i.product_id
      WHERE t.client_id = $1 AND ${dateFilter}
       GROUP BY p.id, p.name
       ORDER BY SUM(i.subtotal) DESC
       LIMIT $2 OFFSET $3`,
      [clientId, limit, offset]
    );

    const countRes = await pool.query(
      `SELECT COUNT(*) AS total FROM (
         SELECT p.id FROM sales_transaction_items i
         JOIN sales_transactions t ON t.id = i.transaction_id
         JOIN products p ON p.id = i.product_id
         WHERE t.client_id = $1 AND ${dateFilter}
         GROUP BY p.id
       ) s`,
      [clientId]
    );

    return res.json({
      rows: dataRes.rows.map((r) => ({
        id: r.id,
        name: r.name,
        jumlah: Number(r.jumlah),
        total_pendapatan: Number(r.total_pendapatan),
      })),
      total: Number(countRes.rows[0].total || 0),
      limit,
      offset,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching product report" });
  }
}

export async function exportProductReport(req, res) {
  const clientId = req.client.id;
  const range = req.query.range || "daily";
  const format = String(req.query.format || "pdf").toLowerCase();
  const dateFilter = getDateFilter(range);

  try {
    const clientRes = await pool.query("SELECT name FROM clients WHERE id = $1", [clientId]);
    const clientName = clientRes.rows[0]?.name || "Toko";

    const dataRes = await pool.query(
      `SELECT p.id, p.name, p.unit,
              COALESCE(SUM(i.quantity),0) AS jumlah,
              COALESCE(AVG(i.unit_price),0) AS avg_price,
              COALESCE(SUM(i.subtotal),0) AS total_pendapatan
       FROM sales_transaction_items i
       JOIN sales_transactions t ON t.id = i.transaction_id
       JOIN products p ON p.id = i.product_id
      WHERE t.client_id = $1 AND ${dateFilter}
       GROUP BY p.id, p.name, p.unit
       ORDER BY SUM(i.subtotal) DESC`,
      [clientId]
    );

    const rows = dataRes.rows.map((r, idx) => ({
      no: idx + 1,
      name: r.name,
      unit: r.unit || "pcs",
      jumlah: Number(r.jumlah),
      avg_price: Number(r.avg_price),
      total_pendapatan: Number(r.total_pendapatan),
    }));

    const totalRevenue = rows.reduce((s, r) => s + (r.total_pendapatan || 0), 0);

    const rangeLabel = {
      daily: "Hari Ini",
      weekly: "Minggu Ini",
      monthly: "Bulan Ini",
      yearly: "Tahun Ini",
    };
    const periodText = rangeLabel[range] || range;

    if (format === "excel") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Laporan Penjualan");

      sheet.mergeCells("A1:F1");
      sheet.getCell("A1").value = clientName;
      sheet.getCell("A1").font = { size: 16, bold: true };
      sheet.getCell("A1").alignment = { horizontal: "center" };

      sheet.mergeCells("A2:F2");
      sheet.getCell("A2").value = "Laporan Penjualan Produk";
      sheet.getCell("A2").font = { size: 12, bold: true };
      sheet.getCell("A2").alignment = { horizontal: "center" };

      sheet.mergeCells("A3:F3");
      sheet.getCell("A3").value = `Periode: ${periodText}`;
      sheet.getCell("A3").font = { size: 10 };
      sheet.getCell("A3").alignment = { horizontal: "center" };

      sheet.addRow([]);
      const headerRow = sheet.addRow(["No", "Nama Produk", "Qty", "Satuan", "Harga Rata-rata", "Total Pendapatan"]);
      headerRow.font = { bold: true };
      headerRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD3D3D3" } };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });

      rows.forEach((r) => {
        const qty = (q, u) => {
          const n = Number(q || 0);
          const unit = (u || "").toLowerCase().trim();
          if (unit === "pcs" || unit === "pc") {
            const displayed = n >= 1000 ? n / 1000 : n;
            return Number.isInteger(displayed) ? displayed : displayed.toFixed(2);
          }
          return n.toFixed(2);
        };

        const row = sheet.addRow([r.no, r.name, qty(r.jumlah, r.unit), r.unit, r.avg_price, r.total_pendapatan]);
        row.getCell(5).numFmt = "Rp #,##0";
        row.getCell(6).numFmt = "Rp #,##0";
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      sheet.addRow([]);
      const totalRow = sheet.addRow(["", "", "", "", "Total Pendapatan:", totalRevenue]);
      totalRow.font = { bold: true, size: 11 };
      totalRow.getCell(6).numFmt = "Rp #,##0";

      sheet.getColumn(1).width = 6;
      sheet.getColumn(2).width = 35;
      sheet.getColumn(3).width = 12;
      sheet.getColumn(4).width = 10;
      sheet.getColumn(5).width = 18;
      sheet.getColumn(6).width = 20;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=laporan_penjualan_${range}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
      return;
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=laporan_penjualan_${range}.pdf`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).text(clientName, { align: "center" });
    doc.fontSize(14).text("Laporan Penjualan Produk", { align: "center" });
    doc.fontSize(10).text(`Periode: ${periodText}`, { align: "center" });
    doc.moveDown(2);

    const tableTop = doc.y;
    const colWidths = [30, 200, 60, 60, 90, 100];
    const cols = ["No", "Nama Produk", "Qty", "Satuan", "Harga Rata-rata", "Total"];

    doc.fontSize(9).font("Helvetica-Bold");
    let x = 50;
    cols.forEach((col, i) => {
      doc.text(col, x, tableTop, { width: colWidths[i], align: i === 0 ? "center" : "left" });
      x += colWidths[i];
    });

    doc.moveTo(50, tableTop + 15).lineTo(540, tableTop + 15).stroke();
    doc.font("Helvetica");

    let y = tableTop + 20;
    rows.forEach((item) => {
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
          return Number.isInteger(displayed) ? displayed : displayed.toFixed(2);
        }
        return n.toFixed(2);
      };

      x = 50;
      doc.text(String(item.no), x, y, { width: colWidths[0], align: "center" });
      x += colWidths[0];
      doc.text(item.name || "-", x, y, { width: colWidths[1] });
      x += colWidths[1];
      doc.text(formatQty(item.jumlah, item.unit), x, y, { width: colWidths[2] });
      x += colWidths[2];
      doc.text(item.unit || "pcs", x, y, { width: colWidths[3] });
      x += colWidths[3];
      doc.text(formatRupiah(item.avg_price), x, y, { width: colWidths[4] });
      x += colWidths[4];
      doc.text(formatRupiah(item.total_pendapatan), x, y, { width: colWidths[5] });
      y += 20;
    });

    doc.moveTo(50, y).lineTo(540, y).stroke();
    y += 10;
    doc.fontSize(11).font("Helvetica-Bold");
    doc.text(`Total Pendapatan: Rp ${totalRevenue.toLocaleString("id-ID")}`, 50, y, { align: "right" });

    doc.end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error export report" });
  }
}

export async function getMonthlySales(req, res) {
  const clientId = req.client.id;
  try {
    const dataRes = await pool.query(
      `SELECT m.bulan_num, m.nama_bulan, COALESCE(SUM(t.total_amount),0) AS total
       FROM (
         SELECT 1 AS bulan_num, 'Januari' AS nama_bulan
         UNION ALL SELECT 2, 'Februari'
         UNION ALL SELECT 3, 'Maret'
         UNION ALL SELECT 4, 'April'
         UNION ALL SELECT 5, 'Mei'
         UNION ALL SELECT 6, 'Juni'
         UNION ALL SELECT 7, 'Juli'
         UNION ALL SELECT 8, 'Agustus'
         UNION ALL SELECT 9, 'September'
         UNION ALL SELECT 10, 'Oktober'
         UNION ALL SELECT 11, 'November'
         UNION ALL SELECT 12, 'Desember'
       ) AS m
       LEFT JOIN sales_transactions t ON t.client_id = $1
         AND MONTH(t.created_at) = m.bulan_num
         AND YEAR(t.created_at) = YEAR(CURDATE())
       GROUP BY m.bulan_num, m.nama_bulan
       ORDER BY m.bulan_num`,
      [clientId]
    );

    return res.json({
      chart: dataRes.rows.map((r) => ({ bulan: r.nama_bulan, total: Number(r.total) })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching monthly sales" });
  }
}
