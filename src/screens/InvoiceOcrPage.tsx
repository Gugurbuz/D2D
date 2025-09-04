import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  Upload,
  Wand2,
  Building2,
  Home,
  Hash,
  Gauge,
  Percent,
  Loader2,
  ShieldAlert,
  Zap,
  ChevronRight,
  CheckCircle,
} from "lucide-react";

/* ---------- process polyfill (Vite 5) ---------- */
if (typeof window !== "undefined" && (window as any).process === undefined) {
  (window as any).process = { env: {} };
}
/* ---------------------------------------------- */

const BRAND_YELLOW = "#F9C800";
const BRAND_NAVY = "#002D72";

/* ---------- Veri Tipi ---------- */
interface InvoiceData {
  companyName?: string;
  customer?: { name?: string; address?: string };
  supplyDetails?: { installationNumber?: string };
  meterReadings?: { consumption?: { total_kWh?: number | string } };
  charges?: { energyLow?: { unitPrice?: number | string } };
  /* --- Rakip şirkete ait ek alan örnekleri --- */
  tariffPlan?: string;
  contractEnd?: string;
}

/* ---------- Başlangıç ---------- */
const initialData: InvoiceData = {
  companyName: "",
  customer: { name: "", address: "" },
  supplyDetails: { installationNumber: "" },
  meterReadings: { consumption: { total_kWh: "" } },
  charges: { energyLow: { unitPrice: "" } },
  tariffPlan: "",
  contractEnd: "",
};

/* ---------- Supabase fonksiyonu ---------- */
async function generateInvoiceSummary(rawText: string) {
  const res = await fetch(
    "https://ehqotgebdywdmwxbwbjl.supabase.co/functions/v1/gpt-summary",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "AI hatası");
  return data as { invoiceData: InvoiceData; summary: string };
}

/* ---------- Yardımcı ---------- */
const FieldLabel: React.FC<{ icon: React.ReactNode; text: string }> = ({
  icon,
  text,
}) => (
  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded"
      style={{ background: BRAND_YELLOW, color: BRAND_NAVY }}
    >
      {icon}
    </span>
    {text}
  </label>
);

export default function InvoiceOcrPage() {
  /* UI state */
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  /* Data state */
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(initialData);
  const [summary, setSummary] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");

  /* Camera */
  const [cameraOn, setCameraOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY;

  useEffect(
    () => () => {
      stream?.getTracks().forEach((t) => t.stop());
    },
    [stream]
  );

  /* ---------- OCR & AI işlemi ---------- */
  async function processInvoice(file: File) {
    if (!apiKey) {
      setError("Google API anahtarı bulunamadı.");
      return;
    }
    setError(null);
    setLoading(true);
    setLoadingMessage("Fatura okunuyor…");
    try {
      /* OCR */
      const base64 = await fileToBase64(file);
      const clean = base64.replace(/^data:image\/\w+;base64,/, "");
      const visionRes = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: [
              {
                image: { content: clean },
                features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
              },
            ],
          }),
        }
      );
      if (!visionRes.ok)
        throw new Error((await visionRes.json()).error.message);
      const detected =
        (await visionRes.json()).responses[0]?.fullTextAnnotation?.text || "";
      setRawText(detected);

      /* AI Analiz */
      setLoadingMessage("Fatura analiz ediliyor…");
      const ai = await generateInvoiceSummary(detected);
      setInvoiceData(ai.invoiceData);
      setSummary(ai.summary);
      setStep(2); // otomatik olarak 2. adıma geç
    } catch (e: any) {
      console.error(e);
      setError(e.message || "İşlem hatası");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  }

  /* ---------- Helpers ---------- */
  const fileToBase64 = (file: File) =>
    new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) await processInvoice(f);
  }

  async function startCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
      setCameraOn(true);
    } catch {
      setError("Kamera başlatılamadı");
    }
  }
  function stopCamera() {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setCameraOn(false);
  }
  async function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    const blob = await (await fetch(c.toDataURL("image/jpeg"))).blob();
    await processInvoice(new File([blob], "capture.jpg", { type: "image/jpeg" }));
    stopCamera();
  }

  /* ---------- Render yardımcıları ---------- */
  const renderTable = () => (
    <table className="min-w-full text-xs border">
      <tbody>
        {Object.entries(invoiceData).map(([key, val]) => {
          if (typeof val === "object" && val !== null) return null; // basit örnek
          return (
            <tr key={key} className="border-b">
              <td className="px-2 py-1 font-medium">{key}</td>
              <td className="px-2 py-1">{String(val || "-")}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  /* ---------- UI ---------- */
  return (
    <div className="w-screen h-screen bg-[#f6f7fb] flex flex-col">
      <header className="border-b bg-white border-gray-200 px-4 py-3 flex items-center gap-3">
        <Zap size={24} className="text-yellow-500" />
        <h1 className="text-xl font-semibold">Fatura Tarama</h1>
      </header>

      {/* -------- Adım İçeriği -------- */}
      <main className="flex-1 overflow-auto">
        {/* ---------- ADIM 1: Tara ---------- */}
        {step === 1 && (
          <div className="p-4 flex flex-col gap-4 lg:flex-row">
            {/* Sol panel – Tarayıcı */}
            <div className="flex-1 bg-white rounded-2xl shadow border p-4">
              <div className="flex items-center gap-2 mb-4">
                <Wand2 />
                <h2 className="font-semibold">1. Faturanızı Yükleyin / Çekin</h2>
              </div>

              <div className="flex gap-3 flex-wrap">
                <button
                  disabled={loading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  Cihazdan Yükle
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={onFileChange}
                  />
                </button>

                <button
                  disabled={loading}
                  onClick={cameraOn ? stopCamera : startCamera}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  {cameraOn ? "Kamerayı Kapat" : "Kamerayı Aç"}
                </button>

                {loading && (
                  <span className="inline-flex items-center gap-2 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {loadingMessage}
                  </span>
                )}
              </div>

              {/* Kamera alanı */}
              {cameraOn && (
                <div className="mt-4 bg-gray-100 rounded-xl overflow-hidden border">
                  <div className="flex justify-between items-center px-2 py-1 bg-white border-b text-sm">
                    <span>Kamera</span>
                    <button
                      onClick={capturePhoto}
                      className="text-xs px-3 py-1 rounded font-semibold"
                      style={{ background: BRAND_YELLOW, color: BRAND_NAVY }}
                    >
                      Fotoğraf Çek
                    </button>
                  </div>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full aspect-video object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              )}

              {/* Özet alanı */}
              {summary && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold mb-1">
                    Akıllı Fatura Özeti
                  </h3>
                  <div className="bg-gray-50 border rounded-lg p-3 text-sm whitespace-pre-wrap">
                    {summary}
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 rounded-xl border bg-red-50 border-red-200 text-sm flex gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Devam Et butonu */}
              {summary && (
                <button
                  onClick={() => setStep(2)}
                  className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white"
                  style={{ background: BRAND_NAVY }}
                >
                  Devam Et <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sağ panel – JSON (isteğe bağlı) */}
            <div className="w-full lg:w-80 bg-white rounded-2xl shadow border p-4 h-fit">
              <details open className="text-sm">
                <summary className="cursor-pointer font-semibold">
                  JSON Ayrıntıları
                </summary>
                <div className="mt-2 overflow-auto max-h-96">{renderTable()}</div>
              </details>
            </div>
          </div>
        )}

        {/* ---------- ADIM 2: Bilgileri kontrol et ---------- */}
        {step === 2 && (
          <div className="p-4 flex flex-col gap-4 lg:flex-row">
            <div className="flex-1 bg-white rounded-2xl shadow border p-4">
              <div className="flex items-center gap-2 mb-4">
                <Home />
                <h2 className="font-semibold">2. Müşteri Bilgilerini Kontrol Et</h2>
              </div>

              {/* Basit gösterim – düzenlenebilir alan istenmiyorsa input yerine p kullan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <FieldLabel icon={<Building2 />} text="Rakip Şirket" />
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={invoiceData.companyName ?? ""}
                    onChange={(e) =>
                      setInvoiceData({ ...invoiceData, companyName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <FieldLabel icon={<Hash />} text="Tesisat No" />
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={invoiceData.supplyDetails?.installationNumber ?? ""}
                    onChange={(e) =>
                      setInvoiceData({
                        ...invoiceData,
                        supplyDetails: {
                          ...invoiceData.supplyDetails,
                          installationNumber: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <FieldLabel icon={<Home />} text="Müşteri Adı Soyadı" />
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={invoiceData.customer?.name ?? ""}
                    onChange={(e) =>
                      setInvoiceData({
                        ...invoiceData,
                        customer: { ...invoiceData.customer, name: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <FieldLabel icon={<Gauge />} text="Tüketim (kWh)" />
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={invoiceData.meterReadings?.consumption?.total_kWh ?? ""}
                    onChange={(e) =>
                      setInvoiceData({
                        ...invoiceData,
                        meterReadings: {
                          consumption: {
                            total_kWh: e.target.value,
                          },
                        },
                      })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel icon={<Home />} text="Adres" />
                  <textarea
                    rows={2}
                    className="w-full border rounded px-2 py-1"
                    value={invoiceData.customer?.address ?? ""}
                    onChange={(e) =>
                      setInvoiceData({
                        ...invoiceData,
                        customer: { ...invoiceData.customer, address: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              {/* Devam Et */}
              <button
                onClick={() => setStep(3)}
                className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white"
                style={{ background: BRAND_NAVY }}
              >
                Devam Et <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ---------- ADIM 3: Ziyareti Tamamla ---------- */}
        {step === 3 && (
          <div className="p-4 flex justify-center">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow border p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <CheckCircle className="text-green-600" /> Ziyareti Tamamla
              </h2>

              {/* Özet */}
              <p className="text-sm mb-4">{summary}</p>

              {/* Tüm veri tablosu */}
              <div className="mb-4 border rounded overflow-auto max-h-96">
                {renderTable()}
              </div>

              {/* İzin kutusu (örnek) */}
              <label className="flex items-center gap-2 text-sm mb-6">
                <input type="checkbox" className="accent-green-600" /> Müşteriden
                verileri kaydetme izni alındı
              </label>

              <button
                onClick={() => alert("Ziyaret kaydedildi!")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white"
                style={{ background: BRAND_YELLOW, color: BRAND_NAVY }}
              >
                Ziyareti Kaydet <CheckCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
