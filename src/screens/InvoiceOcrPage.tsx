import React, { useEffect, useRef, useState } from "react";
import { Camera, Upload, Wand2, Building2, Home, Hash, Gauge, Percent, Loader2, FileText, Eye, EyeOff, ShieldAlert } from "lucide-react";
import Tesseract from "tesseract.js";

// ====== THEME (Enerjisa) ======
const BRAND_YELLOW = "#F9C800";
const BRAND_NAVY = "#002D72";

// ====== TYPES ======
interface InvoiceData {
  customerName: string;
  address: string;
  installationNumber: string;
  consumption: string;
  unitPrice: string;
  companyName: string;
}

// ====== HELPERS ======
const initialData: InvoiceData = {
  customerName: "",
  address: "",
  installationNumber: "",
  consumption: "",
  unitPrice: "",
  companyName: "",
};

const num = (s?: string) => (s || "").replace(/[^0-9.,]/g, "").trim();

function normalizeDecimal(s: string) {
  if (!s) return s;
  let t = s.replace(/\s/g, "");
  if (/\,\d{1,3}$/.test(t)) {
    t = t.replace(/\./g, "").replace(",", ".");
  } else {
    t = t.replace(/,/g, "");
  }
  return t;
}

function pickCompanyName(lines: string[]): string {
  const candidates = lines.slice(0, 12).filter((l) => /ELEKTRIK|ELEKTRİK|ENERJI|ENERJİ|A\.Ş\.|AS\.|AŞ|Ş\.|SAN\.|TIC\.|TİC\./i.test(l));
  if (candidates.length > 0) {
    return candidates.sort((a, b) => b.length - a.length)[0];
  }
  const upperish = lines.find((l) => l === l.toUpperCase() && l.replace(/[^A-ZÇĞİÖŞÜ]/g, "").length >= 5);
  return upperish || lines[0] || "";
}

function extractBetween(source: string, startLabel: RegExp, nextStop: RegExp): string {
  const start = startLabel.exec(source);
  if (!start) return "";
  const rest = source.slice(start.index + start[0].length);
  const stop = nextStop.exec(rest);
  const seg = stop ? rest.slice(0, stop.index) : rest;
  return seg.split("\n").map((s) => s.trim()).filter(Boolean).join(" ");
}

function parseInvoiceText(fullText: string): InvoiceData {
  const text = fullText.replace(/\r/g, "");
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const companyName = pickCompanyName(lines);

  const nameRegexes = [
    /MÜŞTERİ\s*ADI.*?:\s*(.*)/i,
    /ABONE\s*ADI.*?:\s*(.*)/i,
    /AD\s*SOYAD.*?:\s*(.*)/i,
    /UNVAN.*?:\s*(.*)/i,
    /SAYIN\s+([^,\n]+)/i,
  ];
  let customerName = "";
  for (const rx of nameRegexes) {
    const m = text.match(rx);
    if (m && m[1]) { customerName = m[1].trim(); break; }
  }
  if (!customerName) {
    const i = lines.findIndex((l) => /MÜŞTERİ|ABONE|AD\s*SOYAD|UNVAN/i.test(l));
    if (i >= 0 && lines[i + 1]) customerName = lines[i + 1];
  }

  let address = extractBetween(text, /(ADRES|Adres)\s*:?/i, /(TESISAT|TESİSAT|ABONE|MÜŞTERİ|FATURA|VERGİ|TARİH|DÖNEM|DÖNEMİ|SAYAÇ|TOPLAM|TÜKETİM)/i);
  if (!address) {
    const idx = lines.findIndex((l) => /ADRES/i.test(l));
    if (idx >= 0) {
      address = [lines[idx + 1], lines[idx + 2]].filter(Boolean).join(" ");
    }
  }

  const instRegexes = [
    /(TESISAT|TESİSAT)\s*(NO|NUMARASI|#)?\s*[:]??\s*([0-9]{6,})/i,
    /(ABONE|MÜŞTERİ)\s*(NO|NUMARASI)\s*[:]??\s*([0-9]{6,})/i,
  ];
  let installationNumber = "";
  for (const rx of instRegexes) {
    const m = text.match(rx);
    if (m && m[3]) { installationNumber = m[3]; break; }
  }

  const cons = text.match(/([0-9][0-9 .,.]*?)\s*(kWh|KWH|kWsaat)/i);
  let consumption = cons ? normalizeDecimal(num(cons[1])) : "";

  const unit = text.match(/([0-9][0-9 .,.]*?)\s*(TL\s*\/\s*kWh|TL\/kWh)/i);
  let unitPrice = unit ? normalizeDecimal(num(unit[1])) : "";

  console.group("📝 OCR DEBUG (Tesseract)");
  console.log("RAW_TEXT:", fullText);
  console.log("PARSED:", { customerName, address, installationNumber, consumption, unitPrice, companyName });
  console.groupEnd();

  return { customerName, address, installationNumber, consumption, unitPrice, companyName };
}

// ====== MAIN COMPONENT ======
export default function InvoiceOcrPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [data, setData] = useState<InvoiceData>(initialData);
  const [loading, setLoading] = useState(false);
  const [rawText, setRawText] = useState<string>("");
  const [showRaw, setShowRaw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  async function startCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s as any;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch (e) {
      setError("Kamera başlatılamadı. Tarayıcı izinlerini kontrol edin.");
    }
  }

  function stopCamera() {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    setStream(null);
    setCameraOn(false);
  }

  async function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setImagePreview(dataUrl);
    await ocrFromDataUrl(dataUrl);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const dataUrl = URL.createObjectURL(f);
    setImagePreview(dataUrl);
    await ocrFromFile(f);
  }

  async function ocrFromDataUrl(dataUrl: string) {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    await ocrFromFile(new File([blob], "capture.jpg", { type: "image/jpeg" }));
  }

  async function ocrFromFile(file: File) {
    setError(null);
    setLoading(true);
    try {
      const { data: result } = await Tesseract.recognize(file, "tur+eng");
      setRawText(result.text || "");
      const parsed = parseInvoiceText(result.text || "");
      setData((d) => ({ ...d, ...parsed }));
    } catch (err: any) {
      console.error(err);
      setError("OCR sırasında bir hata oluştu (Tesseract).");
    } finally {
      setLoading(false);
    }
  }

  function FieldLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
    return (
      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded" style={{ background: BRAND_YELLOW, color: BRAND_NAVY }}>{icon}</span>
        {children}
      </label>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ background: "#f6f7fb" }}>
      <header className="sticky top-0 z-20 border-b" style={{ background: BRAND_NAVY, borderColor: BRAND_YELLOW }}>
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3 text-white">
          <div className="w-2 h-6 rounded-sm" style={{ background: BRAND_YELLOW }} />
          <h1 className="text-xl font-semibold tracking-wide">Fatura OCR • Rakipten Geçiş</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: BRAND_YELLOW }}>
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wand2 />
                  <h2 className="text-lg font-semibold">Görsel Seç / Çek ve Tara</h2>
                </div>
                <span className="text-xs text-gray-500">Tesseract.js (tr+eng)</span>
              </div>

              <div className="flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer bg-white hover:bg-gray-50">
                  <Upload className="w-4 h-4" />
                  <span>Fotoğraf Yükle</span>
                  <input type="file" accept="image/*" className="hidden" onChange={onFile} />
                </label>

                {!cameraOn ? (
                  <button onClick={startCamera} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-gray-50">
                    <Camera className="w-4 h-4" />
                    Kamerayı Aç
                  </button>
                ) : (
                  <button onClick={stopCamera} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-gray-50">
                    <Camera className="w-4 h-4" />
                    Kamerayı Kapat
                  </button>
                )}

                {loading && (
                  <span className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-xl border bg-white">
                    <Loader2 className="w-4 h-4 animate-spin" /> OCR çalışıyor…
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl overflow-hidden border" style={{ borderColor: BRAND_YELLOW }}>
                  <div className="p-2 flex items-center justify-between bg-white border-b" style={{ borderColor: BRAND_YELLOW }}>
                    <span className="text-sm font-medium flex items-center gap-2"><Camera className="w-4 h-4" /> Kamera Önizleme</span>
                    {cameraOn && (
                      <button onClick={capturePhoto} className="text-xs px-3 py-1 rounded-lg" style={{ background: BRAND_YELLOW, color: BRAND_NAVY }}>Fotoğraf Çek</button>
                    )}
                  </div>
                  <div className="aspect-video relative">
                    {cameraOn ? (
                      <video ref={videoRef} playsInline className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Kamera kapalı</div>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl overflow-hidden border" style={{ borderColor: BRAND_YELLOW }}>
                  <div className="p-2 flex items-center justify-between bg-white border-b" style={{ borderColor: BRAND_YELLOW }}>
                    <span className="text-sm font-medium flex items-center gap-2"><FileText className="w-4 h-4" /> Seçilen Görsel</span>
                    {imagePreview && (
                      <button onClick={() => ocrFromDataUrl(imagePreview)} className="text-xs px-3 py-1 rounded-lg" style={{ background: BRAND_YELLOW, color: BRAND_NAVY }}>Tekrar Tara</button>
                    )}
                  </div>
                  <div className="aspect-video bg-white flex items-center justify-center">
                    {imagePreview ? (
                      <img src={imagePreview} alt="preview" className="max-h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Görsel seçilmedi</div>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-xl border text-sm flex items-start gap-2" style={{ borderColor: "#FECACA", background: "#FEF2F2" }}>
                  <ShieldAlert className="w-4 h-4 mt-0.5" />
                  <div>
                    <div className="font-semibold">Hata</div>
                    <div className="text-gray-700">{error}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border" style={{ borderColor: BRAND_YELLOW }}>
            <div className="p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Wand2 />
                <h2 className="text-lg font-semibold">Otomatik Doldurulan Form</h2>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <FieldLabel icon={<Building2 className="w-3.5 h-3.5" />}>Rakip Şirket</FieldLabel>
                  <input
                    value={data.companyName}
                    onChange={(e) => setData({ ...data, companyName: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none"
                    placeholder="Örn. ABC Enerji A.Ş."
                  />
                </div>

                <div className="space-y-1">
                  <FieldLabel icon={<Home className="w-3.5 h-3.5" />}>Müşteri Adı Soyadı</FieldLabel>
                  <input
                    value={data.customerName
