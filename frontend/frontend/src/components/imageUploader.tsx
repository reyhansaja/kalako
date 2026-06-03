"use client";

import React, { useRef, useState } from "react";
import { getApiBase } from "@/lib/api";

export default function ImageUploader({
  onUploaded,
}: {
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function uploadFile(file: File) {
    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const base = getApiBase();
      const res = await fetch(`${base}/api/upload/store-photo`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Upload gagal");
      }

      onUploaded(json.url);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  }

  return (
    <div className="space-y-2">
      <div
        className="w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 hover:border-blue-400 hover:bg-white transition-colors cursor-pointer"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        role="button"
        aria-label="Unggah foto toko"
      >
        {preview ? (
          <div className="p-3 flex flex-col items-center gap-3">
            <img
              src={preview}
              alt="preview"
              className="h-32 w-full object-cover rounded-lg border border-slate-200"
            />
            <button
              type="button"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              Ganti Foto
            </button>
          </div>
        ) : (
          <div className="p-6 sm:p-7 flex flex-col items-center text-center gap-2">
            <div className="h-12 w-12 rounded-full bg-white border border-dashed border-slate-300 flex items-center justify-center text-slate-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M3 16.5L7.5 12m-4.5 4.5 4.5 4.5M21 16.5l-4.5-4.5m4.5 4.5-4.5 4.5M3 7.5V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25V7.5M3 7.5l4.5 4.5M3 7.5 7.5 3m13.5 4.5L16.5 3m4.5 4.5L16.5 12"
                />
              </svg>
            </div>
            <p className="text-sm text-slate-700 font-medium">
              Choose a file or drag & drop it here
            </p>
            <p className="text-xs text-slate-500">
              JPEG, PNG, and MP4 formats, up to 50MB
            </p>
            <span className="mt-1 inline-flex px-4 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 shadow-sm">
              Browse File
            </span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*,video/mp4"
        onChange={handleInputChange}
      />

      {uploading && (
        <p className="text-sm text-blue-600 animate-pulse">Mengupload...</p>
      )}
    </div>
  );
}
