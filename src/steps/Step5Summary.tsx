// src/steps/Step5Summary.tsx
import React from "react";
import { Step4Data } from "./Step4Competitor";
import { Step3Data } from "./Step3Customer";
import { PodResult } from "./Step2PodCheck";

export default function Step5Summary({
  data,
  onBack,
  onSave,
  onSaveAndPlan,
}: {
  data: {
    fromStep1: { customerName?: string; address?: string; tariff?: string; annual?: string } | null;
    step2: PodResult;
    step3: Step3Data;
    step4?: Step4Data;
  };
  onBack: () => void;
  onSave: () => Promise<void> | void;
  onSaveAndPlan: () => Promise<void> | void;
}) {
  const { fromStep1, step2, step3, step4 } = data;

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-4">
      <h2 className="text-lg font-semibold mb-4">Adım 5 — Özet</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="border rounded-lg p-3">
          <div className="font-semibold text-gray-700 mb-1">Müşteri (Adım 1)</div>
          <ul className="space-y-1">
            <li>Adı: <b>{fromStep1?.customerName || "-"}</b></li>
            <li>Adres: <span>{fromStep1?.address || "-"}</span></li>
            <li>Tarife: <b>{fromStep1?.tariff || "-"}</b></li>
            <li>Yıllık Tük.: <b>{fromStep1?.annual || "-"}</b></li>
          </ul>
        </div>

        <div className="border rounded-lg p-3">
          <div className="font-semibold text-gray-700 mb-1">POD (Adım 2)</div>
          <ul className="space-y-1">
            <li>POD: <b>{step2.pod}</b></li>
            <li>Bulundu: <b>{step2.found ? "Evet" : "Hayır"}</b></li>
            <li>Müşteri Tipi: <b>{step2.customerType}</b></li>
          </ul>
        </div>

        <div className="border rounded-lg p-3">
          <div className="font-semibold text-gray-700 mb-1">Müşteri Detayları (Adım 3)</div>
          {step3.customerType === "Kurumsal" ? (
            <ul className="space-y-1">
              <li>Yetkili: <b>{step3.contactName || "-"}</b></li>
              <li>Telefon: <span>{step3.contactPhone || "-"}</span></li>
              <li>E-posta: <span>{step3.contactEmail || "-"}</span></li>
            </ul>
          ) : (
            <ul className="space-y-1">
              <li>KVKK: <b>{step3.kvkkOk ? "Onaylı" : "Onaysız"}</b></li>
              <li>Pazarlama: <b>{step3.marketingOk ? "İzinli" : "Yok"}</b></li>
              <li>SMS Kod: <span>{step3.smsCode || "-"}</span></li>
            </ul>
          )}
        </div>

        <div className="border rounded-lg p-3">
          <div className="font-semibold text-gray-700 mb-1">Rakip (Adım 4)</div>
          <ul className="space-y-1">
            <li>Şirket: <b>{step4?.rivalCompany || "-"}</b></li>
            <li>Ort. Fatura: <span>{step4?.avgBill || "-"}</span></li>
            <li>Sözleşme Bitiş: <span>{step4?.contractEnd || "-"}</span></li>
            <li>Fiyat/Oran: <span>{step4?.rivalRate || "-"}</span></li>
            <li>Taahhüt: <b>{step4?.commitment || "-"}</b></li>
            <li>Teminat: <b>{step4?.deposit || "-"}</b></li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 justify-between mt-4">
        <button onClick={onBack} className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50">
          Geri
        </button>
        <div className="flex gap-2">
          <button onClick={onSave} className="px-5 py-2 rounded-lg bg-blue-600 text-white">
            Kaydet
          </button>
          <button onClick={onSaveAndPlan} className="px-5 py-2 rounded-lg bg-emerald-600 text-white">
            Kaydet ve Ziyaret Planla
          </button>
        </div>
      </div>
    </div>
  );
}
