import React, { useReducer, useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  IdCard, Camera, FileText,
  ChevronRight, ShieldCheck, CheckCircle, XCircle, UserX, Clock,
  Loader2, ScanLine, Nfc, Maximize2, MapPin, Home, Building, Factory,
  Sparkles, Info
} from 'lucide-react';
import { Customer } from '../RouteMap';
import { BRAND_COLORS } from '../styles/theme';

/*************************** Utils ***************************/
const isDev = typeof import.meta !== 'undefined' ? Boolean((import.meta as any).env?.DEV) : false;

const fmtTRY = (n: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(n || 0);

const phoneSanitize = (v: string) => v.replace(/\D+/g, '');
const phoneIsValid = (v: string) => /^05\d{9}$/.test(phoneSanitize(v));

// Very small analytics hook (no-op; wire to your logger)
const track = (event: string, props?: Record<string, any>) => {
  if (isDev) console.debug('[track]', event, props || {});
};

/*************************** Types / Data ***************************/

type Tariff = {
  id: string;
  name: string;
  unitPrice: number;
  type: Customer['customerType'][];
};

const ALL_TARIFFS: Tariff[] = [
  { id: 'standart_mesken', name: 'Standart Konut', unitPrice: 2.10, type: ['Mesken'] },
  { id: 'yesil_evim', name: 'Yeşil Evim', unitPrice: 2.25, type: ['Mesken'] },
  { id: 'is_yeri_eko', name: 'Ekonomik Ticarethane', unitPrice: 3.50, type: ['Ticarethane'] },
  { id: 'is_yeri_pro', name: 'Profesyonel Ticarethane', unitPrice: 3.35, type: ['Ticarethane'] },
  { id: 'sanayi_eko', name: 'Sanayi Avantaj', unitPrice: 3.10, type: ['Sanayi'] },
];

type VisitStatus = 'Pending' | 'InProgress' | 'Completed' | 'Rejected' | 'Unreachable' | 'Postponed';
type FlowStep = 1 | 2 | 3 | 4;

type VerificationStatus = 'idle' | 'scanning' | 'success' | 'error';

type State = {
  visitStatus: VisitStatus;
  currentStep: FlowStep;
  idPhoto: string | null;
  ocrStatus: VerificationStatus;
  nfcStatus: VerificationStatus;
  contractAccepted: boolean;
  smsSent: boolean; // used as OTP-sent flag
  notes: string;
};

type Action =
  | { type: 'SET_VISIT_STATUS'; payload: VisitStatus }
  | { type: 'SET_STEP'; payload: FlowStep }
  | { type: 'SET_ID_PHOTO'; payload: string | null }
  | { type: 'SET_OCR_STATUS'; payload: VerificationStatus }
  | { type: 'SET_NFC_STATUS'; payload: VerificationStatus }
  | { type: 'SET_CONTRACT_ACCEPTED'; payload: boolean }
  | { type: 'SET_SMS_SENT'; payload: boolean }
  | { type: 'SET_NOTES'; payload: string }
  | { type: 'RESET' };

const initialState: State = {
  visitStatus: 'Pending',
  currentStep: 1,
  idPhoto: null,
  ocrStatus: 'idle',
  nfcStatus: 'idle',
  contractAccepted: false,
  smsSent: false,
  notes: '',
};

function visitReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_VISIT_STATUS':
      return { ...initialState, visitStatus: action.payload, notes: state.notes };
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_ID_PHOTO':
      return { ...state, idPhoto: action.payload };
    case 'SET_OCR_STATUS':
      return { ...state, ocrStatus: action.payload };
    case 'SET_NFC_STATUS':
      return { ...state, nfcStatus: action.payload };
    case 'SET_CONTRACT_ACCEPTED':
      return { ...state, contractAccepted: action.payload };
    case 'SET_SMS_SENT':
      return { ...state, smsSent: action.payload };
    case 'SET_NOTES':
      return { ...state, notes: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

type Props = {
  customer: Customer;
  onCloseToList: () => void;
  onCompleteVisit: (updated: Customer, status: VisitStatus, notes: string) => void;
};

/*************************** Root ***************************/

const VisitFlowScreen: React.FC<Props> = ({ customer, onCloseToList, onCompleteVisit }) => {
  const [state, dispatch] = useReducer(visitReducer, initialState);
  const [currentScreen, setCurrentScreen] = useState<'checkin' | 'proposal' | 'flow'>('checkin');

  const handleSaveVisitResult = useCallback(
    (status: VisitStatus) => {
      dispatch({ type: 'SET_VISIT_STATUS', payload: status });
      track('visit_status_set', { status });
      if (status !== 'InProgress') {
        onCompleteVisit(customer, status, state.notes);
        onCloseToList();
      }
    },
    [customer, onCloseToList, onCompleteVisit, state.notes]
  );

  // Non-clickable visual progress indicator
  const StepIndicator = () => (
    <div className="flex items-center gap-2 mb-6" aria-label="Adım İlerlemesi">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="flex items-center">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
              state.currentStep === n
                ? 'text-white shadow-lg transform scale-110'
                : state.currentStep > n
                ? 'text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
            style={{
              backgroundColor: state.currentStep >= n ? BRAND_COLORS.navy : undefined,
            }}
          >
            {state.currentStep > n ? <CheckCircle className="w-5 h-5" /> : n}
          </div>
          {n < 4 && (
            <div
              className={`h-1 w-16 mx-2 rounded-full transition-all duration-500 ${
                state.currentStep > n ? 'bg-[' + BRAND_COLORS.navy + ']' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Ziyaret: {customer.name}</h1>
        <button onClick={onCloseToList} className="text-gray-600 hover:text-gray-900 font-medium">
          ← Listeye Dön
        </button>
      </div>

      {currentScreen === 'checkin' && (
        <CheckInScreen 
          customer={customer} 
          onContinue={() => setCurrentScreen('proposal')} 
        />
      )}

      {currentScreen === 'proposal' && (
        <ProposalScreen 
          customer={customer} 
          onContinue={() => setCurrentScreen('flow')} 
        />
      )}

      {currentScreen === 'flow' && (
        <>
          {state.visitStatus === 'Pending' && (
            <VisitStatusSelection
              onSave={handleSaveVisitResult}
              notes={state.notes}
              setNotes={(notes) => dispatch({ type: 'SET_NOTES', payload: notes })}
            />
          )}

          {state.visitStatus === 'InProgress' && (
            <>
              <StepIndicator />
              {state.currentStep === 1 && (
                <CustomerInfoStep customer={customer} dispatch={dispatch} />
              )}
              {state.currentStep === 2 && (
                <IdVerificationStep state={state} dispatch={dispatch} />
              )}
              {state.currentStep === 3 && (
                <ContractStep state={state} dispatch={dispatch} customer={customer} />
              )}
              {state.currentStep === 4 && (
                <CompletionStep
                  customer={customer}
                  dispatch={dispatch}
                  onComplete={() => handleSaveVisitResult('Completed')}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

/*************************** Check-in ***************************/

const CheckInScreen: React.FC<{ customer: Customer; onContinue: () => void }> = ({ customer, onContinue }) => {
  const [locationStatus, setLocationStatus] = useState<'idle' | 'getting' | 'success' | 'error'>('idle');
  const [distance, setDistance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoAdvancing, setAutoAdvancing] = useState(false);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    setLocationStatus('getting');
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const dist = getDistance(userLat, userLng, customer.lat, customer.lng);
        setDistance(dist);
        setLocationStatus('success');
        track('checkin_location_success', { dist });

        // Auto-advance if location is verified
        if (dist <= 200) {
          setAutoAdvancing(true);
          setTimeout(() => {
            onContinue();
          }, 2000);
        }
      },
      (err) => {
        setError(`Konum alınamadı: ${err.message}`);
        setLocationStatus('error');
        track('checkin_location_error', { code: (err as any)?.code, message: err.message });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [customer.lat, customer.lng, onContinue]);

  const renderStatus = () => {
    switch (locationStatus) {
      case 'getting':
        return (
          <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg animate-pulse">
            <div className="w-4 h-4 bg-blue-300 rounded-full animate-bounce"></div>
            <div className="w-4 h-4 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-4 h-4 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <span className="ml-2 text-blue-700 font-medium">Konum alınıyor...</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 p-4 bg-red-50 rounded-lg border border-red-200">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        );
      case 'success':
        if (distance === null) return null;
        const isClose = distance <= 200;
        
        if (autoAdvancing && isClose) {
          return (
            <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg border border-green-200 animate-pulse">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-700 font-medium">
                Konum doğrulandı ({distance.toFixed(0)}m), yönlendiriliyorsunuz...
              </span>
              <Loader2 className="w-4 h-4 animate-spin text-green-500" />
            </div>
          );
        }

        return isClose ? (
          <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-700 font-medium">
              Müşteri konumundasınız ({distance.toFixed(0)}m).
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <XCircle className="w-5 h-5 text-yellow-500" />
            <span className="text-yellow-700">
              Müşteri konumundan uzaktasınız (~{(distance / 1000).toFixed(1)} km).
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <MapPin className="w-6 h-6" style={{ color: BRAND_COLORS.navy }} />
        <h3 className="text-xl font-semibold">Ziyaret Başlangıç Onayı</h3>
      </div>
      <div className="space-y-4">
        <p className="text-gray-600">Teklif ekranına geçmeden önce, müşterinin lokasyonunda olduğunuzu doğrulayın.</p>
        <div className="p-4 bg-gray-100 rounded-lg">
          <p className="font-semibold">{customer.name}</p>
          <p className="text-sm text-gray-700">
            {customer.address}, {customer.district}
          </p>
          <div className="mt-3">{renderStatus()}</div>
          {locationStatus === 'error' && (
            <button
              className="mt-2 text-sm underline text-blue-600 hover:text-blue-800"
              onClick={() => {
                // allow manual confirmation if GPS blocked
                setLocationStatus('success');
                setDistance(0);
                track('checkin_manual_confirm');
              }}
            >
              Konumu haritada manuel doğrula
            </button>
          )}
        </div>
      </div>
      {!autoAdvancing && (
        <div className="mt-6 text-right">
          <button
            onClick={onContinue}
            className="text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: BRAND_COLORS.navy }}
          >
            Check-in Yap ve Devam Et <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

/*************************** Lead Modal ***************************/

const LeadGenerationModal: React.FC<{ customer: Customer; onClose: () => void }> = ({ customer, onClose }) => {
  const [selectedSolutions, setSelectedSolutions] = useState<string[]>([]);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSolutionToggle = (solution: string) =>
    setSelectedSolutions((prev) => (prev.includes(solution) ? prev.filter((s) => s !== solution) : [...prev, solution]));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    track('lead_submit', { customerId: customer.id, solutions: selectedSolutions, kvkk: kvkkAccepted });
    setIsSubmitted(true);
    setTimeout(onClose, 1500);
  };

  // simple ESC close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal>
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" aria-label="Kapat">
          <XCircle className="w-6 h-6" />
        </button>
        {!isSubmitted ? (
          <form onSubmit={handleSubmit}>
            <h3 className="text-xl font-semibold mb-2">Güneş Enerjisi Çözümleri Talep Formu</h3>
            <p className="text-sm text-gray-600 mb-4">Müşterinin ilgilendiği çözümleri işaretleyin.</p>
            <div className="mb-4 p-3 bg-gray-100 rounded-lg">
              <p className="font-medium">{customer.name}</p>
              <p className="text-sm text-gray-700">{customer.phone}</p>
            </div>
            <div className="mb-4">
              <label className="font-medium">Talep Edilen Çözümler:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {['Güneş Paneli', 'Depolama (Batarya)', 'Şarj İstasyonu (EV)'].map((sol) => (
                  <label
                    key={sol}
                    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedSolutions.includes(sol) ? 'bg-yellow-100 border-yellow-400 transform scale-105' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSolutions.includes(sol)}
                      onChange={() => handleSolutionToggle(sol)}
                      className="h-4 w-4 rounded text-yellow-500 focus:ring-yellow-400"
                    />
                    {sol}
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={kvkkAccepted}
                  onChange={(e) => setKvkkAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded"
                />
                <span>
                  KVKK aydınlatma metnini okudum, anladım. Müşterinin verilerinin bu talep kapsamında işlenmesine ve
                  kendisiyle iletişime geçilmesine onay verdiğini beyan ederim.
                </span>
              </label>
            </div>
            <button
              type="submit"
              disabled={!kvkkAccepted || selectedSolutions.length === 0}
              className="w-full text-gray-900 px-6 py-3 rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              style={{ backgroundColor: BRAND_COLORS.yellow }}
            >
              Talep Oluştur
            </button>
          </form>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold">Talep Alındı!</h3>
            <p className="text-gray-600 mt-2">Müşteriniz en kısa sürede uzman ekibimiz tarafından aranacaktır.</p>
          </div>
        )}
      </div>
    </div>
  );
};

/*************************** Proposal ***************************/

const ProposalScreen: React.FC<{ customer: Customer; onContinue: () => void }> = ({ customer, onContinue }) => {
  const FALLBACK_TARIFF: Tariff = {
    id: 'fallback',
    name: 'Lütfen Bir Tarife Seçin',
    unitPrice: 0,
    type: ['Mesken', 'Ticarethane', 'Sanayi'],
  };

  const [currentUnitPrice, setCurrentUnitPrice] = useState(2.2);
  const [currentConsumption, setCurrentConsumption] = useState(150);
  const [savingsAnimating, setSavingsAnimating] = useState(false);

  const availableTariffs = useMemo(
    () => (customer.customerType ? ALL_TARIFFS.filter((t) => t.type.includes(customer.customerType)) : []),
    [customer.customerType]
  );

  const [selectedTariff, setSelectedTariff] = useState<Tariff>(availableTariffs[0] || FALLBACK_TARIFF);

  // keep selectedTariff in sync with availableTariffs
  useEffect(() => {
    if (!availableTariffs.length) {
      if (selectedTariff.id !== 'fallback') setSelectedTariff(FALLBACK_TARIFF);
      return;
    }
    if (!availableTariffs.some((t) => t.id === selectedTariff.id)) {
      setSelectedTariff(availableTariffs[0]);
    }
  }, [availableTariffs, selectedTariff.id]);

  const currentMonthlyBill = currentUnitPrice * currentConsumption;
  const enerjisaMonthlyBill = selectedTariff.unitPrice * currentConsumption;
  const annualSavings = (currentMonthlyBill - enerjisaMonthlyBill) * 12;

  // Animate savings when values change
  useEffect(() => {
    setSavingsAnimating(true);
    const timer = setTimeout(() => setSavingsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [currentUnitPrice, currentConsumption, selectedTariff.id]);

  const CustomerTypeIcon: Record<NonNullable<Customer['customerType']>, JSX.Element> = {
    Mesken: <Home className="w-6 h-6 text-gray-700" />,
    Ticarethane: <Building className="w-6 h-6 text-gray-700" />,
    Sanayi: <Factory className="w-6 h-6 text-gray-700" />,
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
        <div className="flex justify-between items-start border-b pb-4 mb-4">
          <div>
            <h3 className="text-xl font-semibold">Teklif ve Tasarruf Simülasyonu</h3>
            {customer.isFreeConsumer && (
              <div className="mt-2 flex items-center gap-2 text-sm font-medium text-green-700 bg-green-50 p-2 rounded-md">
                <ShieldCheck className="w-5 h-5" />
                <span>Serbest Tüketici Olmaya Uygun</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
            {customer.customerType ? CustomerTypeIcon[customer.customerType] : <UserX className="w-6 h-6 text-gray-500" />}
            <span className="font-medium">{customer.customerType || 'Tip Belirtilmemiş'}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 border rounded-lg bg-gray-50">
            <h4 className="font-semibold text-lg mb-3">Mevcut Durum</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Birim Fiyat (TL/kWh)</label>
                <div className="mt-1">
                  <input
                    type="range"
                    min="1.5"
                    max="4.0"
                    step="0.01"
                    value={currentUnitPrice}
                    onChange={(e) => setCurrentUnitPrice(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1.5 TL</span>
                    <span className="font-semibold">{currentUnitPrice.toFixed(2)} TL</span>
                    <span>4.0 TL</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Aylık Tüketim (kWh)</label>
                <div className="mt-1">
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="10"
                    value={currentConsumption}
                    onChange={(e) => setCurrentConsumption(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>50 kWh</span>
                    <span className="font-semibold">{currentConsumption} kWh</span>
                    <span>500 kWh</span>
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <p className="text-sm text-gray-600">Tahmini Aylık Fatura</p>
                <p className="text-2xl font-bold text-gray-800">{fmtTRY(currentMonthlyBill)}</p>
              </div>
            </div>
          </div>

          <div className="p-4 border-2 rounded-lg bg-white" style={{ borderColor: BRAND_COLORS.navy }}>
            <h4 className="font-semibold text-lg mb-3" style={{ color: BRAND_COLORS.navy }}>
              Enerjisa Teklifi
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Tarife Seçimi</label>
                {availableTariffs.length === 0 ? (
                  <div className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-700">
                      <Info className="w-4 h-4" />
                      <span className="text-sm font-medium">Bu müşteri tipine uygun tarife bulunamadı.</span>
                    </div>
                    <p className="text-xs text-yellow-600 mt-1">
                      Lütfen müşteri tipini kontrol edin veya özel tarife için yöneticinizle iletişime geçin.
                    </p>
                  </div>
                ) : (
                  <select
                    value={selectedTariff.id}
                    onChange={(e) => setSelectedTariff(ALL_TARIFFS.find((t) => t.id === e.target.value)!)}
                    className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {availableTariffs.map((tariff) => (
                      <option key={tariff.id} value={tariff.id}>
                        {tariff.name}
                      </option>
                    ))}
                  </select>
                )}
                {selectedTariff.id === 'yesil_evim' && (
                  <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Solar çözümlerde %10 indirim sağlar.
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Birim Fiyat (TL/kWh)</p>
                <p className="text-xl font-semibold">{selectedTariff.unitPrice.toFixed(2)} TL</p>
              </div>
              <div className="pt-2">
                <p className="text-sm text-gray-600">Enerjisa ile Tahmini Aylık Fatura</p>
                <p className="text-2xl font-bold" style={{ color: BRAND_COLORS.navy }}>
                  {fmtTRY(enerjisaMonthlyBill)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div 
          className={`mt-6 p-4 rounded-lg border text-center transition-all duration-300 ${
            savingsAnimating ? 'transform scale-105' : ''
          }`} 
          style={{ backgroundColor: '#ECFDF5', borderColor: '#BBF7D0' }}
        >
          <p className="text-lg font-medium" style={{ color: '#065F46' }}>
            Yıllık Tahmini Tasarruf
          </p>
          <p 
            className={`text-4xl font-bold my-2 transition-all duration-300 ${
              savingsAnimating ? 'transform scale-110' : ''
            }`} 
            style={{ color: '#047857' }}
          >
            {selectedTariff.id !== 'fallback' ? (annualSavings > 0 ? fmtTRY(annualSavings) : 'Tasarruf Yok') : '-'}
          </p>
        </div>

        {selectedTariff.id === 'yesil_evim' && (
          <div className="mt-4 p-4 rounded-lg border text-center animate-fade-in" style={{ backgroundColor: '#FEF9C3', borderColor: '#FDE68A' }}>
            <p className="font-medium" style={{ color: '#92400E' }}>
              Güneş enerjisi çözümleriyle ilgileniyor musunuz?
            </p>
            <LeadTrigger />
          </div>
        )}

        <div className="mt-8 text-right">
          <button
            onClick={onContinue}
            className="text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: BRAND_COLORS.navy }}
          >
            Devam Et <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* Host must receive customer for modal */}
      <LeadModalsHost customer={customer} />
    </>
  );
};

// lightweight portal-less modal toggling (keeps code local)
const LeadModalBus: { open: (() => void)[] } = { open: [] };
const LeadTrigger: React.FC = () => {
  return (
    <button
      onClick={() => LeadModalBus.open.forEach((f) => f())}
      className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
      style={{ backgroundColor: BRAND_COLORS.yellow, color: '#111827' }}
    >
      Evet, Teklif İçin Talep Oluştur
    </button>
  );
};
const LeadModalsHost: React.FC<{ customer: Customer }> = ({ customer }) => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const fn = () => setOpen(true);
    LeadModalBus.open.push(fn);
    return () => {
      const i = LeadModalBus.open.indexOf(fn);
      if (i >= 0) LeadModalBus.open.splice(i, 1);
    };
  }, []);
  if (!open) return null;
  return <LeadGenerationModal customer={customer} onClose={() => setOpen(false)} />;
};

/*************************** Visit Status ***************************/

const VisitStatusSelection: React.FC<{
  onSave: (status: VisitStatus) => void;
  notes: string;
  setNotes: (notes: string) => void;
}> = ({ onSave, notes, setNotes }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Ziyaret Sonucunu Belirtin</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BasicStatusButton
          colorClass="hover:bg-green-50 hover:border-green-400 hover:shadow-md"
          icon={<CheckCircle className="w-8 h-8 text-green-500" />}
          title="Sözleşme Başlat"
          desc="Müşteri teklifi kabul etti, sürece başla."
          onClick={() => onSave('InProgress')}
        />
        <BasicStatusButton
          colorClass="hover:bg-red-50 hover:border-red-400 hover:shadow-md"
          icon={<XCircle className="w-8 h-8 text-red-500" />}
          title="Teklifi Reddetti"
          desc="Müşteri teklifi istemedi."
          onClick={() => onSave('Rejected')}
        />
        <BasicStatusButton
          colorClass="hover:bg-yellow-50 hover:border-yellow-400 hover:shadow-md"
          icon={<UserX className="w-8 h-8 text-yellow-500" />}
          title="Ulaşılamadı"
          desc="Müşteri adreste bulunamadı."
          onClick={() => onSave('Unreachable')}
        />
        <BasicStatusButton
          colorClass="hover:bg-blue-50 hover:border-blue-400 hover:shadow-md"
          icon={<Clock className="w-8 h-8 text-blue-500" />}
          title="Ertelendi"
          desc="Müşteri daha sonra görüşmek istedi."
          onClick={() => onSave('Postponed')}
        />
      </div>
      <div className="mt-6">
        <label htmlFor="visitNotes" className="block text-sm font-medium text-gray-700 mb-1">
          Ziyaret Notları (Reddetme/Erteleme Sebebi vb.)
        </label>
        <textarea
          id="visitNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Örn: Müşteri mevcut sağlayıcısından memnun olduğunu belirtti."
        />
      </div>
    </div>
  );
};

const BasicStatusButton: React.FC<{
  colorClass: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}> = ({ colorClass, icon, title, desc, onClick }) => (
  <button
    onClick={onClick}
    className={`p-4 border rounded-lg text-left transition-all duration-200 flex items-center gap-4 transform hover:scale-105 ${colorClass}`}
  >
    {icon}
    <div>
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-gray-600">{desc}</p>
    </div>
  </button>
);

/*************************** Step 1: Customer Info ***************************/

const CustomerInfoStep: React.FC<{ customer: Customer; dispatch: React.Dispatch<Action> }> = ({ customer, dispatch }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <IdCard className="w-5 h-5" style={{ color: BRAND_COLORS.navy }} />
        <h3 className="text-lg font-semibold">1. Müşteri Bilgileri Kontrolü</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-600">Ad Soyad</label>
          <input defaultValue={customer.name} className="w-full mt-1 p-2 border rounded-lg bg-gray-100" readOnly />
        </div>
        <div>
          <label className="text-sm text-gray-600">Telefon</label>
          <input defaultValue={customer.phone} className="w-full mt-1 p-2 border rounded-lg bg-gray-100" readOnly />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm text-gray-600">Adres</label>
          <input
            defaultValue={`${customer.address}, ${customer.district}`}
            className="w-full mt-1 p-2 border rounded-lg bg-gray-100"
            readOnly
          />
        </div>
      </div>
      <div className="mt-6 text-right">
        <button
          onClick={() => dispatch({ type: 'SET_STEP', payload: 2 })}
          className="text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: BRAND_COLORS.navy }}
        >
          Bilgiler Doğru, Devam Et <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/*************************** Step 2: ID Verification ***************************/

const IdVerificationStep: React.FC<{ state: State; dispatch: React.Dispatch<Action> }> = ({ state, dispatch }) => {
  const [isBypassChecked, setIsBypassChecked] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = async () => {
    if (stream) stopCamera();
    setCameraError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(s);
      track('camera_start');
    } catch (err: any) {
      setCameraError(`Kamera başlatılamadı: ${err.message}`);
      track('camera_error', { message: err?.message });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
      track('camera_stop');
    }
  };

  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl && stream) {
      videoEl.srcObject = stream;
      videoEl
        .play()
        .catch((error) => {
          console.error('Video oynatma hatası:', error);
          setCameraError('Kamera başlatıldı ancak video otomatik oynatılamadı.');
        });
    }
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  // also stop when leaving this step
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [state.currentStep, stream]);

  const handleCaptureAndOcr = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const photoDataUrl = canvas.toDataURL('image/jpeg');
    dispatch({ type: 'SET_ID_PHOTO', payload: photoDataUrl });
    dispatch({ type: 'SET_OCR_STATUS', payload: 'scanning' });
    stopCamera();

    // NOTE: replace with real OCR provider; dev-only mock below
    setTimeout(() => {
      if (isDev) {
        dispatch({ type: 'SET_OCR_STATUS', payload: 'success' });
        track('ocr_mock_success');
      } else {
        dispatch({ type: 'SET_OCR_STATUS', payload: 'error' });
      }
    }, 1200);
  };

  const handleNfcRead = () => {
    dispatch({ type: 'SET_NFC_STATUS', payload: 'scanning' });
    // dev-only mock NFC
    setTimeout(() => {
      if (isDev) {
        dispatch({ type: 'SET_NFC_STATUS', payload: 'success' });
        track('nfc_mock_success');
      } else {
        dispatch({ type: 'SET_NFC_STATUS', payload: 'error' });
      }
    }, 900);
  };

  const handleBypassToggle = (isChecked: boolean) => {
    setIsBypassChecked(isChecked);
    if (isChecked) {
      dispatch({ type: 'SET_OCR_STATUS', payload: 'success' });
      dispatch({ type: 'SET_NFC_STATUS', payload: 'success' });
      stopCamera();
    } else {
      dispatch({ type: 'SET_OCR_STATUS', payload: 'idle' });
      dispatch({ type: 'SET_NFC_STATUS', payload: 'idle' });
    }
  };

  const isVerified = state.ocrStatus === 'success' && state.nfcStatus === 'success';

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <ScanLine className="w-5 h-5" style={{ color: BRAND_COLORS.navy }} />
          <h3 className="text-lg font-semibold">2. Kimlik Doğrulama</h3>
        </div>
      
          <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 border border-yellow-300">
            <input
              type="checkbox"
              id="bypass-verification"
              checked={isBypassChecked}
              onChange={(e) => handleBypassToggle(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            <label htmlFor="bypass-verification" className="text-sm font-medium text-yellow-800">
              [TEST] Doğrulamayı Atla
            </label>
          </div>
        
      </div>

      <fieldset disabled={isBypassChecked}>
        <div className={`grid md:grid-cols-2 gap-6 items-start transition-opacity duration-300 ${isBypassChecked ? 'opacity-40' : 'opacity-100'}`}>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Kimlik Fotoğrafı</p>
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
              {!stream && !state.idPhoto && (
                <div className="text-center p-4">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Kamera başlatılıyor...</p>
                </div>
              )}
              <video ref={videoRef} className={`w-full h-full object-cover ${!stream ? 'hidden' : ''}`} autoPlay muted playsInline />
              <canvas ref={canvasRef} className="hidden" />
              {stream && <div className="absolute inset-0 border-[3px] border-dashed border-white/70 m-4 rounded-xl pointer-events-none" />}
              {!stream && state.idPhoto && <img src={state.idPhoto} alt="Çekilen Kimlik" className="w-full h-full object-contain" />}
            </div>
            {cameraError && <p className="text-red-600 text-sm mt-2">{cameraError}</p>}
            <div className="mt-4">
              {state.ocrStatus === 'idle' && (
                <button
                  onClick={stream ? handleCaptureAndOcr : startCamera}
                  className="w-full text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: BRAND_COLORS.navy }}
                >
                  <Camera className="w-4 h-4" /> {stream ? 'Fotoğraf Çek ve Doğrula' : 'Kamerayı Başlat'}
                </button>
              )}
              {state.ocrStatus === 'scanning' && (
                <div className="text-center p-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: BRAND_COLORS.navy }} />
                  <p>Kimlik okunuyor...</p>
                </div>
              )}
              {state.ocrStatus === 'success' && (
                <div className="text-center p-2 text-green-600 font-semibold flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Kimlik başarıyla okundu.
                </div>
              )}
              {state.ocrStatus === 'error' && (
                <div className="text-center p-2 text-red-600">
                  <p className="font-semibold">Kimlik okunamadı!</p>
                  <p className="text-sm">Lütfen daha aydınlık bir ortamda, yansıma olmadan tekrar deneyin.</p>
                  <button onClick={() => dispatch({ type: 'SET_OCR_STATUS', payload: 'idle' })} className="mt-2 text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 transition-colors">
                    Tekrar Dene
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={`transition-all duration-500 ${
            state.ocrStatus === 'success' 
              ? 'opacity-100 transform scale-100' 
              : 'opacity-40 pointer-events-none transform scale-95'
          }`}>
            <p className="text-sm font-medium text-gray-700 mb-2">Çipli Kimlik (NFC) Onayı</p>
            <div className={`p-4 border rounded-lg h-full flex flex-col justify-center items-center transition-all duration-300 ${
              state.ocrStatus === 'success' ? 'border-green-300 bg-green-50/30 shadow-sm' : 'border-gray-200'
            }`}>
              {state.nfcStatus === 'idle' && (
                <button
                  onClick={handleNfcRead}
                  className="px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: BRAND_COLORS.yellow, color: '#111827' }}
                >
                  <Nfc className="w-5 h-5" /> NFC ile Oku
                </button>
              )}
              {state.nfcStatus === 'scanning' && (
                <div className="text-center p-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: BRAND_COLORS.yellow }} />
                  <p>Telefonu kimliğe yaklaştırın...</p>
                </div>
              )}
              {state.nfcStatus === 'success' && (
                <div className="text-center p-2 text-green-600 font-semibold flex items-center justify-center gap-2">
                  <ShieldCheck className="w-5 h-5" /> NFC onayı başarılı.
                </div>
              )}
              {state.nfcStatus === 'error' && <p className="text-red-600">NFC okunamadı.</p>}
              <p className="text-xs text-gray-500 mt-2 text-center">Bu adım, kimlikteki çipten bilgileri alarak güvenliği artırır.</p>
            </div>
          </div>
        </div>
      </fieldset>

      <div className="mt-6 flex justify-between">
        <button onClick={() => dispatch({ type: 'SET_STEP', payload: 1 })} className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50 transition-colors">
          Geri
        </button>
        <div className="relative">
          <button
            onClick={() => dispatch({ type: 'SET_STEP', payload: 3 })}
            disabled={!isVerified}
            className={`px-6 py-3 rounded-lg text-white transition-all ${
              isVerified ? 'hover:opacity-90' : 'bg-gray-300 cursor-not-allowed'
            }`}
            style={{ backgroundColor: isVerified ? BRAND_COLORS.navy : undefined }}
            title={!isVerified ? 'Devam etmek için kimlik doğrulama ve NFC onayı gerekli' : ''}
          >
            Devam Et
          </button>
          {!isVerified && (
            <div className="absolute -top-8 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Devam etmek için imza ve SMS onayı gerekli
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/*************************** Step 3: Contract ***************************/

const ContractStep: React.FC<{ state: State; dispatch: React.Dispatch<Action>; customer: Customer }> = ({ state, dispatch, customer }) => {
  const [flowSmsPhone, setFlowSmsPhone] = useState(() => customer?.phone ?? '');
  const [otp, setOtp] = useState('');
  const [sigOpen, setSigOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const smsSend = () => {
    dispatch({ type: 'SET_SMS_SENT', payload: true });
    track('sms_sent');
  };

  const otpValid = otp.trim() === '0000' || (isDev && otp.trim().length >= 4); // demo logic

  const canContinue = state.contractAccepted && state.smsSent && !!signatureDataUrl && otpValid;

  const getTooltipMessage = () => {
    const missing = [];
    if (!state.contractAccepted) missing.push('sözleşme onayı');
    if (!signatureDataUrl) missing.push('dijital imza');
    if (!state.smsSent) missing.push('SMS onayı');
    else if (!otpValid) missing.push('geçerli SMS kodu');
    
    return missing.length > 0 ? `Devam etmek için ${missing.join(', ')} gerekli` : '';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="w-5 h-5" style={{ color: BRAND_COLORS.navy }} />
        <h3 className="text-lg font-semibold">3. Sözleşme Onayı</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <p className="text-sm text-gray-600 mb-2">Sözleşme Önizleme</p>
          <button
            type="button"
            onClick={() => setContractOpen(true)}
            className="w-full h-64 border rounded-lg bg-white overflow-hidden relative text-left hover:shadow-md transition-shadow"
            aria-label="Sözleşmeyi görüntüle"
          >
            <ContractMockPage customer={customer} signatureDataUrl={signatureDataUrl} scale="preview" />
            <div className="absolute bottom-2 right-2 flex flex-col items-center pointer-events-none">
              <div
                className="h-8 w-8 rounded-full text-gray-900 shadow ring-1 ring-black/10 flex items-center justify-center"
                style={{ backgroundColor: BRAND_COLORS.yellow }}
              >
                <Maximize2 className="h-4 w-4" />
              </div>
            </div>
          </button>

          <label className="mt-4 flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
            <input
              type="checkbox"
              checked={state.contractAccepted}
              onChange={(e) => dispatch({ type: 'SET_CONTRACT_ACCEPTED', payload: e.target.checked })}
              className="h-4 w-4 rounded"
            />
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
                  <button onClick={() => setSigOpen(true)} className="px-3 py-2 rounded-lg border bg-white text-sm hover:bg-gray-50 transition-colors">
                    İmzayı Düzenle
                  </button>
                  <button onClick={() => setSignatureDataUrl(null)} className="px-3 py-2 rounded-lg border bg-white text-sm hover:bg-gray-50 transition-colors">
                    Temizle
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-gray-500">Henüz imza yok.</div>
                <button onClick={() => setSigOpen(true)} className="px-3 py-2 rounded-lg text-white text-sm hover:opacity-90 transition-opacity" style={{ backgroundColor: BRAND_COLORS.navy }}>
                  İmza Al
                </button>
              </div>
            )}
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">SMS ile Onay</p>
            <div className="flex gap-2">
              <input
                value={flowSmsPhone}
                onChange={(e) => setFlowSmsPhone(e.target.value)}
                className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="05XX XXX XX XX"
              />
              <button 
                onClick={smsSend} 
                disabled={!phoneIsValid(flowSmsPhone)} 
                className="px-4 py-2 rounded-lg text-gray-900 disabled:bg-gray-300 hover:opacity-90 transition-opacity" 
                style={{ backgroundColor: BRAND_COLORS.yellow }}
              >
                SMS Gönder
              </button>
            </div>
            {state.smsSent && (
              <div className="mt-2">
                <div className="flex items-center gap-2 text-green-700 text-sm">
                  <ShieldCheck className="w-4 h-4" /> Onay SMS'i gönderildi.
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)} 
                    maxLength={6} 
                    className="p-2 border rounded w-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="Onay Kodu" 
                  />
                  <span className={`text-sm transition-colors ${otpValid ? 'text-green-700' : 'text-gray-500'}`}>
                    {otpValid ? 'Kod doğrulandı' : '0000 demo'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button onClick={() => dispatch({ type: 'SET_STEP', payload: 2 })} className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50 transition-colors">
          Geri
        </button>
        <div className="relative group">
          <button
            onClick={() => dispatch({ type: 'SET_STEP', payload: 4 })}
            disabled={!canContinue}
            className={`px-6 py-3 rounded-lg text-white transition-all ${
              canContinue ? 'hover:opacity-90' : 'bg-gray-300 cursor-not-allowed'
            }`}
            style={{ backgroundColor: canContinue ? BRAND_COLORS.navy : undefined }}
          >
            Sözleşmeyi Onayla ve Bitir
          </button>
          {!canContinue && (
            <div className="absolute bottom-full right-0 mb-2 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              {getTooltipMessage()}
            </div>
          )}
        </div>
      </div>

      {sigOpen && (
        <SignaturePadModal
          onClose={() => setSigOpen(false)}
          onSave={(dataUrl) => {
            setSignatureDataUrl(dataUrl);
            setSigOpen(false);
          }}
        />
      )}
      {contractOpen && (
        <ContractModal customer={customer} signatureDataUrl={signatureDataUrl} onClose={() => setContractOpen(false)} />
      )}
    </div>
  );
};

/*************************** Step 4: Completion ***************************/

const CompletionStep: React.FC<{ customer: Customer; dispatch: React.Dispatch<Action>; onComplete: () => void }> = ({ customer, dispatch, onComplete }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 text-center animate-fade-in">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h3 className="text-2xl font-semibold">Sözleşme Tamamlandı!</h3>
      <p className="text-gray-600 mt-2">
        Müşteri {customer.name} için elektrik satış sözleşmesi başarıyla oluşturulmuştur.
      </p>
      <div className="mt-6 flex justify-center gap-4">
        <button onClick={() => dispatch({ type: 'SET_STEP', payload: 3 })} className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50 transition-colors">
          Geri
        </button>
        <button onClick={onComplete} className="px-8 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors">
          Ziyareti Kaydet
        </button>
      </div>
    </div>
  );
};

/*************************** Signature Modal ***************************/

const SignaturePadModal: React.FC<{ onClose: () => void; onSave: (dataUrl: string) => void }> = ({ onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const fitCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
  };

  useEffect(() => {
    fitCanvas();
    window.addEventListener('resize', fitCanvas);
    return () => window.removeEventListener('resize', fitCanvas);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let drawing = false;
    const getPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const down = (e: PointerEvent) => {
      drawing = true;
      const { x, y } = getPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };
    const move = (e: PointerEvent) => {
      if (!drawing) return;
      const { x, y } = getPos(e);
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();
    };
    const up = () => {
      drawing = false;
    };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointerleave', up);
    return () => {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointerleave', up);
    };
  }, []);

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, rect.width, rect.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL('image/png'));
  };

  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-[10050] flex flex-col bg-black/50">
      <div className="flex items-center justify-between bg-white px-4 py-3 border-b">
        <div className="font-semibold text-gray-900">İmza</div>
        <div className="flex gap-2">
          <button onClick={handleClear} className="px-3 py-1.5 rounded border bg-white text-sm hover:bg-gray-50 transition-colors">
            Temizle
          </button>
          <button onClick={handleSave} className="px-3 py-1.5 rounded text-white text-sm hover:opacity-90 transition-opacity" style={{ backgroundColor: BRAND_COLORS.navy }}>
            Kaydet
          </button>
          <button onClick={onClose} className="px-3 py-1.5 rounded border bg-white text-sm hover:bg-gray-50 transition-colors">
            Kapat
          </button>
        </div>
      </div>
      <div className="flex-1 bg-white">
        <canvas ref={canvasRef} className="h-full w-full" style={{ touchAction: 'none' }} />
      </div>
    </div>
  );
};

/*************************** Contract Mock + Modal ***************************/

const ContractMockPage: React.FC<{ customer: Customer; signatureDataUrl: string | null; scale: 'preview' | 'full' }> = ({ customer, signatureDataUrl, scale }) => {
  const base = scale === 'full'
    ? { pad: 'p-8', title: 'text-2xl', body: 'text-sm', small: 'text-xs' }
    : { pad: 'p-3', title: 'text-base', body: 'text-[10.5px]', small: 'text-[9.5px]' };
  const sigH = scale === 'full' ? 100 : 44;
  const imgMaxH = Math.floor(sigH * 0.8);

  return (
    <div className={`relative h-full w-full ${base.pad} bg-white`}>
      <div className="text-center mb-2">
        <div className={`font-semibold ${base.title} text-gray-900`}>ELEKTRİK SATIŞ SÖZLEŞMESİ</div>
        <div className={`${base.small} text-gray-500`}>Mock • Tek Sayfa</div>
      </div>
      <div className={`space-y-2 ${base.body} text-gray-800`}>
        <p>
          İşbu sözleşme; <strong>{customer.name}</strong> ({customer.address}, {customer.district}) ile Enerjisa Satış A.Ş. arasında,
          elektrik tedariki kapsamındaki hak ve yükümlülükleri belirlemek üzere {new Date().toLocaleDateString()} tarihinde akdedilmiştir.
        </p>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Teslim noktasında ölçüm değerleri esas alınır.</li>
          <li>Faturalandırma aylık dönemler itibarıyla yapılır.</li>
          <li>Ödeme süresi fatura tebliğinden itibaren 10 gündür.</li>
        </ol>
      </div>
      <div className="mt-6 pt-4 border-t">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <div className="border-2 border-dashed border-gray-300 rounded bg-white flex items-center justify-center" style={{ height: sigH }}>
              {signatureDataUrl ? (
                <img src={signatureDataUrl} alt="Müşteri İmzası" style={{ maxHeight: imgMaxH, maxWidth: '90%' }} className="object-contain" />
              ) : (
                <span className={`${base.small} text-gray-400`}>Müşteri İmzası</span>
              )}
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

const ContractModal: React.FC<{ customer: Customer; signatureDataUrl: string | null; onClose: () => void }> = ({ customer, signatureDataUrl, onClose }) => {
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-[10040] flex flex-col bg-black/50">
      <div className="flex items-center justify-between bg-white px-4 py-3 border-b">
        <div className="font-semibold text-gray-900">Sözleşme — Önizleme</div>
        <button onClick={onClose} className="px-3 py-1.5 rounded border bg-white text-sm hover:bg-gray-50 transition-colors">Kapat</button>
      </div>
      <div className="flex-1 bg-gray-100 overflow-auto">
        <div className="mx-auto my-4 bg-white shadow border" style={{ width: 820, minHeight: 1160 }}>
          <ContractMockPage customer={customer} signatureDataUrl={signatureDataUrl} scale="full" />
        </div>
      </div>
    </div>
  );
};

/*************************** Export ***************************/

export default VisitFlowScreen;