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
  CheckCircle2, // Başarı ikonu için eklendi
  Save, // Kaydet butonu ikonu için eklendi
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

// YENİ: Durum Overlay'i için tür tanımı
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

// YENİ: Merkezi durum bildirimleri için bileşen
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
  const [rawText, setRawText] = useState<string>(""); // UI'da gizli
  const [error, setError] = useState<string | null>(null);

  // DEĞİŞTİ: `loading` ve `loadingMessage` yerine tek bir state
  const [statusOverlay, setStatusOverlay] = useState<StatusOverlayState>({
    show: false,
    type: "loading",
    message: "",
  });

  // Kamera state
  const [cameraOn, setCameraOn] = useState(false);
  const [camMode, setCamMode] = useState<CamMode>("live");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);

  // Özet modal state
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY;

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

  useEffect(() => {
    return () => {
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    };
  }, [capturedUrl]);

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

  async function processTextWithAI(text: string) {
    if (!text.trim()) {
      setError("Faturadan metin okunamadı.");
      return;
    }
    // DEĞİŞTİ: Overlay mesajını güncelle
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

      // YENİ: Başarı durumunu göster
      setStatusOverlay({
        show: true,
        type: "success",
        message: "Fatura bilgileri çıkarıldı!",
      });
      setTimeout(() => setStatusOverlay((prev) => ({ ...prev, show: false })), 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Yapay zeka özeti oluşturulamadı.");
      // YENİ: Hata durumunda overlay'i kapat
      setStatusOverlay({ show: false, type: "loading", message: "" });
    }
  }

  async function runCloudVisionOcr(file: File) {
    if (!apiKey) {
      setError("Google Cloud API anahtarı eksik.");
      return;
    }
    // DEĞİŞTİ: Overlay'i göster
    setStatusOverlay({
      show: true,
      type: "loading",
      message: "Fatura okunuyor...",
    });
    setError(null);
    setRawText("");
    setData(initialData);
    setSummary(null);

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
      // YENİ: Hata durumunda overlay'i kapat
      setStatusOverlay({ show: false, type: "loading", message: "" });
    }
  }

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
      {/* YENİ: Merkezi durum overlay'i */}
      <StatusOverlay status={statusOverlay} />

      {/* ------- HEADER ------- */}
      <header className="border-b bg-white border-gray-200">
        <div className="px-4 py-3 flex items-center gap-3">
          <Zap size={24} className="text-yellow-500" />
          <h1 className="text-xl font-semibold tracking-wide text-gray-800">
            Bölge Dışı Ziyaret
          </h1>
        </div>
      </header>

      {/* ---------- MAIN (YENİ: Alt boşluk eklendi) ---------- */}
      <main className="p-2 pb-24"> {/* Sticky footer için boşluk */}
        <div className="space-y-6">
          {/* --------- 1. Fatura Yükle --------- */}
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
              <div className="mt-4">
                {summary ? (
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
                ) : (
                  <div className="h-24 bg-white flex items-center justify-center text-gray-400 text-sm border rounded-xl">
                    Henüz özet yok
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

          {/* --------- 2. Müşteri Bilgileri --------- */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Wand2 />
                <h2 className="text-lg font-semibold">2. Müşteri Bilgileri</h2>
              </div>
              <div className="space-y-4">
                {/* ... (Form alanları değişmedi) ... */}
                 {/* ------- Tarife ------- */}
                 <div className="space-y-1">
                   <FieldLabel icon={<Zap className="w-3.5 h-3.5" />}>
                     Tarife
                   </FieldLabel>
                   <select
                     value={data.tariff ?? ""}
                     onChange={(e) => handleDataChange("tariff", e.target.value)}
                     className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                   >
                     <option value="">-</option>
                     <option value="Mesken">Mesken</option>
                     <option value="Ticarethane">Ticarethane</option>
                     <option value="Sanayi">Sanayi</option>
                   </select>
                 </div>
                 {/* ------- Şirket ------- */}
                 <div className="space-y-1">
                   <FieldLabel icon={<Building2 className="w-3.5 h-3.5" />}>
                     Rakip Şirket
                   </FieldLabel>
                   <input
                     value={data.companyName ?? ""}
                     onChange={(e) =>
                       handleDataChange("companyName", e.target.value)
                     }
                     className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                     placeholder="-"
                   />
                 </div>
                 {/* ------- İsim ------- */}
                 <div className="space-y-1">
                   <FieldLabel icon={<Home className="w-3.5 h-3.5" />}>
                     Müşteri Adı Soyadı
                   </FieldLabel>
                   <input
                     value={data.customer?.name ?? ""}
                     onChange={(e) =>
                       handleDataChange("customer.name", e.target.value)
                     }
                     className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                     placeholder="-"
                   />
                 </div>
                 {/* ------- Adres ------- */}
                 <div className="space-y-1">
                   <FieldLabel icon={<Home className="w-3.5 h-3.5" />}>
                     Adres
                   </FieldLabel>
                   <textarea
                     value={data.customer?.address ?? ""}
                     onChange={(e) =>
                       handleDataChange("customer.address", e.target.value)
                     }
                     rows={3}
                     className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                     placeholder="-"
                   />
                 </div>
                 {/* ------- Grid ------- */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                   <div className="space-y-1">
                     <FieldLabel icon={<Hash className="w-3.5 h-3.5" />}>
                       Tesisat No
                     </FieldLabel>
                     <input
                       value={data.supplyDetails?.installationNumber ?? ""}
                       onChange={(e) =>
                         handleDataChange(
                           "supplyDetails.installationNumber",
                           e.target.value
                         )
                       }
                       className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                       placeholder="-"
                     />
                   </div>
                   <div className="space-y-1">
                     <FieldLabel icon={<Gauge className="w-3.5 h-3.5" />}>
                       Tüketim (kWh)
                     </FieldLabel>
                     <input
                       value={data.meterReadings?.consumption?.total_kWh ?? ""}
                       onChange={(e) =>
                         handleDataChange(
                           "meterReadings.consumption.total_kWh",
                           e.target.value
                         )
                       }
                       className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                       placeholder="-"
                     />
                   </div>
                   <div className="space-y-1">
                     <FieldLabel icon={<Percent className="w-3.5 h-3.5" />}>
                       Birim Fiyat
                     </FieldLabel>
                     <input
                       value={data.charges?.energyLow?.unitPrice ?? ""}
                       onChange={(e) =>
                         handleDataChange(
                           "charges.energyLow.unitPrice",
                           e.target.value
                         )
                       }
                       className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                       placeholder="-"
                     />
                   </div>
                 </div>
                 {/* ------- Yıllık & Ortalama Tüketim ------- */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                   <div className="space-y-1">
                     <FieldLabel icon={<Gauge className="w-3.5 h-3.5" />}>
                       Yıllık Tüketim (kWh)
                     </FieldLabel>
                     <input
                       type="number"
                       value={data.annualConsumption ?? ""}
                       onChange={(e) =>
                         handleDataChange("annualConsumption", e.target.value)
                       }
                       className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                       placeholder="-"
                     />
                   </div>
                   <div className="space-y-1">
                     <FieldLabel icon={<Gauge className="w-3.5 h-3.5" />}>
                       Ortalama Tüketim (kWh)
                     </FieldLabel>
                     <input
                       type="number"
                       value={data.avgConsumption ?? ""}
                       onChange={(e) =>
                         handleDataChange("avgConsumption", e.target.value)
                       }
                       className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                       placeholder="-"
                     />
                   </div>
                   <div className="space-y-1">
                     <FieldLabel icon={<Zap className="w-3.5 h-3.5" />}>
                       SKTT Durumu
                     </FieldLabel>
                     <input
                       value={data.skttStatus ?? ""}
                       readOnly
                       className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
                     />
                   </div>
                 </div>
                 {/* ------- Detayları Göster (tablo) ------- */}
                 {hasAnyAIData && (
                   <div className="pt-2">
                     <details>
                       <summary className="cursor-pointer text-sm text-gray-600 select-none">
                         Detayları Göster
                       </summary>
                       <div className="mt-2 bg-gray-50 p-3 rounded-lg border">
                         <table className="w-full text-sm">
                           <thead>
                             <tr className="bg-gray-100">
                               <th className="text-left px-3 py-2 w-56">Alan</th>
                               <th className="text-left px-3 py-2">Değer</th>
                             </tr>
                           </thead>
                           <tbody>
                             {detailRows.map((r, i) => (
                               <tr key={i} className="border-t even:bg-white">
                                 <td className="px-3 py-2 font-medium text-gray-700">
                                   {r.label}
                                 </td>
                                 <td className="px-3 py-2 text-gray-800 break-words">
                                   {String(r.value)}
                                 </td>
                               </tr>
                             ))}
                           </tbody>
                         </table>
                       </div>
                     </details>
                   </div>
                 )}
              </div>
            </div>
          </div>
        </div>
      </main>

       {/* YENİ: Sticky Footer ve Ana Eylem Butonu */}
       <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-t border-gray-200">
        <div className="p-3 flex justify-end">
            <button
                disabled={!hasAnyAIData || isLoading}
                onClick={() => alert("Kaydedildi!")} // Örnek eylem
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
            >
                <Save className="w-5 h-5" />
                Kaydet ve Devam Et
            </button>
        </div>
      </footer>

      {/* ===================== ÖZET MODAL (YENİLENDİ) ===================== */}
      {isSummaryModalOpen && summary && (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Akıllı Fatura Özeti"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsSummaryModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-lg max-h-[85vh] flex flex-col">
              {/* Modal Header */}
              <div className="p-5 text-center border-b">
                 <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-full" style={{ background: BRAND_YELLOW }}>
                    <Wand2 className="w-6 h-6" style={{ color: BRAND_NAVY }}/>
                 </div>
                 <h3 className="text-lg font-semibold text-gray-800 mt-3">Akıllı Fatura Özeti</h3>
                 <button
                    onClick={() => setIsSummaryModalOpen(false)}
                    className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100"
                    aria-label="Kapat"
                  >
                    <X className="w-5 h-5" />
                  </button>
              </div>
              {/* Modal İçerik */}
              <div className="p-6 overflow-y-auto">
                 <div className="bg-gray-50 p-4 rounded-lg border border-l-4 border-yellow-400">
                    <p className="whitespace-pre-wrap break-words text-gray-800 text-sm">
                        {summary}
                    </p>
                 </div>
              </div>
          </div>
        </div>
      )}

      {/* ===================== KAMERA OVERLAY (Değişmedi) ===================== */}
      {cameraOn && (
         <div className="fixed inset-0 z-[1000] bg-black">
         {/* Üst bar */}
         <div className="absolute top-0 left-0 right-0 h-14 bg-black/40 backdrop-blur flex items-center justify-between px-3">
           <div className="text-white text-sm">Kamera</div>
           <button
             onClick={closeCamera}
             className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 text-white"
             aria-label="Kapat"
           >
             <X className="w-5 h-5" />
           </button>
         </div>

         {/* İçerik: canlı veya önizleme */}
         <div className="absolute inset-0">
           {camMode === "live" ? (
             <video
               ref={videoRef}
               autoPlay
               playsInline
               muted
               className="w-full h-full object-cover"
             />
           ) : (
             capturedUrl && (
               <img
                 src={capturedUrl}
                 alt="Önizleme"
                 className="w-full h-full object-contain bg-black"
               />
             )
           )}

           {/* Kadraj rehberi sadece LIVE iken */}
           {camMode === "live" && (
             <div className="absolute inset-0 pointer-events-none">
               <div className="absolute inset-0 border-2 border-white/20 m-6 rounded-xl" />
               <div className="absolute inset-x-0 top-1/2 h-px bg-white/20" />
             </div>
           )}
         </div>

         {/* Alt bar */}
         <div className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent">
           <div className="h-28 flex items-center justify-center gap-6">
             {camMode === "live" ? (
               <button
                 onClick={capturePhoto}
                 className="relative w-16 h-16 rounded-full bg-white active:scale-95 transition-transform"
                 aria-label="Fotoğraf Çek"
               >
                 <span className="absolute inset-1 rounded-full border-4 border-black/60" />
               </button>
             ) : (
               <div className="flex items-center gap-4">
                 <button
                   onClick={retakePhoto}
                   className="px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white inline-flex items-center gap-2"
                 >
                   <RotateCcw className="w-4 h-4" /> Yeniden Çek
                 </button>
                 <button
                   onClick={confirmPhoto}
                   className="px-5 py-2 rounded-full bg-white text-black font-semibold inline-flex items-center gap-2"
                 >
                   <Check className="w-4 h-4" /> Onayla
                 </button>
               </div>
             )}
           </div>
         </div>

         {/* Gizli canvas */}
         <canvas ref={canvasRef} className="hidden" />
       </div>
      )}
    </div>
  );
}