import { pool } from "../db.js";

export async function listProducts(req, res) {
  const clientId = req.client.id;
  const { page = 1, perPage = 20, search, categoryId, status } = req.query;

  const limit = Number(perPage) || 20;
  const offset = (Number(page) - 1) * limit;

  const where = ["p.client_id = $1"];
  const params = [clientId];
  let idx = 2;

  if (search) {
    where.push(`LOWER(p.name) LIKE $${idx++}`);
    params.push(`%${String(search).toLowerCase()}%`);
  }
  if (categoryId) {
    where.push(`p.category_id = $${idx++}`);
    params.push(Number(categoryId));
  }

  if (status === "habis") where.push("p.stock <= 0");
  else if (status === "menipis") where.push("p.stock > 0 AND p.stock < 10");

  const whereSql = "WHERE " + where.join(" AND ");

  try {
    const listSql = `SELECT p.id, p.name, p.selling_price, p.unit, p.stock, p.category_id, p.expiry_date FROM products p ${whereSql} ORDER BY p.name ASC LIMIT ${limit} OFFSET ${offset}`;
    const countSql = `SELECT COUNT(*) AS count FROM products p ${whereSql}`;

    const [listRes, countRes] = await Promise.all([
      pool.query(listSql, params),
      pool.query(countSql, params),
    ]);

    return res.json({
      items: listRes.rows,
      total: countRes.rows[0].count,
      page: Number(page),
      perPage: limit,
    });
  } catch (err) {
    console.error("GET /api/retail/products error:", err);
    return res.status(500).json({ message: "Gagal mengambil produk", detail: String(err) });
  }
}

export async function createProduct(req, res) {
  try {
    const clientId = req.client.id;
    const { name, selling_price, unit, stock = 0, category_id, expiry_date } = req.body;

    if (!name || !selling_price || !unit) {
      return res.status(400).json({ message: "name, selling_price dan unit wajib diisi" });
    }

    const result = await pool.query(
      `INSERT INTO products (client_id, name, selling_price, unit, stock, category_id, expiry_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       `,
      [clientId, name, Number(selling_price), unit, Number(stock) || 0, category_id || null, expiry_date || null]
    );

    const created = await pool.query(
      "SELECT id, client_id, name, selling_price, unit, stock, category_id, expiry_date FROM products WHERE id = $1",
      [result.insertId]
    );
    return res.status(201).json(created.rows[0]);
  } catch (err) {
    console.error("POST /api/retail/products error:", err);
    return res.status(500).json({ message: "Gagal menambah produk", detail: String(err) });
  }
}

export async function updateProduct(req, res) {
  try {
    const clientId = req.client.id;
    const { id } = req.params;
    const { name, selling_price, unit, stock = 0, category_id, expiry_date } = req.body;

    const result = await pool.query(
      `UPDATE products
       SET name=$1, selling_price=$2, unit=$3, stock=$4, category_id=$5, expiry_date=$6
       WHERE id=$7 AND client_id=$8
       `,
      [name, Number(selling_price), unit, Number(stock) || 0, category_id || null, expiry_date || null, id, clientId]
    );

    if (result.rowCount === 0) return res.status(404).json({ message: "Produk tidak ditemukan" });
    const updated = await pool.query(
      "SELECT id, client_id, name, selling_price, unit, stock, category_id, expiry_date FROM products WHERE id = $1 AND client_id = $2",
      [id, clientId]
    );
    return res.json(updated.rows[0]);
  } catch (err) {
    console.error("PUT /api/retail/products/:id error:", err);
    return res.status(500).json({ message: "Gagal mengupdate produk", detail: String(err) });
  }
}

export async function deleteProduct(req, res) {
  try {
    const clientId = req.client.id;
    const { id } = req.params;

    const result = await pool.query("DELETE FROM products WHERE id=$1 AND client_id=$2", [id, clientId]);
    if (result.rowCount === 0) return res.status(404).json({ message: "Produk tidak ditemukan" });
    return res.json({ message: "Product deleted" });
  } catch (err) {
    console.error("DELETE /api/retail/products/:id error:", err);
    return res.status(500).json({ message: "Gagal menghapus produk", detail: String(err) });
  }
}

export async function listCategories(req, res) {
  try {
    const clientId = req.client.id;
    const result = await pool.query("SELECT id, name FROM product_categories WHERE client_id = $1 ORDER BY name ASC", [clientId]);
    return res.json(result.rows);
  } catch (err) {
    console.error("GET /api/retail/categories error:", err);
    return res.status(500).json({ message: "Gagal memuat kategori", detail: String(err) });
  }
}

export async function createCategory(req, res) {
  try {
    const clientId = req.client.id;
    const { name } = req.body;
    if (!name || !String(name).trim()) return res.status(400).json({ message: "Nama kategori wajib diisi" });

    const result = await pool.query("INSERT INTO product_categories (client_id, name) VALUES ($1, $2)", [clientId, String(name).trim()]);
    const created = await pool.query("SELECT id, name FROM product_categories WHERE id = $1", [result.insertId]);
    return res.status(201).json(created.rows[0]);
  } catch (err) {
    console.error("POST /api/retail/categories error:", err);
    return res.status(500).json({ message: "Gagal menambah kategori", detail: String(err) });
  }
}

export async function listUnits(req, res) {
  try {
    const clientId = req.client.id;
    const result = await pool.query("SELECT id, name FROM product_units WHERE client_id = $1 ORDER BY name ASC", [clientId]);
    return res.json(result.rows);
  } catch (err) {
    console.error("GET /api/retail/units error:", err);
    return res.status(500).json({ message: "Gagal memuat satuan", detail: String(err) });
  }
}

export async function createUnit(req, res) {
  try {
    const clientId = req.client.id;
    const { name } = req.body;
    if (!name || !String(name).trim()) return res.status(400).json({ message: "Nama satuan wajib diisi" });

    const result = await pool.query("INSERT INTO product_units (client_id, name) VALUES ($1, $2)", [clientId, String(name).trim()]);
    const created = await pool.query("SELECT id, name FROM product_units WHERE id = $1", [result.insertId]);
    return res.status(201).json(created.rows[0]);
  } catch (err) {
    console.error("POST /api/retail/units error:", err);
    return res.status(500).json({ message: "Gagal menambah satuan", detail: String(err) });
  }
}
