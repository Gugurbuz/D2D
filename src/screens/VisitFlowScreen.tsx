import React, { useReducer, useState, useRef, useEffect } from 'react';

// İkonları import ediyoruz
import {
  IdCard, Camera, Smartphone, FileText, PenLine, Send,
  ChevronRight, ShieldCheck, CheckCircle, XCircle, UserX, Clock,
  Loader2, ScanLine, Nfc, Maximize2, Hourglass, Sparkles, TrendingUp, ChevronsRight,
  Home, Building, Factory // Müşteri tipi için yeni ikonlar
} from 'lucide-react';

// --- GEREKLİ TİPLER ---
// Önizleme için gerekli tipleri ve mock verileri buraya ekledim.
export interface Customer {
  id: number;
  name: string;
  address: string;
  district: string;
  phone: string;
  status: 'Pending' | 'Completed' | 'Rejected' | 'Postponed' | 'Unreachable' | 'Evaluating';
  notes?: string;
  // Teklif ekranı için güncellenen alanlar
  subscriberType: 'Mesken' | 'Ticarethane' | 'Sanayi';
  isEligible: boolean;
  currentProvider: string;
  currentKwhPrice: number;
  avgMonthlyConsumptionKwh: number;
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
    // ... diğer case'ler aynı kalır
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
        <button onClick={onCloseToList} className="text-gray-600 hover:text-gray-900 font-medium text-sm sm:text-base">← Listeye Dön</button>
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

// ==================================================================
// ==================== YENİ TEKLİF EKRANI ==========================
// ==================================================================

type Tariff = { name: string; price: number; };

const enerjisaTariffs: Record<Customer['subscriberType'], Tariff[]> = {
    'Mesken': [
        { name: 'Avantajlı Konut', price: 1.99 },
        { name: 'Gece Kuşu Konut', price: 1.85 },
        { name: 'Yeşil Evim', price: 2.15 },
    ],
    'Ticarethane': [
        { name: 'Esnaf Dostu', price: 2.15 },
        { name: 'İş Yeri Pro', price: 2.05 },
        { name: 'Sanayi Tipi', price: 1.95 },
    ],
    'Sanayi': [
        { name: 'Üretim Gücü', price: 1.80 },
        { name: 'Ağır Sanayi Plus', price: 1.72 },
    ]
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

    const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);

    const currentMonthlyBill = currentPrice * currentConsumption;
    const enerjisaMonthlyBill = selectedTariff.price * currentConsumption;
    const annualSavings = (currentMonthlyBill - enerjisaMonthlyBill) * 12;

    const typeInfo = subscriberTypeInfo[customer.subscriberType];

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen animate-fade-in">
            <div className="flex items-center justify-between mb-4">
                 <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Müşteri Teklifi ve Analiz</h1>
                 <button onClick={onCancel} className="text-gray-600 hover:text-gray-900 font-medium text-sm sm:text-base">← Listeye Dön</button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="pb-4 border-b flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">{customer.name}</h2>
                        <p className="text-sm text-gray-500">{customer.address}</p>
                        <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 ${typeInfo.color} rounded-full text-sm font-medium`}>
                            {typeInfo.icon} {customer.subscriberType}
                        </div>
                    </div>
                    {customer.isEligible ? (
                        <div className="flex-shrink-0 ml-4 inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            <CheckCircle className="w-4 h-4" /> Serbest Tüketici
                        </div>
                    ) : (
                         <div className="flex-shrink-0 ml-4 inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                            <XCircle className="w-4 h-4" /> Uygun Değil
                        </div>
                    )}
                </div>

                <div className="grid md:grid-cols-2 gap-x-6 gap-y-8 mt-6">
                    {/* Mevcut Durum - EDİTLENEBİLİR */}
                    <div className="border-r pr-6">
                        <h3 className="font-semibold text-gray-700">Mevcut Durum Analizi</h3>
                        <div className="mt-4 space-y-4">
                            <div>
                                <label className="text-xs text-gray-500">Mevcut Birim Fiyat (kWh)</label>
                                <div className="flex items-center mt-1"><input type="number" step="0.01" value={currentPrice} onChange={e => setCurrentPrice(parseFloat(e.target.value) || 0)} className="w-full p-2 border rounded-lg" /><span className="ml-2 font-semibold text-gray-600">TL</span></div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Ort. Aylık Tüketim (kWh)</label>
                                <div className="flex items-center mt-1"><input type="number" step="10" value={currentConsumption} onChange={e => setCurrentConsumption(parseFloat(e.target.value) || 0)} className="w-full p-2 border rounded-lg" /><span className="ml-2 font-semibold text-gray-600">kWh</span></div>
                            </div>
                            <div className="pt-2 border-t">
                                <p className="text-xs text-gray-500">Hesaplanan Aylık Fatura</p>
                                <p className="font-medium text-lg text-red-600">{formatCurrency(currentMonthlyBill)}</p>
                            </div>
                        </div>
                    </div>
                    {/* Enerjisa Teklifi - DİNAMİK */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                         <h3 className="font-bold text-[#0099CB] flex items-center gap-2"><Sparkles className="w-5 h-5"/> Enerjisa Teklif Simülasyonu</h3>
                         <div className="mt-4 space-y-2">
                            <p className="text-xs text-gray-500 mb-1">Uygun Tarife Seçimi</p>
                            {availableTariffs.map(tariff => (
                                <label key={tariff.name} className={`p-3 border rounded-lg flex justify-between items-center cursor-pointer transition-colors ${selectedTariff.name === tariff.name ? 'bg-white border-blue-400 ring-2 ring-blue-300' : 'hover:bg-blue-100'}`}>
                                    <span className="text-sm font-semibold text-gray-800">{tariff.name}</span>
                                    <span className="font-bold text-sm text-[#0099CB]">{formatCurrency(tariff.price)}</span>
                                    <input type="radio" name="tariff" checked={selectedTariff.name === tariff.name} onChange={() => setSelectedTariff(tariff)} className="sr-only"/>
                                </label>
                            ))}
                         </div>
                         <div className="pt-3 mt-3 border-t">
                            <p className="text-xs text-gray-500">Enerjisa ile Tahmini Aylık Fatura</p>
                            <p className="font-bold text-xl text-green-600">{formatCurrency(enerjisaMonthlyBill)}</p>
                        </div>
                    </div>
                </div>
                
                {annualSavings > 0 && (
                    <div className="mt-8 p-4 bg-green-100 border border-green-200 rounded-lg text-center">
                        <p className="text-sm font-semibold text-green-800 flex items-center justify-center gap-2"><TrendingUp className="w-5 h-5"/> Tahmini Yıllık Tasarruf</p>
                        <p className="text-3xl font-bold text-green-700">{formatCurrency(annualSavings)}</p>
                    </div>
                )}
                 <div className="mt-8 text-center">
                    <button onClick={onProceed} disabled={!customer.isEligible} className="bg-[#0099CB] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#007ca8] transition-colors inline-flex items-center gap-2 text-lg disabled:bg-gray-300 disabled:cursor-not-allowed">
                       Müzakere Sonucuna Git <ChevronsRight className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
};


// ==================================================================
// ==================== ANA UYGULAMA (ÖNİZLEME İÇİN) ===============
// ==================================================================

const mockCustomers: Customer[] = [
    { id: 1, name: 'Ahmet Yılmaz', address: 'Gül Mahallesi, No: 12/3', district: 'Çankaya/Ankara', phone: '555 123 4567', status: 'Pending', subscriberType: 'Mesken', isEligible: true, currentProvider: 'Bölgesel Tedarikçi', currentKwhPrice: 2.35, avgMonthlyConsumptionKwh: 150 },
    { id: 2, name: 'Ayşe Kaya (ABC Market)', address: 'Menekşe Cd, No: 5', district: 'Kadıköy/İstanbul', phone: '555 987 6543', status: 'Pending', subscriberType: 'Ticarethane', isEligible: true, currentProvider: 'Bölgesel Tedarikçi', currentKwhPrice: 2.41, avgMonthlyConsumptionKwh: 450 },
    { id: 3, name: 'Mehmet Öztürk (Demir Çelik)', address: 'Sanayi Sitesi No: 1', district: 'Bornova/İzmir', phone: '555 111 2233', status: 'Pending', subscriberType: 'Sanayi', isEligible: true, currentProvider: 'Bölgesel Tedarikçi', currentKwhPrice: 2.29, avgMonthlyConsumptionKwh: 2500 },
];

const App = () => {
    const [view, setView] = useState<'list' | 'proposal' | 'flow'>('list');
    const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
    
    const handleStartVisit = (customer: Customer) => {
        setActiveCustomer(customer);
        setView('proposal');
    };
    
    const handleClose = () => {
        setActiveCustomer(null);
        setView('list');
    };
    
    const handleProceedToFlow = () => {
        setView('flow');
    };
    
    const handleComplete = (customer: Customer, status: VisitStatus, notes: string) => {
        console.log("Ziyaret Tamamlandı!", { customer: customer.name, status, notes });
        handleClose();
    };

    if (activeCustomer) {
        if (view === 'proposal') {
            return <ProposalScreen customer={activeCustomer} onProceed={handleProceedToFlow} onCancel={handleClose} />;
        }
        if (view === 'flow') {
            return <VisitFlowScreen customer={activeCustomer} onCloseToList={handleClose} onCompleteVisit={handleComplete} />;
        }
    }
    
    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Müşteri Ziyaret Listesi</h1>
            <div className="space-y-4">
                {mockCustomers.map(customer => (
                    <div key={customer.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-lg text-gray-800">{customer.name}</p>
                            <p className="text-sm text-gray-600">{customer.address}</p>
                             <div className={`mt-2 inline-flex items-center gap-2 px-2 py-0.5 ${subscriberTypeInfo[customer.subscriberType].color} rounded-full text-xs font-medium`}>
                                {subscriberTypeInfo[customer.subscriberType].icon} {customer.subscriberType}
                            </div>
                        </div>
                        <button onClick={() => handleStartVisit(customer)} className="bg-[#0099CB] text-white px-5 py-2 rounded-lg font-semibold hover:bg-[#007ca8] transition-colors">
                            Ziyareti Başlat
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;

