// src/screens/OutOfRegionVisitWizard.tsx
import React, { useMemo, useState, useEffect } from "react";
import {
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  Building2,
  User,
  Hash,
  Phone,
  Mail,
  BadgeCheck,
  Info,
  Factory,
  FileSignature,
  CalendarClock,
  Coins,
  ArrowLeft,
  ArrowRight,
  Save,
  CalendarPlus,
  Plus,
  X,
} from "lucide-react";

type Step0Store = {
  customerName?: string;
  address?: string;
  tariff?: "Mesken" | "Ticarethane" | "Sanayi" | string;
  annual?: string;
  companyName?: string; // rakip
  installationNumber?: string; // fatura OCR'dan geldiyse
  unitPrice?: string;
  periodKwh?: string;
};

type PodCheckResult =
  | { ok: true; customerType: "bireysel" | "kurumsal"; message: string }
  | { ok: false; message: string };

const brand = { yellow: "#F9C800", navy: "#002D72" };

function StepHeader({ title, step }: { title: string; step: number }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
        style={{ background: brand.yellow, color: brand.navy }}
      >
        {step}
      </div>
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
    </div>
  );
}

export default function OutOfRegionVisitWizard({
  onBack,
  onFinish,
}: {
  onBack?: () => void;
  onFinish?: () => void;
}) {
  // 0. adım storage'dan verileri çekelim (InvoiceOcrPage yazıyor)
  const step0 = useMemo<Step0Store>(() => {
    try {
      const raw = localStorage.getItem("outOfRegion.step0");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  // ======= Adım state'leri =======
  const [activeStep, setActiveStep] = useState(1);

  // Adım 1 - POD doğrulama
  const [pod, setPod] = useState(step0.installationNumber || "");
  const [podChecking, setPodChecking] = useState(false);
  const [podResult, setPodResult] = useState<PodCheckResult | null>(null);
  const [podCreateOpen, setPodCreateOpen] = useState(false);
  const [newPodOwner, setNewPodOwner] = useState(step0.customerName || "");
  const [newPodAddress, setNewPodAddress] = useState(step0.address || "");

  // Adım 2 - Müşteri detayları (koşullu)
  const [customerType, setCustomerType] = useState<"bireysel" | "kurumsal">(
    // Eğer POD doğrulama başarılı olursa oradan gelecek; yoksa 0. adımdaki tarife ipucu
    step0.tariff === "Mesken" ? "bireysel" : "kurumsal"
  );
  const [customerName, setCustomerName] = useState(step0.customerName || "");
  const [customerAddress, setCustomerAddress] = useState(step0.address || "");
  // bireysel onay/sms
  const [kvkk, setKvkk] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [smsCode, setSmsCode] = useState("");
  const [smsOk, setSmsOk] = useState(false);
  // kurumsal yetkili
  const [repName, setRepName] = useState("");
  const [repPhone, setRepPhone] = useState("");
  const [repMail, setRepMail] = useState("");
  const [repConsent, setRepConsent] = useState(false);

  // Adım 3 - Rakip bilgileri
  const [competitor, setCompetitor] = useState(step0.companyName || "");
  const [avgBill, setAvgBill] = useState(""); // TL
  const [contractEnd, setContractEnd] = useState(""); // YYYY-MM-DD
  const [competitorPrice, setCompetitorPrice] = useState(step0.unitPrice || "");
  const [commitment, setCommitment] = useState<"var" | "yok" | "bilinmiyor">("bilinmiyor");
  const [deposit, setDeposit] = useState<"var" | "yok" | "bilinmiyor">("bilinmiyor");

  // Adım 4 - Özet (derlenmiş)
  const summary = useMemo(() => {
    return {
      pod,
      customerType,
      customerName,
      customerAddress,
      consents:
        customerType === "bireysel"
          ? { kvkk, marketing, smsOk }
          : { repName, repPhone, repMail, repConsent },
      competitorInfo: {
        competitor,
        avgBill,
        contractEnd,
        competitorPrice,
        commitment,
        deposit,
      },
    };
  }, [
    pod,
    customerType,
    customerName,
    customerAddress,
    kvkk,
    marketing,
    smsOk,
    repName,
    repPhone,
    repMail,
    repConsent,
    competitor,
    avgBill,
    contractEnd,
    competitorPrice,
    commitment,
    deposit,
  ]);

  // POD doğrulama simülasyonu (yerine gerçek API bağlayabilirsin)
  async function checkPod() {
    setPodChecking(true);
    setPodResult(null);
    await new Promise((r) => setTimeout(r, 800));
    // basit senaryo: sonu "7" ile bitenler yok, diğerleri var
    const exists = /\d$/.test(pod) && !pod.endsWith("7");
    if (exists) {
      const inferredType =
        step0.tariff === "Mesken" ? "bireysel" : ("kurumsal" as "bireysel" | "kurumsal");
      setCustomerType(inferredType);
      setPodResult({
        ok: true,
        customerType: inferredType,
        message:
          inferredType === "kurumsal"
            ? "POD bulundu. Müşteri Tipi: Kurumsal"
            : "POD bulundu. Müşteri Tipi: Bireysel",
      });
    } else {
      setPodResult({ ok: false, message: "Bu POD numarası sistemde kayıtlı değil." });
    }
    setPodChecking(false);
  }

  function createPod() {
    // burada gerçek servis ile POD yaratılabilir
    const fakePod = pod || String(Math.floor(Math.random() * 1e10));
    setPod(fakePod);
    setPodCreateOpen(false);
    setPodResult({
      ok: true,
      customerType: customerType,
      message: "Yeni POD oluşturuldu ve ilişkilendirildi.",
    });
  }

  function sendSms() {
    setSmsSent(true);
    setSmsOk(false);
  }
  function verifySms() {
    // basit doğrulama: 1234
    setSmsOk(smsCode === "1234");
  }

  function canGoNextFrom(step: number): boolean {
    if (step === 1) {
      return !!pod && !!podResult?.ok;
    }
    if (step === 2) {
      if (customerType === "bireysel") {
        return !!customerName && !!customerAddress && kvkk && smsOk;
      }
      // kurumsal
      return (
        !!customerName &&
        !!customerAddress &&
        !!repName &&
        !!repPhone &&
        repConsent
      );
    }
    if (step === 3) {
      return !!competitor || !!avgBill || !!contractEnd || !!competitorPrice;
    }
    return true;
  }

  function goNext() {
    if (canGoNextFrom(activeStep)) {
      setActiveStep((s) => Math.min(4, s + 1));
    }
  }
  function goPrev() {
    setActiveStep((s) => Math.max(1, s - 1));
  }

  useEffect(() => {
    // özet için saklayalım
    try {
      localStorage.setItem("outOfRegion.wizardDraft", JSON.stringify(summary));
    } catch {}
  }, [summary]);

  function saveOnly() {
    try {
      localStorage.setItem("outOfRegion.saved", JSON.stringify(summary));
      alert("Müşteri bilgileri kaydedildi.");
    } catch {}
    onFinish?.();
  }

  function saveAndPlan() {
    try {
      localStorage.setItem("outOfRegion.saved", JSON.stringify(summary));
      alert("Müşteri bilgileri kaydedildi. Ziyaret planlama ekranına yönlendirileceksiniz.");
    } catch {}
    onFinish?.(); // App tarafında 'visits' ya da takvim ekranına alabilirsin.
  }

  // ---- UI ----
  return (
    <div className="min-h-[calc(100vh-60px)] p-3 md:p-6">
      {/* Stepper */}
      <div className="flex items-center gap-3 mb-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                activeStep >= n ? "text-black" : "text-gray-400"
              }`}
              style={{ background: activeStep >= n ? brand.yellow : "#E5E7EB" }}
            >
              {n}
            </div>
            {n < 4 && <div className="w-10 h-0.5 bg-gray-300" />}
          </div>
        ))}
      </div>

      {/* Adım 1: POD Doğrulama */}
      {activeStep === 1 && (
        <div className="bg-white rounded-xl border p-4">
          <StepHeader title="POD Doğrulama" step={1} />
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                <Hash className="w-4 h-4" /> POD Numarası
              </label>
              <input
                value={pod}
                onChange={(e) => {
                  setPod(e.target.value);
                  setPodResult(null);
                }}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Tesisat / POD no"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={checkPod}
                disabled={!pod || podChecking}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white w-full md:w-auto disabled:opacity-60"
              >
                {podChecking ? "Sorgulanıyor..." : "Sistemde Sorgula"}
              </button>
            </div>
          </div>

          {podResult && (
            <div
              className={`mt-4 p-3 rounded-lg border flex items-start gap-2 ${
                podResult.ok
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-yellow-50 border-yellow-200 text-yellow-800"
              }`}
            >
              {podResult.ok ? (
                <CheckCircle2 className="w-5 h-5 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 mt-0.5" />
              )}
              <div>
                <div className="font-semibold">
                  {podResult.ok ? "Başarılı" : "Kayıt Bulunamadı"}
                </div>
                <div className="text-sm">{podResult.message}</div>
                {!podResult.ok && (
                  <div className="mt-2">
                    <button
                      onClick={() => setPodCreateOpen(true)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-black text-white"
                    >
                      <Plus className="w-4 h-4" /> Yeni POD Kaydı Oluştur
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-between">
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-lg border flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Geri
            </button>
            <button
              onClick={goNext}
              disabled={!canGoNextFrom(1)}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white flex items-center gap-2 disabled:opacity-50"
            >
              İleri <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* POD Oluştur Modal */}
          {podCreateOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl w-full max-w-lg p-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="font-semibold">Yeni POD Kaydı</div>
                  <button onClick={() => setPodCreateOpen(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="text-sm font-medium">Müşteri Adı</label>
                    <input
                      className="w-full border rounded-lg px-3 py-2"
                      value={newPodOwner}
                      onChange={(e) => setNewPodOwner(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Adres</label>
                    <textarea
                      className="w-full border rounded-lg px-3 py-2"
                      rows={3}
                      value={newPodAddress}
                      onChange={(e) => setNewPodAddress(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    className="px-4 py-2 rounded-lg border"
                    onClick={() => setPodCreateOpen(false)}
                  >
                    Vazgeç
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white"
                    onClick={createPod}
                  >
                    Oluştur
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Adım 2: Müşteri Detayları */}
      {activeStep === 2 && (
        <div className="bg-white rounded-xl border p-4">
          <StepHeader title="Müşteri Detayları" step={2} />
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-1">
                <User className="w-4 h-4" /> Müşteri Tipi
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={customerType}
                onChange={(e) => {
                  setCustomerType(e.target.value as "bireysel" | "kurumsal");
                  // tip değişirse kurumsal/bireysel alanlarını sıfırla
                  setKvkk(false);
                  setMarketing(false);
                  setSmsSent(false);
                  setSmsCode("");
                  setSmsOk(false);
                  setRepName("");
                  setRepPhone("");
                  setRepMail("");
                  setRepConsent(false);
                }}
              >
                <option value="bireysel">Bireysel</option>
                <option value="kurumsal">Kurumsal</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-1">
                <Hash className="w-4 h-4" /> POD
              </label>
              <input className="w-full border rounded-lg px-3 py-2" value={pod} readOnly />
            </div>

            <div>
              <label className="text-sm font-medium mb-1">Ad / Ünvan</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1">Adres</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2"
                rows={3}
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
              />
            </div>
          </div>

          {/* Bireysel: izinler + SMS */}
          {customerType === "bireysel" && (
            <div className="mt-4 rounded-lg border p-3 bg-gray-50">
              <div className="font-semibold mb-2 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> İzinler ve Onaylar
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={kvkk} onChange={(e) => setKvkk(e.target.checked)} />
                KVKK Aydınlatma ve Açık Rıza Metni’ni onaylıyorum.
              </label>
              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                />
                Kampanya/iletişim izni veriyorum.
              </label>

              <div className="mt-3">
                {!smsSent ? (
                  <button
                    disabled={!kvkk}
                    onClick={sendSms}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
                  >
                    SMS Doğrulama Kodu Gönder
                  </button>
                ) : (
                  <div className="flex items-end gap-2">
                    <div>
                      <label className="text-sm font-medium mb-1 block">SMS Kodu</label>
                      <input
                        value={smsCode}
                        onChange={(e) => setSmsCode(e.target.value)}
                        className="border rounded-lg px-3 py-2"
                        placeholder="1234"
                      />
                    </div>
                    <button
                      onClick={verifySms}
                      className="px-4 py-2 rounded-lg bg-black text-white"
                    >
                      Doğrula
                    </button>
                    {smsOk && (
                      <span className="inline-flex items-center gap-1 text-green-700 text-sm">
                        <BadgeCheck className="w-4 h-4" /> Doğrulandı
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Kurumsal: yetkili kişi */}
          {customerType === "kurumsal" && (
            <div className="mt-4 rounded-lg border p-3 bg-gray-50">
              <div className="font-semibold mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Yetkili Kişi Bilgileri
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1">Ad Soyad</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={repName}
                    onChange={(e) => setRepName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1">Telefon</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={repPhone}
                    onChange={(e) => setRepPhone(e.target.value)}
                    placeholder="+90..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1">E-posta</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={repMail}
                    onChange={(e) => setRepMail(e.target.value)}
                    placeholder="mail@firma.com"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 mt-3">
                <input
                  type="checkbox"
                  checked={repConsent}
                  onChange={(e) => setRepConsent(e.target.checked)}
                />
                Yetkili kişinin iletişim/onay bilgileri tarafımdan alındı.
              </label>
            </div>
          )}

          <div className="mt-4 flex justify-between">
            <button onClick={goPrev} className="px-4 py-2 rounded-lg border flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Geri
            </button>
            <button
              onClick={goNext}
              disabled={!canGoNextFrom(2)}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white flex items-center gap-2 disabled:opacity-50"
            >
              İleri <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Adım 3: Rakip Bilgileri */}
      {activeStep === 3 && (
        <div className="bg-white rounded-xl border p-4">
          <StepHeader title="Rakip Bilgileri" step={3} />
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <label className="text-sm font-medium mb-1 flex items-center gap-2">
                <Factory className="w-4 h-4" /> Rakip Şirket
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={competitor}
                onChange={(e) => setCompetitor(e.target.value)}
                placeholder="A.Ş., Enerji A.Ş. vb."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 flex items-center gap-2">
                <Coins className="w-4 h-4" /> Aylık Ortalama Fatura (TL)
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={avgBill}
                onChange={(e) => setAvgBill(e.target.value)}
                placeholder="ör. 12.500"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 flex items-center gap-2">
                <CalendarClock className="w-4 h-4" /> Sözleşme Bitiş Tarihi
              </label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2"
                value={contractEnd}
                onChange={(e) => setContractEnd(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1">Rakip Fiyat / Oran</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={competitorPrice}
                onChange={(e) => setCompetitorPrice(e.target.value)}
                placeholder="ör. 3.25 TL/kWh"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1">Taahhüt Durumu</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={commitment}
                onChange={(e) => setCommitment(e.target.value as any)}
              >
                <option value="bilinmiyor">Bilinmiyor</option>
                <option value="var">Var</option>
                <option value="yok">Yok</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1">Teminat Durumu</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value as any)}
              >
                <option value="bilinmiyor">Bilinmiyor</option>
                <option value="var">Var</option>
                <option value="yok">Yok</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-between">
            <button onClick={goPrev} className="px-4 py-2 rounded-lg border flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Geri
            </button>
            <button
              onClick={goNext}
              disabled={!canGoNextFrom(3)}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white flex items-center gap-2 disabled:opacity-50"
            >
              İleri <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Adım 4: Özet */}
      {activeStep === 4 && (
        <div className="bg-white rounded-xl border p-4">
          <StepHeader title="Özet ve Sonraki Adım" step={4} />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border p-3">
              <div className="font-semibold mb-2">Genel</div>
              <ul className="text-sm space-y-1">
                <li><b>POD:</b> {summary.pod || "-"}</li>
                <li><b>Müşteri Tipi:</b> {summary.customerType}</li>
                <li><b>Ad/Unvan:</b> {summary.customerName || "-"}</li>
                <li><b>Adres:</b> {summary.customerAddress || "-"}</li>
              </ul>
            </div>
            <div className="rounded-lg border p-3">
              <div className="font-semibold mb-2">Onay / Yetkili</div>
              <pre className="text-sm bg-gray-50 p-2 rounded">{JSON.stringify(summary.consents, null, 2)}</pre>
            </div>
            <div className="md:col-span-2 rounded-lg border p-3">
              <div className="font-semibold mb-2">Rakip Bilgileri</div>
              <pre className="text-sm bg-gray-50 p-2 rounded">{JSON.stringify(summary.competitorInfo, null, 2)}</pre>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 justify-between">
            <button onClick={goPrev} className="px-4 py-2 rounded-lg border flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Geri
            </button>
            <div className="flex gap-2">
              <button
                onClick={saveOnly}
                className="px-5 py-2 rounded-lg bg-black text-white flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Kaydet
              </button>
              <button
                onClick={saveAndPlan}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white flex items-center gap-2"
              >
                <CalendarPlus className="w-4 h-4" /> Kaydet ve Ziyaret Planla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
