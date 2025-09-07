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
  X,
  RotateCcw,
  Check,
  CheckCircle2,
  Save,
  FileImage, // Önizleme alanı için ikon
} from "lucide-react";

/* ------------ process polyfill (tarayıcı) ------------- */
if (typeof window !== "undefined" && (window as any).process === undefined) {
  (window as any).process = { env: {} };
}
/* ------------------------------------------------------ */

/* ============= TEMA ============= */
const BRAND_YELLOW = "#F9C800";
const BRAND_NAVY = "#002D72";

/* ============= TÜRLER ============= */
interface InvoiceData {
  companyName?: string;
  customer?: { name?: string; address?: string };
  supplyDetails?: { installationNumber?: string };
  tariff?: string;
  annualConsumption?: string;
  avgConsumption?: string;
  skttStatus?: string;
  meterReadings?: { consumption?: { total_kWh?: number | string } };
  charges?: { energyLow?: { unitPrice?: number | string } };
}

type StatusOverlayState = {
  show: boolean;
  type: "loading" | "success";
  message: string;
};

/* ============= SABİT & YARDIMCI ============= */
const initialData: InvoiceData = {
  companyName: "",
  customer: { name: "", address: "" },
  supplyDetails: { installationNumber: "" },
  tariff: "",
  annualConsumption: "",
  avgConsumption: "",
  skttStatus: "",
  meterReadings: { consumption: { total_kWh: "" } },
  charges: { energyLow: { unitPrice: "" } },
};

async function generateInvoiceSummary(rawText: string) {
  const response = await fetch(
    "https://ehqotgebdywdmwxbwbjl.supabase.co/functions/v1/gpt-summary",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText }),
    }
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "AI hatası");
  return result;
}

function computeSktt(tariff: string, yearly: number): string {
  if (!tariff || isNaN(yearly)) return "";
  if (tariff === "Mesken") return yearly >= 5000 ? "Kapsamda" : "Hariç";
  if (tariff === "Ticarethane" || tariff === "Sanayi")
    return yearly >= 15000 ? "Kapsamda" : "Hariç";
  return "";
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
      className="inline-flex items-center justify-center w-5 h-5 rounded"
      style={{ background: BRAND_YELLOW, color: BRAND_NAVY }}
    >
      {icon}
    </span>
    {children}
  </label>
);

type CamMode = "live" | "preview";

const StatusOverlay = ({ status }: { status: StatusOverlayState }) => {
  if (!status.show) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
    >
      <div className="flex flex-col items-center gap-4 rounded-xl bg-white p-8 shadow-2xl">
        {status.type === "loading" ? (
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        ) : (
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        )}
        <p className="font-medium text-gray-700">{status.message}</p>
      </div>
    </div>
  );
};

export default function InvoiceOcrPage() {
  const [summary, setSummary] = useState<string | null>(null);
  const [data, setData] = useState<InvoiceData>(initialData);
  const [rawText, setRawText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null); // YENİ

  const [statusOverlay, setStatusOverlay] = useState<StatusOverlayState>({
    show: false,
    type: "loading",
    message: "",
  });

  // Kamera state'leri
  const [cameraOn, setCameraOn] = useState(false);
  const [camMode, setCamMode] = useState<CamMode>("live");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY;

  // ... (useEffect hook'ları ve diğer yardımcı fonksiyonlar aynı)
  const summaryClampStyle: React.CSSProperties = {
    display: "-webkit-box",
    WebkitLineClamp: 4,
    WebkitBoxOrient: "vertical" as any,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "normal",
  };

  useEffect(
    () => () => {
      stopStream();
    },
    []
  );

  useEffect(() => {
    const prev = {
      overflow: document.body.style.overflow,
      height: document.body.style.height,
    };
    if (cameraOn || isSummaryModalOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.height = "100vh";
    }
    return () => {
      document.body.style.overflow = prev.overflow;
      document.body.style.height = prev.height;
    };
  }, [cameraOn, isSummaryModalOpen]);

  useEffect(() => {
    if (!videoRef.current || !stream) return;
    const v = videoRef.current;
    v.setAttribute("playsinline", "true");
    v.muted = true;
    (v as any).srcObject = stream;
    const p = v.play();
    if (p && typeof p.then === "function") p.catch(() => {});
  }, [stream]);

  // YENİ: Hem kamera hem de yükleme önizlemesi için bellek temizliği
  useEffect(() => {
    return () => {
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [capturedUrl, imagePreviewUrl]);
  

  const handleDataChange = (path: string, value: any) => {
    setData((prev) => {
      const cloned: any = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let cur = cloned;
      keys.slice(0, -1).forEach((k) => (cur = cur[k] = cur[k] || {}));
      cur[keys.at(-1)!] = value;

      const tariff = path === "tariff" ? value : cloned.tariff;
      const annual =
        path === "annualConsumption"
          ? Number(value)
          : Number(cloned.annualConsumption);
      cloned.skttStatus = computeSktt(tariff, annual);

      return cloned;
    });
  };

  const fileToBase64 = (file: File) =>
    new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  // YENİ: Görseli ve ilgili verileri temizlemek için fonksiyon
  const handleRemoveImage = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(null);
    setData(initialData);
    setSummary(null);
    setError(null);
    setRawText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Input'u sıfırla ki aynı dosya tekrar seçilebilsin
    }
  };
  
  async function processTextWithAI(text: string) {
    if (!text.trim()) {
      setError("Faturadan metin okunamadı.");
      return;
    }
    setStatusOverlay({
      show: true,
      type: "loading",
      message: "Fatura analiz ediliyor...",
    });
    setError(null);
    setSummary(null);

    try {
      const result = await generateInvoiceSummary(text);
      const raw: any = result.invoiceData ?? result.data ?? result ?? {};

      const aiData: InvoiceData = {
        companyName: raw.companyName ?? raw.company_name ?? "",
        customer: {
          name: raw.customer?.name ?? raw.customerName ?? "",
          address: raw.customer?.address ?? raw.address ?? "",
        },
        supplyDetails: {
          installationNumber:
            raw.supplyDetails?.installationNumber ?? raw.installationNumber ?? "",
        },
        tariff: raw.tariff ?? "",
        annualConsumption: raw.annualConsumption ?? "",
        avgConsumption: raw.avgConsumption ?? "",
        skttStatus: "",
        meterReadings: {
          consumption: {
            total_kWh:
              raw.meterReadings?.consumption?.total_kWh ??
              raw.consumption ??
              "",
          },
        },
        charges: {
          energyLow: {
            unitPrice:
              raw.charges?.energyLow?.unitPrice ?? raw.unitPrice ?? "",
          },
        },
      };

      aiData.skttStatus = computeSktt(
        aiData.tariff || "",
        Number(aiData.annualConsumption)
      );

      const toStr = (v: unknown) =>
        v === undefined || v === null ? "" : String(v);
      aiData.meterReadings!.consumption!.total_kWh = toStr(
        aiData.meterReadings?.consumption?.total_kWh
      );
      aiData.charges!.energyLow!.unitPrice = toStr(
        aiData.charges?.energyLow?.unitPrice
      );

      setData(aiData);
      setSummary(result.summary);

      setStatusOverlay({
        show: true,
        type: "success",
        message: "Fatura bilgileri çıkarıldı!",
      });
      setTimeout(() => setStatusOverlay((prev) => ({ ...prev, show: false })), 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Yapay zeka özeti oluşturulamadı.");
      setStatusOverlay({ show: false, type: "loading", message: "" });
    }
  }

  async function runCloudVisionOcr(file: File) {
    // YENİ: Her işlemden önce eski durumu temizle ve önizlemeyi ayarla
    handleRemoveImage();
    setImagePreviewUrl(URL.createObjectURL(file));

    if (!apiKey) {
      setError("Google Cloud API anahtarı eksik.");
      return;
    }
    setStatusOverlay({
      show: true,
      type: "loading",
      message: "Fatura okunuyor...",
    });

    try {
      const base64 = (await fileToBase64(file)).replace(/^data:.*;base64,/, "");
      const body = {
        requests: [
          {
            image: { content: base64 },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          },
        ],
      };
      const res = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        const msg =
          json?.error?.message ||
          json?.error ||
          "Google Vision hatası";
        throw new Error(msg);
      }
      const detected =
        json?.responses?.[0]?.fullTextAnnotation?.text ||
        json?.responses?.[0]?.textAnnotations?.[0]?.description ||
        "";

      if (!detected.trim()) {
        throw new Error("Görüntüden metin çıkarılamadı.");
      }

      setRawText(detected);
      await processTextWithAI(detected);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "OCR/AI hatası");
      setStatusOverlay({ show: false, type: "loading", message: "" });
    }
  }
  
  // ... (Kamera fonksiyonları onFile, stopStream, resetCapture vs. aynı kaldı)
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) await runCloudVisionOcr(f);
  }

  function stopStream() {
    try {
      stream?.getTracks().forEach((t) => t.stop());
    } catch {}
    setStream(null);
  }

  function resetCapture() {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedUrl(null);
    setCapturedFile(null);
  }

  function mapMediaError(e: any): string {
    const name = e?.name || "";
    if (!window.isSecureContext)
      return "Kamera yalnızca HTTPS veya localhost üzerinde çalışır.";
    if (name === "NotAllowedError")
      return "Kamera erişimi reddedildi. Tarayıcı izinlerini kontrol edin.";
    if (name === "NotFoundError") return "Uygun bir kamera bulunamadı.";
    if (name === "NotReadableError")
      return "Kamera başka bir uygulama tarafından kullanılıyor olabilir.";
    return "Kamera başlatılamadı.";
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Tarayıcı getUserMedia desteklemiyor.");
      return;
    }
    if (!window.isSecureContext) {
      setError("Kamera yalnızca HTTPS veya localhost üzerinde çalışır.");
      return;
    }
    try {
      let s: MediaStream;
      try {
        s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
      } catch {
        s = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      setStream(s);
    } catch (e: any) {
      setError(mapMediaError(e));
      setCameraOn(false);
      setStream(null);
    }
  }

  async function openCameraFullscreen() {
    setError(null);
    resetCapture();
    setCamMode("live");
    setCameraOn(true);
    await startCamera();
  }

  function closeCamera() {
    stopStream();
    resetCapture();
    setCamMode("live");
    setCameraOn(false);
  }

  async function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    if (videoRef.current.videoWidth === 0) {
      await new Promise<void>((resolve) => {
        const onLoaded = () => {
          videoRef.current?.removeEventListener("loadeddata", onLoaded);
          resolve();
        };
        videoRef.current?.addEventListener("loadeddata", onLoaded);
      });
    }
    const c = canvasRef.current, v = videoRef.current;
    c.width = v.videoWidth || 1280;
    c.height = v.videoHeight || 720;
    c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
    const blob: Blob = await new Promise((resolve, reject) => {
      c.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Görüntü oluşturulamadı."))),
        "image/jpeg",
        0.92
      );
    });
    const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
    const url = URL.createObjectURL(file);
    stopStream();
    setCapturedFile(file);
    setCapturedUrl(url);
    setCamMode("preview");
  }

  async function retakePhoto() {
    resetCapture();
    setCamMode("live");
    await startCamera();
  }

  function confirmPhoto() {
    if (!capturedFile) return;
    const file = capturedFile;
    closeCamera();
    setTimeout(() => {
      runCloudVisionOcr(file);
    }, 0);
  }

  const detailRows = [
    { label: "Rakip Şirket", value: data.companyName },
    { label: "Müşteri Adı Soyadı", value: data.customer?.name },
    { label: "Adres", value: data.customer?.address },
    { label: "Tesisat No", value: data.supplyDetails?.installationNumber },
    { label: "Tarife", value: data.tariff },
    { label: "Yıllık Tüketim (kWh)", value: data.annualConsumption },
    { label: "Ortalama Tüketim (kWh)", value: data.avgConsumption },
    { label: "SKTT Durumu", value: data.skttStatus },
    { label: "Tüketim (kWh)", value: data.meterReadings?.consumption?.total_kWh },
    { label: "Birim Fiyat", value: data.charges?.energyLow?.unitPrice },
  ].filter((r) => r.value !== undefined && r.value !== null && String(r.value) !== "");
  
  const hasAnyAIData = detailRows.length > 0 || !!summary;
  const isLoading = statusOverlay.show && statusOverlay.type === 'loading';

  return (
    <div className="min-h-screen w-full bg-[#f6f7fb]">
      <StatusOverlay status={statusOverlay} />
      <header className="border-b bg-white border-gray-200">
        <div className="px-4 py-3 flex items-center gap-3">
          <Zap size={24} className="text-yellow-500" />
          <h1 className="text-xl font-semibold tracking-wide text-gray-800">
            Bölge Dışı Ziyaret
          </h1>
        </div>
      </header>
      <main className="p-2 pb-24">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Wand2 />
                <h2 className="text-lg font-semibold">1. Fatura Yükle</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  disabled={isLoading}
                  onClick={() => fileInputRef.current?.click()}
                  className="disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-gray-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>Cihazdan Yükle</span>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={onFile}
                    className="hidden"
                  />
                </button>
                <button
                  disabled={isLoading}
                  onClick={openCameraFullscreen}
                  className="disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-gray-50"
                >
                  <Camera className="w-4 h-4" />
                  Kamerayı Aç
                </button>
              </div>
              
              {/* === YENİ: ÖNİZLEME VE ÖZET ALANI === */}
              <div className="mt-4 space-y-4">
                {imagePreviewUrl ? (
                  <div className="relative group">
                    <img
                      src={imagePreviewUrl}
                      alt="Fatura Önizlemesi"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                      aria-label="Görseli Kaldır"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="h-24 bg-gray-50 flex flex-col items-center justify-center text-gray-400 text-sm border rounded-xl">
                    <FileImage className="w-8 h-8 mb-2" />
                    <span>Önizleme için fatura yükleyin</span>
                  </div>
                )}
                
                {summary && (
                  <button
                    type="button"
                    onClick={() => setIsSummaryModalOpen(true)}
                    className="w-full text-left p-4 border rounded-lg bg-gray-50 text-sm hover:bg-gray-100 active:opacity-90 cursor-pointer"
                    aria-label="Akıllı Fatura Özetini Aç"
                  >
                    <div className="font-semibold text-gray-800 mb-1">
                      Akıllı Fatura Özeti
                    </div>
                    <p style={summaryClampStyle} className="text-gray-700">
                      {summary}
                    </p>
                    <div className="mt-2 text-xs text-gray-500">
                      Tamamını görmek için dokunun
                    </div>
                  </button>
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

          {/* --------- 2. Müşteri Bilgileri --------- */}
          {/* ... (Bu bölüm aynı kaldı) ... */}

        </div>
      </main>
      
      {/* ... (Footer, Modal ve Kamera Overlay'i aynı kaldı) ... */}

    </div>
  );
}