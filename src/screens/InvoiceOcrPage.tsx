import React, { useEffect, useRef, useState } from "react";
import { Camera, Upload, Wand2, Building2, Home, Hash, Gauge, Percent, Loader2, FileText, ShieldAlert, Zap, ClipboardCopy, Download } from "lucide-react";

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

// (Light) Vision response tipleri (ihtiyaç kadar)
type VisionVertex = { x?: number; y?: number };
type VisionBoundingPoly = { vertices?: VisionVertex[] };
type VisionSymbol = { text?: string; property?: { detectedBreak?: { type?: string } } };
type VisionWord = { symbols?: VisionSymbol[]; boundingBox?: VisionBoundingPoly; confidence?: number };
type VisionParagraph = { words?: VisionWord[]; boundingBox?: VisionBoundingPoly; confidence?: number };
type VisionBlock = { blockType?: string; paragraphs?: VisionParagraph[]; boundingBox?: VisionBoundingPoly; confidence?: number };
type VisionPage = { width?: number; height?: number; blocks?: VisionBlock[] };
type VisionFullText = { text?: string; pages?: VisionPage[] };
type VisionAnnotateResponse = { responses: Array<{ fullTextAnnotation?: VisionFullText }> };

// ====== YARDIMCI ======
const initialData: InvoiceData = {
  customerName: "", address: "", installationNumber: "",
  consumption: "", unitPrice: "", companyName: "",
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
    .filter(l => l.length > 5 && !/Fatura|Arşiv/i.test(l));

  if (candidates.length === 0) return lines[0] || "";

  const genericRegex = /^(?:PERAKENDE|DA[ĞG]ITIM)\s*SATIŞ\s*A\.?Ş\.?$/i;
  const specificCandidates = candidates.filter(c => !genericRegex.test(c));

  if (specificCandidates.length > 0) {
    return specificCandidates.sort((a, b) => b.length - a.length)[0];
  }
  return candidates.sort((a, b) => b.length - a.length)[0];
}

export function parseInvoiceText(fullText: string): InvoiceData {
  if (!fullText) return initialData;
  const text = fullText.replace(/\r/g, "");
  const lines = text.split("\n").map((l) => l.trim());

  const companyName = pickCompanyName(lines.filter(Boolean));

  const getValue = (regex: RegExp): string => {
    const match = text.match(regex);
    return match && match[1] ? match[1].replace(/^[:\s,]+/, '').trim() : "";
  };

  const customerName = getValue(/Ad Soyad\s*:\s*(.+)/i);
  const address = getValue(/Adres\s*:\s*(.+)/i);

  let installationNumber = "";
  const instMatch = text.match(/Tekil Kod\/Tesisat No\s*\n\s*(\d+)/i) || text.match(/Sözleşme Hesap No\s*\n\s*(\d+)/i);
  if (instMatch && instMatch[1]) {
    installationNumber = instMatch[1].trim();
  } else {
    installationNumber = getValue(/Tesisat No\s*:\s*(\d+)/i);
  }

  let consumption = "";
  const consMatch = text.match(/Enerji Tük\. Bedeli \(E\.T\.B\.\)\s*:\s*([\d.,]+)/i);
  if (consMatch && consMatch[1]) {
    consumption = normalizeDecimal(consMatch[1]);
  }

  let unitPrice = "";
  const priceLine = lines.find(line => /E\.T\.B\.\s+(Gündüz|Puant|Gece)/.test(line));
  if (priceLine) {
    const numbers = priceLine.match(/[\d.,]+/g);
    if (numbers && numbers.length >= 2) {
      unitPrice = normalizeDecimal(numbers[1]);
    }
  }

  return { customerName, address, installationNumber, consumption, unitPrice, companyName };
}

// ====== ARAÇLAR: kopyalama/indirme ======
async function copyToClipboard(s: string) {
  try { await navigator.clipboard.writeText(s); } catch {}
}
function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ====== ANA KOMPONENT ======
export default function InvoiceOcrPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [data, setData] = useState<InvoiceData>(initialData);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // HAM OCR VERİSİ
  const [rawText, setRawText] = useState<string>("");
  const [rawJson, setRawJson] = useState<string>("");     // Vision JSON (stringified)
  const [rawLines, setRawLines] = useState<string[]>([]); // Satırlara bölünmüş ham metin

  const [cameraOn, setCameraOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY;

  useEffect(() => () => { if (stream) stream.getTracks().forEach((t) => t.stop()); }, [stream]);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });

  // ---- OCR: Google Vision öncelikli, yoksa (opsiyonel) Tesseract fallback ----
  async function runCloudVisionOcr(file: File) {
    setError(null);
    setLoading(true);
    setLoadingMessage("Görüntü işleniyor...");
    setRawText(""); setRawJson(""); setRawLines([]);
    setData(initialData);
    setImagePreview(URL.createObjectURL(file));

    try {
      if (!apiKey) {
        // Fallback: Tesseract (opsiyonel)
        setLoadingMessage("API anahtarı yok. Tesseract ile yerel OCR deneniyor...");
        try {
          // Bu import için: npm i tesseract.js
          // Paket yoksa yakalanır ve anlamlı mesaj gösterilir.
          const { createWorker } = await import("tesseract.js");
          const worker = await createWorker("tur", 1, { logger: () => {} });
          const { data: tdata } = await worker.recognize(file);
          await worker.terminate();

          const detected = tdata?.text || "Metin bulunamadı.";
          const lines = detected.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          const parsed = parseInvoiceText(detected);

          // HAM veri state + log
          setRawText(detected);
          setRawLines(lines);
          setRawJson(JSON.stringify({ engine: "tesseract", text: detected }, null, 2));

          console.groupCollapsed("%cOCR (Tesseract) RAW", "color:#888");
          console.log("OCR_RAW_TEXT:", detected);
          console.groupEnd();

          setData(parsed);
          return;
        } catch (te: any) {
          setError("Google API anahtarı yok ve Tesseract.js bulunamadı. 'npm i tesseract.js' kurup tekrar deneyin.");
          return;
        }
      }

      setLoadingMessage("Görüntü Google'a gönderiliyor...");
      const base64Image = await fileToBase64(file);
      const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error?.message || "Google Vision API isteği başarısız oldu.");
      }

      const result: VisionAnnotateResponse = await response.json();
      const full = result?.responses?.[0]?.fullTextAnnotation;
      const detectedText = full?.text || "Metin bulunamadı.";
      const lines = detectedText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

      // ---- HAM DATA: state + konsol ----
      setRawText(detectedText);
      setRawLines(lines);
      setRawJson(JSON.stringify(result, null, 2)); // tüm yanıtı saklıyoruz

      console.groupCollapsed("%cOCR (Vision) RAW", "color:#888");
      console.log("OCR_RESPONSE:", result);
      console.log("OCR_RAW_TEXT:", detectedText);
      console.groupEnd();

      // ---- Alanları doldur ----
      const parsed = parseInvoiceText(detectedText);
      setData(parsed);

    } catch (err: any) {
      console.error("İşlem sırasında hata:", err);
      setError(err.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
      setLoadingMessage("");
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

  const FieldLabel = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
      <span className="inline-flex items-center justify-center w-5 h-5 rounded" style={{ background: BRAND_YELLOW, color: BRAND_NAVY }}>{icon}</span>
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
          {/* Sol panel: Yükleme/Kamera */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2"><Wand2 /><h2 className="text-lg font-semibold">1. Fatura Yükle</h2></div>
                <span className="text-xs font-semibold text-blue-600">{import.meta.env.VITE_GOOGLE_CLOUD_API_KEY ? "Google Cloud Vision API" : "Tesseract (Yerel OCR)"}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  disabled={loading}
                  onClick={() => fileInputRef.current?.click()}
                  className="disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 cursor-pointer"
                >
                  <Upload className="w-4 h-4" /><span>Fotoğraf Yükle</span>
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={onFile} />
                </button>

                <button
                  disabled={loading}
                  onClick={cameraOn ? stopCamera : startCamera}
                  className="disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-gray-50"
                >
                  <Camera className="w-4 h-4" />{cameraOn ? "Kamerayı Kapat" : "Kamerayı Aç"}
                </button>

                {loading && (
                  <span className="inline-flex items-center gap-2 text-sm px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />{loadingMessage}
                  </span>
                )}
              </div>

              <div className="mt-4">
                {cameraOn ? (
                  <div className="bg-gray-50 rounded-xl overflow-hidden border">
                    <div className="p-2 flex items-center justify-between bg-white border-b">
                      <span className="text-sm font-medium flex items-center gap-2"><Camera className="w-4 h-4" /> Kamera</span>
                      <button onClick={capturePhoto} className="text-xs px-3 py-1 rounded-lg font-semibold" style={{ background: BRAND_YELLOW, color: BRAND_NAVY }}>
                        Fotoğraf Çek
                      </button>
                    </div>
                    <div className="aspect-video relative"><video ref={videoRef} playsInline className="w-full h-full object-cover" /></div>
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl overflow-hidden border">
                    <div className="p-2 bg-white border-b">
                      <span className="text-sm font-medium flex items-center gap-2"><FileText className="w-4 h-4" /> Yüklenen Görüntü</span>
                    </div>
                    <div className="aspect-video bg-white flex items-center justify-center">
                      {imagePreview ? (
                        <img src={imagePreview} alt="preview" className="max-h-full object-contain" />
                      ) : (
                        <div className="text-gray-400 text-sm">Görsel seçilmedi</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-xl border bg-red-50 border-red-200 text-sm flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 mt-0.5 text-red-600" />
                  <div>
                    <div className="font-semibold text-red-800">Hata</div>
                    <div className="text-red-700">{error}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sağ panel: Form + HAM OCR veri */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4"><Wand2 /><h2 className="text-lg font-semibold">2. Otomatik Doldurulan Form</h2></div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <FieldLabel icon={<Building2 className="w-3.5 h-3.5" />}>Rakip Şirket</FieldLabel>
                  <input value={data.companyName} onChange={(e) => setData({ ...data, companyName: e.target.value })} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="Örn. ABC Enerji A.Ş." />
                </div>

                <div className="space-y-1">
                  <FieldLabel icon={<Home className="w-3.5 h-3.5" />}>Müşteri Adı Soyadı</FieldLabel>
                  <input value={data.customerName} onChange={(e) => setData({ ...data, customerName: e.target.value })} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="Ad Soyad" />
                </div>

                <div className="space-y-1">
                  <FieldLabel icon={<Home className="w-3.5 h-3.5" />}>Adres</FieldLabel>
                  <textarea value={data.address} onChange={(e) => setData({ ...data, address: e.target.value })} rows={3} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="Sokak, Cadde, No, İlçe, İl" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <FieldLabel icon={<Hash className="w-3.5 h-3.5" />}>Tesisat No</FieldLabel>
                    <input value={data.installationNumber} onChange={(e) => setData({ ...data, installationNumber: e.target.value })} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="########" />
                  </div>
                  <div className="space-y-1">
                    <FieldLabel icon={<Gauge className="w-3.5 h-3.5" />}>Tüketim (kWh)</FieldLabel>
                    <input value={data.consumption} onChange={(e) => setData({ ...data, consumption: e.target.value })} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="Örn. 245" />
                  </div>
                  <div className="space-y-1">
                    <FieldLabel icon={<Percent className="w-3.5 h-3.5" />}>Birim Fiyat</FieldLabel>
                    <input value={data.unitPrice} onChange={(e) => setData({ ...data, unitPrice: e.target.value })} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="Örn. 3,245" />
                  </div>
                </div>

                {/* === HAM OCR VERİ ÇIKIŞLARI === */}
                {rawText && (
                  <div className="pt-2">
                    <details>
                      <summary className="cursor-pointer text-sm text-gray-700 select-none">Ham OCR Metnini Göster</summary>
                      <div className="mt-2 flex items-center gap-2">
                        <button onClick={() => copyToClipboard(rawText)} className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded border">
                          <ClipboardCopy className="w-3.5 h-3.5" /> Kopyala
                        </button>
                        <button onClick={() => downloadText("ocr_raw.txt", rawText)} className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded border">
                          <Download className="w-3.5 h-3.5" /> İndir (.txt)
                        </button>
                      </div>
                      <pre className="mt-2 max-h-48 overflow-auto text-xs bg-gray-50 p-3 rounded-lg border whitespace-pre-wrap">{rawText}</pre>

                      {/* Satır listesi (kontrol ve ayıklama için faydalı) */}
                      {rawLines.length > 0 && (
                        <>
                          <div className="mt-3 text-xs font-semibold text-gray-600">Satır Listesi ({rawLines.length})</div>
                          <pre className="mt-1 max-h-40 overflow-auto text-xs bg-gray-50 p-3 rounded-lg border">
                            {rawLines.map((l, i) => `${String(i + 1).padStart(3, "0")}: ${l}`).join("\n")}
                          </pre>
                        </>
                      )}
                    </details>
                  </div>
                )}

                {rawJson && (
                  <div className="pt-2">
                    <details>
                      <summary className="cursor-pointer text-sm text-gray-700 select-none">Ham OCR JSON (Vision) Göster</summary>
                      <div className="mt-2 flex items-center gap-2">
                        <button onClick={() => copyToClipboard(rawJson)} className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded border">
                          <ClipboardCopy className="w-3.5 h-3.5" /> Kopyala
                        </button>
                        <button onClick={() => downloadText("ocr_raw.json", rawJson)} className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded border">
                          <Download className="w-3.5 h-3.5" /> İndir (.json)
                        </button>
                      </div>
                      <pre className="mt-2 max-h-56 overflow-auto text-xs bg-gray-50 p-3 rounded-lg border">{rawJson}</pre>
                    </details>
                  </div>
                )}
                {/* === /HAM OCR VERİ ÇIKIŞLARI === */}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
