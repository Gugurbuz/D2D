// src/screens/InvoiceOcrPage.tsx
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
  invoiceNo?: string;
  invoiceDate?: string;
  period?: string;
  dueDate?: string;
  companyName?: string;
  customer?: { name?: string; address?: string };
  supplyDetails?: { installationNumber?: string; accountNo?: string };
  meterReadings?: { consumption?: { total_kWh?: number | string } };
  charges?: { energyLow?: { unitPrice?: number | string }; total?: string };
  taxes?: string;
  paymentMethod?: string;
}

/* ---------- Başlangıç ---------- */
const initialData: InvoiceData = {
  invoiceNo: "",
  invoiceDate: "",
  period: "",
  dueDate: "",
  companyName: "",
  customer: { name: "", address: "" },
  supplyDetails: { installationNumber: "", accountNo: "" },
  meterReadings: { consumption: { total_kWh: "" } },
  charges: { energyLow: { unitPrice: "" }, total: "" },
  taxes: "",
  paymentMethod: "",
};

/* ---------- Supabase Fonksiyonu ---------- */
async function generateInvoiceSummary(rawText: string) {
  const r = await fetch(
    "https://ehqotgebdywdmwxbwbjl.supabase.co/functions/v1/gpt-summary",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText }),
    }
  );
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "AI hatası");
  return d as { invoiceData: InvoiceData; summary: string };
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

/* ---------- Bileşen ---------- */
export default function InvoiceOcrPage() {
  /* State */
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [invoiceData, setInvoiceData] = useState<InvoiceData>(initialData);
  const [summary, setSummary] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");

  /* Kamera */
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

  /* ---------- OCR + AI ---------- */
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
      const vRes = await fetch(
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
      if (!vRes.ok) throw new Error((await vRes.json()).error.message);
      const detected =
        (await vRes.json()).responses[0]?.fullTextAnnotation?.text || "";
      setRawText(detected);

      /* AI */
      setLoadingMessage("Fatura analiz ediliyor…");
      const ai = await generateInvoiceSummary(detected);
      setInvoiceData(ai.invoiceData);
      setSummary(ai.summary);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "İşlem hatası");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  }

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

  /* ---------- Sabit tablo satırları ---------- */
  const rows: { label: string; value: string }[] = [
    { label: "Fatura No", value: invoiceData.invoiceNo ?? "" },
    { label: "Fatura Tarihi", value: invoiceData.invoiceDate ?? "" },
    { label: "Fatura Dönemi", value: invoiceData.period ?? "" },
    { label: "Son Ödeme Tarihi", value: invoiceData.dueDate ?? "" },
    {
      label: "Abone / Adres",
      value: `${invoiceData.customer?.name ?? ""} — ${invoiceData.customer?.address ?? ""}`,
    },
    {
      label: "Söz. Hesap No",
      value: invoiceData.supplyDetails?.accountNo ?? "",
    },
    {
      label: "Tesisat No",
      value: invoiceData.supplyDetails?.installationNumber ?? "",
    },
    {
      label: "Toplam Tüketim",
      value: (invoiceData.meterReadings?.consumption?.total_kWh ?? "") + " kWh",
    },
    {
      label: "Fatura Tutarı",
      value: invoiceData.charges?.total ?? "",
    },
    {
      label: "Enerji Bedeli",
      value: invoiceData.charges?.energyLow?.unitPrice
        ? `${invoiceData.charges.energyLow.unitPrice} TL/kWh`
        : "",
    },
    { label: "Vergi & Fonlar", value: invoiceData.taxes ?? "" },
    { label: "Ödeme Yöntemi", value: invoiceData.paymentMethod ?? "" },
  ];

  /* ---------- UI ---------- */
  return (
    <div className="w-screen min-h-screen bg-[#f6f7fb]">
      <header className="border-b bg-white border-gray-200 px-4 py-3 flex items-center gap-3">
        <Zap size={24} className="text-yellow-500" />
        <h1 className="text-xl font-semibold">Fatura Tarama</h1>
      </header>

      <main className="mx-auto max-w-6xl p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* -------- Sol Panel -------- */}
        <div className="bg-white rounded-2xl shadow border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wand2 />
            <h2 className="text-lg font-semibold">Fatura Yükle / Çek</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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

          {/* Özet */}
          {summary && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-1">Akıllı Fatura Özeti</h3>
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
        </div>

        {/* -------- Sağ Panel -------- */}
        <div className="bg-white rounded-2xl shadow border p-6 h-fit">
          <h3 className="text-sm font-semibold mb-3">Fatura Verileri</h3>

          <div className="max-h-[70vh] overflow-auto">
            <table className="text-xs border w-full">
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-b">
                    <td className="font-medium px-2 py-1">{r.label}</td>
                    <td className="px-2 py-1">{r.value || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ham OCR metni (isteğe bağlı) */}
          {rawText && (
            <details className="mt-4 text-xs">
              <summary className="cursor-pointer">Ham OCR Metni</summary>
              <pre className="mt-2 bg-gray-50 border p-2 max-h-48 overflow-auto whitespace-pre-wrap">
                {rawText}
              </pre>
            </details>
          )}
        </div>
      </main>
    </div>
  );
}
