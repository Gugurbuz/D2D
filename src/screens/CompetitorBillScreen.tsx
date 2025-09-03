import React, { useState } from "react";
import BillCapture from "../components/BillCapture";
import { toFormDefaults, confColor } from "../utils/extractHelpers";
import type { ExtractResponseData } from "../types/extract";

type FormState = ReturnType<typeof toFormDefaults>;

// Enerjisa paleti
const cYellow = "#F9C800";
const cNavy = "#002D72";

export default function CompetitorBillScreen() {
  const [form, setForm] = useState<FormState>({
    provider: "",
    customerName: "",
    address: "",
    installationNo: "",
    meterNo: "",
    periodFrom: "",
    periodTo: "",
    consumptionKwh: "",
    unitPrice: "",
    totalAmount: "",
  });

  const [conf, setConf] = useState<Record<string, number | undefined>>({});

  function handleResult(data: ExtractResponseData) {
    const mapped = toFormDefaults(data);
    setForm((p) => ({ ...p, ...mapped }));
    setConf({
      provider: data?.provider?.confidence,
      customerName: undefined, // isim confidence yoksa boş bırak
      address: undefined,
      installationNo: data?.installation_no?.confidence,
      meterNo: data?.meter_no?.confidence,
      consumptionKwh: data?.consumption_kwh?.confidence,
      unitPrice: data?.unit_price_tl_per_kwh?.confidence,
      totalAmount: data?.total_amount_tl?.confidence,
    });
  }

  // Basit doğrulama: unitPrice * consumption ≈ total
  const calcOk = (() => {
    const k = parseFloat(form.consumptionKwh.replace(",", "."));
    const u = parseFloat(form.unitPrice.replace(",", "."));
    const t = parseFloat(form.totalAmount.replace(",", "."));
    if (Number.isFinite(k) && Number.isFinite(u) && Number.isFinite(t)) {
      const expected = k * u;
      const diff = Math.abs(expected - t);
      const tol = Math.max(5, expected * 0.05); // min 5 TL veya ±%5
      return diff <= tol;
    }
    return true;
  })();

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: cNavy }}>
          Rakip Fatura – Otomatik Doldurma
        </h1>
        <div
          className="px-3 py-1 rounded text-sm font-medium"
          style={{ background: cYellow, color: "#1a1a1a" }}
        >
          MVP • Ücretsiz OCR
        </div>
      </header>

      <BillCapture onResult={handleResult} />

      <section className="grid md:grid-cols-2 gap-4">
        <Field label="Şirket" value={form.provider} onChange={(v) => setForm({ ...form, provider: v })} ring={confColor(conf.provider)} />

        <Field label="Müşteri Ad Soyad" value={form.customerName} onChange={(v) => setForm({ ...form, customerName: v })} />

        <div className="md:col-span-2">
          <Field label="Adres" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
        </div>

        <Field label="Tesisat No" value={form.installationNo} onChange={(v) => setForm({ ...form, installationNo: v })} ring={confColor(conf.installationNo)} />
        <Field label="Sayaç No" value={form.meterNo} onChange={(v) => setForm({ ...form, meterNo: v })} ring={confColor(conf.meterNo)} />

        <Field label="Dönem Başlangıç" value={form.periodFrom} onChange={(v) => setForm({ ...form, periodFrom: v })} />
        <Field label="Dönem Bitiş" value={form.periodTo} onChange={(v) => setForm({ ...form, periodTo: v })} />

        <Field label="Tüketim (kWh)" value={form.consumptionKwh} onChange={(v) => setForm({ ...form, consumptionKwh: v })} ring={confColor(conf.consumptionKwh)} />
        <Field label="Birim Fiyat (TL/kWh)" value={form.unitPrice} onChange={(v) => setForm({ ...form, unitPrice: v })} ring={confColor(conf.unitPrice)} />
        <Field label="Toplam Tutar (TL)" value={form.totalAmount} onChange={(v) => setForm({ ...form, totalAmount: v })} ring={confColor(conf.totalAmount)} />
      </section>

      <footer className="flex items-center justify-between pt-2">
        <div className={`text-sm ${calcOk ? "text-emerald-700" : "text-rose-700"}`}>
          {calcOk ? "✅ Tutar kontrolü mantıklı görünüyor." : "⚠️ Tutar, tüketim×birim fiyat ile uyuşmuyor. Kontrol edin."}
        </div>
        <button className="px-4 py-2 rounded-md text-white" style={{ background: cNavy }}>
          Teklif Oluştur
        </button>
      </footer>
    </div>
  );
}

function Field({
  label, value, onChange, ring
}: { label: string; value: string; onChange: (v: string) => void; ring?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-gray-700">{label}</span>
      <input
        className={`px-3 py-2 rounded border outline-none focus:ring-2 ${ring ? `ring-2 ${ring}` : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
