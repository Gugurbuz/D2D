import React, { useReducer, useState, useRef, useEffect } from 'react';

// İkonları import ediyoruz
import {
  IdCard, Camera, Smartphone, FileText, PenLine, Send,
  ChevronRight, ShieldCheck, CheckCircle, XCircle, UserX, Clock,
  Loader2, ScanLine, Nfc, Maximize2, Hourglass, Sparkles, TrendingUp, ChevronsRight,
  Home, Building, Factory, MapPin, AlertTriangle, Info // Müşteri tipi ve Check-in için yeni ikonlar
} from 'lucide-react';

// --- GEREKLİ TİPLER ---
export interface Customer {
  id: number;
  name: string;
  address: string;
  district: string;
  phone: string;
  status: 'Pending' | 'Completed' | 'Rejected' | 'Postponed' | 'Unreachable' | 'Evaluating';
  notes?: string;
  subscriberType: 'Mesken' | 'Ticarethane' | 'Sanayi';
  isEligible: boolean;
  currentProvider: string;
  currentKwhPrice: number;
  avgMonthlyConsumptionKwh: number;
  lat: number;
  lon: number;
}

// ==================================================================
// ==================== ZİYARET AKIŞ EKRANI =========================
// ==================================================================

type VisitStatus =
  | 'Pending'
  | 'InProgress'
  | 'Completed'
  | 'Rejected'
  | 'Unreachable'
  | 'Postponed'
  | 'Evaluating';

type FlowStep = 1 | 2 | 3 | 4;

type VerificationStatus = 'idle' | 'scanning' | 'success' | 'error';

type State = {
  visitStatus: VisitStatus;
  currentStep: FlowStep;
  idPhoto: string | null;
  ocrStatus: VerificationStatus;
  nfcStatus: VerificationStatus;
  contractAccepted: boolean;
  smsSent: boolean;
  notes: string;
  rejectionReason: string | null;
  rescheduledDate: string | null;
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
  | { type: 'SET_REJECTION_REASON'; payload: string | null }
  | { type: 'SET_RESCHEDULED_DATE'; payload: string | null }
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
  rejectionReason: null,
  rescheduledDate: null,
};

function visitReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_VISIT_STATUS':
      if (action.payload !== 'InProgress') {
         return { ...initialState, visitStatus: action.payload, notes: state.notes };
      }
      return { ...state, visitStatus: action.payload };
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_ID_PHOTO': return { ...state, idPhoto: action.payload };
    case 'SET_OCR_STATUS': return { ...state, ocrStatus: action.payload };
    case 'SET_NFC_STATUS': return { ...state, nfcStatus: action.payload };
    case 'SET_CONTRACT_ACCEPTED': return { ...state, contractAccepted: action.payload };
    case 'SET_SMS_SENT': return { ...state, smsSent: action.payload };
    case 'SET_NOTES': return { ...state, notes: action.payload };
    case 'SET_REJECTION_REASON': return { ...state, rejectionReason: action.payload, rescheduledDate: null };
    case 'SET_RESCHEDULED_DATE': return { ...state, rescheduledDate: action.payload, rejectionReason: null };
    case 'RESET': return initialState;
    default:
      return state;
  }
}

type VisitFlowProps = {
  customer: Customer;
  onCloseToList: () => void;
  onCompleteVisit: (updated: Customer, status: VisitStatus, notes: string) => void;
};

const VisitFlowScreen: React.FC<VisitFlowProps> = ({ customer, onCloseToList, onCompleteVisit }) => {
  const [state, dispatch] = useReducer(visitReducer, initialState);

  const handleStatusSelect = (status: VisitStatus) => {
    dispatch({ type: 'SET_VISIT_STATUS', payload: status });
  };

  const handleFinalizeVisit = () => {
    let finalNotes = state.notes;
    if (state.rejectionReason) {
        finalNotes = `Sebep: ${state.rejectionReason}\n\nNotlar:\n${state.notes}`;
    } else if (state.rescheduledDate) {
        const formattedDate = new Date(state.rescheduledDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
        finalNotes = `Yeni Randevu Tarihi: ${formattedDate}\n\nNotlar:\n${state.notes}`;
    }
    onCompleteVisit(customer, state.visitStatus, finalNotes);
    onCloseToList();
  };
  
  const StepIndicator = () => ( <div className="flex items-center gap-2 mb-4"> {[1, 2, 3, 4].map(n => ( <div key={n} className={`h-2 rounded-full transition-colors ${state.currentStep >= n ? 'bg-[#0099CB]' : 'bg-gray-200'}`} style={{ width: 56 }} /> ))} </div> );
  const isFinalizing = ['Rejected', 'Unreachable', 'Postponed', 'Evaluating'].includes(state.visitStatus);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Ziyaret: {customer.name}</h1>
        <button onClick={onCloseToList} className="text-gray-600 hover:text-gray-900 font-medium text-sm sm:text-base">← Başa Dön</button>
      </div>
      {state.visitStatus === 'Pending' && <VisitStatusSelection onSelect={handleStatusSelect} />}
      {state.visitStatus === 'InProgress' && (
        <>
          <StepIndicator />
          {state.currentStep === 1 && <CustomerInfoStep customer={customer} dispatch={dispatch} />}
          {state.currentStep === 2 && <IdVerificationStep state={state} dispatch={dispatch} />}
          {state.currentStep === 3 && <ContractStep state={state} dispatch={dispatch} customer={customer} />}
          {state.currentStep === 4 && <CompletionStep customer={customer} dispatch={dispatch} onComplete={() => { onCompleteVisit(customer, 'Completed', state.notes); onCloseToList(); }} />}
        </>
      )}
      {isFinalizing && <FinalizeVisitScreen state={state} dispatch={dispatch} onFinalize={handleFinalizeVisit} onBack={() => dispatch({type: 'SET_VISIT_STATUS', payload: 'Pending'})} />}
    </div>
  );
};

// --- YARDIMCI BİLEŞENLER ---
// (VisitStatusSelection, FinalizeVisitScreen, CustomerInfoStep, IdVerificationStep, ContractStep, CompletionStep, SignaturePadModal, ContractMockPage, ContractModal)
// Bu bileşenler bir önceki versiyonla aynı olduğu için kod bloğunu kısaltmak adına gizlenmiştir.
// ...

// ==================================================================
// ==================== SOLAR LEAD MODAL ============================
// ==================================================================

const SolarLeadModal: React.FC<{ customer: Customer; onClose: () => void; }> = ({ customer, onClose }) => {
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [kvkkAccepted, setKvkkAccepted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleProductChange = (product: string) => {
        setSelectedProducts(prev => 
            prev.includes(product) ? prev.filter(p => p !== product) : [...prev, product]
        );
    };

    const handleSubmit = () => {
        setError(null);
        if (!kvkkAccepted || selectedProducts.length === 0) {
            setError("Lütfen en az bir ürün seçin ve KVKK metnini onaylayın.");
            return;
        }

        const leadData = {
            customerName: customer.name,
            customerPhone: customer.phone,
            requestedProducts: selectedProducts,
            kvkkConsent: kvkkAccepted,
            timestamp: new Date().toISOString()
        };
        
        console.log("SOLAR LEAD CREATED:", leadData);
        setIsSubmitted(true);
    };

    const products = ['Güneş Paneli', 'Depolama Ünitesi', 'Şarj İstasyonu'];

    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[10050] bg-black/60 flex items-center justify-center p-4 animate-fade-in">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative">
                {isSubmitted ? (
                    <div className="text-center p-4">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-800">Talep Başarıyla Alındı!</h2>
                        <p className="text-sm text-gray-600 mt-2">Güneş enerjisi çözümleri talebiniz ilgili ekibe başarıyla iletilmiştir. Müşterimizle en kısa sürede iletişime geçilecektir.</p>
                        <button onClick={onClose} className="mt-6 w-full bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700">Harika, Kapat</button>
                    </div>
                ) : (
                    <>
                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><XCircle className="w-6 h-6"/></button>
                        <h2 className="text-xl font-bold text-gray-800">Güneş Enerjisi Çözümleri Talep Formu</h2>
                        <p className="text-sm text-gray-600 mt-1">Bu form ile ilgili ekibe talep oluşturulacak ve müşteriyle detaylar için iletişime geçilecektir.</p>
                        
                        <div className="mt-6 space-y-4">
                            <div><label className="text-xs font-medium text-gray-500">Müşteri Adı Soyadı</label><input type="text" value={customer.name} readOnly className="w-full mt-1 p-2 border rounded-lg bg-gray-100" /></div>
                            <div><label className="text-xs font-medium text-gray-500">Telefon Numarası</label><input type="text" value={customer.phone} readOnly className="w-full mt-1 p-2 border rounded-lg bg-gray-100" /></div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-2">Talep Edilen Çözümler</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {products.map(product => (<label key={product} className={`p-3 border rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${selectedProducts.includes(product) ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300' : 'hover:bg-gray-50'}`}><input type="checkbox" checked={selectedProducts.includes(product)} onChange={() => handleProductChange(product)} className="h-4 w-4 text-[#0099CB] border-gray-300 focus:ring-[#0099CB]" /><span className="text-sm font-medium text-gray-700">{product}</span></label>))}
                                </div>
                            </div>
                            <div className="pt-4 border-t">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input type="checkbox" checked={kvkkAccepted} onChange={e => setKvkkAccepted(e.target.checked)} className="h-4 w-4 text-[#0099CB] border-gray-300 focus:ring-[#0099CB] mt-0.5" />
                                    <span className="text-xs text-gray-600">Müşterinin, kişisel verilerinin Güneş Enerjisi Çözümleri hakkında bilgilendirme ve teklif sunulması amacıyla işlenmesine ve kendisiyle bu kanallar üzerinden iletişime geçilmesine onay verdiğini beyan ederim.</span>
                                </label>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col items-end gap-3">
                            {error && <p className="text-sm text-red-600 text-right w-full">{error}</p>}
                            <div className="flex gap-3">
                                <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200">Vazgeç</button>
                                <button onClick={handleSubmit} disabled={!kvkkAccepted || selectedProducts.length === 0} className="px-6 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:bg-gray-300">Talep Oluştur</button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// ==================================================================
// ==================== YENİ TEKLİF EKRANI ==========================
// ==================================================================

type Tariff = { name: string; price: number; isSolar?: boolean };

const enerjisaTariffs: Record<Customer['subscriberType'], Tariff[]> = {
    'Mesken': [ { name: 'Dinamik tarife', price: 1.99 }, { name: 'Pratik tarife', price: 1.85 }, { name: 'Yeşil Evim', price: 2.15, isSolar: true }, ],
    'Ticarethane': [ { name: 'Esnaf Dostu', price: 2.15 }, { name: 'İş Yeri Pro', price: 2.05 }, { name: 'Sanayi Tipi', price: 1.95 }, ],
    'Sanayi': [ { name: 'Üretim Gücü', price: 1.80 }, { name: 'Ağır Sanayi Plus', price: 1.72 }, ]
};

const subscriberTypeInfo = {
    'Mesken': { icon: <Home className="w-5 h-5"/>, color: "text-cyan-600 bg-cyan-50" },
    'Ticarethane': { icon: <Building className="w-5 h-5"/>, color: "text-orange-600 bg-orange-50" },
    'Sanayi': { icon: <Factory className="w-5 h-5"/>, color: "text-slate-600 bg-slate-100" },
}

const ProposalScreen: React.FC<{ customer: Customer; onProceed: () => void; onCancel: () => void; }> = ({ customer, onProceed, onCancel }) => {
    const [currentPrice, setCurrentPrice] = useState(customer.currentKwhPrice);
    const [currentConsumption, setCurrentConsumption] = useState(customer.avgMonthlyConsumptionKwh);
    const availableTariffs = enerjisaTariffs[customer.subscriberType];
    const [selectedTariff, setSelectedTariff] = useState<Tariff>(availableTariffs[0]);
    const [isSolarModalOpen, setSolarModalOpen] = useState(false);
    const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
    const currentMonthlyBill = currentPrice * currentConsumption;
    const enerjisaMonthlyBill = selectedTariff.price * currentConsumption;
    const annualSavings = (currentMonthlyBill - enerjisaMonthlyBill) * 12;
    const typeInfo = subscriberTypeInfo[customer.subscriberType];

    return (
        <>
            <div className="p-4 sm:p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                     <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Müşteri Teklifi ve Analiz</h1>
                     <button onClick={onCancel} className="text-gray-600 hover:text-gray-900 font-medium text-sm sm:text-base">← Başa Dön</button>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="pb-4 border-b flex justify-between items-start">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">{customer.name}</h2>
                            <p className="text-sm text-gray-500">{customer.address}</p>
                            <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 ${typeInfo.color} rounded-full text-sm font-medium`}>{typeInfo.icon} {customer.subscriberType}</div>
                        </div>
                        {customer.isEligible ? ( <div className="flex-shrink-0 ml-4 inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"><CheckCircle className="w-4 h-4" /> Serbest Tüketici</div>) : ( <div className="flex-shrink-0 ml-4 inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"><XCircle className="w-4 h-4" /> Uygun Değil</div>)}
                    </div>
                    <div className="grid md:grid-cols-2 gap-x-6 gap-y-8 mt-6">
                        <div className="md:border-r md:pr-6">
                            <h3 className="font-semibold text-gray-700">Mevcut Durum Analizi</h3>
                            <div className="mt-4 space-y-4">
                                <div><label className="text-xs text-gray-500">Mevcut Birim Fiyat (kWh)</label><div className="flex items-center mt-1"><input type="number" step="0.01" value={currentPrice} onChange={e => setCurrentPrice(parseFloat(e.target.value) || 0)} className="w-full p-2 border rounded-lg" /><span className="ml-2 font-semibold text-gray-600">TL</span></div></div>
                                <div><label className="text-xs text-gray-500">Ort. Aylık Tüketim (kWh)</label><div className="flex items-center mt-1"><input type="number" step="10" value={currentConsumption} onChange={e => setCurrentConsumption(parseFloat(e.target.value) || 0)} className="w-full p-2 border rounded-lg" /><span className="ml-2 font-semibold text-gray-600">kWh</span></div></div>
                                <div className="pt-2 border-t"><p className="text-xs text-gray-500">Hesaplanan Aylık Fatura</p><p className="font-medium text-lg text-red-600">{formatCurrency(currentMonthlyBill)}</p></div>
                            </div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg">
                             <h3 className="font-bold text-[#0099CB] flex items-center gap-2"><Sparkles className="w-5 h-5"/> Enerjisa Teklif Simülasyonu</h3>
                             <div className="mt-4 space-y-2">
                                <p className="text-xs text-gray-500 mb-1">Uygun Tarife Seçimi</p>
                                {availableTariffs.map(tariff => (
                                <label key={tariff.name} className={`p-3 border rounded-lg cursor-pointer transition-colors flex flex-col ${selectedTariff.name === tariff.name ? 'bg-white border-blue-400 ring-2 ring-blue-300' : 'hover:bg-blue-100'}`}>
                                    <div className="flex justify-between items-center w-full">
                                        <span className="text-sm font-semibold text-gray-800">{tariff.name}</span>
                                        <span className="font-bold text-sm text-[#0099CB]">{formatCurrency(tariff.price)}</span>
                                    </div>
                                    {tariff.isSolar && (
                                    <div className="mt-2 text-xs text-green-700 bg-green-50 p-1.5 rounded flex items-center gap-1 w-full">
                                        <Info className="w-4 h-4 flex-shrink-0" />
                                        <span className="min-w-0">Bu tarife ile solar çözümlerde %10 indirim!</span>
                                    </div>
                                    )}
                                    <input type="radio" name="tariff" checked={selectedTariff.name === tariff.name} onChange={() => setSelectedTariff(tariff)} className="sr-only"/>
                                </label>
                                ))}
                             </div>
                             {selectedTariff.isSolar && (
                                <div className="mt-4 pt-4 border-t border-blue-200 text-center animate-fade-in">
                                    <p className="text-sm text-gray-700">Müşteriniz güneş enerjisi çözümleriyle ilgileniyor mu?</p>
                                    <button onClick={() => setSolarModalOpen(true)} className="mt-2 bg-yellow-400 text-yellow-900 px-4 py-1.5 rounded-lg font-semibold hover:bg-yellow-500 transition-colors text-sm">Evet, Teklif İçin Talep Oluştur</button>
                                </div>
                             )}
                             <div className="pt-3 mt-3 border-t"><p className="text-xs text-gray-500">Enerjisa ile Tahmini Aylık Fatura</p><p className="font-bold text-xl text-green-600">{formatCurrency(enerjisaMonthlyBill)}</p></div>
                        </div>
                    </div>
                    {annualSavings > 0 && ( <div className="mt-8 p-4 bg-green-100 border border-green-200 rounded-lg text-center md:col-span-2"> <p className="text-sm font-semibold text-green-800 flex items-center justify-center gap-2"><TrendingUp className="w-5 h-5"/> Tahmini Yıllık Tasarruf</p> <p className="text-3xl font-bold text-green-700">{formatCurrency(annualSavings)}</p> </div> )}
                     <div className="mt-8 text-center md:col-span-2"><button onClick={onProceed} disabled={!customer.isEligible} className="bg-[#0099CB] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#007ca8] transition-colors inline-flex items-center gap-2 text-lg disabled:bg-gray-300 disabled:cursor-not-allowed">Müzakere Sonucuna Git <ChevronsRight className="w-5 h-5"/></button></div>
                </div>
            </div>
            {isSolarModalOpen && <SolarLeadModal customer={customer} onClose={() => setSolarModalOpen(false)} />}
        </>
    );
};

// ==================================================================
// ==================== YENİ CHECK-IN EKRANI ========================
// ==================================================================

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180; const a = 0.5 - Math.cos(dLat)/2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * (1 - Math.cos(dLon)) / 2; return R * 2 * Math.asin(Math.sqrt(a));
}

const CheckInScreen: React.FC<{customer: Customer; onCheckInSuccess: () => void; onCancel: () => void;}> = ({ customer, onCheckInSuccess, onCancel }) => {
    const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [distance, setDistance] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const checkInTime = new Date();
    const CHECK_IN_RADIUS_KM = 0.2; // 200 metre tolerans

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLon = position.coords.longitude;
                const dist = calculateDistance(userLat, userLon, customer.lat, customer.lon);
                setDistance(dist);
                setLocationStatus('success');
            },
            (error) => {
                let msg = "Konum bilgisi alınamadı.";
                if (error.code === 1) msg = "Konum izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.";
                setErrorMessage(msg);
                setLocationStatus('error');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, [customer.lat, customer.lon]);
    
    const isCheckInAllowed = distance !== null && distance <= CHECK_IN_RADIUS_KM;
    // TEST MODU: Konum hatası olsa bile devam etmeye izin ver.
    const canProceedForTesting = locationStatus !== 'loading';

    return (
        <div className="p-4 sm:p-6 max-w-lg mx-auto bg-gray-50 min-h-screen flex items-center justify-center animate-fade-in">
            <div className="w-full bg-white rounded-xl shadow-lg p-8">
                <div className="text-center">
                    <MapPin className="w-16 h-16 text-[#0099CB] mx-auto mb-4"/>
                    <h1 className="text-2xl font-bold text-gray-900">Ziyaret Başlatma (Check-in)</h1>
                    <p className="text-gray-600 mt-2">Ziyareti başlatmak için müşteri konumunda olmanız gerekmektedir.</p>
                </div>
                <div className="mt-6 border-t pt-6 space-y-4">
                    <div> <p className="text-sm font-medium text-gray-500">Müşteri</p> <p className="font-semibold text-gray-800">{customer.name}</p> <p className="text-sm text-gray-600">{customer.address}</p> </div>
                    <div> <p className="text-sm font-medium text-gray-500">Ziyaret Başlangıç Zamanı</p> <p className="font-semibold text-gray-800">{checkInTime.toLocaleDateString('tr-TR')} - {checkInTime.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</p> </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Konum Durumu</p>
                        {locationStatus === 'loading' && <div className="flex items-center gap-2 text-gray-600"><Loader2 className="w-4 h-4 animate-spin"/>Konumunuz alınıyor...</div>}
                        {locationStatus === 'error' && <div className="flex items-center gap-2 text-red-600 font-semibold"><AlertTriangle className="w-4 h-4"/>{errorMessage}</div>}
                        {locationStatus === 'success' && distance !== null && (
                            isCheckInAllowed ? (
                                <div className="flex items-center gap-2 text-green-600 font-semibold"><CheckCircle className="w-5 h-5"/>Müşteri konumundasınız ({Math.round(distance * 1000)}m).</div>
                            ) : (
                                <div className="flex items-center gap-2 text-orange-600 font-semibold"><AlertTriangle className="w-5 h-5"/>Müşteri konumuna uzaksınız ({distance.toFixed(2)} km). [Test Modu Aktif]</div>
                            )
                        )}
                    </div>
                </div>
                <div className="mt-8 flex flex-col gap-3">
                    <button onClick={onCheckInSuccess} disabled={!canProceedForTesting} className="w-full bg-[#0099CB] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#007ca8] transition-colors inline-flex items-center justify-center gap-2 text-lg disabled:bg-gray-300 disabled:cursor-not-allowed">Check-in Yap ve Devam Et</button>
                    <button onClick={onCancel} className="w-full bg-gray-100 text-gray-700 px-8 py-2 rounded-lg font-medium hover:bg-gray-200">İptal</button>
                </div>
            </div>
        </div>
    );
};

// ==================================================================
// ==================== ANA UYGULAMA (ÖNİZLEME İÇİN) ===============
// ==================================================================

const mockCustomers: Customer[] = [
    { id: 1, name: 'Ahmet Yılmaz', address: 'Gül Mahallesi, No: 12/3', district: 'Çankaya/Ankara', phone: '555 123 4567', status: 'Pending', subscriberType: 'Mesken', isEligible: true, currentProvider: 'Bölgesel Tedarikçi', currentKwhPrice: 2.35, avgMonthlyConsumptionKwh: 150, lat: 39.9085, lon: 32.7533 },
    { id: 2, name: 'Ayşe Kaya (ABC Market)', address: 'Menekşe Cd, No: 5', district: 'Kadıköy/İstanbul', phone: '555 987 6543', status: 'Pending', subscriberType: 'Ticarethane', isEligible: true, currentProvider: 'Bölgesel Tedarikçi', currentKwhPrice: 2.41, avgMonthlyConsumptionKwh: 450, lat: 40.9904, lon: 29.0271 },
    { id: 3, name: 'Mehmet Öztürk (Demir Çelik)', address: 'Sanayi Sitesi No: 1', district: 'Bornova/İzmir', phone: '555 111 2233', status: 'Pending', subscriberType: 'Sanayi', isEligible: true, currentProvider: 'Bölgesel Tedarikçi', currentKwhPrice: 2.29, avgMonthlyConsumptionKwh: 2500, lat: 38.4682, lon: 27.2211 },
];

const App = () => {
    // TEST MODU: Müşteri listesi olmadan, doğrudan ilk müşterinin check-in ekranıyla başla
    const [activeCustomer, setActiveCustomer] = useState<Customer>(mockCustomers[0]);
    const [view, setView] = useState<'check-in' | 'proposal' | 'flow'>('check-in');

    const handleReset = () => {
        // Test için akışı yeniden başlat
        setActiveCustomer(mockCustomers[0]);
        setView('check-in');
    };
    
    const handleCheckInSuccess = () => {
        setView('proposal'); // Check-in başarılı olunca teklife geç
    };
    
    const handleProceedToFlow = () => {
        setView('flow');
    };
    
    const handleComplete = (customer: Customer, status: VisitStatus, notes: string) => {
        console.log("Ziyaret Tamamlandı!", { customer: customer.name, status, notes });
        handleReset(); // Akış bitince başa dön
    };
    
    if (!activeCustomer) {
      return <div>Müşteri bulunamadı.</div>;
    }

    switch (view) {
        case 'check-in':
            return <CheckInScreen customer={activeCustomer} onCheckInSuccess={handleCheckInSuccess} onCancel={handleReset} />;
        case 'proposal':
            return <ProposalScreen customer={activeCustomer} onProceed={handleProceedToFlow} onCancel={handleReset} />;
        case 'flow':
             return <VisitFlowScreen customer={activeCustomer} onCloseToList={handleReset} onCompleteVisit={handleComplete} />;
        default:
             return <div>Geçersiz görünüm.</div>
    }
}

export default App;