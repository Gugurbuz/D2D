// src/screens/VisitFlowScreen.tsx

import React, { useReducer, useState, useRef, useEffect, useMemo } from 'react';

// --- İKONLAR ---
// Yeni eklenen ikonlar: MapPin, Home, Building, Factory, Sparkles, Sun, BatteryCharging, Car
import {
    IdCard, Camera, Smartphone, FileText, PenLine, Send,
    ChevronRight, ShieldCheck, CheckCircle, XCircle, UserX, Clock,
    Loader2, ScanLine, Nfc, Maximize2, MapPin, Home, Building, Factory,
    Sparkles, Sun, BatteryCharging, Car
} from 'lucide-react';

// Customer tipi projenin başka bir yerinde tanımlı olabilir.
// O dosyada bu şekilde güncellenmesi GEREKİR:
/*
export type Customer = {
    id: number;
    name: string;
    address: string;
    district: string;
    phone: string;
    lat: number;
    lng: number;
    customerType: 'Mesken' | 'Ticarethane' | 'Sanayi'; // <-- YENİ EKLENDİ
};
*/
import { Customer } from '../RouteMap';


// --- YENİ TİP VE VERİ TANIMLAMALARI ---

type Tariff = {
    id: string;
    name: string;
    unitPrice: number; // kWh başına fiyat
    type: Customer['customerType'][]; // Hangi müşteri tipleri için uygun
};

// Mock Tarife Verisi
const ALL_TARIFFS: Tariff[] = [
    { id: 'standart_mesken', name: 'Standart Konut', unitPrice: 2.10, type: ['Mesken'] },
    { id: 'yesil_evim', name: 'Yeşil Evim', unitPrice: 2.25, type: ['Mesken'] },
    { id: 'is_yeri_eko', name: 'Ekonomik Ticarethane', unitPrice: 3.50, type: ['Ticarethane'] },
    { id: 'is_yeri_pro', name: 'Profesyonel Ticarethane', unitPrice: 3.35, type: ['Ticarethane'] },
    { id: 'sanayi_eko', name: 'Sanayi Avantaj', unitPrice: 3.10, type: ['Sanayi'] },
];


// --- MEVCUT TİPLER VE STATE ---

type VisitStatus =
    | 'Pending'
    | 'InProgress'
    | 'Completed'
    | 'Rejected'
    | 'Unreachable'
    | 'Postponed';

type FlowStep = 1 | 2 | 3 | 4;
type VerificationStatus = 'idle' | 'scanning' | 'success' | 'error';

// Ana akış state'i (sözleşme kısmı için)
type State = {
    visitStatus: VisitStatus;
    currentStep: FlowStep;
    idPhoto: string | null;
    ocrStatus: VerificationStatus;
    nfcStatus: VerificationStatus;
    contractAccepted: boolean;
    smsSent: boolean;
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


// --- REDUCER (Değişiklik yok) ---

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

// --- PROPS ---

type Props = {
    customer: Customer;
    onCloseToList: () => void;
    onCompleteVisit: (updated: Customer, status: VisitStatus, notes: string) => void;
};


// --- ANA BİLEŞEN: VisitFlowScreen ---
// YENİ AKIŞI YÖNETMEK İÇİN GÜNCELLENDİ
const VisitFlowScreen: React.FC<Props> = ({ customer, onCloseToList, onCompleteVisit }) => {
    const [state, dispatch] = useReducer(visitReducer, initialState);
    
    // YENİ: Hangi ana ekranda olduğumuzu tutan state. Akış buradan yönetiliyor.
    const [currentScreen, setCurrentScreen] = useState<'checkin' | 'proposal' | 'flow'>('checkin');

    const handleSaveVisitResult = (status: VisitStatus) => {
        dispatch({ type: 'SET_VISIT_STATUS', payload: status });
        if (status !== 'InProgress') {
            onCompleteVisit(customer, status, state.notes);
            onCloseToList();
        }
    };

    const StepIndicator = () => (
        <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3, 4].map(n => (
                <div key={n} className={`h-2 rounded-full transition-colors ${state.currentStep >= n ? 'bg-[#0099CB]' : 'bg-gray-200'}`} style={{ width: 56 }} />
            ))}
        </div>
    );

    return (
        <div className="p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900">Ziyaret: {customer.name}</h1>
                <button onClick={onCloseToList} className="text-gray-600 hover:text-gray-900 font-medium">← Listeye Dön</button>
            </div>

            {/* YENİ AKIŞ YÖNETİMİ */}
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
                        <VisitStatusSelection onSave={handleSaveVisitResult} notes={state.notes} setNotes={(notes) => dispatch({ type: 'SET_NOTES', payload: notes })} />
                    )}

                    {state.visitStatus === 'InProgress' && (
                        <>
                            <StepIndicator />
                            {state.currentStep === 1 && <CustomerInfoStep customer={customer} dispatch={dispatch} />}
                            {state.currentStep === 2 && <IdVerificationStep state={state} dispatch={dispatch} />}
                            {state.currentStep === 3 && <ContractStep state={state} dispatch={dispatch} customer={customer} />}
                            {state.currentStep === 4 && <CompletionStep customer={customer} dispatch={dispatch} onComplete={() => handleSaveVisitResult('Completed')} />}
                        </>
                    )}
                </>
            )}
        </div>
    );
};


// ==========================================================================================
// ==================== YENİ EKLENEN BİLEŞENLER =============================================
// ==========================================================================================


// --- YENİ BİLEŞEN: Coğrafi Konum Doğrulama Ekranı ---
const CheckInScreen: React.FC<{ customer: Customer, onContinue: () => void }> = ({ customer, onContinue }) => {
    const [locationStatus, setLocationStatus] = useState<'idle' | 'getting' | 'success' | 'error'>('idle');
    const [distance, setDistance] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Haversine formülü ile iki nokta arası mesafe hesaplama
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // Metre cinsinden Dünya'nın yarıçapı
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Metre cinsinden sonuç
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
            },
            (err) => {
                setError(`Konum alınamadı: ${err.message}`);
                setLocationStatus('error');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, [customer.lat, customer.lng]);

    const renderStatus = () => {
        switch (locationStatus) {
            case 'getting': return <><Loader2 className="w-4 h-4 animate-spin" /> Konum alınıyor...</>;
            case 'error': return <><XCircle className="w-4 h-4 text-red-500" /> {error}</>;
            case 'success':
                if (distance === null) return null;
                const isClose = distance <= 200; // 200 metre eşik değeri
                return isClose ? (
                    <><CheckCircle className="w-4 h-4 text-green-500" /> Müşteri konumundasınız ({distance.toFixed(0)}m).</>
                ) : (
                    <><XCircle className="w-4 h-4 text-yellow-500" /> Müşteri konumundan uzaktasınız (~{ (distance / 1000).toFixed(1)} km).</>
                );
            default: return null;
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-6 h-6 text-[#0099CB]" />
                <h3 className="text-xl font-semibold">Ziyaret Başlangıç Onayı</h3>
            </div>
            <div className="space-y-4">
                <p className="text-gray-600">Teklif ekranına geçmeden önce, müşterinin lokasyonunda olduğunuzu doğrulamak için check-in yapın.</p>
                <div className="p-4 bg-gray-100 rounded-lg">
                    <p className="font-semibold">{customer.name}</p>
                    <p className="text-sm text-gray-700">{customer.address}, {customer.district}</p>
                    <div className="mt-2 flex items-center gap-2 text-sm font-medium">{renderStatus()}</div>
                </div>
            </div>
            <div className="mt-6 text-right">
                <button
                    onClick={onContinue}
                    className="bg-[#0099CB] text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 hover:bg-[#007ca8] transition-colors"
                >
                    Check-in Yap ve Devam Et <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};


// --- YENİ BİLEŞEN: Teklif ve Müzakere Ekranı ---
const ProposalScreen: React.FC<{ customer: Customer; onContinue: () => void; }> = ({ customer, onContinue }) => {
    // State'ler
    const [currentUnitPrice, setCurrentUnitPrice] = useState(2.20); // Simülasyon için başlangıç değeri
    const [currentConsumption, setCurrentConsumption] = useState(150); // Simülasyon için başlangıç değeri
    const availableTariffs = useMemo(() => ALL_TARIFFS.filter(t => t.type.includes(customer.customerType)), [customer.customerType]);
    const [selectedTariff, setSelectedTariff] = useState<Tariff>(availableTariffs[0]);
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

    // Hesaplamalar
    const currentMonthlyBill = currentUnitPrice * currentConsumption;
    const enerjisaMonthlyBill = selectedTariff.unitPrice * currentConsumption;
    const annualSavings = (currentMonthlyBill - enerjisaMonthlyBill) * 12;

    const CustomerTypeIcon = {
        Mesken: <Home className="w-6 h-6 text-gray-700" />,
        Ticarethane: <Building className="w-6 h-6 text-gray-700" />,
        Sanayi: <Factory className="w-6 h-6 text-gray-700" />,
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
                {/* Başlık ve Müşteri Tipi */}
                <div className="flex justify-between items-center border-b pb-4 mb-4">
                    <h3 className="text-xl font-semibold">Teklif ve Tasarruf Simülasyonu</h3>
                    <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
                        {CustomerTypeIcon[customer.customerType]}
                        <span className="font-medium">{customer.customerType}</span>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Mevcut Durum Alanı (İnteraktif) */}
                    <div className="p-4 border rounded-lg bg-gray-50">
                        <h4 className="font-semibold text-lg mb-3">Mevcut Durum</h4>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium">Birim Fiyat (TL/kWh)</label>
                                <input
                                    type="number"
                                    value={currentUnitPrice}
                                    onChange={e => setCurrentUnitPrice(parseFloat(e.target.value) || 0)}
                                    className="w-full mt-1 p-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Aylık Tüketim (kWh)</label>
                                <input
                                    type="number"
                                    value={currentConsumption}
                                    onChange={e => setCurrentConsumption(parseInt(e.target.value) || 0)}
                                    className="w-full mt-1 p-2 border rounded-lg"
                                />
                            </div>
                            <div className="pt-2">
                                <p className="text-sm text-gray-600">Tahmini Aylık Fatura</p>
                                <p className="text-2xl font-bold text-gray-800">{currentMonthlyBill.toFixed(2)} TL</p>
                            </div>
                        </div>
                    </div>

                    {/* Enerjisa Teklifi Alanı (Dinamik) */}
                    <div className="p-4 border-2 border-[#0099CB] rounded-lg bg-white">
                        <h4 className="font-semibold text-lg mb-3 text-[#007ca8]">Enerjisa Teklifi</h4>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium">Tarife Seçimi</label>
                                <select
                                    value={selectedTariff.id}
                                    onChange={e => setSelectedTariff(ALL_TARIFFS.find(t => t.id === e.target.value)!)}
                                    className="w-full mt-1 p-2 border rounded-lg"
                                >
                                    {availableTariffs.map(tariff => (
                                        <option key={tariff.id} value={tariff.id}>{tariff.name}</option>
                                    ))}
                                </select>
                                {selectedTariff.id === 'yesil_evim' && (
                                     <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3"/> Solar çözümlerde %10 indirim sağlar.
                                     </p>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Birim Fiyat (TL/kWh)</p>
                                <p className="text-xl font-semibold">{selectedTariff.unitPrice.toFixed(2)} TL</p>
                            </div>
                            <div className="pt-2">
                                <p className="text-sm text-gray-600">Enerjisa ile Tahmini Aylık Fatura</p>
                                <p className="text-2xl font-bold text-[#007ca8]">{enerjisaMonthlyBill.toFixed(2)} TL</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Tasarruf ve Sonraki Adım */}
                <div className="mt-6 p-4 rounded-lg bg-green-50 border border-green-200 text-center">
                    <p className="text-lg font-medium text-green-800">Yıllık Tahmini Tasarruf</p>
                    <p className="text-4xl font-bold text-green-700 my-2">{annualSavings > 0 ? `${annualSavings.toFixed(2)} TL` : "Daha Avantajlı"}</p>
                </div>
                
                {/* Yeşil Evim Lead Oluşturma */}
                {selectedTariff.id === 'yesil_evim' && (
                    <div className="mt-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-center animate-fade-in">
                        <p className="font-medium text-yellow-800 mb-2">Güneş enerjisi çözümleriyle ilgileniyor musunuz?</p>
                        <button 
                            onClick={() => setIsLeadModalOpen(true)}
                            className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-500"
                        >
                            Evet, Teklif İçin Talep Oluştur
                        </button>
                    </div>
                )}


                <div className="mt-8 text-right">
                    <button onClick={onContinue} className="bg-[#0099CB] text-white px-6 py-3 rounded-lg inline-flex items-center gap-2">
                        Müzakere Sonucuna Git <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
            {isLeadModalOpen && (
                <LeadGenerationModal 
                    customer={customer}
                    onClose={() => setIsLeadModalOpen(false)}
                />
            )}
        </>
    );
};


// --- YENİ BİLEŞEN: Güneş Enerjisi Talep Formu (Modal) ---
const LeadGenerationModal: React.FC<{ customer: Customer; onClose: () => void }> = ({ customer, onClose }) => {
    const [selectedSolutions, setSelectedSolutions] = useState<string[]>([]);
    const [kvkkAccepted, setKvkkAccepted] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSolutionToggle = (solution: string) => {
        setSelectedSolutions(prev => 
            prev.includes(solution) ? prev.filter(s => s !== solution) : [...prev, solution]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("LEAD OLUŞTURULDU:", {
            customerId: customer.id,
            solutions: selectedSolutions,
            kvkk: kvkkAccepted
        });
        setIsSubmitted(true);
        setTimeout(onClose, 3000); // 3 saniye sonra modal'ı kapat
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
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
                                {['Güneş Paneli', 'Depolama (Batarya)', 'Şarj İstasyonu (EV)'].map(sol => (
                                    <label key={sol} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer ${selectedSolutions.includes(sol) ? 'bg-yellow-100 border-yellow-400' : 'bg-white'}`}>
                                        <input type="checkbox" checked={selectedSolutions.includes(sol)} onChange={() => handleSolutionToggle(sol)} className="h-4 w-4 rounded text-yellow-500 focus:ring-yellow-400" />
                                        {sol}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="flex items-start gap-2 text-sm text-gray-700">
                                <input type="checkbox" checked={kvkkAccepted} onChange={e => setKvkkAccepted(e.target.checked)} className="mt-1 h-4 w-4 rounded" />
                                <span>KVKK aydınlatma metnini okudum, anladım. Müşterinin verilerinin bu talep kapsamında işlenmesine ve kendisiyle iletişime geçilmesine onay verdiğini beyan ederim.</span>
                            </label>
                        </div>
                        
                        <button type="submit" disabled={!kvkkAccepted || selectedSolutions.length === 0} className="w-full bg-[#F9C800] text-gray-900 px-6 py-3 rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed">
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


// ==========================================================================================
// ==================== MEVCUT YARDIMCI BİLEŞENLER (Değişiklik yok) =========================
// ==========================================================================================

// --- ZİYARET DURUM SEÇİM EKRANI ---
const VisitStatusSelection: React.FC<{ onSave: (status: VisitStatus) => void; notes: string; setNotes: (notes: string) => void; }> = ({ onSave, notes, setNotes }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Ziyaret Sonucunu Belirtin</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button onClick={() => onSave('InProgress')} className="p-4 border rounded-lg text-left hover:bg-green-50 hover:border-green-400 transition-colors flex items-center gap-4">
        <CheckCircle className="w-8 h-8 text-green-500" />
        <div>
          <p className="font-semibold text-green-800">Sözleşme Başlat</p>
          <p className="text-sm text-gray-600">Müşteri teklifi kabul etti, sürece başla.</p>
        </div>
      </button>
      <button onClick={() => onSave('Rejected')} className="p-4 border rounded-lg text-left hover:bg-red-50 hover:border-red-400 transition-colors flex items-center gap-4">
        <XCircle className="w-8 h-8 text-red-500" />
        <div>
          <p className="font-semibold text-red-800">Teklifi Reddetti</p>
          <p className="text-sm text-gray-600">Müşteri teklifi istemedi.</p>
        </div>
      </button>
      <button onClick={() => onSave('Unreachable')} className="p-4 border rounded-lg text-left hover:bg-yellow-50 hover:border-yellow-400 transition-colors flex items-center gap-4">
        <UserX className="w-8 h-8 text-yellow-500" />
        <div>
          <p className="font-semibold text-yellow-800">Ulaşılamadı</p>
          <p className="text-sm text-gray-600">Müşteri adreste bulunamadı.</p>
        </div>
      </button>
      <button onClick={() => onSave('Postponed')} className="p-4 border rounded-lg text-left hover:bg-blue-50 hover:border-blue-400 transition-colors flex items-center gap-4">
        <Clock className="w-8 h-8 text-blue-500" />
        <div>
          <p className="font-semibold text-blue-800">Ertelendi</p>
          <p className="text-sm text-gray-600">Müşteri daha sonra görüşmek istedi.</p>
        </div>
      </button>
    </div>
    <div className="mt-6">
        <label htmlFor="visitNotes" className="block text-sm font-medium text-gray-700 mb-1">Ziyaret Notları (Reddetme/Erteleme Sebebi vb.)</label>
        <textarea
            id="visitNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full p-2 border rounded-lg"
            placeholder="Örn: Müşteri mevcut sağlayıcısından memnun olduğunu belirtti."
        />
    </div>
  </div>
);

// --- ADIM 1: Müşteri Bilgileri ---
const CustomerInfoStep: React.FC<{ customer: Customer; dispatch: React.Dispatch<Action> }> = ({ customer, dispatch }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <IdCard className="w-5 h-5 text-[#0099CB]" />
        <h3 className="text-lg font-semibold">1. Müşteri Bilgileri Kontrolü</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div><label className="text-sm text-gray-600">Ad Soyad</label><input defaultValue={customer.name} className="w-full mt-1 p-2 border rounded-lg bg-gray-100" readOnly /></div>
        <div><label className="text-sm text-gray-600">Telefon</label><input defaultValue={customer.phone} className="w-full mt-1 p-2 border rounded-lg bg-gray-100" readOnly /></div>
        <div className="md:col-span-2"><label className="text-sm text-gray-600">Adres</label><input defaultValue={`${customer.address}, ${customer.district}`} className="w-full mt-1 p-2 border rounded-lg bg-gray-100" readOnly /></div>
      </div>
      <div className="mt-6 text-right">
        <button onClick={() => dispatch({ type: 'SET_STEP', payload: 2 })} className="bg-[#0099CB] text-white px-6 py-3 rounded-lg inline-flex items-center gap-2">
          Bilgiler Doğru, Devam Et <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
);

// --- ADIM 2: Kimlik Doğrulama ---
const IdVerificationStep: React.FC<{ state: State; dispatch: React.Dispatch<Action> }> = ({ state, dispatch }) => {
    // ... Bu bileşenin içeriği çok uzun olduğu için ve değişiklik olmadığı için kısaltılmıştır ...
    // ... Orijinal kodunuzdaki IdVerificationStep içeriğini buraya yapıştırabilirsiniz ...
    // ... Bu bileşende herhangi bir değişiklik yapılmamıştır.
    // --- (IdVerificationStep orijinal kodu buraya gelecek) ---
    return <div>(Kimlik Doğrulama Adımı)</div>;
};

// --- ADIM 3: Sözleşme ve İmza ---
const ContractStep: React.FC<{ state: State; dispatch: React.Dispatch<Action>; customer: Customer }> = ({ state, dispatch, customer }) => {
    // ... Bu bileşenin içeriği çok uzun olduğu için ve değişiklik olmadığı için kısaltılmıştır ...
    // ... Orijinal kodunuzdaki ContractStep içeriğini buraya yapıştırabilirsiniz ...
    // ... Bu bileşende herhangi bir değişiklik yapılmamıştır.
    // --- (ContractStep orijinal kodu buraya gelecek) ---
    return <div>(Sözleşme Adımı)</div>;
};


// --- ADIM 4: Tamamlama ---
const CompletionStep: React.FC<{ customer: Customer; dispatch: React.Dispatch<Action>; onComplete: () => void; }> = ({ customer, dispatch, onComplete }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 text-center animate-fade-in">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-semibold">Sözleşme Tamamlandı!</h3>
        <p className="text-gray-600 mt-2">Müşteri {customer.name} için elektrik satış sözleşmesi başarıyla oluşturulmuştur.</p>
        <div className="mt-6 flex justify-center gap-4">
            <button onClick={() => dispatch({ type: 'SET_STEP', payload: 3 })} className="px-4 py-2 rounded-lg bg-white border">Geri</button>
            <button onClick={onComplete} className="px-8 py-3 rounded-lg bg-green-600 text-white font-semibold">
                Ziyareti Kaydet
            </button>
        </div>
    </div>
);

// ... Diğer yardımcı bileşenler (SignaturePadModal, ContractMockPage, ContractModal) ...
// ... Bu bileşenlerde herhangi bir değişiklik yapılmamıştır ...
// ... Orijinal kodunuzdaki halleriyle kalabilirler ...


export default VisitFlowScreen;