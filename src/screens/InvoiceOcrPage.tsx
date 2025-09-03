// InvoiceOcrPage.tsx
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
  FileText,
  ShieldAlert,
  Zap,
} from "lucide-react";

// ====== RENK PALETİ ======
const BRAND_YELLOW = "#F9C800";
const BRAND_NAVY = "#002D72";

// ====== TİP TANIMI ======
interface InvoiceData {
  customerName: string;
  address: string;
  installationNumber: string;
  consumption: string;
  unitPrice: string;
  companyName: string;
}

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
  return s.replace(/\s/g, "").replace(",", ".");
}

function pickCompanyName(lines: string[]): string {
  const candidates = lines
    .slice(0, 12)
    .filter((l) => l.length > 5 && !/Fatura|Arşiv|Hazine|Maliye/i.test(l));

  if (candidates.length === 0) return "";

  const specificMatch = candidates.find((c) =>
    c.toLowerCase().includes("elektrik") ||
    c.toLowerCase().includes("enerji")
  );
  if (specificMatch) {
    return specificMatch.split(/Perakende|Dağıtım/i)[0].trim();
  }

  return candidates.sort((a, b) => b.length - a.length)[0];
}

export function parseInvoiceText(fullText: string): InvoiceData {
  if (!fullText) return initialData;
  const text = fullText.replace(/\r/g, "");
  const lines = text.split("\n").map((l) => l.trim());

  let data: Partial<InvoiceData> = {};
  data.companyName = pickCompanyName(lines.filter(Boolean));

  const instMatch =
    text.match(/Tekil Kod\/Tesisat No\s*\n\s*(\d+)/) ||
    text.match(/Sözleşme Hesap No\s*\n\s*(\d+)/);
  if (instMatch?.[1]) {
    data.installationNumber = instMatch[1].trim();
  }

  const consMatch = text.match(
    /Enerji Tük\. Bedeli \(E\.T\.B\.\)\s*:\s*([\d.,]+)/
  );
  if (consMatch?.[1]) {
    data.consumption = normalizeDecimal(consMatch[1]);
  }

  const priceLine = lines.find((line) =>
    /E\.T\.B\.\s+(Gündüz|Puant|Gece)/.test(line)
  );
  if (priceLine) {
    const numbers = priceLine.match(/[\d.,]+/g);
    if (numbers?.[1]) {
      data.unitPrice = normalizeDecimal(numbers[1]);
    }
  }

  const sameLineNameMatch = text.match(/Ad Soyad\s*:\s*(.+)/i);
  const sameLineAddressMatch = text.match(/Adres\s*:\s*(.+)/i);
  if (sameLineNameMatch && sameLineAddressMatch) {
    data.customerName = sameLineNameMatch[1].trim();
    data.address = sameLineAddressMatch[1].replace(/^,/, "").trim();
    return { ...initialData, ...data };
  }

  const startIndex = lines.findIndex((line) => /Tüketici Bilgisi/i.test(line));
  const endIndex = lines.findIndex((line) =>
    /Sözleşme Hesap No/i.test(line)
  );

  if (startIndex > -1 && endIndex > -1) {
    const blockLines = lines
      .slice(startIndex + 1, endIndex)
      .filter(Boolean);
    const labels: string[] = [];
    const values: string[] = [];

    blockLines.forEach((line) => {
      if (line.trim().startsWith(":")) {
        values.push(line.replace(/^[:\s,]+/, "").trim());
      } else if (line.trim().length > 1) {
        labels.push(line.trim());
      }
    });

    const infoMap = new Map<string, string>();
    labels.forEach((label, index) => {
      if (values[index]) {
        infoMap.set(label.toLowerCase(), values[index]);
      }
    });

    data.customerName = infoMap.get("ad soyad") || data.customerName;
    data.address = infoMap.get("adres") || data.address;
    return { ...initialData, ...data };
  }

  return { ...initialData, ...data };
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

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  async function runCloudVisionOcr(file: File) {
    if (!apiKey) {
      setError(
        "Google Cloud API anahtarı bulunamadı. .env dosyasında VITE_GOOGLE_CLOUD_API_KEY tanımlı mı?"
      );
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
      const cleanBase64 = base64Image.replace(
        /^data:image\/\w+;base64,/,
        ""
      );

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: [
              {
                image: { content: cleanBase64 },
                features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message);
      }

      const result = await response.json();
      const detectedText =
        result.responses[0]?.fullTextAnnotation?.text || "Metin bulunamadı.";

      setRawText(detectedText);
      const parsed = parseInvoiceText(detectedText);
      setData(parsed);
    } catch (err: any) {
      setError(err.message || "Beklenmeyen bir hata oluştu.");
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
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(s);
      if (videoRef.current) {
        (videoRef.current as any).srcObject = s;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
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

  const FieldLabel = ({
    icon,
    children,
  }: {
    icon: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
      <span
        className="inline-flex items-center justify-center w-5 h-5 rounded-full"
        style={{ background: BRAND_YELLOW, color: BRAND_NAVY }}
      >
        {icon}
      </span>
      {children}
    </label>
  );

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-gray-800">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <Zap size={24} className="text-yellow-500" />
          <h1 className="text-xl font-semibold">Fatura OCR • Rakipten Geçiş</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* === Sol Panel === */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wand2 />
              <h2 className="text-lg font-semibold">1. Fatura Yükle</h2>
            </div>
            <span className="text-xs font-semibold text-blue-600">
              Google Vision API
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              disabled={loading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm"
            >
              <Upload className="w-4 h-4" />
              Fotoğraf Yükle
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={onFile}
                className="hidden"
              />
            </button>

            <button
              disabled={loading}
              onClick={cameraOn ? stopCamera : startCamera}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm"
            >
              <Camera className="w-4 h-4" />
              {cameraOn ? "Kamerayı Kapat" : "Kamerayı Aç"}
            </button>

            {loading && (
              <span className="inline-flex items-center gap-2 text-sm px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {loadingMessage}
              </span>
            )}
          </div>

          {cameraOn ? (
            <div className="bg-gray-100 border rounded-xl overflow-hidden">
              <div className="flex justify-between items-center p-2 bg-white border-b">
                <span className="text-sm flex items-center gap-2">
                  <Camera className="w-4 h-4" /> Kamera Aktif
                </span>
                <button
                  onClick={capturePhoto}
                  className="text-xs font-semibold px-3 py-1 rounded-lg"
                  style={{ background: BRAND_YELLOW, color: BRAND_NAVY }}
                >
                  Fotoğraf Çek
                </button>
              </div>
              <video ref={videoRef} playsInline className="w-full" />
              <canvas ref={canvasRef} className="hidden" />
            </div>
          ) : (
            <div className="bg-white border rounded-xl p-3">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="preview"
                  className="w-full object-contain rounded-lg"
                />
              ) : (
                <div className="text-sm text-gray-500 text-center">
                  Görsel seçilmedi
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-xl border bg-red-50 border-red-200 text-sm flex gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <div>
                <div className="font-semibold text-red-800">Hata</div>
                <div className="text-red-700">{error}</div>
              </div>
            </div>
          )}
        </div>

        {/* === Sağ Panel === */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wand2 />
            <h2 className="text-lg font-semibold">2. Otomatik Doldurulan Form</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <FieldLabel icon={<Building2 size={14} />}>Rakip Şirket</FieldLabel>
              <input
                value={data.companyName}
                onChange={(e) =>
                  setData({ ...data, companyName: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Örn. ABC Enerji A.Ş."
              />
            </div>

            <div className="space-y-1">
              <FieldLabel icon={<Home size={14} />}>Ad Soyad</FieldLabel>
              <input
                value={data.customerName}
                onChange={(e) =>
                  setData({ ...data, customerName: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Ad Soyad"
              />
            </div>

            <div className="space-y-1">
              <FieldLabel icon={<Home size={14} />}>Adres</FieldLabel>
              <textarea
                rows={3}
                value={data.address}
                onChange={(e) =>
                  setData({ ...data, address: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Sokak, Cadde, No, İlçe, İl"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <FieldLabel icon={<Hash size={14} />}>Tesisat No</FieldLabel>
                <input
                  value={data.installationNumber}
                  onChange={(e) =>
                    setData({ ...data, installationNumber: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="########"
                />
              </div>

              <div className="space-y-1">
                <FieldLabel icon={<Gauge size={14} />}>Tüketim</FieldLabel>
                <input
                  value={data.consumption}
                  onChange={(e) =>
                    setData({ ...data, consumption: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="kWh"
                />
              </div>

              <div className="space-y-1">
                <FieldLabel icon={<Percent size={14} />}>Birim Fiyat</FieldLabel>
                <input
                  value={data.unitPrice}
                  onChange={(e) =>
                    setData({ ...data, unitPrice: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="TL/kWh"
                />
              </div>
            </div>

            {rawText && (
              <details className="text-sm mt-3 cursor-pointer select-none">
                <summary className="text-gray-500">
                  OCR'dan Gelen Ham Metni Göster
                </summary>
                <pre className="mt-2 max-h-48 overflow-auto text-xs bg-gray-50 p-3 rounded-lg border">
                  {rawText}
                </pre>
              </details>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
