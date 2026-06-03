"use client";

import { useEffect, useRef, useState } from "react";
import ClientShell from "@/components/clientShell";
import { useProtectedPage } from "@/lib/hooks";
import {
  getRetailProducts,
  getRetailCategories,
  addRetailCategory,
  addRetailProduct,
  updateRetailProduct,
  deleteRetailProduct,
  getRetailUnits,
  addRetailUnit,
} from "@/lib/api";
import CategoryFormModal from "@/components/categoryForm";

/* ============================================================
 * KONSTANTA
 * ============================================================ */

const PER_PAGE = 10;

/* ============================================================
 * HALAMAN UTAMA
 * ============================================================ */

export default function RetailStockPage() {
  const { isReady, user } = useProtectedPage();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<"all" | "banyak" | "sedikit" | "habis">("all");

  const [showAddModal, setShowAddModal] = useState(false);
  
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [forceVisibleIds, setForceVisibleIds] = useState<number[]>([]);
  const forceTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  function forceShowProduct(id: number, ms = 15000) {
    const nid = Number(id);
    setForceVisibleIds((prev) => (prev.includes(nid) ? prev : [...prev, nid]));
    // clear any previous timer
    if (forceTimers.current[nid]) clearTimeout(forceTimers.current[nid]);
    forceTimers.current[nid] = setTimeout(() => {
      setForceVisibleIds((prev) => prev.filter((x) => x !== nid));
      delete forceTimers.current[nid];
    }, ms);
  }

  // cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(forceTimers.current).forEach((t) => clearTimeout(t));
      forceTimers.current = {};
    };
  }, []);

  async function loadData() {
    try {
      const [prod, cats, unt] = await Promise.all([
        getRetailProducts({}), // filter dilakukan di front-end
        getRetailCategories(),
        getRetailUnits(),
      ]);

      setProducts(prod.items || prod || []);
      setCategories(cats || []);
      setUnits(unt || []);
    } catch (err) {
      console.error("LOAD ERROR:", err);
    }
  }

  useEffect(() => {
    if (!isReady || !user) return;
    loadData();
  }, [isReady, user]);

  // fungsi bantu status stok (banyak/sedikit/habis)
  function getStockStatus(stock: number): "banyak" | "sedikit" | "habis" {
    if (stock === 0) return "habis";
    if (stock < 10) return "sedikit";
    return "banyak";
  }

  // filter kategori & status stok
  const filteredProducts = products.filter((p) => {
    // Determine product category id (support: p.category?.id, p.category_id, p.category_name)
    let pid: number | undefined = undefined;
    if (p?.category?.id !== undefined) {
      pid = Number(p.category.id);
    } else if (p?.category_id !== undefined) {
      pid = Number(p.category_id);
    } else if (p?.category_name) {
      // try to find category id by name (case-insensitive)
      const name = String(p.category_name).trim().toLowerCase();
      const c = categories.find((c) => String(c.name).trim().toLowerCase() === name);
      pid = c ? Number(c.id) : undefined;
    }

    const matchCategory = categoryId !== undefined ? pid === categoryId : true;

    const status = getStockStatus(Number(p.stock || 0));
    const matchStatus = statusFilter === "all" ? true : status === statusFilter;
    const matchForced = forceVisibleIds.includes(Number(p.id));

    return matchCategory && matchStatus || matchForced;
  });

  // pagination
  const totalProducts = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PER_PAGE));
  const startIndex = (currentPage - 1) * PER_PAGE;
  const currentItems = filteredProducts.slice(startIndex, startIndex + PER_PAGE);

  // kalau filter berubah, reset ke halaman 1
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryId, statusFilter]);

  if (!isReady) {
    return (
      <ClientShell
        title={
          <div className="flex items-center gap-2">
            <img
              src="/Logo.png"
              alt="Kalako"
              className="h-12 w-auto"
            />
            <span className="text-3xl">Stok Retail</span>
          </div>
        }
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin text-4xl mb-2">⏳</div>
            <p className="text-slate-600">Memverifikasi akses...</p>
          </div>
        </div>
      </ClientShell>
    );
  }

  return (
    <ClientShell
      title={
        <div className="flex items-center gap-2">
          <img
            src="/Logo.png"
            alt="Kalako"
            className="h-12 w-auto"
          />
          <span className="text-3xl">Stok Retail</span>
        </div>
      }
    >
      <div className="space-y-6">
        {/* HEADER (judul di atas, filter + aksi di bawah) */}
        <div className="flex flex-col gap-4">
         <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
              Status Kadaluwarsa
            </h2>

            {/* legend badge hijau & merah */}
            <div className="mt-2 flex flex-wrap gap-2 items-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs px-2.5 py-0.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Sisa kadaluarsa masih lama
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500 text-white text-xs px-2.5 py-0.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-white/80" />
                Kadaluarsa sisa 1 bulan
              </span>
            </div>
          </div>

          {/* Filter + Actions di bawah heading */}
          <div className="flex flex-col gap-3">
            {/* Filter dropdowns */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="relative flex-1 sm:flex-initial">
                <select
                  className="appearance-none border border-slate-300 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-700 w-full sm:min-w-[160px] focus:outline-none focus:ring-2 focus:ring-slate-200"
                  value={categoryId !== undefined ? String(categoryId) : ""}
                  onChange={(e) =>
                    setCategoryId(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                >
                  <option value="">Semua Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                  ▼
                </span>
              </div>

              <div className="relative flex-1 sm:flex-initial">
                <select
                  className="appearance-none border border-slate-300 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-700 w-full sm:min-w-[160px] focus:outline-none focus:ring-2 focus:ring-slate-200"
                  value={statusFilter}
                  onChange={(e) => {
                    const val = e.target.value as "all" | "banyak" | "sedikit" | "habis";
                    setStatusFilter(val);
                  }}
                >
                  <option value="all">Semua Status</option>
                  <option value="banyak">Stok Banyak</option>
                  <option value="sedikit">Stok Sedikit</option>
                  <option value="habis">Stok Habis</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                  ▼
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                className="px-4 py-2 w-full sm:w-auto rounded-lg bg-slate-900 text-white text-sm hover:bg-black"
                onClick={() => setShowAddModal(true)}
                aria-label="Tambah Barang"
              >
                Tambah Barang
              </button>

              {/* Kategori sekarang dapat ditambahkan langsung dari form produk */}
            </div>
          </div>
        </div>

        {/* TABEL */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-200">
                  <th className="py-3 px-4 text-left w-14 border-r border-slate-200">No</th>
                  <th className="py-3 px-4 text-left border-r border-slate-200">Nama Barang</th>
                  <th className="py-3 px-4 text-left border-r border-slate-200">Harga Jual</th>
                  <th className="py-3 px-4 text-left border-r border-slate-200">Stok</th>
                  <th className="py-3 px-4 text-left border-r border-slate-200">Satuan</th>
                  <th className="py-3 px-4 text-left border-r border-slate-200">Kadaluarsa</th>
                  <th className="py-3 px-4 text-left border-r border-slate-200">Kategori</th>
                  <th className="py-3 px-4 text-left border-r border-slate-200">Status Stok</th>
                  <th className="py-3 px-4 text-center w-10">&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((p, idx) => {
                  const rowNumber = startIndex + idx + 1;
                  const status = getStockStatus(Number(p.stock || 0));

                  const categoryName =
                    p.category?.name ||
                    p.category_name ||
                    categories.find((c) => c.id === p.category_id)?.name ||
                    "–";

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 last:border-b last:border-slate-200">
                      <td className="py-3 px-4 text-slate-700 border-r border-slate-200">{rowNumber}.</td>
                      <td className="py-3 px-4 text-slate-900 border-r border-slate-200">{p.name}</td>
                      <td className="py-3 px-4 text-slate-900 whitespace-nowrap border-r border-slate-200">Rp {(Number(p.selling_price) || 0).toLocaleString("id-ID")}</td>
                      <td className="py-3 px-4 text-slate-900 border-r border-slate-200">{Number(p.stock).toFixed(4).replace(/\.?0+$/, "")}</td>
                      <td className="py-3 px-4 text-slate-700 border-r border-slate-200">{p.unit}</td>
                      <td className="py-3 px-4 border-r border-slate-200"><ExpiryBadge expiry={p.expiry_date} /></td>
                      <td className="py-3 px-4 text-slate-700 border-r border-slate-200">{categoryName}</td>
                      <td className="py-3 px-4 border-r border-slate-200"><StockStatusPill status={status} /></td>
                      <td className="py-3 px-2 text-center relative">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100"
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === p.id ? null : p.id
                            )
                          }
                        >
                          <span className="text-xl leading-none text-slate-600">
                            ⋮
                          </span>
                        </button>

                        {openMenuId === p.id && (
                                  <div className={`absolute right-2 ${idx >= currentItems.length - 2 ? 'bottom-full mb-1' : 'mt-1'} bg-white border border-slate-200 rounded-md shadow-lg z-50 text-sm`}>
                            <button
                              className="block px-4 py-2 hover:bg-slate-50 text-left w-full"
                              onClick={() => {
                                setEditProduct(p);
                                setOpenMenuId(null);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="block px-4 py-2 hover:bg-slate-50 text-left w-full text-red-600"
                              onClick={async () => {
                                setOpenMenuId(null);
                                await handleDelete(p.id, loadData);
                              }}
                            >
                              Hapus
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {totalProducts === 0 && (
                  <tr className="border-b border-slate-200">
                    <td
                      colSpan={9}
                      className="py-8 text-center text-slate-500"
                    >
                      Tidak ada data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* FOOTER PAGINATION */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white">
            <div className="text-xs text-slate-600">
              Showing{" "}
              {totalProducts === 0 ? 0 : startIndex + 1} to{" "}
              {Math.min(startIndex + PER_PAGE, totalProducts)} of{" "}
              {totalProducts} results
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span>Per page</span>
                <div className="relative">
                  <select
                    className="appearance-none border border-slate-300 rounded-md pl-3 pr-7 py-1 text-xs text-slate-700 bg-white"
                    value={PER_PAGE}
                    disabled
                  >
                    <option value={PER_PAGE}>{PER_PAGE}</option>
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                    ▼
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.max(1, p - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-2 py-1 border border-slate-300 rounded-md disabled:opacity-40"
                >
                  ‹
                </button>

                <div className="flex border border-slate-300 rounded-md overflow-hidden">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1;
                    const active = page === currentPage;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 text-xs ${
                          active
                            ? "bg-slate-900 text-white"
                            : "bg-white text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(totalPages, p + 1)
                    )
                  }
                  disabled={
                    currentPage === totalPages || totalProducts === 0
                  }
                  className="px-2 py-1 border border-slate-300 rounded-md disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL TAMBAH */}
      {showAddModal && (
        <ProductFormModal
          title="Tambah Produk"
          categories={categories}
          units={units}
          onClose={() => setShowAddModal(false)}
          onSubmit={async (data) => {
            await addRetailProduct(data);
            setShowAddModal(false);
            loadData();
          }}
          onCategoryAdded={loadData}
        />
      )}

      {/* Tambah kategori sekarang tersedia di dalam select Kategori (inline) */}

      {/* MODAL EDIT */}
      {editProduct && (
        <ProductFormModal
          title="Edit Produk"
          initial={editProduct}
          categories={categories}
          units={units}
          onClose={() => setEditProduct(null)}
            onSubmit={async (data) => {
            try {
              // update on server
              const updated = await updateRetailProduct(editProduct.id, data);

              // If server returns updated object use it; otherwise merge with submitted data
              const newProduct = updated && typeof updated === "object" ? updated : { ...editProduct, ...data };

              // optimistically update local state so the edited product doesn't disappear
              setProducts((prev) =>
                prev.map((p) => (Number(p.id) === Number(editProduct.id) ? newProduct : p))
              );

              // force show this product for a short duration so filters don't hide it immediately
              forceShowProduct(editProduct.id);

              setEditProduct(null);
              // also reload fresh data to ensure consistency (categories, aggregated fields)
              loadData();
            } catch (err) {
              // bubble up error to modal behavior
              throw err;
            }
          }}
          onCategoryAdded={loadData}
        />
      )}
      </div>
    </ClientShell>
  );
}

/* ============================================================
 * BADGE KADALUARSA (warna mirip gambar)
 * ============================================================ */

function ExpiryBadge({ expiry }: { expiry?: string | null }) {
  if (!expiry) {
    return (
      <span className="inline-flex px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs">
        –
      </span>
    );
  }

  const expTime = new Date(expiry).getTime();
  const now = Date.now();
  const diff = expTime - now;
  const oneMonth = 30 * 24 * 60 * 60 * 1000;

  const formatted = new Date(expiry).toLocaleDateString("id-ID");

  // hijau = >1 bulan, merah = <=1 bulan / lewat
  const isSoon = diff <= oneMonth;
  const baseClass =
    "inline-flex items-center justify-center min-w-[96px] px-3 py-1 rounded-full text-xs font-medium";

  if (expTime < now || isSoon) {
    return (
      <span className={`${baseClass} bg-red-500 text-white`}>
        {formatted}
      </span>
    );
  }

  return (
    <span className={`${baseClass} bg-emerald-500 text-white`}>
      {formatted}
    </span>
  );
}

/* ============================================================
 * PILL STATUS STOK (Stok Banyak/Sedikit/Habis)
 * ============================================================ */

function StockStatusPill({
  status,
}: {
  status: "banyak" | "sedikit" | "habis";
}) {
  let text = "";
  let className =
    "inline-flex items-center justify-center min-w-[96px] px-3 py-1 rounded-full text-xs font-medium ";

  if (status === "banyak") {
    text = "Stok Banyak";
    className += "bg-emerald-200 text-emerald-800";
  } else if (status === "sedikit") {
    text = "Stok Sedikit";
    className += "bg-slate-200 text-slate-800";
  } else {
    text = "Stok Habis";
    className += "bg-red-500 text-white";
  }

  return <span className={className}>{text}</span>;
}

/* ============================================================
 * DELETE HANDLER
 * ============================================================ */

async function handleDelete(id: number, refresh: () => void) {
  if (!confirm("Hapus produk ini?")) return;
  await deleteRetailProduct(id);
  refresh();
}

/* ============================================================
 * FORM MODAL (TAMBAH / EDIT)
 * ============================================================ */

function ProductFormModal({
  title,
  initial,
  categories,
  units,
  onClose,
  onSubmit,
  onCategoryAdded,
}: {
  title: string;
  initial?: any;
  categories?: any[];
  units?: any[];
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  onCategoryAdded?: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    selling_price: initial?.selling_price
      ? Number(initial.selling_price).toLocaleString("id-ID")
      : "",
    unit: initial?.unit || "",
    stock: initial?.stock?.toString() || "",
    category_id: initial?.category_id?.toString() || "",
    expiry_date: initial?.expiry_date
      ? String(initial.expiry_date).split("T")[0]
      : "",
  });

  const [saving, setSaving] = useState(false);
  const [noExpiry, setNoExpiry] = useState<boolean>(initial ? !initial?.expiry_date : false);
  const [localCategories, setLocalCategories] = useState<any[]>(categories || []);
  const [localUnits, setLocalUnits] = useState<any[]>(units || []);
  const [showAddInline, setShowAddInline] = useState(false);
  const [showAddUnitInline, setShowAddUnitInline] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newUnitName, setNewUnitName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [addingUnit, setAddingUnit] = useState(false);

  // sync when parent categories or units change
  useEffect(() => {
    setLocalCategories(categories || []);
  }, [categories]);

  useEffect(() => {
    setLocalUnits(units || []);
  }, [units]);

  function update(key: string, val: any) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSaveUnit() {
    if (!newUnitName.trim()) {
      alert("Nama satuan wajib diisi");
      return;
    }
    try {
      setAddingUnit(true);
      const created = await addRetailUnit({ name: newUnitName.trim() });

      const newUnit = (created && created.id) ? created : { id: created?.id || Date.now(), name: newUnitName.trim() };

      setLocalUnits((prev) => [...prev, newUnit]);
      setForm((prev) => ({ ...prev, unit: newUnit.name }));
      setShowAddUnitInline(false);
      setNewUnitName("");
      onCategoryAdded?.();
    } catch (err: any) {
      alert(err?.message || "Gagal menambah satuan");
    } finally {
      setAddingUnit(false);
    }
  }

  async function handleSave() {
    if (!form.name || !form.selling_price) {
      alert("Nama dan harga wajib diisi");
      return;
    }

    if (!form.unit || form.unit.trim() === "") {
      alert("Satuan wajib dipilih");
      return;
    }

    const numericPrice = Number(String(form.selling_price).replace(/\D/g, "")) || 0;

    const payload = {
      name: form.name,
      selling_price: numericPrice,
      unit: form.unit,
      stock: form.stock ? Number(form.stock) : 0,
      category_id: form.category_id ? Number(form.category_id) : undefined,
      expiry_date: noExpiry ? undefined : form.expiry_date || undefined,
    };

    try {
      setSaving(true);
      await onSubmit(payload);
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan produk");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-black">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Nama Produk
            </label>
            <input
              type="text"
              className="border border-slate-300 w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Harga Jual
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="border border-slate-300 w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
              value={form.selling_price}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                const formatted = raw ? Number(raw).toLocaleString("id-ID") : "";
                update("selling_price", formatted);
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">
                Satuan
              </label>
              <select
                className="border border-slate-300 w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                value={form.unit}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "__add_unit__") {
                    setShowAddUnitInline(true);
                    update("unit", "");
                  } else {
                    setShowAddUnitInline(false);
                    update("unit", v);
                  }
                }}
              >
                <option value="">-- Pilih Satuan --</option>
                {localUnits?.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name}
                  </option>
                ))}
                <option value="__add_unit__">➕ Tambah satuan...</option>
              </select>

              {showAddUnitInline && (
        <form
  className="relative z-50 mt-2 flex items-center gap-2"
  onSubmit={(e) => {
    e.preventDefault();
    handleSaveUnit();
  }}
>
          <input
            type="text"
            className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm"
            placeholder="Contoh: Botol, Kardus"
            value={newUnitName}
            onChange={(e) => setNewUnitName(e.target.value)}
            autoFocus
          />

          <button
            type="submit"
            disabled={addingUnit}
            className="px-3 py-2 text-sm rounded-md bg-slate-900 text-white hover:bg-black disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {addingUnit ? "Menyimpan..." : "Simpan"}
          </button>

          <button
            type="button"
            className="px-3 py-2 text-sm rounded-md border border-slate-300"
            onClick={() => {
              setShowAddUnitInline(false);
              setNewUnitName("");
            }}
          >
            Batal
          </button>
        </form>
      )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">
                Stok
              </label>
              <input
                type="number"
                step={form.unit === "KG" ? "0.01" : "1"}
                className="border border-slate-300 w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                value={form.stock}
                onChange={(e) => update("stock", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Kategori
            </label>
            <select
              className="border border-slate-300 w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
              value={form.category_id}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "__add__") {
                  setShowAddInline(true);
                  update("category_id", "");
                } else {
                  setShowAddInline(false);
                  update("category_id", v);
                }
              }}
            >
              <option value="">-- Pilih Kategori --</option>
              {localCategories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="__add__">➕ Tambah kategori...</option>
            </select>

            {showAddInline && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  className="border border-slate-300 flex-1 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="Nama kategori baru"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <button
                  type="button"
                  className="px-3 py-2 text-sm rounded-md bg-slate-900 text-white hover:bg-black disabled:opacity-60"
                  disabled={addingCategory}
                  onClick={async () => {
                    if (!newCategoryName.trim()) return alert("Nama kategori wajib diisi");
                    try {
                      setAddingCategory(true);
                      const created = await addRetailCategory({ name: newCategoryName.trim() });

                      // created may be the new category object or something else; try to normalize
                      const newCat = (created && created.id) ? created : { id: created?.id || Date.now(), name: newCategoryName.trim() };

                      setLocalCategories((prev) => [...prev, newCat]);
                      setForm((prev) => ({ ...prev, category_id: String(newCat.id) }));
                      setShowAddInline(false);
                      setNewCategoryName("");
                      onCategoryAdded?.();
                    } catch (err: any) {
                      alert(err?.message || "Gagal menambah kategori");
                    } finally {
                      setAddingCategory(false);
                    }
                  }}
                >
                  {addingCategory ? "Menyimpan..." : "Simpan"}
                </button>
                <button
                  type="button"
                  className="px-3 py-2 text-sm rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    setShowAddInline(false);
                    setNewCategoryName("");
                    update("category_id", "");
                  }}
                >
                  Batal
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Tanggal Kadaluarsa
            </label>
            <input
              type="date"
              className={`border border-slate-300 w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 ${noExpiry ? 'bg-slate-50 text-slate-400' : ''}`}
              value={form.expiry_date}
              onChange={(e) => update("expiry_date", e.target.value)}
              disabled={noExpiry}
            />

            <div className="mt-2 flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300"
                  checked={noExpiry}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setNoExpiry(checked);
                    if (checked) update("expiry_date", "");
                  }}
                />
                <span>Tanpa kadaluarsa</span>
              </label>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
          <button
            type="button"
            className="px-4 py-2 text-sm rounded-md border border-slate-300 text-slate-700 hover:bg-white"
            onClick={onClose}
          >
            Batal
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm rounded-md bg-slate-900 text-white hover:bg-black disabled:opacity-60"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
