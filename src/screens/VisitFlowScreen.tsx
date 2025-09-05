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
// Bu bölüm, daha önce üzerinde çalıştığımız kodun tamamıdır.

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
    case 'SET_REJECTION_REASON':
      return { ...state, rejectionReason: action.payload, rescheduledDate: null };
    case 'SET_RESCHEDULED_DATE':
        return { ...state, rescheduledDate: action.payload, rejectionReason: null };
    case 'RESET':
      return initialState;
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

// --- YARDIMCI BİLEŞENLER ---

const VisitStatusSelection: React.FC<{ onSelect: (status: VisitStatus) => void; }> = ({ onSelect }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Müzakere Sonucunu Belirtin</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button onClick={() => onSelect('InProgress')} className="p-4 border rounded-lg text-left hover:bg-green-50 hover:border-green-400 transition-colors flex items-center gap-4">
        <CheckCircle className="w-8 h-8 text-green-500" />
        <div><p className="font-semibold text-green-800">Sözleşme Başlat</p><p className="text-sm text-gray-600">Müşteri teklifi kabul etti, sürece başla.</p></div>
      </button>
      <button onClick={() => onSelect('Rejected')} className="p-4 border rounded-lg text-left hover:bg-red-50 hover:border-red-400 transition-colors flex items-center gap-4">
        <XCircle className="w-8 h-8 text-red-500" />
        <div><p className="font-semibold text-red-800">Teklifi Reddetti</p><p className="text-sm text-gray-600">Müşteri teklifi istemedi.</p></div>
      </button>
      <button onClick={() => onSelect('Unreachable')} className="p-4 border rounded-lg text-left hover:bg-yellow-50 hover:border-yellow-400 transition-colors flex items-center gap-4">
        <UserX className="w-8 h-8 text-yellow-500" />
        <div><p className="font-semibold text-yellow-800">Ulaşılamadı</p><p className="text-sm text-gray-600">Müşteri adreste bulunamadı.</p></div>
      </button>
      <button onClick={() => onSelect('Postponed')} className="p-4 border rounded-lg text-left hover:bg-blue-50 hover:border-blue-400 transition-colors flex items-center gap-4">
        <Clock className="w-8 h-8 text-blue-500" />
        <div><p className="font-semibold text-blue-800">Ertelendi</p><p className="text-sm text-gray-600">Müşteri daha sonra görüşmek istedi.</p></div>
      </button>
      <button onClick={() => onSelect('Evaluating')} className="p-4 border rounded-lg text-left hover:bg-purple-50 hover:border-purple-400 transition-colors flex items-center gap-4 md:col-span-2">
        <Hourglass className="w-8 h-8 text-purple-500" />
        <div><p className="font-semibold text-purple-800">Değerlendiriliyor</p><p className="text-sm text-gray-600">Müşteri teklifi düşüneceğini belirtti.</p></div>
      </button>
    </div>
  </div>
);

const FinalizeVisitScreen: React.FC<{ state: State; dispatch: React.Dispatch<Action>; onFinalize: () => void; onBack: () => void; }> = ({ state, dispatch, onFinalize, onBack }) => {
  const statusConfig = { Rejected: { title: 'Teklifi Reddetti', color: 'red', icon: <XCircle className="w-12 h-12 text-red-500" /> }, Unreachable: { title: 'Ulaşılamadı', color: 'yellow', icon: <UserX className="w-12 h-12 text-yellow-500" /> }, Postponed: { title: 'Ertelendi', color: 'blue', icon: <Clock className="w-12 h-12 text-blue-500" /> }, Evaluating: { title: 'Değerlendiriliyor', color: 'purple', icon: <Hourglass className="w-12 h-12 text-purple-500" /> }, default: { title: 'Ziyareti Sonlandır', color: 'gray', icon: <CheckCircle className="w-12 h-12 text-gray-500" /> } };
  const reasonsConfig = { Rejected: ['Fiyatı pahalı buldu', 'Mevcut sağlayıcısından taahhütü var', 'Hizmet kalitesine güvenmiyor', 'Teklifle ilgilenmiyor'], Unreachable: ['Adres hatalı / eksik', 'Adreste bulunamadı', 'Kapıyı açmadı'], Evaluating: ['Teklifi inceleyecek', 'Eşiyle/ortağıyla görüşecek', 'Geri dönüş yapacak'] };
  const config = statusConfig[state.visitStatus as keyof typeof statusConfig] || statusConfig.default;
  const reasons = reasonsConfig[state.visitStatus as keyof typeof reasonsConfig];
  const colorClasses = { red: 'bg-red-600 hover:bg-red-700', yellow: 'bg-yellow-600 hover:bg-yellow-700', blue: 'bg-blue-600 hover:bg-blue-700', purple: 'bg-purple-600 hover:bg-purple-700', gray: 'bg-gray-600 hover:bg-gray-700' }
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
      <div className="text-center"><div className="mx-auto w-fit mb-4">{config.icon}</div><h3 className="text-2xl font-semibold text-gray-800 mb-2">Ziyaret Sonucu: {config.title}</h3><p className="text-gray-600 mb-6">Lütfen ziyaret detaylarını belirtip notlarınızı ekleyin.</p></div>
      {state.visitStatus === 'Postponed' && (<div className="text-left my-6"><label htmlFor="rescheduleDate" className="block text-sm font-medium text-gray-700 mb-2">Yeni Randevu Tarihi Belirleyin</label><input type="date" id="rescheduleDate" value={state.rescheduledDate || ''} onChange={(e) => dispatch({ type: 'SET_RESCHEDULED_DATE', payload: e.target.value })} className="w-full p-2 border rounded-lg" min={new Date().toISOString().split('T')[0]} /></div>)}
      {reasons && (<div className="text-left my-6"><label className="block text-sm font-medium text-gray-700 mb-2">Lütfen bir sebep seçin</label><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{reasons.map(reason => (<label key={reason} className={`p-3 border rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${state.rejectionReason === reason ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300' : 'hover:bg-gray-50'}`}><input type="radio" name="rejectionReason" value={reason} checked={state.rejectionReason === reason} onChange={(e) => dispatch({ type: 'SET_REJECTION_REASON', payload: e.target.value })} className="h-4 w-4 text-[#0099CB] border-gray-300 focus:ring-[#0099CB]" /><span className="text-sm font-medium text-gray-700">{reason}</span></label>))}</div></div>)}
      <div className="text-left mt-6"><label htmlFor="visitNotes" className="block text-sm font-medium text-gray-700 mb-1">Ek Notlar</label><textarea id="visitNotes" value={state.notes} onChange={(e) => dispatch({ type: 'SET_NOTES', payload: e.target.value })} rows={3} className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099CB]" placeholder="Eklemek istediğiniz diğer detaylar..." /></div>
      <div className="mt-8 flex justify-center gap-4"><button onClick={onBack} className="px-6 py-2 rounded-lg bg-white border text-gray-700 hover:bg-gray-50">Geri</button><button onClick={onFinalize} className={`px-8 py-2 rounded-lg text-white font-semibold ${colorClasses[config.color as keyof typeof colorClasses]}`}>Ziyareti Kaydet ve Kapat</button></div>
    </div>
  );
};
const CustomerInfoStep: React.FC<{ customer: Customer; dispatch: React.Dispatch<Action> }> = ({ customer, dispatch }) => ( <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in"> <div className="flex items-center gap-3 mb-4"><IdCard className="w-5 h-5 text-[#0099CB]" /><h3 className="text-lg font-semibold">1. Müşteri Bilgileri Kontrolü</h3></div> <div className="grid md:grid-cols-2 gap-4"> <div><label className="text-sm text-gray-600">Ad Soyad</label><input defaultValue={customer.name} className="w-full mt-1 p-2 border rounded-lg bg-gray-100" readOnly /></div> <div><label className="text-sm text-gray-600">Telefon</label><input defaultValue={customer.phone} className="w-full mt-1 p-2 border rounded-lg bg-gray-100" readOnly /></div> <div className="md:col-span-2"><label className="text-sm text-gray-600">Adres</label><input defaultValue={`${customer.address}, ${customer.district}`} className="w-full mt-1 p-2 border rounded-lg bg-gray-100" readOnly /></div> </div> <div className="mt-6 text-right"><button onClick={() => dispatch({ type: 'SET_STEP', payload: 2 })} className="bg-[#0099CB] text-white px-6 py-3 rounded-lg inline-flex items-center gap-2">Bilgiler Doğru, Devam Et <ChevronRight className="w-4 h-4" /></button></div> </div> );
const IdVerificationStep: React.FC<{ state: State; dispatch: React.Dispatch<Action> }> = ({ state, dispatch }) => {
  const [isBypassChecked, setIsBypassChecked] = useState(false); const [stream, setStream] = useState<MediaStream | null>(null); const videoRef = useRef<HTMLVideoElement | null>(null); const canvasRef = useRef<HTMLCanvasElement | null>(null); const [cameraError, setCameraError] = useState<string | null>(null);
  const startCamera = async () => { if (stream) { stream.getTracks().forEach(track => track.stop()); } setCameraError(null); try { const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); setStream(s); } catch (err: any) { setCameraError(`Kamera başlatılamadı: ${err.message}`); } }; const stopCamera = () => { if (stream) { stream.getTracks().forEach(track => track.stop()); setStream(null); } }; useEffect(() => { const videoElement = videoRef.current; if (videoElement && stream) { videoElement.srcObject = stream; videoElement.play().catch(error => { setCameraError("Kamera başlatıldı ancak video otomatik oynatılamadı."); }); } return () => { if (stream) { stream.getTracks().forEach(track => track.stop()); } }; }, [stream]);
  const handleCaptureAndOcr = () => { const video = videoRef.current; const canvas = canvasRef.current; if (!video || !canvas) return; canvas.width = video.videoWidth; canvas.height = video.videoHeight; canvas.getContext('2d')?.drawImage(video, 0, 0); const photoDataUrl = canvas.toDataURL('image/jpeg'); dispatch({ type: 'SET_ID_PHOTO', payload: photoDataUrl }); dispatch({ type: 'SET_OCR_STATUS', payload: 'scanning' }); stopCamera(); setTimeout(() => { if (Math.random() < 0.8) { dispatch({ type: 'SET_OCR_STATUS', payload: 'success' }); } else { dispatch({ type: 'SET_OCR_STATUS', payload: 'error' }); dispatch({ type: 'SET_ID_PHOTO', payload: null }); } }, 2500); }; const handleNfcRead = () => { dispatch({ type: 'SET_NFC_STATUS', payload: 'scanning' }); setTimeout(() => { dispatch({ type: 'SET_NFC_STATUS', payload: 'success' }); }, 2000); };
  const handleBypassToggle = (isChecked: boolean) => { setIsBypassChecked(isChecked); if (isChecked) { dispatch({ type: 'SET_OCR_STATUS', payload: 'success' }); dispatch({ type: 'SET_NFC_STATUS', payload: 'success' }); stopCamera(); } else { dispatch({ type: 'SET_OCR_STATUS', payload: 'idle' }); dispatch({ type: 'SET_NFC_STATUS', payload: 'idle' }); } }; const isVerified = state.ocrStatus === 'success' && state.nfcStatus === 'success';
  return ( <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in"> <div className="flex items-center justify-between gap-3 mb-4"> <div className="flex items-center gap-3"><ScanLine className="w-5 h-5 text-[#0099CB]" /><h3 className="text-lg font-semibold">2. Kimlik Doğrulama</h3></div> <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 border border-yellow-300"><input type="checkbox" id="bypass-verification" checked={isBypassChecked} onChange={(e) => handleBypassToggle(e.target.checked)} className="h-4 w-4 rounded text-[#0099CB] focus:ring-[#0099CB]" /><label htmlFor="bypass-verification" className="text-sm font-medium text-yellow-800">[TEST] Doğrulamayı Atla</label></div> </div> <fieldset disabled={isBypassChecked}> <div className={`grid md:grid-cols-2 gap-6 items-start transition-opacity ${isBypassChecked ? 'opacity-40' : 'opacity-100'}`}> <div> <p className="text-sm font-medium text-gray-700 mb-2">Kimlik Fotoğrafı</p> <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center"> <video ref={videoRef} className={`w-full h-full object-cover ${!stream ? 'hidden' : ''}`} autoPlay muted playsInline /> {stream && <div className="absolute inset-0 border-[3px] border-dashed border-white/70 m-4 rounded-xl pointer-events-none" />} {!stream && state.idPhoto && <img src={state.idPhoto} alt="Çekilen Kimlik" className="w-full h-full object-contain" />} {!stream && !state.idPhoto && <div className="text-gray-400 p-4 text-center">Kamera kapalı veya izin bekleniyor.</div>} <canvas ref={canvasRef} className="hidden" /> </div> {cameraError && <p className="text-red-600 text-sm mt-2">{cameraError}</p>} <div className="mt-4"> {state.ocrStatus === 'idle' && (<button onClick={stream ? handleCaptureAndOcr : startCamera} className="w-full bg-[#0099CB] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"><Camera className="w-4 h-4" /> {stream ? 'Fotoğraf Çek ve Doğrula' : 'Kamerayı Başlat'}</button>)} {state.ocrStatus === 'scanning' && <div className="text-center p-2"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0099CB]" /> <p>Kimlik okunuyor...</p></div>} {state.ocrStatus === 'success' && <div className="text-center p-2 text-green-600 font-semibold flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5"/> Kimlik başarıyla okundu.</div>} {state.ocrStatus === 'error' && (<div className="text-center p-2 text-red-600"><p className="font-semibold">Kimlik okunamadı!</p><p className="text-sm">Lütfen daha aydınlık bir ortamda, yansıma olmadan tekrar deneyin.</p><button onClick={() => dispatch({type: 'SET_OCR_STATUS', payload: 'idle'})} className="mt-2 text-sm bg-gray-200 px-3 py-1 rounded">Tekrar Dene</button></div>)} </div> </div> <div className={`transition-opacity duration-500 ${state.ocrStatus === 'success' ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}> <p className="text-sm font-medium text-gray-700 mb-2">Çipli Kimlik (NFC) Onayı</p> <div className="p-4 border rounded-lg h-full flex flex-col justify-center items-center"> {state.nfcStatus === 'idle' && <button onClick={handleNfcRead} className="bg-[#F9C800] text-gray-900 px-4 py-2 rounded-lg flex items-center gap-2"><Nfc className="w-5 h-5" /> NFC ile Oku</button>} {state.nfcStatus === 'scanning' && <div className="text-center p-2"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#F9C800]" /> <p>Telefonu kimliğe yaklaştırın...</p></div>} {state.nfcStatus === 'success' && <div className="text-center p-2 text-green-600 font-semibold flex items-center justify-center gap-2"><ShieldCheck className="w-5 h-5"/> NFC onayı başarılı.</div>} {state.nfcStatus === 'error' && <p className="text-red-600">NFC okunamadı.</p>} <p className="text-xs text-gray-500 mt-2 text-center">Bu adım, kimlikteki çipten bilgileri alarak güvenliği artırır.</p> </div> </div> </div> </fieldset> <div className="mt-6 flex justify-between"> <button onClick={() => dispatch({ type: 'SET_STEP', payload: 1 })} className="px-4 py-2 rounded-lg bg-white border">Geri</button> <button onClick={() => dispatch({ type: 'SET_STEP', payload: 3 })} disabled={!isVerified} className={`px-6 py-3 rounded-lg text-white ${isVerified ? 'bg-[#0099CB]' : 'bg-gray-300'}`}>Devam Et</button> </div> </div> ); };
const ContractStep: React.FC<{ state: State; dispatch: React.Dispatch<Action>; customer: Customer }> = ({ state, dispatch, customer }) => { const [flowSmsPhone, setFlowSmsPhone] = useState(() => customer?.phone ?? ""); const [sigOpen, setSigOpen] = useState(false); const [contractOpen, setContractOpen] = useState(false); const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null); const canContinue = state.contractAccepted && state.smsSent && !!signatureDataUrl; return ( <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in"> <div className="flex items-center gap-3 mb-4"><FileText className="w-5 h-5 text-[#0099CB]" /><h3 className="text-lg font-semibold">3. Sözleşme Onayı</h3></div> <div className="grid md:grid-cols-2 gap-6"> <div> <p className="text-sm text-gray-600 mb-2">Sözleşme Önizleme</p> <button type="button" onClick={() => setContractOpen(true)} className="w-full h-64 border rounded-lg bg-white overflow-hidden relative text-left" aria-label="Sözleşmeyi görüntüle"> <ContractMockPage customer={customer} signatureDataUrl={signatureDataUrl} scale="preview" /> <div className="absolute bottom-2 right-2 flex flex-col items-center pointer-events-none"><div className="h-8 w-8 rounded-full bg-[#F9C800] text-gray-900 shadow ring-1 ring-black/10 flex items-center justify-center"><Maximize2 className="h-4 w-4" /></div></div> </button> <label className="mt-4 flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={state.contractAccepted} onChange={(e) => dispatch({ type: "SET_CONTRACT_ACCEPTED", payload: e.target.checked })}/>Sözleşme koşullarını okudum ve onaylıyorum.</label> </div> <div> <p className="text-sm text-gray-600 mb-2">Dijital İmza</p> <div className="border rounded-lg p-2 bg-gray-50"> {signatureDataUrl ? (<div className="flex items-center gap-3"><img src={signatureDataUrl} alt="İmza" className="h-[120px] w-auto bg-white rounded border" /><div className="flex flex-col gap-2"><button onClick={() => setSigOpen(true)} className="px-3 py-2 rounded-lg border bg-white text-sm">İmzayı Düzenle</button><button onClick={() => setSignatureDataUrl(null)} className="px-3 py-2 rounded-lg border bg-white text-sm">Temizle</button></div></div>) : (<div className="flex items-center justify-between gap-3"><div className="text-sm text-gray-500">Henüz imza yok.</div><button onClick={() => setSigOpen(true)} className="px-3 py-2 rounded-lg bg-[#0099CB] text-white text-sm"> İmza Al </button></div>)} </div> <div className="mt-4"> <p className="text-sm text-gray-600 mb-2">SMS ile Onay</p> <div className="flex gap-2"><input value={flowSmsPhone} onChange={(e) => setFlowSmsPhone(e.target.value)} className="flex-1 p-2 border rounded-lg" placeholder="5XX XXX XX XX" /><button onClick={() => dispatch({ type: "SET_SMS_SENT", payload: true })} className="px-4 py-2 bg-[#F9C800] rounded-lg">SMS Gönder</button></div> {state.smsSent && (<div className="mt-2 flex items-center gap-2 text-green-700 text-sm"><ShieldCheck className="w-4 h-4" /> Onay SMS'i gönderildi.</div>)} </div> </div> </div> <div className="mt-6 flex justify-between"> <button onClick={() => dispatch({ type: "SET_STEP", payload: 2 })} className="px-4 py-2 rounded-lg bg-white border">Geri</button> <button onClick={() => dispatch({ type: "SET_STEP", payload: 4 })} disabled={!canContinue} className={`px-6 py-3 rounded-lg text-white ${canContinue ? "bg-[#0099CB]" : "bg-gray-300"}`}>Sözleşmeyi Onayla ve Bitir</button> </div> {sigOpen && (<SignaturePadModal onClose={() => setSigOpen(false)} onSave={(dataUrl) => { setSignatureDataUrl(dataUrl); setSigOpen(false); }} />)} {contractOpen && (<ContractModal customer={customer} signatureDataUrl={signatureDataUrl} onClose={() => setContractOpen(false)} />)} </div> ); };
const CompletionStep: React.FC<{ customer: Customer; dispatch: React.Dispatch<Action>; onComplete: () => void; }> = ({ customer, onComplete }) => ( <div className="bg-white rounded-xl shadow-sm p-6 text-center animate-fade-in"> <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" /> <h3 className="text-2xl font-semibold">Sözleşme Tamamlandı!</h3> <p className="text-gray-600 mt-2">Müşteri {customer.name} için elektrik satış sözleşmesi başarıyla oluşturulmuştur.</p> <div className="mt-6 flex justify-center gap-4"> <button onClick={onComplete} className="px-8 py-3 rounded-lg bg-green-600 text-white font-semibold">Ziyareti Kaydet</button> </div> </div> );
const SignaturePadModal: React.FC<{ onClose: () => void; onSave: (dataUrl: string) => void; }> = ({ onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null); useEffect(() => { const scrollY = window.scrollY; const { style } = document.body; const htmlStyle = document.documentElement.style; const prev = { overflow: style.overflow, position: style.position, top: style.top, width: style.width, overscroll: htmlStyle.overscrollBehaviorY, }; style.overflow = "hidden"; style.position = "fixed"; style.top = `-${scrollY}px`; style.width = "100%"; htmlStyle.overscrollBehaviorY = "contain"; return () => { style.overflow = prev.overflow; style.position = prev.position; style.top = prev.top; style.width = prev.width; htmlStyle.overscrollBehaviorY = prev.overscroll || ""; window.scrollTo(0, scrollY); }; }, []);
  const fitCanvas = () => { const canvas = canvasRef.current; if (!canvas) return; const dpr = Math.max(window.devicePixelRatio || 1, 1); const rect = canvas.getBoundingClientRect(); canvas.width = Math.floor(rect.width * dpr); canvas.height = Math.floor(rect.height * dpr); const ctx = canvas.getContext("2d"); if (ctx) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, rect.width, rect.height); } }; useEffect(() => { fitCanvas(); const onResize = () => fitCanvas(); window.addEventListener("resize", onResize); return () => window.removeEventListener("resize", onResize); }, []);
  useEffect(() => { const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext("2d"); if (!ctx) return; canvas.style.touchAction = "none"; let drawing = false; const getPos = (e: PointerEvent) => { const rect = canvas.getBoundingClientRect(); return { x: e.clientX - rect.left, y: e.clientY - rect.top }; }; const down = (e: PointerEvent) => { drawing = true; canvas.setPointerCapture(e.pointerId); const { x, y } = getPos(e); ctx.beginPath(); ctx.moveTo(x, y); }; const move = (e: PointerEvent) => { if (!drawing) return; const { x, y } = getPos(e); ctx.lineTo(x, y); ctx.strokeStyle = "#111"; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke(); }; const up = (e: PointerEvent) => { drawing = false; try { canvas.releasePointerCapture(e.pointerId); } catch {} }; canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointermove", move); window.addEventListener("pointerup", up); return () => { canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); }; }, []);
  const handleClear = () => { const canvas = canvasRef.current; const ctx = canvas?.getContext("2d"); if (!canvas || !ctx) return; const rect = canvas.getBoundingClientRect(); ctx.clearRect(0, 0, rect.width, rect.height); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, rect.width, rect.height); }; const handleSave = () => { const canvas = canvasRef.current; if (!canvas) return; onSave(canvas.toDataURL("image/png")); };
  return ( <div role="dialog" aria-modal="true" className="fixed inset-0 z-[10050] bg-black/50"> <div className="absolute top-4 right-4 z-20 p-2 bg-white/30 backdrop-blur-sm rounded-xl shadow-lg flex items-center gap-2"> <button onClick={handleClear} className="px-4 py-2 rounded-lg border bg-white/80 text-gray-800 font-semibold text-sm">Temizle</button> <button onClick={handleSave} className="px-5 py-2 rounded-lg bg-[#0099CB] text-white font-semibold text-sm">Kaydet</button> <button onClick={onClose} className="px-4 py-2 rounded-lg border bg-white/80 text-gray-800 text-sm">Kapat</button> </div> <div className="relative h-screen w-screen"> <canvas ref={canvasRef} className="h-full w-full block bg-white" /> <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-gray-400 text-sm pointer-events-none">Lütfen bu alana imzanızı atın</div> </div> </div> );
};
const ContractMockPage: React.FC<{ customer: Customer; signatureDataUrl: string | null; scale: "preview" | "full"; }> = ({ customer, signatureDataUrl, scale }) => { const base = scale === "full" ? { pad: "p-8", title: "text-2xl", body: "text-sm", small: "text-xs" } : { pad: "p-3", title: "text-base", body: "text-[10.5px]", small: "text-[9.5px]" }; const sigH = scale === "full" ? 100 : 44; const imgMaxH = Math.floor(sigH * 0.8); return ( <div className={`relative h-full w-full ${base.pad} bg-white`}> <div className="text-center mb-2"><div className={`font-semibold ${base.title} text-gray-900`}>ELEKTRİK SATIŞ SÖZLEŞMESİ</div><div className={`${base.small} text-gray-500`}>Mock • Tek Sayfa</div></div> <div className={`space-y-2 ${base.body} text-gray-800`}><p>İşbu sözleşme; <strong>{customer.name}</strong> ({customer.address}, {customer.district}) ile Enerjisa Satış A.Ş. arasında, elektrik tedariki kapsamındaki hak ve yükümlülükleri belirlemek üzere{" "}{new Date().toLocaleDateString()} tarihinde akdedilmiştir.</p><ol className="list-decimal ml-5 space-y-1"><li>Teslim noktasında ölçüm değerleri esas alınır.</li><li>Faturalandırma aylık dönemler itibarıyla yapılır.</li><li>Ödeme süresi fatura tebliğinden itibaren 10 gündür.</li><li>Cayma süresi imzadan itibaren 14 gündür.</li><li>Kişisel veriler 6698 sayılı KVKK kapsamında işlenir.</li></ol></div> <div className="mt-6 pt-4 border-t"><div className="grid grid-cols-2 gap-4"><div className="flex flex-col"><div className="border-2 border-dashed border-gray-300 rounded bg-white flex items-center justify-center" style={{ height: sigH }}>{signatureDataUrl ? (<img src={signatureDataUrl} alt="Müşteri İmzası" style={{ maxHeight: imgMaxH, maxWidth: "90%" }} className="object-contain" />) : (<span className={`${base.small} text-gray-400`}>Müşteri İmzası</span>)}</div><div className={`${base.small} mt-1 text-gray-500 text-center`}>Müşteri İmzası</div></div><div className="flex flex-col"><div className="border-2 border-dashed border-gray-300 rounded bg-white flex items-center justify-center" style={{ height: sigH }}><span className={`${base.small} text-gray-400`}>Tedarikçi İmzası</span></div><div className={`${base.small} mt-1 text-gray-500 text-center`}>Tedarikçi İmzası</div></div></div></div> </div> ); };
const ContractModal: React.FC<{ customer: Customer; signatureDataUrl: string | null; onClose: () => void; }> = ({ customer, signatureDataUrl, onClose }) => { useEffect(() => { const scrollY = window.scrollY; const { style } = document.body; const htmlStyle = document.documentElement.style; const prev = { overflow: style.overflow, position: style.position, top: style.top, width: style.width, overscroll: htmlStyle.overscrollBehaviorY as string | undefined, }; style.overflow = "hidden"; style.position = "fixed"; style.top = `-${scrollY}px`; style.width = "100%"; htmlStyle.overscrollBehaviorY = "contain"; return () => { style.overflow = prev.overflow; style.position = prev.position; style.top = prev.top; style.width = prev.width; htmlStyle.overscrollBehaviorY = prev.overscroll || ""; window.scrollTo(0, scrollY); }; }, []); return ( <div role="dialog" aria-modal="true" className="fixed inset-0 z-[10040] flex flex-col bg-black/50"> <div className="flex items-center justify-between bg-white px-4 py-3 border-b"><div className="font-semibold text-gray-900">Sözleşme — Önizleme</div><button onClick={onClose} className="px-3 py-1.5 rounded border bg-white text-sm">Kapat</button></div> <div className="flex-1 bg-gray-100 overflow-auto"><div className="mx-auto my-4 bg-white shadow border" style={{ width: 820, minHeight: 1160 }}><ContractMockPage customer={customer} signatureDataUrl={signatureDataUrl} scale="full" /></div></div> </div> ); };


// ==================================================================
// ==================== YENİ TEKLİF EKRANI ==========================
// ==================================================================

const ProposalScreen: React.FC<{ customer: Customer; onProceed: () => void; onCancel: () => void; }> = ({ customer, onProceed, onCancel }) => {
    
    const enerjisaKwhPrice = 1.99; // Mock Enerjisa Fiyatı
    const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);

    const currentMonthlyBill = customer.currentKwhPrice * customer.avgMonthlyConsumptionKwh;
    const enerjisaMonthlyBill = enerjisaKwhPrice * customer.avgMonthlyConsumptionKwh;
    const annualSavings = (currentMonthlyBill - enerjisaMonthlyBill) * 12;

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen animate-fade-in">
            <div className="flex items-center justify-between mb-4">
                 <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Müşteri Teklifi ve Analiz</h1>
                 <button onClick={onCancel} className="text-gray-600 hover:text-gray-900 font-medium text-sm sm:text-base">← Listeye Dön</button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
                {/* Müşteri Bilgisi ve Uygunluk */}
                <div className="pb-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">{customer.name}</h2>
                    <p className="text-sm text-gray-500">{customer.address}</p>
                    {customer.isEligible ? (
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            <CheckCircle className="w-4 h-4" /> Serbest Tüketici Olmaya Uygun
                        </div>
                    ) : (
                         <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                            <XCircle className="w-4 h-4" /> Serbest Tüketici Değil
                        </div>
                    )}
                </div>

                {/* Karşılaştırma Tablosu */}
                <div className="grid grid-cols-2 gap-6 mt-6">
                    {/* Mevcut Durum */}
                    <div className="border-r pr-6">
                        <h3 className="font-semibold text-gray-700">Mevcut Durum</h3>
                        <div className="mt-4 space-y-3">
                            <div><p className="text-xs text-gray-500">Tedarikçi</p><p className="font-medium">{customer.currentProvider}</p></div>
                            <div><p className="text-xs text-gray-500">Aktif Tarife</p><p className="font-medium">Standart Konut</p></div>
                            <div><p className="text-xs text-gray-500">Birim Fiyat (kWh)</p><p className="font-medium">{formatCurrency(customer.currentKwhPrice)}</p></div>
                            <div><p className="text-xs text-gray-500">Tahmini Aylık Fatura</p><p className="font-medium text-lg">{formatCurrency(currentMonthlyBill)}</p></div>
                        </div>
                    </div>
                    {/* Enerjisa Teklifi */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                         <h3 className="font-bold text-[#0099CB] flex items-center gap-2"><Sparkles className="w-5 h-5"/> Enerjisa Teklifi</h3>
                        <div className="mt-4 space-y-3">
                            <div><p className="text-xs text-gray-500">Tedarikçi</p><p className="font-medium">Enerjisa</p></div>
                            <div><p className="text-xs text-gray-500">Aktif Tarife</p><p className="font-bold text-[#0099CB]">Avantajlı Konut</p></div>
                            <div><p className="text-xs text-gray-500">Birim Fiyat (kWh)</p><p className="font-bold text-xl text-[#0099CB]">{formatCurrency(enerjisaKwhPrice)}</p></div>
                            <div><p className="text-xs text-gray-500">Tahmini Aylık Fatura</p><p className="font-bold text-xl text-green-600">{formatCurrency(enerjisaMonthlyBill)}</p></div>
                        </div>
                    </div>
                </div>
                
                {/* Yıllık Tasarruf Vurgusu */}
                {annualSavings > 0 && (
                    <div className="mt-6 p-4 bg-green-100 border border-green-200 rounded-lg text-center">
                        <p className="text-sm font-semibold text-green-800">Tahmini Yıllık Tasarruf</p>
                        <p className="text-3xl font-bold text-green-700">{formatCurrency(annualSavings)}</p>
                    </div>
                )}
                 <div className="mt-8 text-center">
                    <button 
                        onClick={onProceed}
                        className="bg-[#0099CB] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#007ca8] transition-colors inline-flex items-center gap-2 text-lg"
                    >
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
    { id: 1, name: 'Ahmet Yılmaz', address: 'Gül Mahallesi, Lale Sokak No: 12/3', district: 'Çankaya/Ankara', phone: '555 123 4567', status: 'Pending', isEligible: true, currentProvider: 'Bölgesel Tedarikçi', currentKwhPrice: 2.35, avgMonthlyConsumptionKwh: 150 },
    { id: 2, name: 'Ayşe Kaya', address: 'Menekşe Caddesi, Zambak Apartmanı No: 5', district: 'Kadıköy/İstanbul', phone: '555 987 6543', status: 'Pending', isEligible: true, currentProvider: 'Bölgesel Tedarikçi', currentKwhPrice: 2.41, avgMonthlyConsumptionKwh: 220 },
    { id: 3, name: 'Mehmet Öztürk', address: 'Çınar Sokak No: 1', district: 'Bornova/İzmir', phone: '555 111 2233', status: 'Pending', isEligible: false, currentProvider: 'Bölgesel Tedarikçi', currentKwhPrice: 2.29, avgMonthlyConsumptionKwh: 80 },
];

const App = () => {
    const [view, setView] = useState<'list' | 'proposal' | 'flow'>('list');
    const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
    
    const handleStartVisit = (customer: Customer) => {
        setActiveCustomer(customer);
        setView('proposal'); // Önce teklif ekranını göster
    };
    
    const handleClose = () => {
        setActiveCustomer(null);
        setView('list');
    };
    
    const handleProceedToFlow = () => {
        setView('flow'); // Tekliften sonra karar ekranına geç
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

 what do you want to do with this code?

