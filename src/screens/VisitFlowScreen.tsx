// src/screens/VisitFlowScreen.tsx
import React, { useReducer, useState, useRef, useEffect, useMemo } from "react";
import {
  IdCard, Camera, Smartphone, FileText, PenLine, Send, ChevronRight, ShieldCheck, CheckCircle, XCircle, UserX, Clock,
  Loader2, ScanLine, Nfc, Maximize2, Home, Building2, Factory, AlertTriangle
} from "lucide-react";
import { Customer } from "../RouteMap";

/* ============== Tipler ============== */
type VisitStatus = "Pending" | "InProgress" | "Completed" | "Rejected" | "Unreachable" | "Postponed";
type FlowStep = 1 | 2 | 3 | 4 | 5; // 1: Check-in, 2: Proposal, 3: Negotiation, 4: Contract, 5: Completion
type VerificationStatus = "idle" | "scanning" | "success" | "error";

type State = {
  visitStatus: VisitStatus;
  currentStep: FlowStep;
  idPhoto: string | null;
  ocrStatus: VerificationStatus;
  nfcStatus: VerificationStatus;
  contractAccepted: boolean;
  smsSent: boolean;
  notes: string;
  currentUnitPrice: number;
  currentMonthlyConsumption: number;
  selectedTariffKey: string;
  createdSolarLead: boolean;
};

type Action =
  | { type: "SET_VISIT_STATUS"; payload: VisitStatus }
  | { type: "SET_STEP"; payload: FlowStep }
  | { type: "SET_ID_PHOTO"; payload: string | null }
  | { type: "SET_OCR_STATUS"; payload: VerificationStatus }
  | { type: "SET_NFC_STATUS"; payload: VerificationStatus }
  | { type: "SET_CONTRACT_ACCEPTED"; payload: boolean }
  | { type: "SET_SMS_SENT"; payload: boolean }
  | { type: "SET_NOTES"; payload: string }
  | { type: "SET_UNIT_PRICE"; payload: number }
  | { type: "SET_MONTHLY_CONS"; payload: number }
  | { type: "SET_TARIFF"; payload: string }
  | { type: "SET_SOLAR_LEAD"; payload: boolean }
  | { type: "RESET" };

/* ============== Helpers ============== */
function toNumberSafe(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3, toRad = (d: number) => (d * Math.PI) / 180;
  const dφ = toRad(lat2 - lat1), dλ = toRad(lon2 - lon1);
  const a = Math.sin(dφ / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
const tl = (n: number) =>
  (Number.isFinite(n) ? n : 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " TL";

/* ============== Initial State ============== */
const initialState: State = {
  visitStatus: "InProgress",
  currentStep: 1,
  idPhoto: null,
  ocrStatus: "idle",
  nfcStatus: "idle",
  contractAccepted: false,
  smsSent: false,
  notes: "",
  currentUnitPrice: 3.0,
  currentMonthlyConsumption: 350,
  selectedTariffKey: "standart",
  createdSolarLead: false,
};

/* ============== Reducer ============== */
function visitReducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_VISIT_STATUS": return { ...state, visitStatus: action.payload };
    case "SET_STEP": return { ...state, currentStep: action.payload };
    case "SET_ID_PHOTO": return { ...state, idPhoto: action.payload };
    case "SET_OCR_STATUS": return { ...state, ocrStatus: action.payload };
    case "SET_NFC_STATUS": return { ...state, nfcStatus: action.payload };
    case "SET_CONTRACT_ACCEPTED": return { ...state, contractAccepted: action.payload };
    case "SET_SMS_SENT": return { ...state, smsSent: action.payload };
    case "SET_NOTES": return { ...state, notes: action.payload };
    case "SET_UNIT_PRICE": return { ...state, currentUnitPrice: action.payload };
    case "SET_MONTHLY_CONS": return { ...state, currentMonthlyConsumption: action.payload };
    case "SET_TARIFF": return { ...state, selectedTariffKey: action.payload };
    case "SET_SOLAR_LEAD": return { ...state, createdSolarLead: action.payload };
    case "RESET": return initialState;
    default: return state;
  }
}

/* ============== Props ============== */
type Props = {
  customer: Customer;
  onCloseToList: () => void;
  onCompleteVisit: (updated: Customer, status: VisitStatus, notes: string) => void;
};

/* ============== Main ============== */
const VisitFlowScreen: React.FC<Props> = ({ customer, onCloseToList, onCompleteVisit }) => {
  const [state, dispatch] = useReducer(visitReducer, {
    ...initialState,
    currentUnitPrice: toNumberSafe((customer as any)?.currentUnitPrice, initialState.currentUnitPrice),
    currentMonthlyConsumption: toNumberSafe((customer as any)?.monthlyConsumption, initialState.currentMonthlyConsumption),
  });

  const StepIndicator = () => (
    <div className="flex items-center gap-2 mb-4" aria-label="Adım Göstergesi">
      {[1, 2, 3, 4, 5].map((n) => (
        <div key={n} className={`h-2 rounded-full transition-colors ${state.currentStep >= n ? "bg-[#0099CB]" : "bg-gray-200"}`} style={{ width: 48 }} />
      ))}
    </div>
  );

  const finishVisit = (status: VisitStatus) => {
    dispatch({ type: "SET_VISIT_STATUS", payload: status });
    if (status !== "InProgress") {
      onCompleteVisit(customer, status, state.notes);
      onCloseToList();
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Ziyaret: {customer?.name ?? "—"}</h1>
        <button onClick={onCloseToList} className="text-gray-600 hover:text-gray-900 font-medium">← Listeye Dön</button>
      </div>

      {state.visitStatus === "InProgress" && (
        <>
          <StepIndicator />
          {state.currentStep === 1 && <CheckInStep customer={customer} onProceed={() => dispatch({ type: "SET_STEP", payload: 2 })} />}
          {state.currentStep === 2 && <ProposalStep customer={customer} state={state} dispatch={dispatch} onProceed={() => dispatch({ type: "SET_STEP", payload: 3 })} />}
          {state.currentStep === 3 && (
            <NegotiationDecisionStep
              notes={state.notes}
              setNotes={(v) => dispatch({ type: "SET_NOTES", payload: v })}
              onStartContract={() => dispatch({ type: "SET_STEP", payload: 4 })}
              onRejected={() => finishVisit("Rejected")}
              onPostponed={() => finishVisit("Postponed")}
              onUnreachable={() => finishVisit("Unreachable")}
            />
          )}
          {state.currentStep === 4 && (
            <ContractStep
              state={state}
              dispatch={dispatch}
              customer={customer}
              onNext={() => dispatch({ type: "SET_STEP", payload: 5 })}
            />
          )}
          {state.currentStep === 5 && (
            <CompletionStep
              customer={customer}
              dispatch={dispatch}
              onComplete={() => finishVisit("Completed")}
            />
          )}
        </>
      )}
    </div>
  );
};

/* ============== Adım 1: Check-in ============== */
const CheckInStep: React.FC<{ customer: Customer; onProceed: () => void }> = ({ customer, onProceed }) => {
  const [status, setStatus] = useState<"idle" | "getting" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [distanceM, setDistanceM] = useState<number | null>(null);

  const custLat = toNumberSafe((customer as any)?.lat);
  const custLng = toNumberSafe((customer as any)?.lng);
  const hasCustCoords = Number.isFinite(custLat) && Number.isFinite(custLng);

  const getLocation = () => {
    setStatus("getting"); setErrorMsg(null);
    if (!("geolocation" in navigator)) {
      setStatus("error"); setErrorMsg("Tarayıcınız konum bilgisini desteklemiyor."); return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (hasCustCoords) setDistanceM(haversineMeters(latitude, longitude, custLat, custLng));
        else setDistanceM(null);
        setStatus("ok");
      },
      (err) => { setStatus("error"); setErrorMsg(`Konum alınamadı: ${err.message}`); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => { getLocation(); /* ilk açılışta dene */ }, []); // eslint-disable-line

  const far = (distanceM ?? Infinity) > 200;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Smartphone className="w-5 h-5 text-[#0099CB]" />
          <h3 className="text-lg font-semibold">1. Check-in (Konum Doğrulama)</h3>
        </div>
        <button onClick={getLocation} className="px-3 py-1.5 rounded border text-sm bg-white">Yenile</button>
      </div>

      <div className="space-y-2 text-sm">
        <div><span className="text-gray-600">Müşteri:</span> <span className="font-medium">{customer?.name ?? "—"}</span></div>
        <div><span className="text-gray-600">Adres:</span> <span className="font-medium">{customer?.address ?? "—"}, {customer?.district ?? "—"}</span></div>
        <div className="text-gray-600">
          Durum:&nbsp;
          {status === "getting" && <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Konum alınıyor…</span>}
          {status === "ok" && <span className="text-green-700 font-medium">Konum alındı</span>}
          {status === "idle" && <span>Hazır</span>}
          {status === "error" && <span className="text-red-600 font-medium">Hata</span>}
        </div>
        {hasCustCoords && status === "ok" && (
          <div className="text-gray-600">
            Müşteri adresine uzaklık:{" "}
            <span className={`font-semibold ${far ? "text-orange-600" : "text-green-700"}`}>{distanceM ? `${distanceM.toFixed(0)} m` : "—"}</span> (eşik: 200 m)
          </div>
        )}
        {!hasCustCoords && <div className="text-gray-500">Müşteri koordinatı kayıtlı değil (lat/lng). Mesafe hesaplanamadı.</div>}
        {errorMsg && <div className="text-red-600">{errorMsg}</div>}
        {far && (
          <div className="mt-2 flex items-start gap-2 text-orange-700 bg-orange-50 border border-orange-200 p-2 rounded">
            <AlertTriangle className="w-4 h-4 mt-0.5" />
            <div>Konumunuz müşteri adresinden uzakta görünüyor. Buton yine de aktiftir (test kolaylığı için esnetildi).</div>
          </div>
        )}
      </div>

      <div className="mt-6 text-right">
        <button onClick={onProceed} className="bg-[#0099CB] text-white px-6 py-3 rounded-lg inline-flex items-center gap-2">
          Check-in Yap ve Devam Et <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/* ============== Adım 2: Proposal (tablet yan-yana) ============== */
type ProposalProps = { customer: Customer; state: State; dispatch: React.Dispatch<Action>; onProceed: () => void; };

const ProposalStep: React.FC<ProposalProps> = ({ customer, state, dispatch, onProceed }) => {
  const customerType: "Mesken" | "Ticarethane" | "Sanayi" =
    (String((customer as any)?.customerType || (customer as any)?.type || "Mesken") as any);
  const TypeIcon = customerType === "Mesken" ? Home : customerType === "Sanayi" ? Factory : Building2;

  const tariffs = useMemo(() => {
    const base: Record<string, { name: string; unitPrice: number; desc?: string; isGreen?: boolean }> = {
      standart:  { name: "Standart",        unitPrice: 2.95 },
      avantaj12: { name: "Avantajlı 12 Ay", unitPrice: 2.75, desc: "12 ay sabit fiyat" },
      yesilEvim: { name: "Yeşil Evim",      unitPrice: 3.05, desc: "Yenilenebilir destekli", isGreen: true },
    };
    if (customerType === "Ticarethane") { base.standart.unitPrice = 3.10; base.avantaj12.unitPrice = 2.90; base.yesilEvim.unitPrice = 3.15; }
    if (customerType === "Sanayi")      { base.standart.unitPrice = 3.40; base.avantaj12.unitPrice = 3.20; base.yesilEvim.unitPrice = 3.55; }
    return base;
  }, [customerType]);

  const selectedTariff = tariffs[state.selectedTariffKey] ?? undefined;

  const unitPrice   = state.currentUnitPrice;
  const monthlyCons = state.currentMonthlyConsumption;

  const currentMonthlyBill = unitPrice * monthlyCons;
  const enerUnit        = selectedTariff?.unitPrice ?? 0;
  const enerMonthlyBill = enerUnit * monthlyCons;
  const yearlySaving    = (currentMonthlyBill - enerMonthlyBill) * 12;

  const freeConsumerEligible = monthlyCons * 12 >= 1100; // örnek kural
  const providerName = (customer as any)?.currentProvider || "Mevcut Sağlayıcı";
  const [leadOpen, setLeadOpen] = useState(false);

  return (
    <div className="animate-fade-in">
      {/* üst şerit */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TypeIcon className="w-5 h-5 text-[#0099CB]" />
          <div className="text-lg font-semibold">2. Teklif ve Tasarruf Simülasyonu</div>
          <span className="ml-2 px-2 py-0.5 rounded bg-gray-100 text-xs">{customerType}</span>
        </div>
        <span className={`px-2.5 py-1 rounded text-sm font-medium ${freeConsumerEligible ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          Serbest Tüketici: {freeConsumerEligible ? "Uygun" : "Uygun değil"}
        </span>
      </div>

      {/* iki kolonlu düzen */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Sol Kart: Mevcut Durum */}
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <header className="px-5 py-4 border-b">
            <h3 className="text-lg font-semibold">Mevcut Durum</h3>
          </header>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-sm text-gray-600">Birim Fiyat (TL/kWh)</label>
              <input
                type="number" step="0.01" inputMode="decimal" value={unitPrice}
                onChange={(e) => dispatch({ type: "SET_UNIT_PRICE", payload: Number(e.target.value || 0) })}
                className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0099CB]/40 focus:border-[#0099CB]"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Aylık Tüketim (kWh)</label>
              <input
                type="number" step="1" inputMode="numeric" value={monthlyCons}
                onChange={(e) => dispatch({ type: "SET_MONTHLY_CONS", payload: Math.max(0, Math.floor(Number(e.target.value || 0))) })}
                className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0099CB]/40 focus:border-[#0099CB]"
              />
            </div>
            <div className="pt-2">
              <p className="text-sm text-gray-600">Tahmini Aylık Fatura</p>
              <div className="mt-1 text-2xl font-bold tracking-tight">{tl(currentMonthlyBill)}</div>
            </div>
          </div>
        </section>

        {/* Sağ Kart: Enerjisa Teklifi */}
        <section className="rounded-xl border-2 border-[#0099CB] bg-white shadow-sm">
          <header className="px-5 py-4 border-b bg-[#0099CB]/5">
            <h3 className="text-lg font-semibold text-[#004e63]">Enerjisa Teklifi</h3>
          </header>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-sm text-gray-700 font-medium">Tarife Seçimi</label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0099CB]/40 focus:border-[#0099CB]"
                value={state.selectedTariffKey}
                onChange={(e) => dispatch({ type: "SET_TARIFF", payload: e.target.value })}
              >
                <option value="" disabled>Lütfen Bir Tarife Seçin</option>
                {Object.entries(tariffs).map(([key, t]) => (
                  <option key={key} value={key}>{t.name}</option>
                ))}
              </select>
              {selectedTariff?.isGreen && (
                <div className="mt-2 text-xs p-2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  “Yeşil Evim” seçimi, solar çözümlerde <strong>%10 indirim</strong> sağlar.
                </div>
              )}
              {!!selectedTariff?.desc && (
                <div className="mt-2 text-xs p-2 rounded bg-gray-50 text-gray-700 border">{selectedTariff.desc}</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg bg-gray-50 border p-3">
                <div className="text-gray-600">Birim Fiyat</div>
                <div className="mt-1 font-semibold">{selectedTariff ? `${selectedTariff.unitPrice.toFixed(2)} TL/kWh` : "0.00 TL/kWh"}</div>
              </div>
              <div className="rounded-lg bg-gray-50 border p-3">
                <div className="text-gray-600">Aylık Tüketim</div>
                <div className="mt-1 font-semibold">{monthlyCons} kWh</div>
              </div>
            </div>

            <div className="rounded-lg bg-white border p-3">
              <div className="text-sm text-gray-600">Enerjisa ile Tahmini Aylık Fatura</div>
              <div className="mt-1 text-2xl font-bold tracking-tight">{tl(selectedTariff ? enerMonthlyBill : 0)}</div>
            </div>

            {selectedTariff?.isGreen && (
              <button onClick={() => setLeadOpen(true)} className="w-full rounded-lg bg-emerald-600 text-white py-2 text-sm hover:bg-emerald-700 transition">
                Güneş Enerjisi: Teklif İçin Talep Oluştur
              </button>
            )}
          </div>
        </section>
      </div>

      {/* Yıllık tasarruf banner */}
      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="text-base font-semibold text-emerald-700">Yıllık Tahmini Tasarruf</div>
        <div className="mt-2 text-4xl md:text-5xl font-extrabold text-emerald-700 tracking-tight">
          {tl(Math.max(0, yearlySaving))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex justify-between items-center">
        <p className="text-xs text-gray-500">Değerleri değiştirdikçe tüm hesaplamalar anında güncellenir.</p>
        <button onClick={onProceed} className="bg-[#0099CB] text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 hover:bg-[#0084ac] transition">
          Müzakere Sonucuna Git <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Solar Lead Modal */}
      {leadOpen && (
        <SolarLeadModal
          customer={customer}
          onClose={() => setLeadOpen(false)}
          onSubmit={() => { setLeadOpen(false); alert("Talep oluşturuldu. İlgili ekip kısa sürede arayacaktır."); }}
        />
      )}
    </div>
  );
};

/* ============== Solar Lead Modal ============== */
const SolarLeadModal: React.FC<{ customer: Customer; onClose: () => void; onSubmit: () => void; }> = ({ customer, onClose, onSubmit }) => {
  const [phone, setPhone] = useState((customer as any)?.phone ?? "");
  const [name, setName] = useState(customer?.name ?? "");
  const [options, setOptions] = useState({ panel: true, storage: false, charger: false });
  const [kvkk, setKvkk] = useState(false);
  const disabled = !kvkk || (!options.panel && !options.storage && !options.charger);

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[10060] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-gray-900">Güneş Enerjisi Talebi</div>
          <button onClick={onClose} className="px-3 py-1.5 rounded border bg-white text-sm">Kapat</button>
        </div>

        <div className="grid gap-3">
          <div>
            <label className="text-sm text-gray-600">Ad Soyad</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 p-2 border rounded-lg" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Telefon</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full mt-1 p-2 border rounded-lg" placeholder="5XX XXX XX XX" />
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Çözümler</div>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={options.panel} onChange={(e) => setOptions((s) => ({ ...s, panel: e.target.checked }))} /> Güneş Paneli</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={options.storage} onChange={(e) => setOptions((s) => ({ ...s, storage: e.target.checked }))} /> Depolama</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={options.charger} onChange={(e) => setOptions((s) => ({ ...s, charger: e.target.checked }))} /> Şarj İstasyonu</label>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={kvkk} onChange={(e) => setKvkk(e.target.checked)} /> KVKK bilgilendirmesini okudum ve onaylıyorum.
          </label>
        </div>

        <div className="mt-4 text-right">
          <button disabled={disabled} onClick={onSubmit} className={`px-4 py-2 rounded ${disabled ? "bg-gray-300 text-white" : "bg-emerald-600 text-white"}`}>
            Talep Oluştur
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============== Adım 3: Müzakere Sonucu ============== */
const NegotiationDecisionStep: React.FC<{
  notes: string; setNotes: (v: string) => void;
  onStartContract: () => void; onRejected: () => void; onPostponed: () => void; onUnreachable: () => void;
}> = ({ notes, setNotes, onStartContract, onRejected, onPostponed, onUnreachable }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">3. Müzakere Sonucu</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button onClick={onStartContract} className="p-4 border rounded-lg text-left hover:bg-green-50 hover:border-green-400 transition-colors flex items-center gap-4">
        <CheckCircle className="w-8 h-8 text-green-500" />
        <div><p className="font-semibold text-green-800">Sözleşme Başlat</p><p className="text-sm text-gray-600">Müşteri teklifi kabul etti.</p></div>
      </button>
      <button onClick={onRejected} className="p-4 border rounded-lg text-left hover:bg-red-50 hover:border-red-400 transition-colors flex items-center gap-4">
        <XCircle className="w-8 h-8 text-red-500" />
        <div><p className="font-semibold text-red-800">Teklifi Reddetti</p><p className="text-sm text-gray-600">Müşteri teklifi istemedi.</p></div>
      </button>
      <button onClick={onUnreachable} className="p-4 border rounded-lg text-left hover:bg-yellow-50 hover:border-yellow-400 transition-colors flex items-center gap-4">
        <UserX className="w-8 h-8 text-yellow-500" />
        <div><p className="font-semibold text-yellow-800">Ulaşılamadı</p><p className="text-sm text-gray-600">Müşteri adreste bulunamadı.</p></div>
      </button>
      <button onClick={onPostponed} className="p-4 border rounded-lg text-left hover:bg-blue-50 hover:border-blue-400 transition-colors flex items-center gap-4">
        <Clock className="w-8 h-8 text-blue-500" />
        <div><p className="font-semibold text-blue-800">Ertelendi</p><p className="text-sm text-gray-600">Daha sonra görüşülecek.</p></div>
      </button>
    </div>

    <div className="mt-6">
      <label htmlFor="visitNotes" className="block text-sm font-medium text-gray-700 mb-1">Ziyaret Notları</label>
      <textarea id="visitNotes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full p-2 border rounded-lg" placeholder="Örn: Mevcut sağlayıcıyla taahhütlü, 2 ay sonra tekrar arayın." />
    </div>
  </div>
);

/* ============== Adım 4: Sözleşme & İmza ============== */
const ContractStep: React.FC<{ state: State; dispatch: React.Dispatch<Action>; customer: Customer; onNext: () => void; }> = ({ state, dispatch, customer, onNext }) => {
  const [flowSmsPhone, setFlowSmsPhone] = useState(() => (customer as any)?.phone ?? "");
  const [sigOpen, setSigOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const canContinue = state.contractAccepted && state.smsSent && !!signatureDataUrl;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4"><FileText className="w-5 h-5 text-[#0099CB]" /><h3 className="text-lg font-semibold">4. Sözleşme Onayı</h3></div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <p className="text-sm text-gray-600 mb-2">Sözleşme Önizleme</p>
          <button type="button" onClick={() => setContractOpen(true)} className="w-full h-64 border rounded-lg bg-white overflow-hidden relative text-left" aria-label="Sözleşmeyi görüntüle">
            <ContractMockPage customer={customer} signatureDataUrl={signatureDataUrl} scale="preview" />
            <div className="absolute bottom-2 right-2 flex flex-col items-center pointer-events-none">
              <div className="h-8 w-8 rounded-full bg-[#F9C800] text-gray-900 shadow ring-1 ring-black/10 flex items-center justify-center"><Maximize2 className="h-4 w-4" /></div>
            </div>
          </button>
          <label className="mt-4 flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={state.contractAccepted} onChange={(e) => dispatch({ type: "SET_CONTRACT_ACCEPTED", payload: e.target.checked })} />
            Sözleşme koşullarını okudum ve onaylıyorum.
          </label>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-2">Dijital İmza</p>
          <div className="border rounded-lg p-2 bg-gray-50">
            {signatureDataUrl ? (
              <div className="flex items-center gap-3">
                <img src={signatureDataUrl} alt="İmza" className="h-[120px] w-auto bg-white rounded border" />
                <div className="flex flex-col gap-2">
                  <button onClick={() => setSigOpen(true)} className="px-3 py-2 rounded-lg border bg-white text-sm">İmzayı Düzenle</button>
                  <button onClick={() => setSignatureDataUrl(null)} className="px-3 py-2 rounded-lg border bg-white text-sm">Temizle</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-gray-500">Henüz imza yok.</div>
                <button onClick={() => setSigOpen(true)} className="px-3 py-2 rounded-lg bg-[#0099CB] text-white text-sm">İmza Al</button>
              </div>
            )}
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">SMS ile Onay</p>
            <div className="flex gap-2">
              <input value={flowSmsPhone} onChange={(e) => setFlowSmsPhone(e.target.value)} className="flex-1 p-2 border rounded-lg" placeholder="5XX XXX XX XX" />
              <button onClick={() => dispatch({ type: "SET_SMS_SENT", payload: true })} className="px-4 py-2 bg-[#F9C800] rounded-lg">SMS Gönder</button>
            </div>
            {state.smsSent && <div className="mt-2 flex items-center gap-2 text-green-700 text-sm"><ShieldCheck className="w-4 h-4" /> Onay SMS'i gönderildi.</div>}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button className="px-4 py-2 rounded-lg bg-white border" onClick={() => history.back?.()}>Geri</button>
        <button onClick={onNext} disabled={!canContinue} className={`px-6 py-3 rounded-lg text-white ${canContinue ? "bg-[#0099CB]" : "bg-gray-300"}`}>Sözleşmeyi Onayla ve Bitir</button>
      </div>

      {contractOpen && <ContractModal customer={customer} signatureDataUrl={signatureDataUrl} onClose={() => setContractOpen(false)} />}
      {sigOpen && <SignaturePadModal onClose={() => setSigOpen(false)} onSave={(dataUrl) => { setSignatureDataUrl(dataUrl); setSigOpen(false); }} />}
    </div>
  );
};

/* ============== Adım 5: Tamamlama ============== */
const CompletionStep: React.FC<{ customer: Customer; dispatch: React.Dispatch<Action>; onComplete: () => void; }> =
({ customer, dispatch, onComplete }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 text-center animate-fade-in">
    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
    <h3 className="text-2xl font-semibold">Sözleşme Tamamlandı!</h3>
    <p className="text-gray-600 mt-2">Müşteri {customer?.name ?? "—"} için elektrik satış sözleşmesi başarıyla oluşturulmuştur.</p>
    <div className="mt-6 flex justify-center gap-4">
      <button onClick={() => dispatch({ type: "SET_STEP", payload: 4 })} className="px-4 py-2 rounded-lg bg-white border">Geri</button>
      <button onClick={onComplete} className="px-8 py-3 rounded-lg bg-green-600 text-white font-semibold">Ziyareti Kaydet</button>
    </div>
  </div>
);

/* ============== Signature Modal ============== */
const SignaturePadModal: React.FC<{ onClose: () => void; onSave: (dataUrl: string) => void; }> = ({ onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const scrollY = window.scrollY, { style } = document.body, htmlStyle = document.documentElement.style;
    const prev = { overflow: style.overflow, position: style.position, top: style.top, width: style.width, overscroll: htmlStyle.overscrollBehaviorY as string | undefined };
    style.overflow = "hidden"; style.position = "fixed"; style.top = `-${scrollY}px`; style.width = "100%"; htmlStyle.overscrollBehaviorY = "contain";
    return () => { style.overflow = prev.overflow!; style.position = prev.position!; style.top = prev.top!; style.width = prev.width!; htmlStyle.overscrollBehaviorY = prev.overscroll || ""; window.scrollTo(0, scrollY); };
  }, []);

  const fitCanvas = () => {
    const c = canvasRef.current; if (!c) return;
    const dpr = Math.max(window.devicePixelRatio || 1, 1), r = c.getBoundingClientRect();
    c.width = Math.floor(r.width * dpr); c.height = Math.floor(r.height * dpr);
    const ctx = c.getContext("2d"); if (ctx) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, r.width, r.height); }
  };
  useEffect(() => { fitCanvas(); const onResize = () => fitCanvas(); window.addEventListener("resize", onResize); return () => window.removeEventListener("resize", onResize); }, []);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return; const ctx = c.getContext("2d"); if (!ctx) return;
    c.style.touchAction = "none"; let drawing = false;
    const pos = (e: PointerEvent) => { const r = c.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const down = (e: PointerEvent) => { drawing = true; c.setPointerCapture(e.pointerId); const { x, y } = pos(e); ctx.beginPath(); ctx.moveTo(x, y); };
    const move = (e: PointerEvent) => { if (!drawing) return; const { x, y } = pos(e); ctx.lineTo(x, y); ctx.strokeStyle = "#111"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.stroke(); };
    const up = (e: PointerEvent) => { drawing = false; try { c.releasePointerCapture(e.pointerId); } catch {} };
    c.addEventListener("pointerdown", down); c.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    return () => { c.removeEventListener("pointerdown", down); c.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, []);

  const handleClear = () => { const c = canvasRef.current, ctx = c?.getContext("2d"); if (!c || !ctx) return; const r = c.getBoundingClientRect(); ctx.clearRect(0, 0, r.width, r.height); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, r.width, r.height); };
  const handleSave = () => { const c = canvasRef.current; if (!c) return; onSave(c.toDataURL("image/png")); };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[10050] flex flex-col bg-black/50">
      <div className="flex items-center justify-between bg-white px-4 py-3 border-b">
        <div className="font-semibold text-gray-900">İmza</div>
        <div className="flex gap-2">
          <button onClick={handleClear} className="px-3 py-1.5 rounded border bg-white text-sm">Temizle</button>
          <button onClick={handleSave} className="px-3 py-1.5 rounded bg-[#0099CB] text-white text-sm">Kaydet</button>
          <button onClick={onClose} className="px-3 py-1.5 rounded border bg-white text-sm">Kapat</button>
        </div>
      </div>
      <div className="flex-1 bg-white"><div className="h-full w-full"><canvas ref={canvasRef} className="h-[calc(100vh-56px)] w-full block" /></div></div>
    </div>
  );
};

/* ============== Contract Mock Page ============== */
const ContractMockPage: React.FC<{ customer: Customer; signatureDataUrl: string | null; scale: "preview" | "full"; }> =
({ customer, signatureDataUrl, scale }) => {
  const base = scale === "full" ? { pad: "p-8", title: "text-2xl", body: "text-sm", small: "text-xs" } : { pad: "p-3", title: "text-base", body: "text-[10.5px]", small: "text-[9.5px]" };
  const sigH = scale === "full" ? 100 : 44, imgMaxH = Math.floor(sigH * 0.8);
  const cName = customer?.name ?? "—", cAddress = customer?.address ?? "—", cDistrict = customer?.district ?? "—", cPhone = (customer as any)?.phone ?? "—";

  return (
    <div className={`relative h-full w-full ${base.pad} bg-white`}>
      <div className="text-center mb-2">
        <div className={`font-semibold ${base.title} text-gray-900`}>ELEKTRİK SATIŞ SÖZLEŞMESİ</div>
        <div className={`${base.small} text-gray-500`}>Mock • Tek Sayfa</div>
      </div>
      <div className={`space-y-2 ${base.body} text-gray-800`}>
        <p>İşbu sözleşme; <strong>{cName}</strong> ({cAddress}, {cDistrict}) ile Enerjisa Satış A.Ş. arasında {new Date().toLocaleDateString()} tarihinde akdedilmiştir.</p>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Teslim noktasında ölçüm değerleri esas alınır.</li>
          <li>Faturalandırma aylık dönemler itibarıyla yapılır.</li>
          <li>Ödeme süresi fatura tebliğinden itibaren 10 gündür.</li>
          <li>Cayma süresi imzadan itibaren 14 gündür.</li>
          <li>Kişisel veriler 6698 sayılı KVKK kapsamında işlenir.</li>
        </ol>

        <div className="grid grid-cols-2 gap-4 mt-3">
          <div className="border rounded p-2">
            <div className="font-medium mb-1">Müşteri</div>
            <div className={base.small}>Ad Soyad / Ünvan: {cName}</div>
            <div className={base.small}>Adres: {cAddress}, {cDistrict}</div>
            <div className={base.small}>Telefon: {cPhone}</div>
          </div>
          <div className="border rounded p-2">
            <div className="font-medium mb-1">Tedarikçi</div>
            <div className={base.small}>Enerjisa Satış A.Ş.</div>
            <div className={base.small}>Mersis: 000000000000000</div>
            <div className={base.small}>Adres: İstanbul, TR</div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <div className="border-2 border-dashed border-gray-300 rounded bg-white flex items-center justify-center" style={{ height: sigH }}>
              {signatureDataUrl ? <img src={signatureDataUrl} alt="Müşteri İmzası" style={{ maxHeight: imgMaxH, maxWidth: "90%" }} className="object-contain" /> : <span className={`${base.small} text-gray-400`}>Müşteri İmzası</span>}
            </div>
            <div className={`${base.small} mt-1 text-gray-500 text-center`}>Müşteri İmzası</div>
          </div>
          <div className="flex flex-col">
            <div className="border-2 border-dashed border-gray-300 rounded bg-white flex items-center justify-center" style={{ height: sigH }}>
              <span className={`${base.small} text-gray-400`}>Tedarikçi İmzası</span>
            </div>
            <div className={`${base.small} mt-1 text-gray-500 text-center`}>Tedarikçi İmzası</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============== Contract Modal ============== */
const ContractModal: React.FC<{ customer: Customer; signatureDataUrl: string | null; onClose: () => void; }> =
({ customer, signatureDataUrl, onClose }) => {
  useEffect(() => {
    const scrollY = window.scrollY, { style } = document.body, htmlStyle = document.documentElement.style;
    const prev = { overflow: style.overflow, position: style.position, top: style.top, width: style.width, overscroll: htmlStyle.overscrollBehaviorY as string | undefined };
    style.overflow = "hidden"; style.position = "fixed"; style.top = `-${scrollY}px`; style.width = "100%"; htmlStyle.overscrollBehaviorY = "contain";
    return () => { style.overflow = prev.overflow!; style.position = prev.position!; style.top = prev.top!; style.width = prev.width!; htmlStyle.overscrollBehaviorY = prev.overscroll || ""; window.scrollTo(0, scrollY); };
  }, []);

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[10040] flex flex-col bg-black/50">
      <div className="flex items-center justify-between bg-white px-4 py-3 border-b">
        <div className="font-semibold text-gray-900">Sözleşme — Önizleme</div>
        <button onClick={onClose} className="px-3 py-1.5 rounded border bg-white text-sm">Kapat</button>
      </div>
      <div className="flex-1 bg-gray-100 overflow-auto">
        <div className="mx-auto my-4 bg-white shadow border" style={{ width: 820, minHeight: 1160 }}>
          <ContractMockPage customer={customer} signatureDataUrl={signatureDataUrl} scale="full" />
        </div>
      </div>
    </div>
  );
};

export default VisitFlowScreen;
