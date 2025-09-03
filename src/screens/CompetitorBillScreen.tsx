import React, { useEffect, useRef, useState } from "react";

type ExtractField<T = string | number | null> = {
  value?: T | null;
  confidence?: number;
};
type ExtractResponseData = {
  provider?: { name?: string | null; confidence?: number };
  period?: { from?: string | null; to?: string | null; confidence?: number };
  customer?: { name?: string | null; address?: string | null };
  installation_no?: ExtractField<string>;
  meter_no?: ExtractField<string>;
  consumption_kwh?: ExtractField<number>;
  unit_price_tl_per_kwh?: ExtractField<number>;
  total_amount_tl?: ExtractField<number>;
};
type ExtractAPIResponse = { ok: boolean; data: ExtractResponseData };

const API_URL = import.meta.env.VITE_EXTRACT_API_URL || "http://localhost:8000/extract";
const C_NAVY = "#002D72";
const C_YELLOW = "#F9C800";

export default function CompetitorBillScreen() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [streamOn, setStreamOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [json, setJson] = useState<ExtractResponseData | null>(null);

  // Kamera aç
  async function startCamera() {
    setError(null);
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" }, // arka kamera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = media;
        await videoRef.current.play();
        setStreamOn(true);
      }
    } catch (e: any) {
      setError("Kamera açılamadı. Tarayıcı izinlerini ve HTTPS kullanımını kontrol edin.");
      setStreamOn(false);
    }
  }

  // Kamera kapat
  function stopCamera() {
    const v = videoRef.current;
    const stream = v?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (v) v.srcObject = null;
    setStreamOn(false);
  }

  useEffect(() => {
    // Sayfa çıkışında kamerayı kapat
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Foto çek → blob → API
  async function captureAndSend() {
    if (!videoRef.current || !canvasRef.current) return;
    setBusy(true);
    setError(null);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const w = video.videoWidth || 1280;
      const h = video.videoHeight || 720;
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context alınamadı.");
      // Basit crop/rotate yok; faturayı tam çekecek şekilde yönlendir
      ctx.drawImage(video, 0, 0, w, h);

      const blob: Blob = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b as Blob), "image/jpeg", 0.92)
      );

      await sendToAPI(blob, "capture.jpg");
    } catch (e: any) {
      setError(e?.message || "Fotoğraf işlenemedi.");
    } finally {
      setBusy(false);
    }
  }

  // Dosyadan yükleme (fallback)
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setError(null);
    try {
      await sendToAPI(f, f.name);
    } catch (e: any) {
      setError(e?.message || "Yükleme hatası.");
    } finally {
      setBusy(false);
      e.currentTarget.value = "";
    }
  }

  async function sendToAPI(file: Blob, filename: string) {
    const fd = new FormData();
    fd.append("image", file, filename);
    const r = await fetch(API_URL, { method: "POST", body: fd });
    const j: ExtractAPIResponse = await r.json();
    if (!j?.ok) throw new Error("OCR/Alan çıkarımı başarısız.");
    setJson(j.data);
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-16">
      {/* Başlık */}
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: C_NAVY }}>
          Rakip Fatura – Otomatik Doldurma
        </h1>
        {/* KVKK onay mini */}
        <label className="text-sm inline-flex items-center gap-2">
          <input type="checkbox" required className="accent-[#F9C800]" />
          <span>KVKK aydınlatmasını onaylıyorum</span>
        </label>
      </header>

      {/* Kamera / Yükleme Alanı */}
      <section className="grid md:grid-cols-2 gap-24 items-start">
        {/* Sol: Kamera */}
        <div className="space-y-4">
          <div
            className="rounded-xl overflow-hidden border"
            style={{ borderColor: C_YELLOW }}
          >
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full aspect-video bg-black"
            />
          </div>

          <div className="flex flex-wrap gap-8">
            {!streamOn ? (
              <button
                onClick={startCamera}
                className="px-4 py-2 rounded-md text-white"
                style={{ background: C_NAVY }}
              >
                Kamerayı Aç
              </button>
            ) : (
              <>
                <button
                  onClick={captureAndSend}
                  disabled={busy}
                  className="px-4 py-2 rounded-md text-white disabled:opacity-60"
                  style={{ background: C_NAVY }}
                >
                  {busy ? "İşleniyor…" : "Fotoğraf Çek ve Oku"}
                </button>
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 rounded-md"
                  style={{ background: "#eee", color: "#111", border: "1px solid #ddd" }}
                >
                  Kamerayı Kapat
                </button>
              </>
            )}

            <label className="px-4 py-2 rounded-md cursor-pointer"
                   style={{ background: "#fff", border: `1px solid ${C_NAVY}`, color: C_NAVY }}>
              Dosyadan Yükle
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={onFile}
              />
            </label>
          </div>

          {error && <div className="text-sm text-rose-600">{error}</div>}
          <canvas ref={canvasRef} className="hidden" />
          <p className="text-xs text-gray-500">
            * iOS Safari ve birçok tarayıcıda kamera erişimi için **HTTPS** gerekir.  
            * Arka kamerayı açmak için “facingMode: environment” kullanıyoruz.
          </p>
        </div>

        {/* Sağ: Sonuç (Form ön-izleme) */}
        <div className="space-y-3">
          <h2 className="font-medium" style={{ color: C_NAVY }}>Çıkarılan Alanlar</h2>
          {!json && (
            <div className="text-sm text-gray-600">
              Kamerayı açıp “Fotoğraf Çek ve Oku” deyin veya dosya yükleyin.
            </div>
          )}

          {json && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Şirket" value={json.provider?.name} />
              <Field label="Müşteri Ad Soyad" value={json.customer?.name} />
              <div className="md:col-span-2"><Field label="Adres" value={json.customer?.address} /></div>
              <Field label="Tesisat No" value={json.installation_no?.value} conf={json.installation_no?.confidence} />
              <Field label="Sayaç No" value={json.meter_no?.value} conf={json.meter_no?.confidence} />
              <Field label="Dönem Başlangıç" value={json.period?.from} />
              <Field label="Dönem Bitiş" value={json.period?.to} />
              <Field label="Tüketim (kWh)" value={json.consumption_kwh?.value} conf={json.consumption_kwh?.confidence} />
              <Field label="Birim Fiyat (TL/kWh)" value={json.unit_price_tl_per_kwh?.value} conf={json.unit_price_tl_per_kwh?.confidence} />
              <Field label="Toplam Tutar (TL)" value={json.total_amount_tl?.value} conf={json.total_amount_tl?.confidence} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, conf }: { label: string; value: any; conf?: number }) {
  const ring =
    conf === undefined ? "" :
    conf >= 0.85 ? "ring-emerald-400" :
    conf >= 0.7  ? "ring-amber-400"  : "ring-rose-400";

  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-gray-700">{label}</span>
      <input
        readOnly
        value={value ?? ""}
        className={`px-3 py-2 rounded border bg-white/80 ${ring ? `ring-2 ${ring}` : ""}`}
      />
      {conf !== undefined && (
        <span className="text-[11px] text-gray-500">Güven: {(conf*100).toFixed(0)}%</span>
      )}
    </label>
  );
}
