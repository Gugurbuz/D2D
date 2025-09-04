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

export default function InvoiceOcrPage() {
  const [summary, setSummary] = useState<string | null>(null);
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

  // Özet alanını 4 satırla kısıtlamak için stil
  const summaryClampStyle: React.CSSProperties = {
    display: "-webkit-box",
    WebkitLineClamp: 4, // maks 4 satır
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "normal",
  };

  useEffect(
    () => () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    },
    [stream]
  );

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
    setLoadingMessage("Fatura analiz ediliyor…");
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
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Yapay zeka özeti oluşturulamadı.");
    }
  }

  async function runCloudVisionOcr(file: File) {
    if (!apiKey) {
      setError("Google Cloud API anahtarı eksik.");
      return;
    }
    setLoading(true);
    setError(null);
    setRawText("");
    setData(initialData);
    setSummary(null);
    setImagePreview(URL.createObjectURL(file));

    try {
      setLoadingMessage("Fatura okunuyor…");
      const cleanBase64 = (await fileToBase64(file)).replace(
        /^data:image\/\w+;base64,/,
        ""
      );
      const body = {
        requests: [
          {
            image: { content: cleanBase64 },
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
      if (!res.ok) throw new Error((await res.json()).error.message);
      const detected =
        (await res.json()).responses[0]?.fullTextAnnotation?.text || "";
      setRawText(detected);
      await processTextWithAI(detected);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "OCR/AI hatası");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) await runCloudVisionOcr(f);
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
      setError("Kamera başlatılamadı.");
    }
  }
  function stopCamera() {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setCameraOn(false);
  }
  async function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const c = canvasRef.current,
      v = videoRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
    const blob = await (await fetch(c.toDataURL("image/jpeg"))).blob();
    await runCloudVisionOcr(new File([blob], "capture.jpg", { type: "image/jpeg" }));
    stopCamera();
  }

  return (
    <div className="min-h-screen w-full bg-[#f6f7fb]">
      {/* ------- HEADER (sticky değil) ------- */}
      <header className="border-b bg-white border-gray-200">
        <div className="px-4 py-3 flex items-center gap-3">
          <Zap size={24} className="text-yellow-500" />
          <h1 className="text-xl font-semibold tracking-wide text-gray-800">
            Bölge Dışı Ziyaret
          </h1>
        </div>
      </header>

      {/* ---------- MAIN ---------- */}
      <main className="p-2">
        {/* Paneller alt alta */}
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
                  disabled={loading}
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
                  disabled={loading}
                  onClick={cameraOn ? stopCamera : startCamera}
                  className="disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-gray-50"
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

              <div className="mt-4">
                {cameraOn ? (
                  <div className="bg-gray-50 rounded-xl overflow-hidden border">
                    <div className="p-2 flex items-center justify-between bg-white border-b">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Camera className="w-4 h-4" /> Kamera
                      </span>
                      <button
                        onClick={capturePhoto}
                        className="text-xs px-3 py-1 rounded-lg font-semibold"
                        style={{ background: BRAND_YELLOW, color: BRAND_NAVY }}
                      >
                        Fotoğraf Çek
                      </button>
                    </div>
                    <div className="aspect-video relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                ) : summary ? (
                  /* --- Akıllı Fatura Özeti: 3-4 satıra kısaltılmış --- */
                  <div className="p-4 border rounded-lg bg-gray-50 text-sm">
                    <div className="font-semibold text-gray-800 mb-1">
                      Akıllı Fatura Özeti
                    </div>
                    <p style={summaryClampStyle} className="text-gray-700">
                      {summary}
                    </p>
                  </div>
                ) : (
                  // Boşken büyük yer kaplamasın
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

                {/* ------- Ham OCR ------- */}
                {rawText && (
                  <div className="pt-2">
                    <details>
                      <summary className="cursor-pointer text-sm text-gray-600 select-none">
                        Ham Fatura Metnini Göster
                      </summary>
                      <pre className="mt-2 max-h-48 overflow-auto text-xs bg-gray-50 p-3 rounded-lg border">
                        {rawText}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
