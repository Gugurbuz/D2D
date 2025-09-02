// src/screens/VisitFlowScreen.tsx
import React, { useReducer, useState, useRef, useEffect } from 'react';

// İkonları import ediyoruz
import {
  IdCard, Camera, Smartphone, FileText, PenLine, Send,
  ChevronRight, ShieldCheck, CheckCircle, XCircle, UserX, Clock,
  Loader2, ScanLine, Nfc,
} from 'lucide-react';
import { Customer } from '../RouteMap';

// --- TİPLER VE STATE TANIMLAMALARI ---
type VisitStatus =
  | 'Pending'
  | 'InProgress'
  | 'Completed'
  | 'Rejected'
  | 'Unreachable'
  | 'Postponed';

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

// --- REDUCER FONKSİYONU ---
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

// --- ANA BİLEŞEN ---
const VisitFlowScreen: React.FC<Props> = ({ customer, onCloseToList, onCompleteVisit }) => {
  const [state, dispatch] = useReducer(visitReducer, initialState);

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
    </div>
  );
};

// ==================================================================
// ==================== YARDIMCI BİLEŞENLER =========================
// ==================================================================

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
  const [isBypassChecked, setIsBypassChecked] = useState(false);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = async () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    setCameraError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(s);
    } catch (err: any) {
      setCameraError(`Kamera başlatılamadı: ${err.message}`);
    }
  };
  
  const stopCamera = () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
    }
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement && stream) {
      videoElement.srcObject = stream;
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Video oynatma hatası:", error);
          setCameraError("Kamera başlatıldı ancak video otomatik oynatılamadı.");
        });
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
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
      if (Math.random() < 0.8) {
        dispatch({ type: 'SET_OCR_STATUS', payload: 'success' });
      } else {
        dispatch({ type: 'SET_OCR_STATUS', payload: 'error' });
        dispatch({ type: 'SET_ID_PHOTO', payload: null });
      }
    }, 2500);
  };

  const handleNfcRead = () => {
    dispatch({ type: 'SET_NFC_STATUS', payload: 'scanning' });
    setTimeout(() => {
        dispatch({ type: 'SET_NFC_STATUS', payload: 'success' });
    }, 2000);
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
              <ScanLine className="w-5 h-5 text-[#0099CB]" />
              <h3 className="text-lg font-semibold">2. Kimlik Doğrulama</h3>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 border border-yellow-300">
                <input
                    type="checkbox"
                    id="bypass-verification"
                    checked={isBypassChecked}
                    onChange={(e) => handleBypassToggle(e.target.checked)}
                    className="h-4 w-4 rounded text-[#0099CB] focus:ring-[#0099CB]"
                />
                <label htmlFor="bypass-verification" className="text-sm font-medium text-yellow-800">[TEST] Doğrulamayı Atla</label>
            </div>
        </div>
        
        <fieldset disabled={isBypassChecked}>
          <div className={`grid md:grid-cols-2 gap-6 items-start transition-opacity ${isBypassChecked ? 'opacity-40' : 'opacity-100'}`}>
              <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Kimlik Fotoğrafı</p>
                  <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                      <video 
                          ref={videoRef} 
                          className={`w-full h-full object-cover ${!stream ? 'hidden' : ''}`} 
                          autoPlay 
                          muted 
                          playsInline 
                      />
                      {stream && <div className="absolute inset-0 border-[3px] border-dashed border-white/70 m-4 rounded-xl pointer-events-none" />}
                      {!stream && state.idPhoto && <img src={state.idPhoto} alt="Çekilen Kimlik" className="w-full h-full object-contain" />}
                      {!stream && !state.idPhoto && <div className="text-gray-400 p-4 text-center">Kamera kapalı veya izin bekleniyor.</div>}
                      <canvas ref={canvasRef} className="hidden" />
                  </div>
                  {cameraError && <p className="text-red-600 text-sm mt-2">{cameraError}</p>}
                  
                  <div className="mt-4">
                      {state.ocrStatus === 'idle' && (
                          <button onClick={stream ? handleCaptureAndOcr : startCamera} className="w-full bg-[#0099CB] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2">
                              <Camera className="w-4 h-4" /> {stream ? 'Fotoğraf Çek ve Doğrula' : 'Kamerayı Başlat'}
                          </button>
                      )}
                      {state.ocrStatus === 'scanning' && <div className="text-center p-2"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0099CB]" /> <p>Kimlik okunuyor...</p></div>}
                      {state.ocrStatus === 'success' && <div className="text-center p-2 text-green-600 font-semibold flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5"/> Kimlik başarıyla okundu.</div>}
                      {state.ocrStatus === 'error' && (
                          <div className="text-center p-2 text-red-600">
                              <p className="font-semibold">Kimlik okunamadı!</p>
                              <p className="text-sm">Lütfen daha aydınlık bir ortamda, yansıma olmadan tekrar deneyin.</p>
                              <button onClick={() => dispatch({type: 'SET_OCR_STATUS', payload: 'idle'})} className="mt-2 text-sm bg-gray-200 px-3 py-1 rounded">Tekrar Dene</button>
                          </div>
                      )}
                  </div>
              </div>
              <div className={`transition-opacity duration-500 ${state.ocrStatus === 'success' ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                   <p className="text-sm font-medium text-gray-700 mb-2">Çipli Kimlik (NFC) Onayı</p>
                   <div className="p-4 border rounded-lg h-full flex flex-col justify-center items-center">
                      {state.nfcStatus === 'idle' && <button onClick={handleNfcRead} className="bg-[#F9C800] text-gray-900 px-4 py-2 rounded-lg flex items-center gap-2"><Nfc className="w-5 h-5" /> NFC ile Oku</button>}
                      {state.nfcStatus === 'scanning' && <div className="text-center p-2"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#F9C800]" /> <p>Telefonu kimliğe yaklaştırın...</p></div>}
                      {state.nfcStatus === 'success' && <div className="text-center p-2 text-green-600 font-semibold flex items-center justify-center gap-2"><ShieldCheck className="w-5 h-5"/> NFC onayı başarılı.</div>}
                      {state.nfcStatus === 'error' && <p className="text-red-600">NFC okunamadı.</p>}
                      <p className="text-xs text-gray-500 mt-2 text-center">Bu adım, kimlikteki çipten bilgileri alarak güvenliği artırır.</p>
                   </div>
              </div>
          </div>
        </fieldset>
        <div className="mt-6 flex justify-between">
            <button onClick={() => dispatch({ type: 'SET_STEP', payload: 1 })} className="px-4 py-2 rounded-lg bg-white border">Geri</button>
            <button onClick={() => dispatch({ type: 'SET_STEP', payload: 3 })} disabled={!isVerified} className={`px-6 py-3 rounded-lg text-white ${isVerified ? 'bg-[#0099CB]' : 'bg-gray-300'}`}>
              Devam Et
            </button>
        </div>
    </div>
  );
};

// --- ADIM 3: Sözleşme ve İmza ---
const ContractStep: React.FC<{ state: State; dispatch: React.Dispatch<Action>; customer: Customer }> = ({ state, dispatch, customer }) => {
  const [flowSmsPhone, setFlowSmsPhone] = useState(customer.phone || "");
  const [sigOpen, setSigOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);

  // İmza Data URL'i (PNG). Kaydedilince hem önizleme hem modal imza slotu dolar.
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const canContinue = state.contractAccepted && state.smsSent && !!signatureDataUrl;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="w-5 h-5 text-[#0099CB]" />
        <h3 className="text-lg font-semibold">3. Sözleşme Onayı</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Sol: Sözleşme Önizleme + Onay */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Sözleşme Önizleme</p>

          {/* Tek sayfa mock sözleşme kartı (minyatür) */}
          <button
            type="button"
            onClick={() => setContractOpen(true)}
            className="w-full h-64 border rounded-lg bg-white overflow-hidden relative text-left"
            aria-label="Sözleşmeyi görüntüle"
          >
            <ContractMockPage
              customer={customer}
              signatureDataUrl={signatureDataUrl}
              scale="preview"
            />
            <div className="absolute bottom-2 right-2 text-[10px] px-2 py-1 bg-black/60 text-white rounded">
              Dokun ve büyüt
            </div>
          </button>

          <label className="mt-4 flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={state.contractAccepted}
              onChange={(e) => dispatch({ type: "SET_CONTRACT_ACCEPTED", payload: e.target.checked })}
            />
            Sözleşme koşullarını okudum ve onaylıyorum.
          </label>
        </div>

        {/* Sağ: İmza + SMS */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Dijital İmza</p>

          {/* Önizleme + Aç butonu */}
          <div className="border rounded-lg p-2 bg-gray-50">
            {signatureDataUrl ? (
              <div className="flex items-center gap-3">
                <img
                  src={signatureDataUrl}
                  alt="İmza"
                  className="h-[120px] w-auto bg-white rounded border"
                />
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setSigOpen(true)}
                    className="px-3 py-2 rounded-lg border bg-white text-sm"
                  >
                    İmzayı Düzenle
                  </button>
                  <button
                    onClick={() => setSignatureDataUrl(null)}
                    className="px-3 py-2 rounded-lg border bg-white text-sm"
                  >
                    Temizle
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-gray-500">Henüz imza yok.</div>
                <button
                  onClick={() => setSigOpen(true)}
                  className="px-3 py-2 rounded-lg bg-[#0099CB] text-white text-sm"
                >
                  İmza Al (Tam Ekran)
                </button>
              </div>
            )}
          </div>

          {/* SMS Onayı */}
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">SMS ile Onay</p>
            <div className="flex gap-2">
              <input
                value={flowSmsPhone}
                onChange={(e) => setFlowSmsPhone(e.target.value)}
                className="flex-1 p-2 border rounded-lg"
                placeholder="5XX XXX XX XX"
              />
              <button
                onClick={() => dispatch({ type: "SET_SMS_SENT", payload: true })}
                className="px-4 py-2 bg-[#F9C800] rounded-lg"
              >
                SMS Gönder
              </button>
            </div>
            {state.smsSent && (
              <div className="mt-2 flex items-center gap-2 text-green-700 text-sm">
                <ShieldCheck className="w-4 h-4" />
                Onay SMS'i gönderildi.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => dispatch({ type: "SET_STEP", payload: 2 })}
          className="px-4 py-2 rounded-lg bg-white border"
        >
          Geri
        </button>
        <button
          onClick={() => dispatch({ type: "SET_STEP", payload: 4 })}
          disabled={!canContinue}
          className={`px-6 py-3 rounded-lg text-white ${
            canContinue ? "bg-[#0099CB]" : "bg-gray-300"
          }`}
        >
          Sözleşmeyi Onayla ve Bitir
        </button>
      </div>

      {/* Tam ekran imza modalı */}
      {sigOpen && (
        <SignaturePadModal
          onClose={() => setSigOpen(false)}
          onSave={(dataUrl) => {
            setSignatureDataUrl(dataUrl); // ⬅️ otomatik sözleşme imza alanına düşer
            setSigOpen(false);
          }}
        />
      )}

      {/* Tam ekran sözleşme modalı */}
      {contractOpen && (
        <ContractModal
          customer={customer}
          signatureDataUrl={signatureDataUrl}
          onClose={() => setContractOpen(false)}
        />
      )}
    </div>
  );
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
// ---- Tam ekran imza modalı (scroll lock + pointer events) ----
const SignaturePadModal: React.FC<{
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}> = ({ onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Body scroll kilitle
  useEffect(() => {
    const scrollY = window.scrollY;
    const { style } = document.body;
    const htmlStyle = document.documentElement.style;
    const prev = {
      overflow: style.overflow,
      position: style.position,
      top: style.top,
      width: style.width,
      overscroll: htmlStyle.overscrollBehaviorY,
    };

    style.overflow = "hidden";
    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.width = "100%";
    htmlStyle.overscrollBehaviorY = "contain"; // rubber-band engelle

    return () => {
      style.overflow = prev.overflow;
      style.position = prev.position;
      style.top = prev.top;
      style.width = prev.width;
      htmlStyle.overscrollBehaviorY = prev.overscroll || "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Canvas boyutlandırma (retina netliği)
  const fitCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // beyaz arkaplan
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
  };

  useEffect(() => {
    fitCanvas();
    const onResize = () => fitCanvas();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Çizim (Pointer Events + touch-action none)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.style.touchAction = "none"; // kritik: sayfa scroll'unu kapatır (modaldaki canvas için)

    let drawing = false;

    const getPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const down = (e: PointerEvent) => {
      drawing = true;
      canvas.setPointerCapture(e.pointerId);
      const { x, y } = getPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const move = (e: PointerEvent) => {
      if (!drawing) return;
      const { x, y } = getPos(e);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();
    };

    const up = (e: PointerEvent) => {
      drawing = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
    };

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);

    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    // beyaz arkaplanı koru
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, rect.width, rect.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL("image/png")); // backend'e PNG veri URL’i hazır
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[10050] flex flex-col bg-black/50"
    >
      {/* Üst çubuk */}
      <div className="flex items-center justify-between bg-white px-4 py-3 border-b">
        <div className="font-semibold text-gray-900">İmza</div>
        <div className="flex gap-2">
          <button onClick={handleClear} className="px-3 py-1.5 rounded border bg-white text-sm">Temizle</button>
          <button onClick={handleSave} className="px-3 py-1.5 rounded bg-[#0099CB] text-white text-sm">Kaydet</button>
          <button onClick={onClose} className="px-3 py-1.5 rounded border bg-white text-sm">Kapat</button>
        </div>
      </div>

      {/* Canvas alanı */}
      <div className="flex-1 bg-white">
        <div className="h-full w-full">
          <canvas ref={canvasRef} className="h-[calc(100vh-56px)] w-full block" />
        </div>
      </div>
    </div>
  );
};
// ---- ortak: modal açıldığında body scroll kilidi ----
function useScrollLock() {
  useEffect(() => {
    const scrollY = window.scrollY;
    const { style } = document.body;
    const htmlStyle = document.documentElement.style;
    const prev = {
      overflow: style.overflow,
      position: style.position,
      top: style.top,
      width: style.width,
      overscroll: htmlStyle.overscrollBehaviorY,
    };
    style.overflow = "hidden";
    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.width = "100%";
    htmlStyle.overscrollBehaviorY = "contain";
    return () => {
      style.overflow = prev.overflow;
      style.position = prev.position;
      style.top = prev.top;
      style.width = prev.width;
      htmlStyle.overscrollBehaviorY = prev.overscroll || "";
      window.scrollTo(0, scrollY);
    };
  }, []);
}

// ---- Tam ekran imza modalı (scroll lock + pointer events) ----
const SignaturePadModal: React.FC<{
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}> = ({ onClose, onSave }) => {
  useScrollLock();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Retina uyumlu boyutlandırma
  const fitCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
  };

  useEffect(() => {
    fitCanvas();
    const onResize = () => fitCanvas();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Çizim (Pointer Events + touch-action none)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.style.touchAction = "none";

    let drawing = false;
    const getPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const down = (e: PointerEvent) => {
      drawing = true;
      canvas.setPointerCapture(e.pointerId);
      const { x, y } = getPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };
    const move = (e: PointerEvent) => {
      if (!drawing) return;
      const { x, y } = getPos(e);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();
    };
    const up = (e: PointerEvent) => {
      drawing = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
    };

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, rect.width, rect.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL("image/png"));
  };

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
      <div className="flex-1 bg-white">
        <canvas ref={canvasRef} className="h-[calc(100vh-56px)] w-full block" />
      </div>
    </div>
  );
};

// ---- Tek sayfa mock sözleşme sayfası (imza slotlu) ----
const ContractMockPage: React.FC<{
  customer: Customer;
  signatureDataUrl: string | null;
  scale: "preview" | "full";
}> = ({ customer, signatureDataUrl, scale }) => {
  // Boyutlandırma: preview için küçük tipografi
  const base = scale === "full" ? { pad: "p-8", title: "text-2xl", body: "text-sm", small: "text-xs" }
                                : { pad: "p-3", title: "text-base", body: "text-[11px]", small: "text-[10px]" };

  return (
    <div className={`relative h-full w-full ${base.pad} bg-white`}>
      {/* Başlık */}
      <div className="text-center mb-2">
        <div className={`font-semibold ${base.title} text-gray-900`}>ELEKTRİK SATIŞ SÖZLEŞMESİ</div>
        <div className={`${base.small} text-gray-500`}>Mock • Tek Sayfa</div>
      </div>

      {/* İçerik */}
      <div className={`space-y-2 ${base.body} text-gray-800`}>
        <p>
          İşbu sözleşme; <strong>{customer.name}</strong> ({customer.address}, {customer.district}) ile
          Enerjisa Satış A.Ş. arasında, elektrik tedariki kapsamındaki hak ve yükümlülükleri belirlemek üzere
          { " " }{new Date().toLocaleDateString()} tarihinde akdedilmiştir.
        </p>
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
            <div className={base.small}>Ad Soyad / Ünvan: {customer.name}</div>
            <div className={base.small}>Adres: {customer.address}, {customer.district}</div>
            <div className={base.small}>Telefon: {customer.phone || "-"}</div>
          </div>
          <div className="border rounded p-2">
            <div className="font-medium mb-1">Tedarikçi</div>
            <div className={base.small}>Enerjisa Satış A.Ş.</div>
            <div className={base.small}>Mersis: 000000000000000</div>
            <div className={base.small}>Adres: İstanbul, TR</div>
          </div>
        </div>
      </div>

      {/* İmza alanları (absolute, yüzde ile konumlandırma) */}
      <div className="absolute" style={{ bottom: "6%", left: "6%", width: "40%", height: scale === "full" ? "120px" : "60px" }}>
        <div className="h-full w-full border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-white relative">
          {/* İmza görseli (varsa) */}
          {signatureDataUrl ? (
            <img
              src={signatureDataUrl}
              alt="Müşteri İmzası"
              className="absolute inset-0 m-auto max-h-[90%] max-w-[90%] object-contain"
            />
          ) : (
            <span className={`${base.small} text-gray-400`}>Müşteri İmzası</span>
          )}
        </div>
        <div className={`${base.small} mt-1 text-gray-500`}>Müşteri İmzası</div>
      </div>

      <div className="absolute" style={{ bottom: "6%", right: "6%", width: "40%", height: scale === "full" ? "120px" : "60px" }}>
        <div className="h-full w-full border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-white">
          <span className={`${base.small} text-gray-400`}>Tedarikçi İmzası</span>
        </div>
        <div className={`${base.small} mt-1 text-gray-500`}>Tedarikçi İmzası</div>
      </div>
    </div>
  );
};

// ---- Tam ekran sözleşme modalı ----
const ContractModal: React.FC<{
  customer: Customer;
  signatureDataUrl: string | null;
  onClose: () => void;
}> = ({ customer, signatureDataUrl, onClose }) => {
  useScrollLock();
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[10040] flex flex-col bg-black/50">
      <div className="flex items-center justify-between bg-white px-4 py-3 border-b">
        <div className="font-semibold text-gray-900">Sözleşme — Önizleme</div>
        <div className="flex gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded border bg-white text-sm">
            Kapat
          </button>
        </div>
      </div>

      {/* A4 oranına yakın tam ekran gövde */}
      <div className="flex-1 bg-gray-100 overflow-auto">
        <div className="mx-auto my-4 bg-white shadow border" style={{ width: 820, minHeight: 1160 }}>
          <ContractMockPage customer={customer} signatureDataUrl={signatureDataUrl} scale="full" />
        </div>
      </div>
    </div>
  );
};


export default VisitFlowScreen;