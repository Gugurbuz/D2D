// src/steps/Step2PodCheck.tsx
import React, { useState } from "react";
import { Search, CheckCircle2, AlertTriangle, Plus, X } from "lucide-react";

export type PodResult = {
  pod: string;
  found: boolean;
  customerType?: "Kurumsal" | "Bireysel";
  name?: string;
};

export default function Step2PodCheck({
  initialPod,
  onBack,
  onNext,
}: {
  initialPod?: string;
  onBack: () => void;
  onNext: (res: PodResult) => void;
}) {
  const [pod, setPod] = useState(initialPod ?? "");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<PodResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNewPodModal, setShowNewPodModal] = useState(false);

  async function lookupPOD(pod: string): Promise<PodResult> {
    // TODO: gerçek servis entegrasyonu
    await new Promise(r => setTimeout(r, 600));
    if (pod === "0000000000") return { pod, found: false };
    return { pod, found: true, customerType: Math.random() > 0.5 ? "Kurumsal" : "Bireysel", name: "ACME A.Ş." };
  }

  async function onQuery() {
    setError(null);
    if (!/^\d{10,12}$/.test(pod)) {
      setError("POD 10-12 haneli sayısal olmalı.");
      return;
    }
    setLoading(true);
    try {
      const r = await lookupPOD(pod);
      setRes(r);
    } catch (e: any) {
      setError(e.message || "Sorgulama başarısız.");
    } finally {
      setLoading(false);
    }
  }

  function createNewPodAndContinue(newValues: { pod: string; customerType: "Kurumsal" | "Bireysel" }) {
    const r: PodResult = { pod: newValues.pod, found: true, customerType: newValues.customerType };
    setRes(r);
    setShowNewPodModal(false);
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium">POD (Tesisat) Numarası</label>
        <input
          value={pod}
          onChange={(e)=>setPod(e.target.value)}
          placeholder="Örn: 1234567890"
          className="mt-1 w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div className="flex gap-2">
        <button onClick={onBack} className="px-4 py-2 rounded-lg border">Geri</button>
        <button onClick={onQuery} disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white">
          <Search className="w-4 h-4 inline -mt-0.5 mr-2"/> Sistemde Sorgula
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border text-sm">
          <AlertTriangle className="w-4 h-4 inline mr-2 text-red-600" /> {error}
        </div>
      )}

      {res && (
        res.found ? (
          <div className="p-3 rounded-lg border bg-green-50 text-sm">
            <CheckCircle2 className="w-4 h-4 inline mr-2 text-green-600" />
            Müşteri bulundu. Tip: <b>{res.customerType}</b> {res.name ? `— ${res.name}` : ""}
          </div>
        ) : (
          <div className="p-3 rounded-lg border bg-amber-50 text-sm">
            <AlertTriangle className="w-4 h-4 inline mr-2 text-amber-600" />
            Bu POD sistemde yok.
            <button onClick={()=>setShowNewPodModal(true)} className="ml-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border">
              <Plus className="w-4 h-4"/> Yeni POD Kaydı Oluştur
            </button>
          </div>
        )
      )}

      <div className="pt-2">
        <button
          onClick={()=> res?.found && onNext(res)}
          disabled={!res?.found}
          className="px-5 py-2 rounded-lg bg-emerald-600 text-white disabled:bg-gray-300"
        >
          İleri
        </button>
      </div>

      {/* Yeni POD Modal (basit) */}
      {showNewPodModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-4 w-full max-w-md relative">
            <button onClick={()=>setShowNewPodModal(false)} className="absolute right-3 top-3 p-1 rounded-full hover:bg-gray-100">
              <X className="w-5 h-5"/>
            </button>
            <h3 className="text-lg font-semibold mb-3">Yeni POD Kaydı</h3>
            {/* Minimum alanlar */}
            <NewPodForm
              defaultPod={pod}
              onCreate={createNewPodAndContinue}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function NewPodForm({
  defaultPod,
  onCreate
}: {
  defaultPod: string;
  onCreate: (v: {pod: string; customerType: "Kurumsal" | "Bireysel"}) => void;
}) {
  const [val, setVal] = useState(defaultPod);
  const [ctype, setCtype] = useState<"Kurumsal" | "Bireysel">("Kurumsal");
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium">POD</label>
        <input value={val} onChange={e=>setVal(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2"/>
      </div>
      <div>
        <label className="block text-sm font-medium">Müşteri Tipi</label>
        <select value={ctype} onChange={e=>setCtype(e.target.value as any)} className="mt-1 w-full border rounded-lg px-3 py-2">
          <option>Kurumsal</option>
          <option>Bireysel</option>
        </select>
      </div>
      <div className="pt-1">
        <button onClick={()=>onCreate({pod: val, customerType: ctype})} className="px-4 py-2 rounded-lg bg-blue-600 text-white">
          Oluştur ve Devam Et
        </button>
      </div>
    </div>
  );
}
