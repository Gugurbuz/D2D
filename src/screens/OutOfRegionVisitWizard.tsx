import React, { useMemo, useState, useEffect } from "react";
import {
  Check,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  Building2,
  User,
  Hash,
  BadgeCheck,
  Info,
  Factory,
  CalendarClock,
  Coins,
  ArrowLeft,
  ArrowRight,
  Save,
  CalendarPlus,
  Plus,
  X,
} from "lucide-react";

/* ---- Basit fade-in animasyonu ---- */
const FadeStyles = () => (
  <style>{`
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: translateY(0) } }
    .fade-in { animation: fadeIn .25s ease }
  `}</style>
);

type Step0Store = {
  customerName?: string;
  address?: string;
  tariff?: "Mesken" | "Ticarethane" | "Sanayi" | string;
  annual?: string;
  companyName?: string; // rakip
  installationNumber?: string; // OCR
  unitPrice?: string;
  periodKwh?: string;
};

type PodCheckResult =
  | { ok: true; customerType: "bireysel" | "kurumsal"; message: string }
  | { ok: false; message: string };

const brand = { yellow: "#F9C800", navy: "#002D72" };

function Stepper({
  active,
  done,
}: {
  active: 1 | 2 | 3 | 4;
  done: (n: number) => boolean;
}) {
  const steps = [
    { n: 1, label: "POD" },
    { n: 2, label: "Müşteri" },
    { n: 3, label: "Rakip" },
    { n: 4, label: "Özet" },
  ];
  return (
    <div className="flex items-center justify-between gap-2">
      {steps.map((s, i) => {
        const isActive = active === s.n;
        const isDone = done(s.n);
        return (
          <div key={s.n} className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                  isActive
                    ? "border-transparent shadow"
                    : "border-gray-300"
                }`}
                style={{
                  background: isActive || isDone ? brand.yellow : "#E5E7EB",
                  color: brand.navy,
                }}
                title={s.label}
              >
                {isDone && !isActive ? <Check className="w-4 h-4" /> : s.n}
              </div>
              <div
                className={`text-sm font-medium truncate ${
                  isActive ? "text-gray-900" : "text-gray-500"
                }`}
              >
                {s.label}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="w-8 sm:w-12 h-0.5 bg-gray-200" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  stepNo,
}: {
  icon: React.ReactNode;
  title: string;
  stepNo: number;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
        style={{ background: brand.yellow, color: brand.navy }}
      >
        {stepNo}
      </div>
      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        {icon}
        {title}
      </h2>
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
  /* 0. adım verileri (InvoiceOcrPage yazıyor) */
  const step0 = useMemo<Step0Store>(() => {
    try {
      const raw = localStorage.getItem("outOfRegion.step0");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  /* Adım yönetimi */
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  /* Adım 1 - POD */
  const [pod, setPod] = useState(step0.installationNumber || "");
  const [podChecking, setPodChecking] = useState(false);
  const [podResult, setPodResult] = useState<PodCheckResult | null>(null);
  const [podCreateOpen, setPodCreateOpen] = useState(false);
  const [newPodOwner, setNewPodOwner] = useState(step0.customerName || "");
  const [newPodAddress, setNewPodAddress] = useState(step0.address || "");

  /* Adım 2 - Müşteri */
  const [customerType, setCustomerType] = useState<"bireysel" | "kurumsal">(
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

  /* Adım 3 - Rakip */
  const [competitor, setCompetitor] = useState(step0.companyName || "");
  const [avgBill, setAvgBill] = useState("");
  const [contractEnd, setContractEnd] = useState("");
  const [competitorPrice, setCompetitorPrice] = useState(step0.unitPrice || "");
  const [commitment, setCommitment] = useState<"var" | "yok" | "bilinmiyor">("bilinmiyor");
  const [deposit, setDeposit] = useState<"var" | "yok" | "bilinmiyor">("bilinmiyor");

  /* Özet */
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

  /* Persist taslak */
  useEffect(() => {
    try {
      localStorage.setItem("outOfRegion.wizardDraft", JSON.stringify(summary));
    } catch {}
  }, [summary]);

  /* POD doğrulama (simülasyon) */
  async function checkPod() {
    setPodChecking(true);
    setPodResult(null);
    await new Promise((r) => setTimeout(r, 700));
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
    setSmsOk(smsCode === "1234");
  }

  /* Geçiş kuralları */
  function canGoNextFrom(step: number): boolean {
    if (step === 1) {
      return !!pod && !!podResult?.ok;
    }
    if (step === 2) {
      if (customerType === "bireysel") {
        return !!customerName && !!customerAddress && kvkk && smsOk;
      }
      return !!customerName && !!customerAddress && !!repName && !!repPhone && repConsent;
    }
    if (step === 3) {
      return !!competitor || !!avgBill || !!contractEnd || !!competitorPrice;
    }
    return true;
  }
  const isDone = (n: number) => n < activeStep && canGoNextFrom(n);

  function goNext() {
    if (canGoNextFrom(activeStep)) setActiveStep((s) => Math.min(4, (s + 1) as any));
  }
  function goPrev() {
    setActiveStep((s) => Math.max(1, (s - 1) as any));
  }

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
      alert("Kaydedildi. Ziyaret planlama ekranına yönlendirileceksiniz.");
    } catch {}
    onFinish?.();
  }

  /* ---- UI ---- */
  return (
    <div className="min-h-screen bg-gray-50">
      <FadeStyles />
      <div className="mx-auto max-w-3xl px-3 sm:px-4 py-6">
        {/* Kapsayıcı Kart */}
        <div className="bg-white rounded-2xl border shadow-sm">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b">
            <Stepper active={activeStep} done={isDone} />
          </div>

          {/* İçerik */}
          <div key={activeStep} className="p-4 sm:p-6 fade-in space-y-6">
            {/* Adım 1: POD */}
            {activeStep === 1 && (
              <div>
                <SectionHeader
                  stepNo={1}
                  title="POD Doğrulama"
                  icon={<Hash className="w-5 h-5 text-gray-700" />}
                />
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-sm text-gray-600 mb-1 block">
                      POD Numarası
                    </label>
                    <input
                      value={pod}
                      onChange={(e) => {
                        setPod(e.target.value);
                        setPodResult(null);
                      }}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      placeholder="Tesisat / POD no"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={checkPod}
                      disabled={!pod || podChecking}
                      className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60"
                    >
                      {podChecking ? "Sorgulanıyor..." : "Sistemde Sorgula"}
                    </button>
                  </div>
                </div>

                {podResult && (
                  <div
                    className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${
                      podResult.ok
                        ? "bg-green-50 border-green-200"
                        : "bg-yellow-50 border-yellow-200"
                    }`}
                  >
                    <div className="shrink-0">
                      {podResult.ok ? (
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-8 h-8 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <div className="text-base font-semibold text-gray-900">
                        {podResult.ok ? "Başarılı" : "Kayıt Bulunamadı"}
                      </div>
                      <div className="text-sm text-gray-700 mt-1">{podResult.message}</div>
                      {!podResult.ok && (
                        <div className="mt-3">
                          <button
                            onClick={() => setPodCreateOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg"
                            style={{ background: brand.yellow, color: brand.navy }}
                          >
                            <Plus className="w-4 h-4" />
                            Yeni POD Kaydı Oluştur
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* POD Oluştur Modal */}
                {podCreateOpen && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-4 sm:p-5">
                      <div className="flex items-center justify-between border-b pb-3">
                        <div className="font-semibold text-gray-900">Yeni POD Kaydı</div>
                        <button onClick={() => setPodCreateOpen(false)}>
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="mt-4 space-y-3">
                        <div>
                          <label className="text-sm text-gray-600 mb-1 block">Müşteri Adı</label>
                          <input
                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                            value={newPodOwner}
                            onChange={(e) => setNewPodOwner(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600 mb-1 block">Adres</label>
                          <textarea
                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                            rows={3}
                            value={newPodAddress}
                            onChange={(e) => setNewPodAddress(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="mt-5 flex justify-end gap-2">
                        <button
                          className="px-4 py-2 rounded-lg border"
                          onClick={() => setPodCreateOpen(false)}
                        >
                          Vazgeç
                        </button>
                        <button
                          className="px-4 py-2 rounded-lg text-white"
                          style={{ background: brand.navy }}
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

            {/* Adım 2: Müşteri */}
            {activeStep === 2 && (
              <div>
                <SectionHeader
                  stepNo={2}
                  title="Müşteri Detayları"
                  icon={<User className="w-5 h-5 text-gray-700" />}
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Müşteri Tipi</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      value={customerType}
                      onChange={(e) => {
                        setCustomerType(e.target.value as "bireysel" | "kurumsal");
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
                    <label className="text-sm text-gray-600 mb-1 block">POD</label>
                    <input
                      className="w-full border rounded-lg px-3 py-2 bg-gray-50"
                      value={pod}
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Ad / Ünvan</label>
                    <input
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Adres</label>
                    <textarea
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      rows={3}
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                    />
                  </div>
                </div>

                {/* Bireysel */}
                {customerType === "bireysel" && (
                  <div className="mt-4 p-4 rounded-xl border bg-slate-50">
                    <div className="font-semibold mb-2 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" /> İzinler ve Onaylar
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={kvkk}
                        onChange={(e) => setKvkk(e.target.checked)}
                      />
                      KVKK Aydınlatma ve Açık Rıza Metni’ni onaylıyorum.
                    </label>
                    <label className="flex items-center gap-2 text-sm mt-2">
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
                        <div className="flex flex-wrap items-end gap-2">
                          <div>
                            <label className="text-sm text-gray-600 mb-1 block">SMS Kodu</label>
                            <input
                              value={smsCode}
                              onChange={(e) => setSmsCode(e.target.value)}
                              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
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

                {/* Kurumsal */}
                {customerType === "kurumsal" && (
                  <div className="mt-4 p-4 rounded-xl border bg-slate-50">
                    <div className="font-semibold mb-2 flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Yetkili Kişi Bilgileri
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">Ad Soyad</label>
                        <input
                          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                          value={repName}
                          onChange={(e) => setRepName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">Telefon</label>
                        <input
                          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                          value={repPhone}
                          onChange={(e) => setRepPhone(e.target.value)}
                          placeholder="+90..."
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">E-posta</label>
                        <input
                          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                          value={repMail}
                          onChange={(e) => setRepMail(e.target.value)}
                          placeholder="mail@firma.com"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 mt-3 text-sm">
                      <input
                        type="checkbox"
                        checked={repConsent}
                        onChange={(e) => setRepConsent(e.target.checked)}
                      />
                      Yetkili kişinin iletişim/onay bilgileri tarafımdan alındı.
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Adım 3: Rakip */}
            {activeStep === 3 && (
              <div>
                <SectionHeader
                  stepNo={3}
                  title="Rakip Bilgileri"
                  icon={<Factory className="w-5 h-5 text-gray-700" />}
                />
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="text-sm text-gray-600 mb-1 block">Rakip Şirket</label>
                    <input
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      value={competitor}
                      onChange={(e) => setCompetitor(e.target.value)}
                      placeholder="Enerji A.Ş. vb."
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">
                      Aylık Ortalama Fatura (TL)
                    </label>
                    <input
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      value={avgBill}
                      onChange={(e) => setAvgBill(e.target.value)}
                      placeholder="ör. 12.500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">
                      Sözleşme Bitiş Tarihi
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      value={contractEnd}
                      onChange={(e) => setContractEnd(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Rakip Fiyat / Oran</label>
                    <input
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      value={competitorPrice}
                      onChange={(e) => setCompetitorPrice(e.target.value)}
                      placeholder="ör. 3.25 TL/kWh"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Taahhüt Durumu</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      value={commitment}
                      onChange={(e) => setCommitment(e.target.value as any)}
                    >
                      <option value="bilinmiyor">Bilinmiyor</option>
                      <option value="var">Var</option>
                      <option value="yok">Yok</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Teminat Durumu</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      value={deposit}
                      onChange={(e) => setDeposit(e.target.value as any)}
                    >
                      <option value="bilinmiyor">Bilinmiyor</option>
                      <option value="var">Var</option>
                      <option value="yok">Yok</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Adım 4: Özet */}
            {activeStep === 4 && (
              <div>
                <SectionHeader
                  stepNo={4}
                  title="Özet ve Son Kontrol"
                  icon={<Info className="w-5 h-5 text-gray-700" />}
                />
                <div className="grid gap-4">
                  {/* Müşteri Bilgileri Kartı */}
                  <div className="rounded-xl border p-4">
                    <div className="font-semibold mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Müşteri Bilgileri
                    </div>
                    <ul className="text-sm text-gray-800 space-y-1">
                      <li><b>POD:</b> {summary.pod || "-"}</li>
                      <li><b>Müşteri Tipi:</b> {summary.customerType}</li>
                      <li><b>Ad / Ünvan:</b> {summary.customerName || "-"}</li>
                      <li><b>Adres:</b> {summary.customerAddress || "-"}</li>
                    </ul>
                  </div>

                  {/* Onay / Yetkili Kartı */}
                  <div className="rounded-xl border p-4">
                    <div className="font-semibold mb-2 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" />
                      Onaylar / Yetkili
                    </div>
                    {summary.customerType === "bireysel" ? (
                      <ul className="text-sm text-gray-800 space-y-1">
                        <li>
                          <b>KVKK Onayı:</b> {kvkk ? "✅ Onaylandı" : "❌ Yok"}
                        </li>
                        <li>
                          <b>KVKK Pazarlama İzni:</b> {marketing ? "✅ Var" : "—"}
                        </li>
                        <li>
                          <b>SMS Doğrulama:</b> {smsOk ? "✅ Başarılı" : "❌ Başarısız"}
                        </li>
                      </ul>
                    ) : (
                      <ul className="text-sm text-gray-800 space-y-1">
                        <li><b>Yetkili Adı:</b> {repName || "-"}</li>
                        <li><b>Telefon:</b> {repPhone || "-"}</li>
                        <li><b>E-posta:</b> {repMail || "-"}</li>
                        <li><b>Yetkili Onayı:</b> {repConsent ? "✅ Alındı" : "❌ Yok"}</li>
                      </ul>
                    )}
                  </div>

                  {/* Rakip Analizi Kartı */}
                  <div className="rounded-xl border p-4">
                    <div className="font-semibold mb-2 flex items-center gap-2">
                      <Factory className="w-4 h-4" />
                      Rakip Analizi
                    </div>
                    <ul className="text-sm text-gray-800 space-y-1">
                      <li><b>Rakip Şirket:</b> {competitor || "-"}</li>
                      <li><b>Aylık Ortalama Fatura:</b> {avgBill || "-"}</li>
                      <li><b>Sözleşme Bitiş:</b> {contractEnd || "-"}</li>
                      <li><b>Rakip Fiyat/Oran:</b> {competitorPrice || "-"}</li>
                      <li><b>Taahhüt:</b> {commitment}</li>
                      <li><b>Teminat:</b> {deposit}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Action Bar (kartın içinde, alt sabit) */}
          <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t rounded-b-2xl">
            <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
              {/* SOL: Geri */}
              <div>
                {activeStep === 1 ? (
                  <button
                    onClick={onBack}
                    className="px-4 py-2 rounded-xl border flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Geri
                  </button>
                ) : (
                  <button
                    onClick={goPrev}
                    className="px-4 py-2 rounded-xl border flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Geri
                  </button>
                )}
              </div>

              {/* SAĞ: CTA */}
              <div className="flex gap-2">
                {activeStep < 4 && (
                  <button
                    onClick={goNext}
                    disabled={!canGoNextFrom(activeStep)}
                    className="px-5 py-2 rounded-xl bg-blue-600 text-white flex items-center gap-2 disabled:opacity-50"
                  >
                    İleri <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {activeStep === 4 && (
                  <>
                    <button
                      onClick={saveOnly}
                      className="px-5 py-2 rounded-xl border flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Sadece Kaydet
                    </button>
                    <button
                      onClick={saveAndPlan}
                      className="px-5 py-2 rounded-xl bg-blue-600 text-white flex items-center gap-2"
                    >
                      <CalendarPlus className="w-4 h-4" />
                      Kaydet ve Planla
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
