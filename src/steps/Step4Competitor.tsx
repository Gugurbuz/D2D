// src/steps/Step4Competitor.tsx
import React, { useState } from "react";

export type Step4Data = {
  supplier: string;
  avgBillTRY?: number;
  rivalRate?: string;       // % veya birim fiyat metni
  commitment?: "Var" | "Yok" | "Bilinmiyor";
  collateral?: "Var" | "Yok" | "Bilinmiyor";
  contractEnd?: string;     // YYYY-MM-DD
};

const SUPPLIERS = ["CK", "Aydem", "ENERJİSA", "Limak", "Diğer"];

export default function Step4Competitor({
  initial,
  onBack,
  onNext
}: {
  initial?: Partial<Step4Data>;
  onBack: () => void;
  onNext: (d: Step4Data) => void;
}) {
  const [f, setF] = useState<Step4Data>({
    supplier: initial?.supplier ?? "",
    avgBillTRY: initial?.avgBillTRY,
    rivalRate: initial?.rivalRate ?? "",
    commitment: initial?.commitment ?? "Bilinmiyor",
    collateral: initial?.collateral ?? "Bilinmiyor",
    contractEnd: initial?.contractEnd ?? ""
  });
  const canNext = !!f.supplier;

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Mevcut Tedarikçi Bilgileri</h3>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Rakip Şirket</label>
          <select value={f.supplier} onChange={e=>setF({...f, supplier:e.target.value})}
                  className="mt-1 w-full border rounded-lg px-3 py-2">
            <option value="">-</option>
            {SUPPLIERS.map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Aylık Ortalama Fatura (₺)</label>
          <input type="number" value={f.avgBillTRY ?? ""} onChange={e=>setF({...f, avgBillTRY:Number(e.target.value)})}
                 className="mt-1 w-full border rounded-lg px-3 py-2"/>
        </div>

        <div>
          <label className="block text-sm font-medium">Rakip Fiyat/Oran</label>
          <input value={f.rivalRate} onChange={e=>setF({...f, rivalRate:e.target.value})}
                 placeholder="%12 indirim / 3,20 TL/kWh" className="mt-1 w-full border rounded-lg px-3 py-2"/>
        </div>

        <div>
          <label className="block text-sm font-medium">Taahhüt Durumu</label>
          <select value={f.commitment} onChange={e=>setF({...f, commitment:e.target.value as any})}
                  className="mt-1 w-full border rounded-lg px-3 py-2">
            <option>Var</option><option>Yok</option><option>Bilinmiyor</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Teminat Durumu</label>
          <select value={f.collateral} onChange={e=>setF({...f, collateral:e.target.value as any})}
                  className="mt-1 w-full border rounded-lg px-3 py-2">
            <option>Var</option><option>Yok</option><option>Bilinmiyor</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Sözleşme Bitiş Tarihi</label>
          <input type="date" value={f.contractEnd} onChange={e=>setF({...f, contractEnd:e.target.value})}
                 className="mt-1 w-full border rounded-lg px-3 py-2"/>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={onBack} className="px-4 py-2 rounded-lg border">Geri</button>
        <button onClick={()=>onNext(f)} disabled={!canNext}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:bg-gray-300">
          İleri
        </button>
      </div>
    </div>
  );
}
