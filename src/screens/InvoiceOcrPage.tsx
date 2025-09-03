import React, { useEffect, useRef, useState } from "react";
import { Camera, Upload, Wand2, Building2, Home, Hash, Gauge, Percent, Loader2, FileText, ShieldAlert } from "lucide-react";
import Tesseract from "tesseract.js";

// ====== THEME (Enerjisa) ======
const BRAND_YELLOW = "#F9C800";
const BRAND_NAVY = "#002D72";
const BRAND_TURQ = "#0099CB"; // Projede butonlarda kullanılan turkuaz

// ====== TYPES ======
interface InvoiceData {
  customerName: string;
  address: string;
  installationNumber: string;
  consumption: string; // kWh
  unitPrice: string;   // TL/kWh
  companyName: string; // Rakip şirket
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
  const candidates = lines
    .slice(0, 12)
    .filter((l) => /ELEKTRIK|ELEKTRİK|ENERJI|ENERJİ|A\.Ş\.|AS\.|AŞ|Ş\.|SAN\.|TIC\.|TİC\./i.test(l));
  if (candidates.length > 0) return candidates.sort((a, b) => b.length - a.length)[0];
  const upperish = lines.find(
    (l) => l === l.toUpperCase() && l.replace(/[^A-ZÇĞİÖŞÜ]/g, "").length >= 5
  );
  return upperish || lines[0] || "";
}

function extractBetween(source: string, startLabel: RegExp, nextStop: RegExp): string {
  const start = startLabel.exec(source);
  if (!start) return "";
  const rest = source.slice(start.index + start[0].length);
  const stop = nextStop.exec(rest);
  const seg = stop ? rest.slice(0, stop.index) : rest;
  return seg
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
}

export function parseInvoiceText(fullText: string): InvoiceData {
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

  let address = extractBetween(
    text,
    /(ADRES|Adres)\s*:?/i,
    /(TESISAT|TESİSAT|ABONE|MÜŞTERİ|FATURA|VERGİ|TARİH|DÖNEM|DÖNEMİ|SAYAÇ|TOPLAM|TÜKETİM)/i
  );
  if (!address) {
    const idx = lines.findIndex((l) => /ADRES/i.test(l));
    if (idx >= 0) address = [lines[idx + 1], lines[idx + 2]].filter(Boolean).join(" ");
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

  return { customerName, address, installationNumber, consumption, unitPrice, companyName };
}

// ====== MAIN COMPONENT ======
export default function InvoiceOcrPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [data, setData] = useState<InvoiceData>(initialData);
  const [loading, setLoading] = useState(false);
  const [rawText, setRawText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => () => { if (stream) stream.getTracks().forEach((t) => t.stop()); }, [stream]);

  async function startCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      setStream(s);
      if (videoRef.current) {
        (videoRef.current as any).srcObject = s;
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
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded"
          style={{ background: BRAND_YELLOW, color: BRAND_NAVY }}
        >
          {icon}
        </span>
        {children}
      </label>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ background: "#f6f7fb" }}>
      <header className="sticky top-0 z-20 border-b" style={{ background: BRAND_TURQ, borderColor: BRAND_YELLOW }}>
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3 text-white">
          <div className="w-2 h-6 rounded-sm" style={{ background: BRAND_YELLOW }} />
          <h1 className="text-xl font-semibold tracking-wide">Fatura OCR • Rakipten Geçiş</h1>
        </div>
      </header>
      {/* ...kalan içerik aynı */}
    </div>
  );
}
