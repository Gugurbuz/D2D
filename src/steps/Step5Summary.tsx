// src/steps/Step5Summary.tsx
import React from "react";
import { CalendarPlus, Save } from "lucide-react";
import type { PodResult } from "./Step2PodCheck";
import type { Step3Data } from "./Step3Customer";
import type { Step4Data } from "./Step4Competitor";

export type SummaryInput = {
  fromStep1?: { customerName?: string; address?: string; tariff?: string; annual?: string };
  step2: PodResult;
  step3: Step3Data;
  step4: Step4Data;
};

export default function Step5Summary({
  data,
  onBack,
  onSave,
  onSaveAndPlan
}: {
  data: SummaryInput;
  onBack: () => void;
  onSave: () => Promise<void> | void;
  onSaveAndPlan: () => Promise<void> | void;
}) {
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Özet</h3>

      <div className="grid md:grid-cols-2 gap-3 text-sm">
        <Card title="Temel Bilgiler">
          <Row k="Müşteri Adı" v={data.fromStep1?.customerName}/>
          <Row k="Adres" v={data.fromStep1?.address}/>
          <Row k="Tarife" v={data.fromStep1?.tariff}/>
          <Row k="Yıllık Tüketim" v={data.fromStep1?.annual}/>
        </Card>

        <Card title="POD Sorgu">
          <Row k="POD" v={data.step2.pod}/>
          <Row k="Bulundu" v={data.step2.found ? "Evet" : "Hayır"}/>
          <Row k="Müşteri Tipi" v={data.step2.customerType}/>
        </Card>

        {data.step3.type === "Kurumsal" ? (
          <Card title="Yetkili">
            <Row k="Ad Soyad" v={`${data.step3.authorized.name} ${data.step3.authorized.surname}`}/>
            <Row k="Telefon" v={data.step3.authorized.phone}/>
            <Row k="E-posta" v={data.step3.authorized.email}/>
          </Card>
        ) : (
          <Card title="Bireysel İzinler">
            <Row k="KVKK" v={data.step3.consents.kvkk ? "Onaylı" : "Onaysız"}/>
            <Row k="Pazarlama" v={data.step3.consents.marketing ? "Onaylı" : "Onaysız"}/>
            <Row k="Telefon" v={data.step3.phone}/>
            <Row k="SMS" v={data.step3.smsVerified ? "Doğrulandı" : "Bekliyor"}/>
          </Card>
        )}

        <Card title="Rakip/Tedarik">
          <Row k="Rakip Şirket" v={data.step4.supplier}/>
          <Row k="Aylık Ortalama ₺" v={data.step4.avgBillTRY?.toString()}/>
          <Row k="Rakip Fiyat/Oran" v={data.step4.rivalRate}/>
          <Row k="Taahhüt" v={data.step4.commitment}/>
          <Row k="Teminat" v={data.step4.collateral}/>
          <Row k="Sözleşme Bitiş" v={data.step4.contractEnd}/>
        </Card>
      </div>

      <div className="flex gap-2 pt-2 justify-end">
        <button onClick={onBack} className="px-4 py-2 rounded-lg border">Geri</button>
        <button onClick={()=>onSave()} className="px-4 py-2 rounded-lg bg-blue-600 text-white inline-flex items-center gap-2">
          <Save className="w-4 h-4"/> Kaydet
        </button>
        <button onClick={()=>onSaveAndPlan()} className="px-4 py-2 rounded-lg bg-emerald-600 text-white inline-flex items-center gap-2">
          <CalendarPlus className="w-4 h-4"/> Kaydet ve Ziyaret Planla
        </button>
      </div>
    </div>
  );
}

function Card({title, children}:{title:string; children:React.ReactNode}) {
  return (
    <div className="border rounded-xl p-3">
      <div className="font-semibold mb-2">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
function Row({k, v}:{k:string; v:any}) {
  if (v === undefined || v === "" || v === null) return null;
  return <div className="flex justify-between gap-3"><span className="text-gray-600">{k}</span><span className="font-medium">{String(v)}</span></div>;
}
