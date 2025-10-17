// src/steps/Step4Competitor.tsx
import React, { useState } from "react";

export type Step4Data = {
  rivalCompany?: string;
  avgBill?: string;
  contractEnd?: string; // yyyy-mm-dd
  rivalRate?: string;
  commitment?: "Var" | "Yok" | "";
  deposit?: "Var" | "Yok" | "";
};

export default function Step4Competitor({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: (d: Step4Data) => void;
}) {
  const [form, setForm] = useState<Step4Data>({ commitment: "", deposit: "" });

  function set<K extends keyof Step4Data>(k: K, v: Step4Data[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  const canNext = !!form.rivalCompany;

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-4">
      <h2 className="text-lg font-semibold mb-4">Adım 4 — Rakip Bilgileri</h2>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium">Rakip Şirket</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={form.rivalCompany || ""}
            onChange={(e) => set("rivalCompany", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium">Aylık Ortalama Fatura (TL)</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={form.avgBill || ""}
              onChange={(e) => set("avgBill", e.target.value)}
              placeholder="Örn: 4500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Sözleşme Bitiş Tarihi</label>
            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2"
              value={form.contractEnd || ""}
              onChange={(e) => set("contractEnd", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Rakip Fiyat/Oran</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={form.rivalRate || ""}
              onChange={(e) => set("rivalRate", e.target.value)}
              placeholder="Örn: 2.18 TL/kWh"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Taahhüt Durumu</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.commitment || ""}
              onChange={(e) => set("commitment", e.target.value as any)}
            >
              <option value="">-</option>
              <option value="Var">Var</option>
              <option value="Yok">Yok</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Teminat Durumu</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.deposit || ""}
              onChange={(e) => set("deposit", e.target.value as any)}
            >
              <option value="">-</option>
              <option value="Var">Var</option>
              <option value="Yok">Yok</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-4">
        <button onClick={onBack} className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50">
          Geri
        </button>
        <button
          disabled={!canNext}
          onClick={() => onNext(form)}
          className="px-5 py-2 rounded-lg bg-emerald-600 text-white disabled:bg-gray-400"
        >
          İleri
        </button>
      </div>
    </div>
  );
}
