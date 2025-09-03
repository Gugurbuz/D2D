import React, { useEffect, useRef, useState } from "react";
import { Camera, Upload, Wand2, Building2, Home, Hash, Gauge, Percent, Loader2, FileText, ShieldAlert, Zap } from "lucide-react";

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

// ====== YARDIMCI FONKSİYONLAR & SABİTLER ======
const initialData: InvoiceData = {
  customerName: "", address: "", installationNumber: "",
  consumption: "", unitPrice: "", companyName: "",
};

const FieldLabel = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
      <span className="inline-flex items-center justify-center w-5 h-5 rounded" style={{ background: BRAND_YELLOW, color: BRAND_NAVY }}>{icon}</span>
      {children}
    </label>
);

function normalizeDecimal(s: string): string {
  if (!s) return "";
  return s.replace(/\s/g, "").replace(",", ".");
}

function pickCompanyName(lines: string[], providerHint: 'ck' | 'gediz' | 'aydem' | 'none' = 'none'): string {
    const candidates = lines.slice(0, 15).filter(l => l.length > 5 && !/Fatura|Arşiv|Hazine|Maliye/i.test(l));

    if (providerHint === 'aydem') {
        const match = candidates.find(c => /Aydem Elektrik/i.test(c));
        if (match) return "Aydem Elektrik";
    }
    if (providerHint === 'ck') {
        const match = candidates.find(c => /CK AKDENİZ/i.test(c));
        if (match) return "CK Akdeniz Elektrik";
    }
    if (providerHint === 'gediz') {
        const match = candidates.find(c => /Gediz Elektrik/i.test(c));
        if (match) return "Gediz Elektrik";
    }
    
    const specificMatch = candidates.find(c => c.toLowerCase().includes('elektrik') || c.toLowerCase().includes('enerji'));
    if (specificMatch) {
        return specificMatch.split(/Perakende|Dağıtım/i)[0].trim();
    }
    return candidates.sort((a, b) => b.length - a.length)[0] || "";
}

// --- UZMAN PARSER'LAR ---

function aydemParser(text: string, lines: string[]): Partial<InvoiceData> | null {
    if (!text.includes("Aydem Elektrik")) return null;
    console.log("Aydem Parser denendi.");
    const data: Partial<InvoiceData> = {};
    data.companyName = pickCompanyName(lines, 'aydem');

    const musteriBilgileriIndex = lines.findIndex(line => /Müşteri Bilgileri/i.test(line));
    if (musteriBilgileriIndex > -1) {
        const nameLineIndex = lines.findIndex((line, index) => index > musteriBilgileriIndex && line.length > 0);
        if (nameLineIndex > -1) {
            data.customerName = lines[nameLineIndex];
            const addressLineIndex = lines.findIndex((line, index) => index > nameLineIndex && line.length > 0);
            if (addressLineIndex > -1) {
                data.address = lines[addressLineIndex];
            }
        }
    }
    
    const instMatch = text.match(/Tesisat No\/Tekil Kod\s*\n\s*(\d+)/);
    data.installationNumber = instMatch ? instMatch[1].trim() : "";

    const consMatch = text.match(/Enerji Bedeli\s+([\d.,]+)/);
    data.consumption = consMatch ? normalizeDecimal(consMatch[1]) : "";

    const priceLine = lines.find(line => /Gündüz|Puant|Gece/.test(line) && line.split(/\s+/).length >= 4);
    if (priceLine) {
        const numbers = priceLine.match(/[\d.,]+/g);
        if (numbers && numbers.length >= 2) data.unitPrice = normalizeDecimal(numbers[1]);
    }

    if (data.customerName && data.installationNumber) return data;
    return null;
}

function ckAkdenizParser(text: string, lines: string[]): Partial<InvoiceData> | null {
    if (!text.includes("CK AKDENİZ")) return null;
    console.log("CK Akdeniz Parser denendi.");
    const data: Partial<InvoiceData> = {};
    data.companyName = pickCompanyName(lines, 'ck');
    const nameMatch = text.match(/Ad Soyad\s*:(.+)/);
    data.customerName = nameMatch ? nameMatch[1].replace(/-/g, '').trim() : "";
    const addressMatch = text.match(/Adres:(.+)/);
    data.address = addressMatch ? addressMatch[1].trim() : "";
    const instMatch = text.match(/Tekil Kod\/Tesisat No\s+(\d+)/);
    data.installationNumber = instMatch ? instMatch[1].trim() : "";
    const consMatch = text.match(/Enerji Bedeli-Düşük Kademe\s+([\d.,]+)/);
    const consMatch2 = text.match(/Enerji Bedeli-Yüksek Kademe\s+([\d.,]+)/);
    if (consMatch && consMatch[1] && consMatch2 && consMatch2[1]) {
        const total = parseFloat(normalizeDecimal(consMatch[1])) + parseFloat(normalizeDecimal(consMatch2[1]));
        data.consumption = total.toFixed(3);
    }
    const priceMatch = text.match(/Enerji Bedeli-Düşük Kademe\s+[\d.,]+\s+([\d.,]+)/);
    data.unitPrice = priceMatch ? normalizeDecimal(priceMatch[1]) : "";
    if (data.customerName && data.installationNumber) return data;
    return null;
}

function gedizParser(text: string, lines: string[]): Partial<InvoiceData> | null {
    if (!text.includes("Gediz Elektrik")) return null;
    console.log("Gediz Parser denendi.");
    const data: Partial<InvoiceData> = {};
    data.companyName = pickCompanyName(lines, 'gediz');
    const instMatch = text.match(/Tekil Kod\/Tesisat No\s*\n\s*(\d+)/);
    data.installationNumber = instMatch ? instMatch[1].trim() : "";
    const consMatch = text.match(/Enerji Tük\. Bedeli \(E\.T\.B\.\)\s*:\s*([\d.,]+)/);
    data.consumption = consMatch ? normalizeDecimal(consMatch[1]) : "";
    const priceLine = lines.find(line => /E\.T\.B\.\s+(Gündüz|Puant|Gece)/.test(line));
    if (priceLine) { const numbers = priceLine.match(/[\d.,]+/g); if (numbers && numbers.length >= 2) data.unitPrice = normalizeDecimal(numbers[1]); }
    const startIndex = lines.findIndex(line => /Tüketici Bilgisi/i.test(line));
    const endIndex = lines.findIndex(line => /Sözleşme Hesap No/i.test(line));
    if (startIndex > -1 && endIndex > -1) {
        const blockLines = lines.slice(startIndex + 1, endIndex).filter(Boolean); const labels: string[] = []; const values: string[] = [];
        blockLines.forEach(line => { if (line.trim().startsWith(':')) { values.push(line.replace(/^[:\s,]+/, '').trim()); } else if (line.trim().length > 1) { labels.push(line.trim()); } });
        const infoMap = new Map<string, string>();
        labels.forEach((label, index) => { if (values[index]) { infoMap.set(label.toLowerCase(), values[index]); } });
        data.customerName = infoMap.get('ad soyad') || ""; data.address = infoMap.get('adres') || "";
    }
    if (data.customerName && data.installationNumber) return data;
    return null;
}

// --- YÖNETİCİ PARSE FONKSİYONU ---
export function parseInvoiceText(fullText: string): InvoiceData {
    if (!fullText) return initialData;
    const text = fullText.replace(/\r/g, "");
    const lines = text.split("\n").map((l) => l.trim());
    
    const parsers = [aydemParser, ckAkdenizParser, gedizParser];

    for (const parser of parsers) {
        const data = parser(text, lines);
        if (data && data.customerName && data.installationNumber) {
            console.log(`Başarılı Parser: ${parser.name}`);
            return { ...initialData, ...data };
        }
    }

    console.warn("Uygun bir uzman parser bulunamadı.");
    return { ...initialData, companyName: pickCompanyName(lines) };
}

// ====== ANA KOMPONENT ======
export default function InvoiceOcrPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [data, setData] = useState<InvoiceData>(initialData);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [rawText, setRawText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY;

  useEffect(() => () => { if (stream) stream.getTracks().forEach((t) => t.stop()); }, [stream]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  async function runCloudVisionOcr(file: File) {
    if (!apiKey) {
      setError("Google Cloud API anahtarı (.env dosyasında VITE_GOOGLE_CLOUD_API_KEY) bulunamadı.");
      return;
    }
    setError(null);
    setLoading(true);
    setRawText("");
    setData(initialData);
    setImagePreview(URL.createObjectURL(file));

    try {
      setLoadingMessage("Görüntü Google'a gönderiliyor...");
      const base64Image = await fileToBase64(file);
      const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

      const requestBody = {
        requests: [
          {
            image: { content: cleanBase64 },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          },
        ],
      };

      const apiEndpoint = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || 'Google Vision API isteği başarısız oldu.');
      }

      const result = await response.json();
      const detectedText = result.responses[0]?.fullTextAnnotation?.text || "Metin bulunamadı.";

      setRawText(detectedText);
      const parsed = parseInvoiceText(detectedText);
      setData(parsed);

    } catch (err: any) {
      console.error("İşlem sırasında hata:", err);
      setError(err.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    await runCloudVisionOcr(f);
  }

  async function startCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(s);
      if (videoRef.current) { (videoRef.current as any).srcObject = s; await videoRef.current.play(); }
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
    await runCloudVisionOcr(file);
    stopCamera();
  }

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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2"><Wand2 /><h2 className="text-lg font-semibold">1. Fatura Yükle</h2></div>
                <span className="text-xs font-semibold text-blue-600">Google Cloud Vision API</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button disabled={loading} onClick={() => fileInputRef.current?.click()} className="disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 cursor-pointer">
                  <Upload className="w-4 h-4" /><span>Fotoğraf Yükle</span>
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={onFile} />
                </button>
                <button disabled={loading} onClick={cameraOn ? stopCamera : startCamera} className="disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-gray-50">
                  <Camera className="w-4 h-4" />{cameraOn ? "Kamerayı Kapat" : "Kamerayı Aç"}
                </button>
                {loading && <span className="inline-flex items-center gap-2 text-sm px-3 py-2"><Loader2 className="w-4 h-4 animate-spin" />{loadingMessage}</span>}
              </div>
              <div className="mt-4">
                {cameraOn ? (
                  <div className="bg-gray-50 rounded-xl overflow-hidden border">
                    <div className="p-2 flex items-center justify-between bg-white border-b"><span className="text-sm font-medium flex items-center gap-2"><Camera className="w-4 h-4" /> Kamera</span><button onClick={capturePhoto} className="text-xs px-3 py-1 rounded-lg font-semibold" style={{ background: BRAND_YELLOW, color: BRAND_NAVY }}>Fotoğraf Çek</button></div>
                    <div className="aspect-video relative"><video ref={videoRef} playsInline className="w-full h-full object-cover" /></div><canvas ref={canvasRef} className="hidden" />
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl overflow-hidden border">
                    <div className="p-2 bg-white border-b"><span className="text-sm font-medium flex items-center gap-2"><FileText className="w-4 h-4" /> Yüklenen Görüntü</span></div>
                    <div className="aspect-video bg-white flex items-center justify-center">{imagePreview ? <img src={imagePreview} alt="preview" className="max-h-full object-contain" /> : <div className="text-gray-400 text-sm">Görsel seçilmedi</div>}</div>
                  </div>
                )}
              </div>
              {error && <div className="mt-4 p-3 rounded-xl border bg-red-50 border-red-200 text-sm flex items-start gap-2"><ShieldAlert className="w-4 h-4 mt-0.5 text-red-600" /><div><div className="font-semibold text-red-800">Hata</div><div className="text-red-700">{error}</div></div></div>}
            </div>
          </div>
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