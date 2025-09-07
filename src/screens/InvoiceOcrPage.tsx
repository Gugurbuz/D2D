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
  FileImage,
} from "lucide-react";

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
  charges?: {
    energyLow?: { unitPrice?: number | string };
    tiered?: {
      low?: { kWh?: number | string; unitPrice?: number | string };
      high?: { kWh?: number | string; unitPrice?: number | string };
    };
  };
}

type StatusOverlayState = {
  show: boolean;
  type: "loading" | "success";
  message: string;
};

const initialData: InvoiceData = {
  companyName: "",
  customer: { name: "", address: "" },
  supplyDetails: { installationNumber: "" },
  tariff: "",
  annualConsumption: "",
  avgConsumption: "",
  skttStatus: "",
  meterReadings: { consumption: { total_kWh: "" } },
  charges: { energyLow: { unitPrice: "" }, tiered: {} },
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
  return {
    invoiceData: result.invoiceData,
    summary: result.summary,
    allDetails: result.allDetails,
  };
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
      style={{ background: "#F9C800", color: "#002D72" }}
    >
      {icon}
    </span>
    {children}
  </label>
);

const StatusOverlay = ({ status }: { status: StatusOverlayState }) => {
  if (!status.show) return null;
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
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
  const [data, setData] = useState<InvoiceData>(initialData);
  const [summary, setSummary] = useState<string | null>(null);
  const [allDetails, setAllDetails] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [statusOverlay, setStatusOverlay] = useState<StatusOverlayState>({
    show: false,
    type: "loading",
    message: "",
  });
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY;

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const handleDataChange = (path: string, value: any) => {
    setData((prev) => {
      const cloned: any = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let cur = cloned;
      keys.slice(0, -1).forEach((k) => (cur = cur[k] = cur[k] || {}));
      cur[keys.at(-1)!] = value;
      const tariff = cloned.tariff;
      const annual = Number(cloned.annualConsumption);
      cloned.skttStatus = computeSktt(tariff || "", annual);
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

  const handleRemoveImage = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    setData(initialData);
    setSummary(null);
    setAllDetails(null);
    setRawText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const processTextWithAI = async (text: string) => {
    if (!text.trim()) {
      setError("Faturadan metin okunamadı.");
      setStatusOverlay({ show: false, type: "loading", message: "" });
      return;
    }
    setStatusOverlay({
      show: true,
      type: "loading",
      message: "Fatura analiz ediliyor...",
    });
    setError(null);
    setSummary(null);
    setAllDetails(null);

    try {
      const result = await generateInvoiceSummary(text);
      const raw: any = result.invoiceData ?? {};
      const aiData: InvoiceData = {
        companyName: raw.companyName ?? "",
        customer: {
          name: raw.customer?.name ?? "",
          address: raw.customer?.address ?? "",
        },
        supplyDetails: {
          installationNumber: raw.supplyDetails?.installationNumber ?? "",
        },
        tariff: raw.tariff ?? "",
        annualConsumption: raw.annualConsumption ?? "",
        avgConsumption: raw.avgConsumption ?? "",
        skttStatus: "",
        meterReadings: {
          consumption: { total_kWh: raw.meterReadings?.consumption?.total_kWh ?? "" },
        },
        charges: {
          energyLow: { unitPrice: raw.charges?.energyLow?.unitPrice ?? "" },
          tiered: {
            low: {
              kWh: raw.charges?.tiered?.low?.kWh ?? "",
              unitPrice: raw.charges?.tiered?.low?.unitPrice ?? "",
            },
            high: {
              kWh: raw.charges?.tiered?.high?.kWh ?? "",
              unitPrice: raw.charges?.tiered?.high?.unitPrice ?? "",
            },
          },
        },
      };
      aiData.skttStatus = computeSktt(aiData.tariff || "", Number(aiData.annualConsumption));
      setData(aiData);
      setSummary(result.summary ?? null);
      setAllDetails(result.allDetails ?? null);

      setStatusOverlay({ show: true, type: "success", message: "Fatura bilgileri çıkarıldı!" });
      setTimeout(() => setStatusOverlay((s) => ({ ...s, show: false })), 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Yapay zeka özeti oluşturulamadı.");
      setStatusOverlay({ show: false, type: "loading", message: "" });
    }
  };

  const runCloudVisionOcr = async (file: File) => {
    handleRemoveImage();
    setImagePreviewUrl(URL.createObjectURL(file));
    if (!apiKey) {
      setError("Google Cloud API anahtarı eksik. Lütfen ortam değişkenlerini kontrol edin.");
      return;
    }
    setStatusOverlay({ show: true, type: "loading", message: "Fatura okunuyor..." });

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
      const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || "Google Vision hatası");
      const detected = json?.responses?.[0]?.fullTextAnnotation?.text || "";
      if (!detected.trim()) throw new Error("Görüntüden metin çıkarılamadı.");
      setRawText(detected);
      await processTextWithAI(detected);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "OCR/AI hatası");
      setStatusOverlay({ show: false, type: "loading", message: "" });
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) await runCloudVisionOcr(f);
  };

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
    { label: "Kademe 1 Tüketim (kWh)", value: data.charges?.tiered?.low?.kWh },
    { label: "Kademe 1 Fiyat (TL/kWh)", value: data.charges?.tiered?.low?.unitPrice },
    { label: "Kademe 2 Tüketim (kWh)", value: data.charges?.tiered?.high?.kWh },
    { label: "Kademe 2 Fiyat (TL/kWh)", value: data.charges?.tiered?.high?.unitPrice },
  ].filter((r) => r.value !== undefined && r.value !== null && String(r.value) !== "");

  const hasAnyAIData = detailRows.length > 0 || !!summary;

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

      <main className="p-2 pb-24 space-y-6">
        {/* Fatura yükleme, önizleme ve özet butonları */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex gap-2 mb-4 items-center">
              <Wand2 />
              <h2 className="text-lg font-semibold">1. Fatura Yükle</h2>
            </div>
            <div className="flex gap-3">
              <button
                disabled={statusOverlay.show && statusOverlay.type === "loading"}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                Cihazdan Yükle
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={onFile}
                  className="hidden"
                />
              </button>
            </div>

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
                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="h-24 bg-gray-50 flex flex-col items-center justify-center text-gray-400 border rounded-xl">
                  <FileImage className="w-8 h-8 mb-2" />
                  Önizleme için fatura yükleyin
                </div>
              )}

              {summary && (
                <button
                  type="button"
                  onClick={() => {}}
                  className="w-full text-left p-4 border rounded-lg bg-gray-50 text-sm hover:bg-gray-100 cursor-pointer"
                >
                  <div className="font-semibold text-gray-800 mb-1">Akıllı Fatura Özeti</div>
                  <p className="text-gray-700 line-clamp-4">{summary}</p>
                  <div className="mt-2 text-xs text-gray-500">Tamamını görmek için dokunun</div>
                </button>
              )}

              {error && (
                <div className="mt-4 p-3 rounded-xl border bg-red-50 border-red-200 text-red-700 flex items-start">
                  <ShieldAlert className="w-4 h-4 mt-0.5 text-red-600" />
                  <div className="ml-2">
                    <div className="font-semibold">Hata</div>
                    <div>{error}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Müşteri Bilgileri ve Detaylar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex gap-2 mb-4 items-center">
            <Wand2 />
            <h2 className="text-lg font-semibold">2. Müşteri Bilgileri</h2>
          </div>
          <div className="space-y-4">
            {/* Tarife, Şirket, vb. alanlar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <FieldLabel icon={<Zap />} >Tarife</FieldLabel>
                <select
                  value={data.tariff ?? ""}
                  onChange={(e) => handleDataChange("tariff", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="">-</option>
                  <option value="Mesken">Mesken</option>
                  <option value="Ticarethane">Ticarethane</option>
                  <option value="Sanayi">Sanayi</option>
                </select>
              </div>
              <div>
                <FieldLabel icon={<Building2 />} >Rakip Şirket</FieldLabel>
                <input
                  value={data.companyName ?? ""}
                  onChange={(e) => handleDataChange("companyName", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel icon={<Home />} >Müşteri Adı & Adres</FieldLabel>
                <textarea
                  value={`${data.customer?.name ?? ""}\n${data.customer?.address ?? ""}`}
                  onChange={(e) => {
                    const lines = e.target.value.split("\n");
                    handleDataChange("customer.name", lines[0] || "");
                    handleDataChange("customer.address", lines.slice(1).join("\n") || "");
                  }}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            </div>

            {/* Tüketim ve Fiyat alanları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><FieldLabel icon={<Gauge />} >Tüketim (kWh)</FieldLabel>
                <input
                  value={data.meterReadings?.consumption?.total_kWh ?? ""}
                  onChange={(e) => handleDataChange("meterReadings.consumption.total_kWh", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-400"
                /></div>
              <div><FieldLabel icon={<Percent />} >Birim Fiyat</FieldLabel>
                <input
                  value={data.charges?.energyLow?.unitPrice ?? ""}
                  onChange={(e) => handleDataChange("charges.energyLow.unitPrice", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-400"
                /></div>
              <div><FieldLabel icon={<Hash />} >Tesisat No</FieldLabel>
                <input
                  value={data.supplyDetails?.installationNumber ?? ""}
                  onChange={(e) => handleDataChange("supplyDetails.installationNumber", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-400"
                /></div>
            </div>

            {/* Yıllık, Ortalama Tüketim ve SKTT Durumu */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><FieldLabel icon={<Gauge />} >Yıllık Tüketim (kWh)</FieldLabel>
                <input
                  type="number"
                  value={data.annualConsumption ?? ""}
                  onChange={(e) => handleDataChange("annualConsumption", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-400"
                /></div>
              <div><FieldLabel icon={<Gauge />} >Ortalama Tüketim (kWh)</FieldLabel>
                <input
                  type="number"
                  value={data.avgConsumption ?? ""}
                  onChange={(e) => handleDataChange("avgConsumption", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-400"
                /></div>
              <div><FieldLabel icon={<Zap />} >SKTT Durumu</FieldLabel>
                <input
                  value={data.skttStatus ?? ""}
                  readOnly
                  className="w-full border rounded-lg px-3 py-2 bg-gray-100"
                /></div>
            </div>

            {/* Detayları Göster - Kademe ve OCR içerikleri */}
            {hasAnyAIData && (
              <div className="pt-4">
                <details>
                  <summary className="cursor-pointer text-sm text-gray-600 select-none">Detayları Göster</summary>
                  <div className="mt-2 bg-gray-50 p-3 rounded-lg border text-sm">
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
                            <td className="px-3 py-2 font-medium text-gray-700">{r.label}</td>
                            <td className="px-3 py-2 text-gray-800 break-words">{r.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
                {allDetails && (
                  <div className="mt-6">
                    <details>
                      <summary className="cursor-pointer text-sm text-gray-600 select-none">
                        OCR'dan Çıkarılan Ham Fatura Detayları
                      </summary>
                      <div className="mt-2 bg-gray-50 p-3 rounded-lg border text-sm whitespace-pre-wrap text-gray-800">
                        {allDetails}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-t border-gray-200 p-3 flex justify-end">
        <button
          disabled={!hasAnyAIData}
          onClick={() => alert("Kaydedildi!")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" /> Kaydet ve Devam Et
        </button>
      </footer>
    </div>
  );
}
