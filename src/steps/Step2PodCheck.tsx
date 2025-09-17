// src/steps/Step2PodCheck.tsx
import React, { useState } from "react";
import { CheckCircle2, ShieldAlert } from "lucide-react";

export type PodResult = {
  pod: string;
  found: boolean;
  customerType: "Kurumsal" | "Bireysel";
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
  const [pod, setPod] = useState(initialPod || "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<PodResult | null>(null);

  async function queryPod() {
    setErr(null);
    setLoading(true);
    try {
      // TODO: buraya gerçek API isteğini koy
      await new Promise((r) => setTimeout(r, 800));

      // demo mantık: 10 haneli ise bulundu, tek-çift son hane tipini belirler
      const found = pod.trim().length >= 8;
      const last = Number(pod.slice(-1)) || 0;
      const customerType = last % 2 === 0 ? "Kurumsal" : "Bireysel";
      if (!found) {
        setResult({ pod, found: false, customerType });
      } else {
        setResult({ pod, found: true, customerType });
      }
    } catch (e: any) {
      setErr(e.message || "Sorgu başarısız");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-4">
      <h2 className="text-lg font-semibold mb-4">Adım 2 — POD Doğrulama</h2>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">POD / Tesisat No</label>
        <input
          value={pod}
          onChange={(e) => setPod(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Örn: TR00XXXXXXXX"
        />

        <div className="flex gap-2">
          <button onClick={onBack} className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50">
            Geri
          </button>
          <button
            onClick={queryPod}
            disabled={!pod || loading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:bg-gray-400"
          >
            {loading ? "Sorgulanıyor..." : "Sistemde Sorgula"}
          </button>
        </div>

        {err && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm flex gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span className="text-red-700">{err}</span>
          </div>
        )}

        {result && (
          <div
            className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${
              result.found ? "bg-emerald-50 border-emerald-200" : "bg-yellow-50 border-yellow-200"
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${result.found ? "text-emerald-600" : "text-yellow-600"}`} />
            {result.found ? (
              <span>
                Müşteri bulundu. Müşteri Tipi: <b>{result.customerType}</b>
              </span>
            ) : (
              <span>
                Bu POD sistemde yok. <b>Yeni POD Kaydı</b> açmanız gerekiyor.
              </span>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={() => result && result.found && onNext(result)}
            disabled={!result || !result.found}
            className="px-5 py-2 rounded-lg bg-emerald-600 text-white disabled:bg-gray-400"
          >
            İleri
          </button>
        </div>
      </div>
    </div>
  );
}
