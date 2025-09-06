// VisitFlowFullExample.tsx
import React, { useReducer, useState, useRef, useEffect, useCallback } from "react";
import {
  IdCard, Camera, Smartphone, FileText, PenLine, Send,
  ChevronRight, ShieldCheck, CheckCircle, XCircle, UserX, Clock,
  Loader2, ScanLine, Nfc, Maximize2, Hourglass, Sparkles, TrendingUp, ChevronsRight,
  Home, Building, Factory, MapPin, AlertTriangle, Info
} from "lucide-react";

/* ===================== Tipler ===================== */
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

/* ===================== VisitFlowScreen ===================== */
type VisitFlowProps = {
  customer?: Customer | null; // null-guard
  onCloseToList: () => void;
  onCompleteVisit: (updated: Customer, status: VisitStatus, notes: string) => void;
};

const VisitFlowScreen: React.FC<VisitFlowProps> = ({ customer, onCloseToList, onCompleteVisit }) => {
  // null-guard: ilk frame’de customer yoksa skeleton
  if (!customer) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

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
    const finalStatus: VisitStatus = state.visitStatus === 'Pending' ? 'Completed' : state.visitStatus;
    onCompleteVisit(customer, finalStatus, finalNotes);
    onCloseToList();
  };

  const StepIndicator = () => (
    <div className="flex items-center gap-2 mb-4">
      {[1, 2, 3, 4].map(n => (
        <div key={n} className={`h-2 rounded-full transition-colors ${state.currentStep >= n ? 'bg-[#0099CB]' : 'bg-gray-200'}`} style={{ width: 56 }} />
      ))}
    </div>
  );

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
          {state.currentStep === 1 && <CustomerInfoStep customer={customer} dispatch={dispatch} notes={state.notes} />}
          {state.currentStep === 2 && <IdVerificationStep state={state} dispatch={dispatch} />}
          {state.currentStep === 3 && <ContractStep state={state} dispatch={dispatch} customer={customer} />}
          {state.currentStep === 4 && (
            <CompletionStep
              customer={customer}
              dispatch={dispatch}
              onComplete={() => { onCompleteVisit(customer, 'Completed', state.notes); onCloseToList(); }}
            />
          )}
        </>
      )}

      {isFinalizing && (
        <FinalizeVisitScreen
          state={state}
          dispatch={dispatch}
          onFinalize={handleFinalizeVisit}
          onBack={() => dispatch({ type: 'SET_VISIT_STATUS', payload: 'Pending' })}
        />
      )}
    </div>
  );
};

/* ===================== Yardımcı Bileşenler ===================== */

// --- Ziyaret Durumu Seçimi ---
const VisitStatusSelection: React.FC<{ onSelect: (s: VisitStatus) => void; }> = ({ onSelect }) => {
  const CardBtn: React.FC<{
    onClick: () => void; tone: 'green' | 'red' | 'yellow' | 'blue' | 'gray';
    title: string; desc: string; Icon: React.ComponentType<any>;
  }> = ({ onClick, tone, title, desc, Icon }) => {
    const tones: Record<string, string> = {
      green: 'hover:bg-green-50 hover:border-green-400',
      red: 'hover:bg-red-50 hover:border-red-400',
      yellow: 'hover:bg-yellow-50 hover:border-yellow-400',
      blue: 'hover:bg-blue-50 hover:border-blue-400',
      gray: 'hover:bg-gray-50 hover:border-gray-400',
    };
    const iconColor: Record<string, string> = {
      green: 'text-green-500', red: 'text-red-500', yellow: 'text-yellow-500', blue: 'text-blue-500', gray: 'text-gray-500'
    };
    return (
      <button onClick={onClick} className={`p-4 border rounded-lg text-left transition-colors flex items-center gap-4 ${tones[tone]}`}>
        <Icon className={`w-8 h-8 ${iconColor[tone]}`} />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-gray-600">{desc}</p>
        </div>
      </button>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Ziyaret Sonucunu Belirtin</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CardBtn onClick={() => onSelect('InProgress')} tone="green" title="Sözleşme Başlat"
                 desc="Müşteri teklifi kabul etti, sürece başla." Icon={CheckCircle} />
        <CardBtn onClick={() => onSelect('Rejected')} tone="red" title="Teklifi Reddetti"
                 desc="Müşteri teklifi istemedi." Icon={XCircle} />
        <CardBtn onClick={() => onSelect('Unreachable')} tone="yellow" title="Ulaşılamadı"
                 desc="Müşteri adreste bulunamadı." Icon={UserX} />
        <CardBtn onClick={() => onSelect('Postponed')} tone="blue" title="Ertelendi"
                 desc="Müşteri daha sonra görüşmek istedi." Icon={Clock} />
        <CardBtn onClick={() => onSelect('Evaluating')} tone="gray" title="Değerlendiriyor"
                 desc="Müşteri düşünecek, dönüş yapacak." Icon={Hourglass} />
      </div>
    </div>
  );
};

// --- Finalize Ekranı (Reddetme/Ertleme/Değerlendirme) ---
const FinalizeVisitScreen: React.FC<{
  state: State;
  dispatch: React.Dispatch<Action>;
  onFinalize: () => void;
  onBack: () => void;
}> = ({ state, dispatch, onFinalize, onBack }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Ziyaret Notları</h3>

      {state.visitStatus === 'Rejected' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Reddetme Sebebi</label>
          <select
            value={state.rejectionReason ?? ''}
            onChange={(e) => dispatch({ type: 'SET_REJECTION_REASON', payload: e.target.value || null })}
            className="w-full p-2 border rounded-lg"
          >
            <option value="">Seçiniz…</option>
            <option value="Fiyat yüksek">Fiyat yüksek</option>
            <option value="Mevcut sağlayıcıdan memnun">Mevcut sağlayıcıdan memnun</option>
            <option value="Yetkili değil">Görüşülen kişi yetkili değil</option>
          </select>
        </div>
      )}

      {state.visitStatus === 'Postponed' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Randevu</label>
          <input
            type="date"
            value={state.rescheduledDate ?? ''}
            onChange={(e) => dispatch({ type: 'SET_RESCHEDULED_DATE', payload: e.target.value || null })}
            className="w-full p-2 border rounded-lg"
          />
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
        <textarea
          rows={4}
          value={state.notes}
          onChange={(e) => dispatch({ type: 'SET_NOTES', payload: e.target.value })}
          className="w-full p-2 border rounded-lg"
          placeholder="Ziyaretle ilgili kısa notlar…"
        />
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 rounded-lg bg-white border">Geri</button>
        <button onClick={onFinalize} className="px-6 py-2 rounded-lg bg-[#0099CB] text-white">Kaydet ve Bitir</button>
      </div>
    </div>
  );
};

// --- Adım 1: Müşteri Bilgileri ---
const CustomerInfoStep: React.FC<{ customer: Customer; dispatch: React.Dispatch<Action>; notes: string }> = ({ customer, dispatch, notes }) => (
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

    <div className="mt-4">
      <label className="block text-sm text-gray-600 mb-1">Ziyaret Notu (opsiyonel)</label>
      <textarea
        rows={3}
        defaultValue={notes}
        onChange={(e) => dispatch({ type: 'SET_NOTES', payload: e.target.value })}
        className="w-full p-2 border rounded-lg"
        placeholder="Örn: müşteri karar vericinin öğleden sonra geleceğini söyledi."
      />
    </div>

    <div className="mt-6 text-right">
      <button onClick={() => dispatch({ type: 'SET_STEP', payload: 2 })} className="bg-[#0099CB] text-white px-6 py-3 rounded-lg inline-flex items-center gap-2">
        Bilgiler Doğru, Devam Et <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);

// --- Adım 2: Kimlik Doğrulama (mock OCR + NFC) ---
const IdVerificationStep: React.FC<{ state: State; dispatch: React.Dispatch<Action> }> = ({ state, dispatch }) => {
  const [isBypassChecked, setIsBypassChecked] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = async () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    setCameraError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(s);
    } catch (err: any) {
      setCameraError(`Kamera başlatılamadı: ${err.message}`);
    }
  };

  const stopCamera = () => {
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (v && stream) {
      v.srcObject = stream;
      const p = v.play();
      p?.catch(() => setCameraError("Kamera başlatıldı ancak video oynatılamadı."));
    }
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, [stream]);

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
    setTimeout(() => {
      if (Math.random() < 0.85) {
        dispatch({ type: 'SET_OCR_STATUS', payload: 'success' });
      } else {
        dispatch({ type: 'SET_OCR_STATUS', payload: 'error' });
        dispatch({ type: 'SET_ID_PHOTO', payload: null });
      }
    }, 2000);
  };

  const handleNfcRead = () => {
    dispatch({ type: 'SET_NFC_STATUS', payload: 'scanning' });
    setTimeout(() => dispatch({ type: 'SET_NFC_STATUS', payload: 'success' }), 1500);
  };

  const handleBypassToggle = (checked: boolean) => {
    setIsBypassChecked(checked);
    if (checked) {
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
          <ScanLine className="w-5 h-5 text-[#0099CB]" />
          <h3 className="text-lg font-semibold">2. Kimlik Doğrulama</h3>
        </div>
        <label className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 border border-yellow-300">
          <input type="checkbox" checked={isBypassChecked} onChange={(e) => handleBypassToggle(e.target.checked)} className="h-4 w-4" />
          <span className="text-sm font-medium text-yellow-800">Test Modu</span>
        </label>
      </div>

      {!isBypassChecked && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* OCR Section */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Kimlik Fotoğrafı
            </h4>
            
            {state.ocrStatus === 'idle' && !state.idPhoto && (
              <div className="space-y-3">
                {!stream && (
                  <button onClick={startCamera} className="w-full p-3 border-2 border-dashed rounded-lg text-center hover:bg-gray-50">
                    <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">Kamerayı Başlat</p>
                  </button>
                )}
                {cameraError && <p className="text-red-600 text-sm">{cameraError}</p>}
              </div>
            )}

            {stream && (
              <div className="space-y-3">
                <div className="relative">
                  <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" />
                  <button onClick={handleCaptureAndOcr} className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-[#0099CB] text-white p-3 rounded-full">
                    <Camera className="w-6 h-6" />
                  </button>
                </div>
                <button onClick={stopCamera} className="w-full p-2 text-gray-600 border rounded-lg">Kamerayı Kapat</button>
              </div>
            )}

            {state.ocrStatus === 'scanning' && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#0099CB]" />
                <p className="text-sm text-gray-600">Kimlik okunuyor...</p>
              </div>
            )}

            {state.ocrStatus === 'success' && (
              <div className="text-center py-4">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm text-green-600">Kimlik başarıyla okundu</p>
              </div>
            )}

            {state.ocrStatus === 'error' && (
              <div className="text-center py-4">
                <XCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                <p className="text-sm text-red-600">Kimlik okunamadı, tekrar deneyin</p>
                <button onClick={() => dispatch({ type: 'SET_OCR_STATUS', payload: 'idle' })} className="mt-2 text-[#0099CB] text-sm">Tekrar Dene</button>
              </div>
            )}
          </div>

          {/* NFC Section */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Nfc className="w-4 h-4" />
              NFC Okuma
            </h4>
            
            {state.nfcStatus === 'idle' && (
              <button onClick={handleNfcRead} className="w-full p-6 border-2 border-dashed rounded-lg text-center hover:bg-gray-50">
                <Nfc className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">Kimliği NFC ile okut</p>
              </button>
            )}

            {state.nfcStatus === 'scanning' && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#0099CB]" />
                <p className="text-sm text-gray-600">NFC okunuyor...</p>
              </div>
            )}

            {state.nfcStatus === 'success' && (
              <div className="text-center py-4">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm text-green-600">NFC başarıyla okundu</p>
              </div>
            )}
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="mt-6 flex justify-between">
        <button onClick={() => dispatch({ type: 'SET_STEP', payload: 1 })} className="px-4 py-2 border rounded-lg">Geri</button>
        <button 
          onClick={() => dispatch({ type: 'SET_STEP', payload: 3 })} 
          disabled={!isVerified}
          className={`px-6 py-2 rounded-lg ${isVerified ? 'bg-[#0099CB] text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        >
          Devam Et
        </button>
      </div>
    </div>
  );
};

// --- Adım 3: Sözleşme ---
const ContractStep: React.FC<{ state: State; dispatch: React.Dispatch<Action>; customer: Customer }> = ({ state, dispatch, customer }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
    <div className="flex items-center gap-3 mb-4">
      <FileText className="w-5 h-5 text-[#0099CB]" />
      <h3 className="text-lg font-semibold">3. Sözleşme İmzalama</h3>
    </div>

    <div className="bg-gray-50 p-4 rounded-lg mb-4">
      <h4 className="font-medium mb-2">Sözleşme Özeti</h4>
      <div className="text-sm text-gray-600 space-y-1">
        <p>Müşteri: {customer.name}</p>
        <p>Abone Tipi: {customer.subscriberType}</p>
        <p>Aylık Ortalama Tüketim: {customer.avgMonthlyConsumptionKwh} kWh</p>
        <p>Mevcut Birim Fiyat: {customer.currentKwhPrice} TL/kWh</p>
      </div>
    </div>

    <div className="border rounded-lg p-4 mb-4">
      <label className="flex items-start gap-3">
        <input 
          type="checkbox" 
          checked={state.contractAccepted}
          onChange={(e) => dispatch({ type: 'SET_CONTRACT_ACCEPTED', payload: e.target.checked })}
          className="mt-1 h-4 w-4"
        />
        <div className="text-sm">
          <p className="font-medium">Sözleşme Onayı</p>
          <p className="text-gray-600">Müşteri sözleşme şartlarını okudu ve kabul etti.</p>
        </div>
      </label>
    </div>

    <div className="mt-6 flex justify-between">
      <button onClick={() => dispatch({ type: 'SET_STEP', payload: 2 })} className="px-4 py-2 border rounded-lg">Geri</button>
      <button 
        onClick={() => dispatch({ type: 'SET_STEP', payload: 4 })} 
        disabled={!state.contractAccepted}
        className={`px-6 py-2 rounded-lg ${state.contractAccepted ? 'bg-[#0099CB] text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
      >
        Devam Et
      </button>
    </div>
  </div>
);

// --- Adım 4: Tamamlama ---
const CompletionStep: React.FC<{ customer: Customer; dispatch: React.Dispatch<Action>; onComplete: () => void }> = ({ customer, dispatch, onComplete }) => {
  const [isSending, setIsSending] = useState(false);

  const handleSendSms = async () => {
    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    dispatch({ type: 'SET_SMS_SENT', payload: true });
    setIsSending(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="w-5 h-5 text-[#0099CB]" />
        <h3 className="text-lg font-semibold">4. Ziyaret Tamamlama</h3>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h4 className="font-medium text-green-800">Sözleşme Başarıyla Tamamlandı!</h4>
        </div>
        <p className="text-sm text-green-700">
          {customer.name} için sözleşme süreci başarıyla tamamlandı. 
          Müşteriye onay SMS'i gönderebilirsiniz.
        </p>
      </div>

      <div className="border rounded-lg p-4 mb-4">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          SMS Gönderimi
        </h4>
        <p className="text-sm text-gray-600 mb-3">
          Müşteriye sözleşme onay SMS'i gönderilsin mi?
        </p>
        <button 
          onClick={handleSendSms}
          disabled={isSending}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {isSending ? 'Gönderiliyor...' : 'SMS Gönder'}
        </button>
      </div>

      <div className="mt-6 flex justify-between">
        <button onClick={() => dispatch({ type: 'SET_STEP', payload: 3 })} className="px-4 py-2 border rounded-lg">Geri</button>
        <button onClick={onComplete} className="px-6 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Ziyareti Tamamla
        </button>
      </div>
    </div>
  );
};

export default VisitFlowScreen;
