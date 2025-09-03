import React, { useRef, useState } from "react";
import type { ExtractAPIResponse } from "../types/extract";

const API_URL = import.meta.env.VITE_EXTRACT_API_URL || "http://localhost:8000/extract";

type Props = {
  onResult: (data: ExtractAPIResponse["data"]) => void;
};

export default function BillCapture({ onResult }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const r = await fetch(API_URL, { method: "POST", body: fd });
      const json: ExtractAPIResponse = await r.json();
      if (!json?.ok) throw new Error("Çıkarma başarısız");
      onResult(json.data);
    } catch (e: any) {
      setError(e?.message || "Beklenmeyen bir hata");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 border rounded-md bg-white/80">
      <div className="mb-3 text-sm text-gray-700">
        Rakip faturasının fotoğrafını çekin veya yükleyin.{" "}
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" required className="accent-[#F9C800]" />
          <span>KVKK aydınlatmasını okudum ve onaylıyorum.</span>
        </label>
      </div>

      <div className="flex items-center gap-8">
        <button
          onClick={() => inputRef.current?.click()}
          className="px-4 py-2 rounded-md bg-[#002D72] text-white hover:opacity-90"
        >
          Fotoğraf Seç / Çek
        </button>
        {loading && <span className="text-sm">İşleniyor…</span>}
        {error && <span className="text-sm text-rose-600">Hata: {error}</span>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}
