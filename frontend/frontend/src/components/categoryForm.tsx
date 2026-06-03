"use client";

import { useState } from "react";

export default function CategoryFormModal({
  title = "Tambah Kategori",
  initial,
  onClose,
  onSubmit,
}: {
  title?: string;
  initial?: any;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return alert("Nama kategori wajib diisi");
    try {
      setSaving(true);
      await onSubmit({ name: name.trim() });
    } catch (err: any) {
      alert(err?.message || "Gagal menyimpan kategori");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl border-t-4 border-purple-600 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4">
          <h2 className="text-lg font-bold text-white">{title}</h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">🏷️ Nama Kategori</label>
            <input
              type="text"
              className="border-2 border-slate-300 w-full px-3 py-2 rounded-lg text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 text-sm font-bold border-2 border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-all"
            onClick={onClose}
          >
            ❌ Batal
          </button>

          <button
            type="button"
            className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 hover:shadow-lg transition-all disabled:from-slate-400 disabled:to-slate-500"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "⏳ Menyimpan..." : "💾 Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
