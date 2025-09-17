// src/screens/OutOfRegionVisitWizard.tsx
import React, { useState } from "react";
import Step2PodCheck, { PodResult } from "../steps/Step2PodCheck";
import Step3Customer, { Step3Data } from "../steps/Step3Customer";
import Step4Competitor, { Step4Data } from "../steps/Step4Competitor";
import Step5Summary from "../steps/Step5Summary";

export default function OutOfRegionVisitWizard({
  fromStep1
}: {
  fromStep1?: { customerName?: string; address?: string; tariff?: string; annual?: string };
}) {
  const [idx, setIdx] = useState(2); // 1: OCR sayfan, burada 2’den başlıyoruz
  const [s2, setS2] = useState<PodResult | null>(null);
  const [s3, setS3] = useState<Step3Data | null>(null);
  const [s4, setS4] = useState<Step4Data | null>(null);

  function go(i:number){ setIdx(i); }

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <Header current={idx}/>
      <main className="max-w-4xl mx-auto p-4">
        {idx===2 && (
          <Step2PodCheck
            initialPod={""}
            onBack={()=>go(1)}
            onNext={(res)=>{ setS2(res); go(3); }}
          />
        )}
        {idx===3 && s2 && (
          <Step3Customer
            customerType={(s2.customerType ?? "Bireysel") as any}
            onBack={()=>go(2)}
            onNext={(d)=>{ setS3(d); go(4); }}
          />
        )}
        {idx===4 && (
          <Step4Competitor
            onBack={()=>go(3)}
            onNext={(d)=>{ setS4(d); go(5); }}
          />
        )}
        {idx===5 && s2 && s3 && s4 && (
          <Step5Summary
            data={{ fromStep1, step2: s2, step3: s3, step4: s4 }}
            onBack={()=>go(4)}
            onSave={async()=>{ alert("Müşteri bilgileri kaydedildi."); }}
            onSaveAndPlan={async()=>{ alert("Kaydedildi. Takvim planlamasına yönlendiriliyorsunuz."); }}
          />
        )}
      </main>
    </div>
  );
}

function Header({current}:{current:number}) {
  const steps = [
    { id:1, label:"Fatura/Yükleme" },
    { id:2, label:"POD Doğrulama" },
    { id:3, label:"Müşteri Detay" },
    { id:4, label:"Rakip Bilgileri" },
    { id:5, label:"Özet" },
  ];
  return (
    <header className="bg-white border-b">
      <div className="max-w-4xl mx-auto px-4 py-3 flex gap-2">
        {steps.map(s=>(
          <div key={s.id} className={`px-3 py-1 rounded-full text-sm border ${current===s.id? "bg-blue-600 text-white border-blue-600":"bg-white"}`}>
            {s.id}. {s.label}
          </div>
        ))}
      </div>
    </header>
  );
}
