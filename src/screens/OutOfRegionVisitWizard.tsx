// src/screens/OutOfRegionVisitWizard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Step2PodCheck, { PodResult } from "../steps/Step2PodCheck";
import Step3Customer, { Step3Data } from "../steps/Step3Customer";
import Step4Competitor, { Step4Data } from "../steps/Step4Competitor";
import Step5Summary from "../steps/Step5Summary";
import { Zap } from "lucide-react";

type FromStep1 = { customerName?: string; address?: string; tariff?: string; annual?: string };

export default function OutOfRegionVisitWizard() {
  const navigate = useNavigate();
  const location = useLocation() as any;

  const [fromStep1, setFromStep1] = useState<FromStep1 | null>(null);
  const [idx, setIdx] = useState<number>(2); // 2: POD, 3: Müşteri, 4: Rakip, 5: Özet

  const [s2, setS2] = useState<PodResult | null>(null);
  const [s3, setS3] = useState<Step3Data | null>(null);
  const [s4, setS4] = useState<Step4Data | null>(null);

  useEffect(() => {
    const st = location?.state?.fromStep1 as FromStep1 | undefined;
    if (st && (st.customerName || st.address || st.tariff || st.annual)) {
      setFromStep1(st);
      return;
    }
    try {
      const raw = localStorage.getItem("outOfRegion_fromStep1");
      if (raw) {
        const parsed = JSON.parse(raw) as FromStep1;
        setFromStep1(parsed);
        return;
      }
    } catch {}
    // veri yoksa adım 1'e dön
    navigate("/invoice-ocr", { replace: true });
  }, [location, navigate]);

  const steps = useMemo(
    () => [
      { key: 2, title: "POD Doğrulama" },
      { key: 3, title: "Müşteri Detayları" },
      { key: 4, title: "Rakip Bilgileri" },
      { key: 5, title: "Özet" },
    ],
    []
  );

  if (!fromStep1) return null;

  return (
    <div className="min-h-screen w-full bg-[#f6f7fb]">
      <header className="border-b bg-white">
        <div className="px-4 py-3 flex items-center gap-3">
          <Zap className="text-yellow-500" />
          <h1 className="text-lg font-semibold text-gray-800">Bölge Dışı Ziyaret — Sihirbaz</h1>
        </div>
      </header>

      {/* Stepper */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="flex items-center gap-2 text-sm flex-wrap">
          {steps.map((s, i) => {
            const active = s.key === idx;
            const done = s.key < idx;
            return (
              <div key={s.key} className={`inline-flex items-center gap-2`}>
                <span
                  className={`w-6 h-6 rounded-full grid place-items-center text-white text-xs ${
                    done ? "bg-emerald-600" : active ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  {i + 1}
                </span>
                <span className={`${active ? "font-semibold" : "text-gray-600"}`}>{s.title}</span>
                {i < steps.length - 1 && <span className="text-gray-400">›</span>}
              </div>
            );
          })}
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4">
        {idx === 2 && (
          <Step2PodCheck
            initialPod=""
            onBack={() => navigate("/invoice-ocr")}
            onNext={(res) => {
              setS2(res);
              setIdx(3);
            }}
          />
        )}

        {idx === 3 && s2 && (
          <Step3Customer
            customerType={s2.customerType ?? "Bireysel"}
            onBack={() => setIdx(2)}
            onNext={(d) => {
              setS3(d);
              setIdx(4);
            }}
          />
        )}

        {idx === 4 && (
          <Step4Competitor
            onBack={() => setIdx(3)}
            onNext={(d) => {
              setS4(d);
              setIdx(5);
            }}
          />
        )}

        {idx === 5 && s2 && s3 && (
          <Step5Summary
            data={{ fromStep1, step2: s2, step3: s3, step4: s4 || undefined }}
            onBack={() => setIdx(4)}
            onSave={async () => {
              alert("Müşteri bilgileri kaydedildi.");
              // burada API kaydı yap
            }}
            onSaveAndPlan={async () => {
              alert("Kaydedildi. Takvim planlamasına gidiliyor.");
              // burada kaydet + takvim ekranına navigate et
            }}
          />
        )}
      </main>
    </div>
  );
}
