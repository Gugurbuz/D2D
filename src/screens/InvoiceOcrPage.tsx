import React, { useEffect, useRef, useState } from "react";
import { Camera, Upload, Wand2, Building2, Home, Hash, Gauge, Percent, Loader2, FileText, ShieldAlert, Zap, ImagePlay } from "lucide-react";
import Tesseract, { PSM, Worker } from "tesseract.js";

// OpenCV.js'nin window objesine eklendiğini TypeScript'e bildirmek için
declare global {
  interface Window {
    cv: any;
  }
}

// ... (Diğer interface, sabitler ve yardımcı fonksiyonlar aynı kalabilir)
// ... (InvoiceData, initialData, normalizeDecimal, pickCompanyName, extractBetween, parseInvoiceText)
// Önceki yanıttaki bu fonksiyonları buraya kopyalayabilirsin, değişmediler.
// (KODUN KISALTILMASI İÇİN BURADA TEKRAR ETMİYORUM)

// ====== ANA KOMPONENT ======
export default function InvoiceOcrPage() {
  // State'ler
  const [isCvReady, setIsCvReady] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processedImagePreview, setProcessedImagePreview] = useState<string | null>(null);
  const [data, setData] = useState<InvoiceData>(initialData);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Hazırlanıyor...");
  const [rawText, setRawText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Ref'ler
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const tesseractWorker = useRef<Worker | null>(null);

  // === TESSERACT WORKER BAŞLATMA ===
  useEffect(() => {
    async function initWorker() {
      setLoading(true);
      setLoadingMessage("OCR Motoru Yükleniyor...");
      const worker = await Tesseract.createWorker('tur+eng');
      tesseractWorker.current = worker;
      setLoading(false);
      setLoadingMessage("");
    }
    initWorker();

    return () => {
      tesseractWorker.current?.terminate();
    }
  }, []);
  
  // OpenCV yükleyicisi
  useEffect(() => {
    const checkCv = () => { window.cv ? setIsCvReady(true) : setTimeout(checkCv, 50); };
    checkCv();
  }, []);

  // Kamera stream temizliği
  useEffect(() => () => { if (stream) stream.getTracks().forEach((t) => t.stop()); }, [stream]);

  // GÖRÜNTÜ ÖN İŞLEME FONKSİYONU (ADIM 1)
  async function preprocessImage(source: File | string): Promise<string> {
    // ... (Bu fonksiyon bir önceki yanıttaki ile aynı, değişmedi)
    // (KODUN KISALTILMASI İÇİN BURADA TEKRAR ETMİYORUM)
  }

  // OCR VE AYRIŞTIRMA SÜRECİ (Worker ile güncellendi)
  async function runOcrAndParse(file: File) {
    if (!isCvReady || !tesseractWorker.current) {
      setError("Bileşenler henüz hazır değil, lütfen bekleyin.");
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
      await tesseractWorker.current.setParameters({
          tessedit_pageseg_mode: PSM.AUTO,
      });
      
      const { data: result } = await tesseractWorker.current.recognize(processedImageDataUrl);

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

  // ... (Geri kalan tüm kodlar ve JSX yapısı aynı kalabilir)
  // ... (onFile, startCamera, stopCamera, capturePhoto, FieldLabel ve return(...))
  // (KODUN KISALTILMASI İÇİN BURADA TEKRAR ETMİYORUM)
}