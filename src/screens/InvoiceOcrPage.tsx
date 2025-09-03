import React, { useEffect, useRef, useState } from "react";
import { Camera, Upload, Wand2, Building2, Home, Hash, Gauge, Percent, Loader2, FileText, ShieldAlert } from "lucide-react";
import Tesseract from "tesseract.js";

// ====== THEME (Enerjisa) ======
const BRAND_YELLOW = "#F9C800";
const BRAND_NAVY = "#002D72"; // eski lacivert
const BRAND_TURQ = "#0099CB"; // projedeki turkuaz (butonlarla aynı)

// ====== TYPES ======
interface InvoiceData {
  customerName: string;
  address: string;
  installationNumber: string;
  consumption: string; // kWh
  unitPrice: string;   // TL/kWh
  companyName: string; // Rakip şirket
}

// ====== HELPERS ======
const initialData: InvoiceData = {
  customerName: "",
  address: "",
  installationNumber: "",
  consumption: "",
  unitPrice: "",
  companyName: "",
};

const num = (s?: string) => (s || "").replace(/[^0-9.,]/g, "").trim();

function normalizeDecimal(s: string) {
  if (!s) return s;
  let t = s.replace(/\s/g, "");
  // 1.234,56 → 1234.56
  if (/\,\d{1,3}$/.test(t)) {
    t = t.replace(/\./g, "").replace(",", ".");
  } else {
    // 1,234.56 → 1234.56
    t = t.replace(/,/g, "");
  }
  return t;
}

function pickCompanyName(lines: string[]): string {
  const candidates = lines
    .slice(0, 12)
    .filter((l) => /ELEKTRIK|ELEKTRİK|ENERJI|ENERJİ|A\.Ş\.|AS\.|AŞ|Ş\.|SAN\.|TIC\.|TİC\./i.test(l));
  if (candidates.length > 0) return candidates.sort((a, b) => b.length - a.length)[0];
  const upperish = lines.find(
    (l) => l === l.toUpperCase() && l.replace(/[^A-ZÇĞİÖŞÜ]/g, "").length >= 5
  );
  return upperish || lines[0] || "";
}

function extractBetween(source: string, startLabel: RegExp, nextStop: RegExp): string {
  const start = startLabel.exec(source);
  if (!start) return "";
  const rest = source.slice(start.index + start[0].length);
  const stop = nextStop.exec(rest);
  const seg = stop ? rest.slice(0, stop.index) : rest;
  return seg
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
}

export function parseInvoiceText(fullText: string): InvoiceData {
  // Metni ön işleme: Windows satır sonlarını (\r) kaldır ve her satırı trim'le.
  const text = fullText.replace(/\r/g, "");
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // ========================================================================
  // 1. Şirket Adı (Company Name)
  // ========================================================================
  // Bu fonksiyon genellikle faturaların en üstünde yer alan şirket adını bulur.
  // Mevcut 'pickCompanyName' fonksiyonu bu iş için oldukça yeterli.
  const companyName = pickCompanyName(lines);

  // ========================================================================
  // 2. Müşteri Adı (Customer Name)
  // ========================================================================
  // Farklı faturalardaki "Ad Soyad", "Müşteri Adı Soyadı", "Unvan" gibi
  // çeşitli etiketleri arayacak bir regex listesi oluşturuyoruz.
  // (?i) flag'i büyük/küçük harf duyarsız arama yapar.
  // \s*[:\s]?\s* deseni, etiketten sonra gelebilecek iki nokta üst üste veya boşlukları tolere eder.
  const nameRegexes = [
    /(?:MÜŞTERİ|ABONE)\s*(?:ADI|ADI SOYADI)\s*[:\s]?\s*(.+)/i,
    /AD SOYAD\s*[:\s]?\s*(.+)/i,
    /UNVAN\s*[:\s]?\s*(.+)/i,
    /SAYIN\s+([^,\n]+)/i, // "Sayın HASAN DİKÇE," gibi ifadeler için
  ];
  let customerName = "";
  for (const rx of nameRegexes) {
    const m = text.match(rx);
    if (m && m[1]) {
      // Bulunan ismin sonundaki gereksiz karakterleri (örn: TCKN etiketi) temizle
      customerName = m[1].split(/TCKN|VERG[İI]/i)[0].trim();
      break;
    }
  }
  // Eğer regex ile bulunamazsa, etiketin bir alt satırındaki değeri almayı dene.
  if (!customerName) {
    const nameLineIndex = lines.findIndex((l) => /(MÜŞTERİ|ABONE|AD SOYAD|UNVAN)/i.test(l));
    if (nameLineIndex > -1 && lines[nameLineIndex + 1]) {
      // Bir sonraki satırın fatura ile ilgili başka bir etiket içermediğinden emin olalım.
      if (!/ADRES|TCKN|NO:|TAR[İI]H/i.test(lines[nameLineIndex + 1])) {
        customerName = lines[nameLineIndex + 1].trim();
      }
    }
  }

  // ========================================================================
  // 3. Adres (Address)
  // ========================================================================
  // Adres genellikle "ADRES:" etiketinden sonra başlar ve bir sonraki anahtar bilgiye
  // (Tesisat No, Fatura Tarihi, Tüketim vb.) kadar devam eder.
  // Bitiş regex'ini daha kapsamlı hale getirerek adresin daha doğru alınmasını sağlıyoruz.
  let address = extractBetween(
    text,
    /ADRES\s*[:\s]?/i,
    /(TES[İI]SAT|SÖZLEŞME|ABONE|MÜŞTER[İI]|FATURA|VERG[İI]|TAR[İI]H|DÖNEM|SAYAÇ|TÜKET[İI]M|TCKN|EIC)/i
  );
  // extractBetween başarısız olursa, etiketin altındaki 1-2 satırı birleştirmeyi dene.
  if (!address) {
    const idx = lines.findIndex((l) => /ADRES/i.test(l));
    if (idx >= 0) {
      address = [lines[idx + 1], lines[idx + 2]].filter(Boolean).join(" ");
    }
  }

  // ========================================================================
  // 4. Tesisat Numarası (Installation Number)
  // ========================================================================
  // Faturalarda "Tekil Kod/Tesisat No", "Tesisat No Kodu", "Sözleşme Hesap No" gibi
  // birçok farklı format var. Hepsini yakalayacak esnek bir yapı kuruyoruz.
  // Öncelik "Tesisat No" içeren ifadelerde olacak.
  const instRegexes = [
      // En yaygın format: "Tekil Kod/Tesisat No: 123456789"
      /(?:TEK[İI]L KODU?\/)?\s*TES[İI]SAT\s*(?:NO|NUMARASI|KODU)?\s*[:\s]?\s*(\d{7,})/i,
      // Diğer formatlar: "Sözleşme Hesap No: 123456789" veya "Abone No: 123456789"
      /(?:SÖZLEŞME|ABONE|MÜŞTER[İI])\s*(?:HESAP\s*)?NO(?:SU)?\s*[:\s]?\s*(\d{7,})/i,
      // Sadece Tesisat No arayan daha genel bir regex
      /TES[İI]SAT\s*NO\s*[:\s]?\s*(\d{7,})/i
  ];
  let installationNumber = "";
  for (const rx of instRegexes) {
    const m = text.match(rx);
    // Yakalanan 3. grup genelde Tesisat No'dur. Ancak bizim regex'lerimizde 1. grupta olacak.
    if (m && m[1]) {
      installationNumber = m[1].trim();
      break;
    }
  }

  // ========================================================================
  // 5. Tüketim (kWh) ve Birim Fiyat (TL/kWh)
  // ========================================================================
  // Bu değerler genellikle bir tablo satırında bulunur.
  // Strateji: Önce "Toplam Tüketim", "Enerji Bedeli" gibi anahtar kelimeleri içeren satırı bul,
  // sonra o satırdaki sayısal değerleri ayrıştır.
  let consumption = "";
  let unitPrice = "";

  // Regex: En az bir rakam içeren, potansiyel olarak içinde nokta, virgül ve boşluk barındıran sayıları bulur.
  // Örn: "1.234,56" veya "1 234.56" gibi formatları yakalar.
  const numberRegex = /\b(\d{1,}[\d.,\s]+\d)\b/g;

  // Aranacak anahtar kelimeler (öncelik sırasına göre).
  const consumptionKeywords = [
    /TOPLAM ENERJ[İI] BEDEL[İI]/i,
    /AKT[İI]F TÜKET[İI]M TOPLAMI/i,
    /ENERJ[İI] BEDEL[İI].*DÜŞÜK KADEME/i, // Düşük kademe genellikle toplam tüketimi içerir
    /ENERJ[İI] BEDEL[İI]/i,
    /TOPLAM\s*\(?kWh\)?/i,
  ];

  for (const keywordRegex of consumptionKeywords) {
    const targetLine = lines.find(line => keywordRegex.test(line));

    if (targetLine) {
        // Satırdaki tüm sayısal değerleri bul.
        const numbers = (targetLine.match(numberRegex) || []).map(numStr => normalizeDecimal(numStr));

        if (numbers.length > 0) {
            // Genellikle ilk sayı Tüketim (kWh), ikincisi Birim Fiyat (TL/kWh) olur.
            // Örnek Satır: "Enerji Bedeli-Düşük Kademe   456,849   1.341078   612,67"
            consumption = numbers[0];
            if (numbers.length > 1) {
                // Birim fiyatın makul bir aralıkta olup olmadığını kontrol edelim (örn: 0.1 ile 10 arası)
                // Bu, yanlışlıkla fatura tutarını birim fiyat olarak almayı engeller.
                const potentialUnitPrice = parseFloat(numbers[1]);
                if (potentialUnitPrice > 0.1 && potentialUnitPrice < 10.0) {
                    unitPrice = numbers[1];
                }
            }
            break; // Değerleri bulduysak döngüden çık
        }
    }
  }
  
  // Eğer yukarıdaki yöntem başarısız olursa, eski yöntemleri fallback olarak deneyelim.
  if (!consumption) {
      const consMatch = text.match(/TÜKET[İI]M\s*\(?kwh\)?\s*[:\s]*?([\d.,]+)/i);
      if (consMatch && consMatch[1]) consumption = normalizeDecimal(consMatch[1]);
  }
  if (!unitPrice) {
      const unitMatch = text.match(/B[İI]R[İI]M F[İI]YAT\s*\(?(?:TL|Kr)\/kWh\)?\s*[:\s]*?([\d.,]+)/i);
      if (unitMatch && unitMatch[1]) unitPrice = normalizeDecimal(unitMatch[1]);
  }


  return {
    customerName,
    address,
    installationNumber,
    consumption,
    unitPrice,
    companyName
  };
}
// ====== SIMPLE RUNTIME TESTS (dev only) ======
if (import.meta && (import.meta as any).env && (import.meta as any).env.DEV) {
  const sample = `\
XYZ ELEKTRİK A.Ş.\n\
SAYIN MEHMET YILMAZ\n\
ADRES: KAVAKLI MAH. ÇINAR CAD. NO:12 BEYLİKDÜZÜ İSTANBUL\n\
TESİSAT NO: 12345678\n\
TÜKETİM: 245 kWh\n\
BİRİM FİYAT: 3,245 TL/kWh`;
  const parsed = parseInvoiceText(sample);
  console.assert(parsed.companyName.includes("ELEKTR"), "companyName parse failed", parsed);
  console.assert(parsed.customerName.toUpperCase().includes("MEHMET"), "customerName parse failed", parsed);
  console.assert(parsed.installationNumber === "12345678", "installationNumber parse failed", parsed);
  console.assert(parsed.consumption === "245", "consumption parse failed", parsed);
}

// ====== MAIN COMPONENT ======
export default function InvoiceOcrPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [data, setData] = useState<InvoiceData>(initialData);
  const [loading, setLoading] = useState(false);
  const [rawText, setRawText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => () => { if (stream) stream.getTracks().forEach((t) => t.stop()); }, [stream]);

  async function startCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      setStream(s);
      if (videoRef.current) {
        (videoRef.current as any).srcObject = s;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch (e) {
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
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setImagePreview(dataUrl);
    await ocrFromDataUrl(dataUrl);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const dataUrl = URL.createObjectURL(f);
    setImagePreview(dataUrl);
    await ocrFromFile(f);
  }

  async function ocrFromDataUrl(dataUrl: string) {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    await ocrFromFile(new File([blob], "capture.jpg", { type: "image/jpeg" }));
  }

  async function ocrFromFile(file: File) {
    setError(null);
    setLoading(true);
    try {
      const { data: result } = await Tesseract.recognize(file, "tur+eng");
      setRawText(result.text || "");
      const parsed = parseInvoiceText(result.text || "");
      setData((d) => ({ ...d, ...parsed }));
    } catch (err: any) {
      console.error(err);
      setError("OCR sırasında bir hata oluştu (Tesseract).");
    } finally {
      setLoading(false);
    }
  }

  function FieldLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
    return (
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
  }

  return (
    <div className="min-h-screen w-full" style={{ background: "#f6f7fb" }}>
      <header className="sticky top-0 z-20 border-b" style={{ background: BRAND_TURQ, borderColor: BRAND_YELLOW }}>
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3 text-white">
          <div className="w-2 h-6 rounded-sm" style={{ background: BRAND_YELLOW }} />
          <h1 className="text-xl font-semibold tracking-wide">Fatura OCR • Rakipten Geçiş</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* SOL TARAF: Yakalama & Önizleme */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: BRAND_YELLOW }}>
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wand2 />
                  <h2 className="text-lg font-semibold">Görsel Seç / Çek ve Tara</h2>
                </div>
                <span className="text-xs text-gray-500">Tesseract.js (tr+eng)</span>
              </div>

              <div className="flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer bg-white hover:bg-gray-50">
                  <Upload className="w-4 h-4" />
                  <span>Fotoğraf Yükle</span>
                  <input type="file" accept="image/*" className="hidden" onChange={onFile} />
                </label>

                {!cameraOn ? (
                  <button onClick={startCamera} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-gray-50">
                    <Camera className="w-4 h-4" />
                    Kamerayı Aç
                  </button>
                ) : (
                  <button onClick={stopCamera} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-gray-50">
                    <Camera className="w-4 h-4" />
                    Kamerayı Kapat
                  </button>
                )}

                {loading && (
                  <span className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-xl border bg-white">
                    <Loader2 className="w-4 h-4 animate-spin" /> OCR çalışıyor…
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl overflow-hidden border" style={{ borderColor: BRAND_YELLOW }}>
                  <div className="p-2 flex items-center justify-between bg-white border-b" style={{ borderColor: BRAND_YELLOW }}>
                    <span className="text-sm font-medium flex items-center gap-2"><Camera className="w-4 h-4" /> Kamera Önizleme</span>
                    {cameraOn && (
                      <button onClick={capturePhoto} className="text-xs px-3 py-1 rounded-lg" style={{ background: BRAND_YELLOW, color: BRAND_NAVY }}>
                        Fotoğraf Çek
                      </button>
                    )}
                  </div>
                  <div className="aspect-video relative">
                    {cameraOn ? (
                      <video ref={videoRef} playsInline className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Kamera kapalı</div>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl overflow-hidden border" style={{ borderColor: BRAND_YELLOW }}>
                  <div className="p-2 flex items-center justify-between bg-white border-b" style={{ borderColor: BRAND_YELLOW }}>
                    <span className="text-sm font-medium flex items-center gap-2"><FileText className="w-4 h-4" /> Seçilen Görsel</span>
                    {imagePreview && (
                      <button onClick={() => ocrFromDataUrl(imagePreview)} className="text-xs px-3 py-1 rounded-lg" style={{ background: BRAND_YELLOW, color: BRAND_NAVY }}>
                        Tekrar Tara
                      </button>
                    )}
                  </div>
                  <div className="aspect-video bg-white flex items-center justify-center">
                    {imagePreview ? (
                      <img src={imagePreview} alt="preview" className="max-h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Görsel seçilmedi</div>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-xl border text-sm flex items-start gap-2" style={{ borderColor: "#FECACA", background: "#FEF2F2" }}>
                  <ShieldAlert className="w-4 h-4 mt-0.5" />
                  <div>
                    <div className="font-semibold">Hata</div>
                    <div className="text-gray-700">{error}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SAĞ TARAF: Otomatik Doldurulan Form */}
          <div className="bg-white rounded-2xl shadow-sm border" style={{ borderColor: BRAND_YELLOW }}>
            <div className="p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Wand2 />
                <h2 className="text-lg font-semibold">Otomatik Doldurulan Form</h2>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <FieldLabel icon={<Building2 className="w-3.5 h-3.5" />}>Rakip Şirket</FieldLabel>
                  <input
                    value={data.companyName}
                    onChange={(e) => setData({ ...data, companyName: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none"
                    placeholder="Örn. ABC Enerji A.Ş."
                  />
                </div>

                <div className="space-y-1">
                  <FieldLabel icon={<Home className="w-3.5 h-3.5" />}>Müşteri Adı Soyadı</FieldLabel>
                  <input
                    value={data.customerName}
                    onChange={(e) => setData({ ...data, customerName: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none"
                    placeholder="Ad Soyad"
                  />
                </div>

                <div className="space-y-1">
                  <FieldLabel icon={<Home className="w-3.5 h-3.5" />}>Adres</FieldLabel>
                  <textarea
                    value={data.address}
                    onChange={(e) => setData({ ...data, address: e.target.value })}
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none"
                    placeholder="Sokak, Cadde, No, İlçe, İl"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <FieldLabel icon={<Hash className="w-3.5 h-3.5" />}>Tesisat No</FieldLabel>
                    <input
                      value={data.installationNumber}
                      onChange={(e) => setData({ ...data, installationNumber: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none"
                      placeholder="########"
                    />
                  </div>

                  <div className="space-y-1">
                    <FieldLabel icon={<Gauge className="w-3.5 h-3.5" />}>Tüketim (kWh)</FieldLabel>
                    <input
                      value={data.consumption}
                      onChange={(e) => setData({ ...data, consumption: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none"
                      placeholder="Örn. 245"
                    />
                  </div>

                  <div className="space-y-1">
                    <FieldLabel icon={<Percent className="w-3.5 h-3.5" />}>Birim Fiyat (TL/kWh)</FieldLabel>
                    <input
                      value={data.unitPrice}
                      onChange={(e) => setData({ ...data, unitPrice: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none"
                      placeholder="Örn. 3,245"
                    />
                  </div>
                </div>

                {rawText && (
                  <div className="pt-2">
                    <details className="group">
                      <summary className="cursor-pointer text-sm text-gray-700 select-none">Ham OCR Metni (aç/kapa)</summary>
                      <pre className="mt-2 max-h-48 overflow-auto text-xs bg-gray-50 p-3 rounded-lg border">{rawText}</pre>
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
