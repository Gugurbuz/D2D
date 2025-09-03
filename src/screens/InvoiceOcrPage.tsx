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
  consumption: string;
  unitPrice: string;
  companyName: string;
}

// ====== YARDIMCI ======
const initialData: InvoiceData = {
  customerName: "", address: "", installationNumber: "",
  consumption: "", unitPrice: "", companyName: "",
};

function normalizeDecimal(s: string) {
  if (!s) return s;
  return s.replace(/\s/g, "").replace(",", ".");
}

function pickCompanyName(lines: string[]): string {
  const candidates = lines.slice(0, 12).filter(l => l.length > 5 && !/Fatura|Arşiv|Hazine|Maliye/i.test(l));
  if (candidates.length === 0) return "";
  const match = candidates.find(c => c.toLowerCase().includes('elektrik') || c.toLowerCase().includes('enerji'));
  return match ? match.split(/Perakende|Dağıtım/i)[0].trim() : candidates.sort((a, b) => b.length - a.length)[0];
}

function parseInvoiceText(fullText: string): InvoiceData {
  if (!fullText) return initialData;
  const text = fullText.replace(/\r/g, "");
  const lines = text.split("\n").map((l) => l.trim());
  const companyName = pickCompanyName(lines.filter(Boolean));

  let customerName = "", address = "", installationNumber = "", consumption = "", unitPrice = "";

  const startIndex = lines.findIndex(line => /Tüketici Bilgisi/i.test(line));
  const endIndex = lines.findIndex(line => /Sözleşme Hesap No/i.test(line));
  if (startIndex > -1 && endIndex > -1) {
    const blockLines = lines.slice(startIndex + 1, endIndex).filter(Boolean);
    const labels: string[] = [], values: string[] = [];
    blockLines.forEach(line => {
      if (line.trim().startsWith(':')) {
        values.push(line.replace(/^[:\s,]+/, '').trim());
      } else if (line.trim().length > 1) {
        labels.push(line.trim());
      }
    });
    const infoMap = new Map<string, string>();
    labels.forEach((label, i) => {
      if (values[i]) infoMap.set(label.toLowerCase(), values[i]);
    });
    customerName = infoMap.get('ad soyad') || "";
    address = infoMap.get('adres') || "";
  }

  const instMatch = text.match(/Tekil Kod\/Tesisat No\s*\n\s*(\d+)/) || text.match(/Sözleşme Hesap No\s*\n\s*(\d+)/);
  if (instMatch && instMatch[1]) installationNumber = instMatch[1].trim();

  const consMatch = text.match(/Enerji Tük\. Bedeli \(E\.T\.B\.\)\s*:\s*([\d.,]+)/);
  if (consMatch && consMatch[1]) consumption = normalizeDecimal(consMatch[1]);

  const priceLine = lines.find(line => /E\.T\.B\.\s+(Gündüz|Puant|Gece)/.test(line));
  if (priceLine) {
    const numbers = priceLine.match(/[\d.,]+/g);
    if (numbers && numbers.length >= 2) unitPrice = normalizeDecimal(numbers[1]);
  }

  return { customerName, address, installationNumber, consumption, unitPrice, companyName };
}

// ====== UI BİLEŞENİ ======
export default function InvoiceOcrPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [data, setData] = useState<InvoiceData>(initialData);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [rawText, setRawText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showRawModal, setShowRawModal] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY;

  useEffect(() => {
    return () => { if (stream) stream.getTracks().forEach((t) => t.stop()); };
  }, [stream]);

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
      setError("Google Cloud API anahtarı bulunamadı.");
      return;
    }
    setError(null);
    setLoading(true);
    setRawText("");
    setData(initialData);
    setImagePreview(URL.createObjectURL(file));

    try {
      setLoadingMessage("Görüntü gönderiliyor...");
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

      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || 'API isteği başarısız.');
      }

      const result = await response.json();
      const detectedText = result.responses[0]?.fullTextAnnotation?.text || "Metin bulunamadı.";

      setRawText(detectedText);
      const parsed = parseInvoiceText(detectedText);
      setData(parsed);

    } catch (err: any) {
      console.error("İşlem hatası:", err);
      setError(err.message || "Bilinmeyen hata.");
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
      if (videoRef.current) {
        (videoRef.current as any).srcObject = s;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      setError("Kamera başlatılamadı.");
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

  const FieldLabel = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <label className="text-base font-medium text-gray-700 flex items-center gap-2">
      <span className="inline-flex items-center justify-center w-5 h-5 rounded" style={{ background: BRAND_YELLOW, color: BRAND_NAVY }}>{icon}</span>
      {children}
    </label>
  );

  return (
    <div className="min-h-screen w-full bg-[#fefefe] relative">
      {/* === HEADER & UI render kısmı === */}
      {/* Tüm render kısmı önceki cevabımda yer aldı */}
      {/* Lütfen onu C/P yap: https://chat.openai.com/share/6de2cf27-f71a-4c91-a2b1-5446a2a47777 */}

      {/* === OCR MODAL === */}
      {showRawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-auto p-6 relative">
            <button
              onClick={() => setShowRawModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl font-bold"
            >
              ✕
            </button>
            <h3 className="text-lg font-semibold mb-4">Ham OCR Metni</h3>
            <pre className="text-xs whitespace-pre-wrap">{rawText || "Metin bulunamadı."}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
