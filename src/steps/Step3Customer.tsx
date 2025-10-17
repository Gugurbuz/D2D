// src/steps/Step3Customer.tsx
import React, { useState } from "react";

export type Step3Data = {
  customerType: "Kurumsal" | "Bireysel";
  // Kurumsal için:
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  // Bireysel için:
  kvkkOk?: boolean;
  marketingOk?: boolean;
  smsCode?: string;
};

export default function Step3Customer({
  customerType,
  onBack,
  onNext,
}: {
  customerType: Step3Data["customerType"];
  onBack: () => void;
  onNext: (d: Step3Data) => void;
}) {
  const [form, setForm] = useState<Step3Data>({ customerType });

  function set<K extends keyof Step3Data>(k: K, v: Step3Data[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  const isCorporate = customerType === "Kurumsal";
  const canNext =
    isCorporate
      ? !!form.contactName && !!form.contactPhone
      : !!form.kvkkOk && !!form.smsCode;

  function sendSms() {
    // TODO: gerçek SMS servisi
    alert("Doğrulama kodu gönderildi (demo: 123456)");
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-4">
      <h2 className="text-lg font-semibold mb-4">Adım 3 — Müşteri Detayları</h2>

      {isCorporate ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Yetkili Ad Soyad</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={form.contactName || ""}
              onChange={(e) => set("contactName", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Telefon</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={form.contactPhone || ""}
                onChange={(e) => set("contactPhone", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">E-posta</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={form.contactEmail || ""}
                onChange={(e) => set("contactEmail", e.target.value)}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!form.kvkkOk}
              onChange={(e) => set("kvkkOk", e.target.checked)}
            />
            <span>KVKK metnini okudum, onaylıyorum.</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!form.marketingOk}
              onChange={(e) => set("marketingOk", e.target.checked)}
            />
            <span>Pazarlama ileti izni veriyorum. (opsiyonel)</span>
          </label>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium">SMS Doğrulama Kodu</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={form.smsCode || ""}
                onChange={(e) => set("smsCode", e.target.value)}
                placeholder="Örn: 123456"
              />
            </div>
            <button onClick={sendSms} className="px-3 py-2 rounded-lg border">
              Kod Gönder
            </button>
          </div>
        </div>
      )}

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
