import React, { useEffect, useRef, useState } from "react";
import { Camera, Upload, Wand2, Building2, Home, Hash, Gauge, Percent, Loader2, FileText, ShieldAlert, Zap, ImagePlay } from "lucide-react";
import Tesseract, { PSM } from "tesseract.js";

// OpenCV.js'nin window objesine eklendiğini TypeScript'e bildirmek için
declare global {
  interface Window {
    cv: any;
  }
}

// ====== TEMA ======
const BRAND_YELLOW = "#F9C800";
const BRAND_NAVY = "#002D72";

// ====== TÜRLER ======
interface InvoiceData {
  customerName: string;
  address: string;
  installationNumber: string;
  consumption: string; // kWh
  unitPrice: string;   // TL/kWh
  companyName: string; // Rakip şirket
}

// ====== YARDIMCI FONKSİYONLAR ======
const initialData: InvoiceData = {
  customerName: "",
  address: "",
  installationNumber: "",
  consumption: "",
  unitPrice: "",
  companyName: "",
};

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
    .filter((l) => /ELEKTR[İI]K|ENERJ[İI]|A\.Ş|PERAKENDE|DA[ĞG]ITIM/i.test(l))
    .filter(l => l.length > 5);

  if (candidates.length === 0) {
    const upperish = lines.find(
      (l) => l === l.toUpperCase() && l.replace(/[^A-ZÇĞİÖŞÜ]/g, "").length >= 5
    );
    return upperish || lines[0] || "";
  }

  const genericRegex = /^(?:ELEKTR[İI]K\s*)?(?:PERAKENDE|DA[ĞG]ITIM)\s*SATIŞ\s*(?:A\.?Ş\.?|ANON[İI]M\s*Ş[İI]RKET[İI])\s*$/i;
  const specificCandidates = candidates.filter(c => !genericRegex.test(c));

  if (specificCandidates.length > 0) return specificCandidates[0];
  if (candidates.length > 0) return candidates[0];
  return lines[0] || "";
}

function extractBetween(source: string, startLabel: RegExp, nextStop: RegExp): string {
  const start = startLabel.exec(source);
  if (!start) return "";
  const rest = source.slice(start.index + start[0].length);
  const stop = nextStop.exec(rest);
  const seg = stop ? rest.slice(0, stop.index) : rest;
  return seg.split("\n").map((s) => s.trim()).filter(Boolean).join(" ");
}

// En gelişmiş metin ayrıştırma fonksiyonu
export function parseInvoiceText(fullText: string): InvoiceData {
  const text = fullText.replace(/\r/g, "");
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const companyName = pickCompanyName(lines);

  const nameRegexes = [
    /(?:MÜŞTERİ|ABONE)\s*(?:ADI|ADI SOYADI)\s*[:\s]?\s*(.+)/i,
    /AD SOYAD\s*[:\s]?\s*(.+)/i, /UNVAN\s*[:\s]?\s*(.+)/i, /SAYIN\s+([^,\n]+)/i,
  ];
  let customerName = "";
  for (const rx of nameRegexes) {
    const m = text.match(rx);
    if (m && m[1]) {
      customerName = m[1].split(/TCKN|VERG[İI]/i)[0].trim();
      break;
    }
  }
  if (!customerName) {
    const i = lines.findIndex((l) => /(MÜŞTERİ|ABONE|AD SOYAD|UNVAN)/i.test(l));
    if (i > -1 && lines[i + 1] && !/ADRES|TCKN|NO:|TAR[İI]H/i.test(lines[i + 1])) {
      customerName = lines[i + 1].trim();
    }
  }

  let address = extractBetween(text, /ADRES\s*[:\s]?/i, /(TES[İI]SAT|SÖZLEŞME|FATURA|VERG[İI]|TAR[İI]H|SAYAÇ|TÜKET[İI]M|TCKN|EIC)/i);
  if (!address) {
    const idx = lines.findIndex((l) => /ADRES/i.test(l));
    if (idx >= 0) address = [lines[idx + 1], lines[idx + 2]].filter(Boolean).join(" ");
  }

  const instRegexes = [
    /(?:TEK[İI]L KODU?\/)?\s*TES[İI]SAT\s*(?:NO|NUMARASI|KODU)?\s*[:\s]?\s*(\d{7,})/i,
    /(?:SÖZLEŞME|ABONE|MÜŞTER[İI])\s*(?:HESAP\s*)?NO(?:SU)?\s*[:\s]?\s*(\d{7,})/i,
  ];
  let installationNumber = "";
  for (const rx of instRegexes) {
    const m = text.match(rx);
    if (m && m[1]) {
      installationNumber = m[1].trim();
      break;
    }
  }

  let consumption = "";
  let unitPrice = "";
  const consumptionKeywords = [/TOPLAM ENERJ[İI] BEDEL[İI]/i, /AKT[İI]F TÜKET[İI]M TOPLAMI/i, /ENERJ[İI] BEDEL[İI].*DÜŞÜK KADEME/i, /ENERJ[İI] BEDEL[İI]/i, /TOPLAM\s*\(?kWh\)?/i];
  for (const keywordRegex of consumptionKeywords) {
    const targetLine = lines.find(line => keywordRegex.test(line));
    if (targetLine) {
      const numbers = (targetLine.match(/\b(\d{1,}[\d.,\s]+\d)\b/g) || []).map(normalizeDecimal);
      if (numbers.length > 0) {
        consumption = numbers[0];
        if (numbers.length > 1) {
          const potentialUnitPrice = parseFloat(numbers[1]);
          if (potentialUnitPrice > 0.1 && potentialUnitPrice < 10.0) unitPrice = numbers[1];
        }
        break;
      }
    }
  }

  return { customerName, address, installationNumber, consumption, unitPrice, companyName };
}

// ====== ANA KOMPONENT ======
export default function InvoiceOcrPage() {
  // State'ler
  const [isCvReady, setIsCvReady] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processedImagePreview, setProcessedImagePreview] = useState<string | null>(null);
  const [data, setData] = useState<InvoiceData>(initialData);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("OCR çalışıyor…");
  const [rawText, setRawText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Ref'ler
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // OpenCV yükleyicisi
  useEffect(() => {
    const checkCv = () => { window.cv ? setIsCvReady(true) : setTimeout(checkCv, 50); };
    checkCv();
  }, []);

  // Kamera stream temizliği
  useEffect(() => () => { if (stream) stream.getTracks().forEach((t) => t.stop()); }, [stream]);

  // GÖRÜNTÜ ÖN İŞLEME FONKSİYONU (ADIM 1)
  async function preprocessImage(source: File | string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            try {
                if (!window.cv) throw new Error("OpenCV.js hazır değil.");
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error("Canvas context alınamadı");
                ctx.drawImage(img, 0, 0);

                const src = window.cv.imread(canvas);
                const gray = new window.cv.Mat();
                const binary = new window.cv.Mat();

                window.cv.cvtColor(src, gray, window.cv.COLOR_RGBA2GRAY, 0);
                window.cv.adaptiveThreshold(gray, binary, 255, window.cv.ADAPTIVE_THRESH_GAUSSIAN_C, window.cv.THRESH_BINARY, 11, 4);

                window.cv.imshow(canvas, binary);
                
                src.delete(); gray.delete(); binary.delete();
                resolve(canvas.toDataURL('image/jpeg'));
            } catch (error) { reject(error); }
        };
        img.onerror = reject;
        if (source instanceof File) {
            img.src = URL.createObjectURL(source);
        } else {
            img.src = source;
        }
    });
  }

  // OCR VE AYRIŞTIRMA SÜRECİ (ADIM 2 & 3)
  async function runOcrAndParse(file: File) {
    if (!isCvReady) {
      setError("OpenCV kütüphanesi henüz hazır değil, lütfen bekleyin.");
      return;
    }
    setError(null);
    setLoading(true);
    setRawText("");
    setData(initialData);
    setProcessedImagePreview(null);
    setImagePreview(URL.createObjectURL(file));

    try {
      setLoadingMessage("Görüntü işleniyor...");
      const processedImageDataUrl = await preprocessImage(file);
      setProcessedImagePreview(processedImageDataUrl);

      setLoadingMessage("Metin okunuyor (OCR)...");
      const options = { psm: PSM.AUTO };
      const { data: result } = await Tesseract.recognize(processedImageDataUrl, 'tur+eng', options);

      setRawText(result.text || "");
      const parsed = parseInvoiceText(result.text || "");
      setData((d) => ({ ...d, ...parsed }));

    } catch (err: any) {
      console.error("İşlem sırasında hata:", err);
      setError("Görüntü işleme veya OCR sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  // Olay Yöneticileri (Event Handlers)
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    await runOcrAndParse(f);
  }

  async function startCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(s);
      if (videoRef.current) {
        (videoRef.current as any).srcObject = s;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch (e) { setError("Kamera başlatılamadı. Tarayıcı izinlerini kontrol edin."); }
  }

  function stopCamera() {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    setStream(null);
    setCameraOn(false);
  }

  async function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg");

    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
    await runOcrAndParse(file);
    stopCamera();
  }

  const FieldLabel = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
      <span className="inline-flex items-center justify-center w-5 h-5 rounded" style={{ background: BRAND_YELLOW, color: BRAND_NAVY }}>
        {icon}
      </span>
      {children}
    </label>
  );

  return (
    <div className="min-h-screen w-full bg-[#f6f7fb]">
      <header className="sticky top-0 z-20 border-b bg-white border-gray-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <Zap size={24} className="text-yellow-500" />
          <h1 className="text-xl font-semibold tracking-wide text-gray-800">Fatura OCR • Rakipten Geçiş</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
          {/* SOL TARAF: Yakalama & Önizleme */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2"><Wand2 /><h2 className="text-lg font-semibold">1. Fatura Yükle</h2></div>
                <span className="text-xs text-gray-500">OpenCV + Tesseract.js</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 cursor-pointer">
                    <Upload className="w-4 h-4" /><span>Fotoğraf Yükle</span>
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={onFile} />
                </button>
                <button onClick={cameraOn ? stopCamera : startCamera} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-gray-50">
                  <Camera className="w-4 h-4" />{cameraOn ? "Kamerayı Kapat" : "Kamerayı Aç"}
                </button>
                {loading && <span className="inline-flex items-center gap-2 text-sm px-3 py-2"><Loader2 className="w-4 h-4 animate-spin" />{loadingMessage}</span>}
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {cameraOn ? (
                    <div className="bg-gray-50 rounded-xl overflow-hidden border">
                         <div className="p-2 flex items-center justify-between bg-white border-b">
                            <span className="text-sm font-medium flex items-center gap-2"><Camera className="w-4 h-4" /> Kamera</span>
                            <button onClick={capturePhoto} className="text-xs px-3 py-1 rounded-lg font-semibold" style={{ background: BRAND_YELLOW, color: BRAND_NAVY }}>Fotoğraf Çek</button>
                         </div>
                         <div className="aspect-video relative"><video ref={videoRef} playsInline className="w-full h-full object-cover" /></div>
                         <canvas ref={canvasRef} className="hidden" />
                    </div>
                ) : (
                    <div className="bg-gray-50 rounded-xl overflow-hidden border">
                        <div className="p-2 bg-white border-b"><span className="text-sm font-medium flex items-center gap-2"><FileText className="w-4 h-4" /> Orijinal Görüntü</span></div>
                        <div className="aspect-video bg-white flex items-center justify-center">
                            {imagePreview ? <img src={imagePreview} alt="preview" className="max-h-full object-contain" /> : <div className="text-gray-400 text-sm">Görsel seçilmedi</div>}
                        </div>
                    </div>
                )}
                 <div className="bg-gray-50 rounded-xl overflow-hidden border">
                    <div className="p-2 bg-white border-b"><span className="text-sm font-medium flex items-center gap-2"><ImagePlay className="w-4 h-4" /> İşlenmiş Görüntü</span></div>
                    <div className="aspect-video bg-white flex items-center justify-center">
                        {processedImagePreview ? <img src={processedImagePreview} alt="processed preview" className="max-h-full object-contain" /> : <div className="text-gray-400 text-sm">OCR için hazırlanan görüntü</div>}
                    </div>
                </div>
              </div>
              {error && <div className="mt-4 p-3 rounded-xl border bg-red-50 border-red-200 text-sm flex items-start gap-2"><ShieldAlert className="w-4 h-4 mt-0.5 text-red-600" /><div><div className="font-semibold text-red-800">Hata</div><div className="text-red-700">{error}</div></div></div>}
            </div>
          </div>

          {/* SAĞ TARAF: Otomatik Doldurulan Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4"><Wand2 /><h2 className="text-lg font-semibold">2. Otomatik Doldurulan Form</h2></div>
              <div className="space-y-4">
                <div className="space-y-1"><FieldLabel icon={<Building2 className="w-3.5 h-3.5" />}>Rakip Şirket</FieldLabel><input value={data.companyName} onChange={(e) => setData({ ...data, companyName: e.target.value })} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="Örn. ABC Enerji A.Ş." /></div>
                <div className="space-y-1"><FieldLabel icon={<Home className="w-3.5 h-3.5" />}>Müşteri Adı Soyadı</FieldLabel><input value={data.customerName} onChange={(e) => setData({ ...data, customerName: e.target.value })} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="Ad Soyad" /></div>
                <div className="space-y-1"><FieldLabel icon={<Home className="w-3.5 h-3.5" />}>Adres</FieldLabel><textarea value={data.address} onChange={(e) => setData({ ...data, address: e.target.value })} rows={3} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="Sokak, Cadde, No, İlçe, İl" /></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1"><FieldLabel icon={<Hash className="w-3.5 h-3.5" />}>Tesisat No</FieldLabel><input value={data.installationNumber} onChange={(e) => setData({ ...data, installationNumber: e.target.value })} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="########" /></div>
                  <div className="space-y-1"><FieldLabel icon={<Gauge className="w-3.5 h-3.5" />}>Tüketim (kWh)</FieldLabel><input value={data.consumption} onChange={(e) => setData({ ...data, consumption: e.target.value })} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="Örn. 245" /></div>
                  <div className="space-y-1"><FieldLabel icon={<Percent className="w-3.5 h-3.5" />}>Birim Fiyat</FieldLabel><input value={data.unitPrice} onChange={(e) => setData({ ...data, unitPrice: e.target.value })} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="Örn. 3,245" /></div>
                </div>
                {rawText && <div className="pt-2"><details><summary className="cursor-pointer text-sm text-gray-600 select-none">Ham OCR Metnini Göster</summary><pre className="mt-2 max-h-48 overflow-auto text-xs bg-gray-50 p-3 rounded-lg border">{rawText}</pre></details></div>}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}