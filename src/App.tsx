// 1. ADIM: Yeniden çekme ikonu (RefreshCw) eklendi
import { User, MapPin, List, BarChart3, Home,
  Clock, CheckCircle, XCircle, AlertCircle,
  Camera, Route, TrendingUp, Search, Mic, BadgeCheck, Smartphone, FileText, PenLine, Send, ChevronRight, ShieldCheck, RefreshCw
} from 'lucide-react';
import RouteMap, { SalesRep, Customer } from './RouteMap';

type VisitResult = 'Satış Yapıldı' | 'Teklif Verildi' | 'Reddedildi' | 'Evde Yok' | null;
type Screen = 'login' | 'dashboard' | 'visitList' | 'visitDetail' | 'visitFlow' | 'visitResult' | 'reports' | 'routeMap';

export const mockCustomers: Customer[] = [
  { id: '1',  name: 'Buse Aksoy',   address: 'Bağdat Cd. No:120', district: 'Maltepe',     plannedTime: '09:00', priority: 'Düşük',  tariff: 'Mesken',  meterNumber: '210000001', consumption: '270 kWh/ay',  offerHistory: ['2025-03: Dijital sözleşme'], status: 'Bekliyor', estimatedDuration: '25 dk', distance: '0.9 km',  lat: 40.9359, lng: 29.1569, phone: '0555 111 22 01' },
  { id: '2',  name: 'Kaan Er',      address: 'Alemdağ Cd. No:22', district: 'Ümraniye',    plannedTime: '09:20', priority: 'Orta',   tariff: 'Mesken',  meterNumber: '210000002', consumption: '300 kWh/ay',  offerHistory: ['2024-08: %10 indirim'],       status: 'Bekliyor', estimatedDuration: '25 dk', distance: '9.6 km',  lat: 41.0165, lng: 29.1248, phone: '0555 111 22 02' },
  // ... diğer müşteriler
];

const salesRep: SalesRep = {
  name: 'Satış Uzmanı',
  lat: 40.9360,
  lng: 29.1500,
};

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [agentName, setAgentName] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [visitResult, setVisitResult] = useState<VisitResult>(null);
  const [visitNotes, setVisitNotes] = useState('');
  const [filter, setFilter] = useState('Bugün');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);

  // === ZİYARET FLOW STATE (adım adım süreç) ===
  const [flowStep, setFlowStep] = useState<number>(1);
  const [flowSmsPhone, setFlowSmsPhone] = useState<string>('');
  const [flowSmsSent, setFlowSmsSent] = useState<boolean>(false);
  const [flowContractAccepted, setFlowContractAccepted] = useState<boolean>(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [nfcChecked, setNfcChecked] = useState<boolean>(false);

  // 2. ADIM: Kimlik tarama süreci için yeni state'ler eklendi
  const [idScanStep, setIdScanStep] = useState<'front' | 'back' | 'captured'>('front');
  const [idFrontPhoto, setIdFrontPhoto] = useState<string | null>(null);
  const [idBackPhoto, setIdBackPhoto] = useState<string | null>(null);

  // ... (Diğer useEffect ve fonksiyonlar aynı kalacak) ...

  // Kamera aç-kapat (kimlik tarama simülasyonu)
  useEffect(() => {
    const enableCamera = async () => {
      // Kimlik tarama adımları boyunca kameranın açık kalması sağlandı
      if (currentScreen === 'visitFlow' && flowStep === 2 && !stream && idScanStep !== 'captured') {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          setStream(s);
        } catch {
          console.error("Kamera erişimi reddedildi veya bir hata oluştu.");
        }
      }
    };
    enableCamera();
    
    // Tarama tamamlandığında veya ekrandan ayrıldığında kamerayı kapat
    if (stream && (idScanStep === 'captured' || currentScreen !== 'visitFlow' || flowStep !== 2)) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        setStream(null);
      }
    };
  }, [currentScreen, flowStep, stream, idScanStep]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((e) => console.error("Video oynatılamadı:", e));
    }
  }, [stream]);

  const handleStartVisit = (customer: Customer) => {
    // ... (handleStartVisit fonksiyonu aynı kalıyor)
    const updated = customers.map(c => c.id === customer.id ? { ...c, status: 'Yolda' as const } : c);
    setCustomers(updated);
    setSelectedCustomer({ ...customer, status: 'Yolda' });
    setFlowStep(1);
    setFlowSmsPhone(customer.phone || '');
    setFlowSmsSent(false);
    setFlowContractAccepted(false);
    setNfcChecked(false);
    // Kimlik tarama state'lerini sıfırla
    setIdScanStep('front');
    setIdFrontPhoto(null);
    setIdBackPhoto(null);
    setCurrentScreen('visitFlow');
  };
  
  // ... (Diğer tüm fonksiyonlar ve JSX return blokları aynı kalıyor, sadece flowStep === 2 değiştirilecek)

  // ZİYARET AKIŞI (Wizard) — 4 adım
  if (currentScreen === 'visitFlow' && selectedCustomer) {
    const StepIndicator = () => (
      <div className="flex items-center gap-2 mb-4">
        {[1,2,3,4].map(n => (
          <div key={n} className={`h-2 rounded-full ${flowStep >= n ? 'bg-[#0099CB]' : 'bg-gray-200'}`} style={{width: '25%'}} />
        ))}
      </div>
    );

    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="p-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Ziyaret Akışı</h1>
            <button onClick={() => setCurrentScreen('visitList')} className="text-gray-600 hover:text-gray-900">← Listeye Dön</button>
          </div>
          <StepIndicator />

          {/* ADIM 1: Bilgiler (Aynı kalıyor) */}
          {flowStep === 1 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* ... Adım 1 içeriği burada ... */}
               <div className="mt-6 text-right">
                 <button onClick={() => setFlowStep(2)} className="bg-[#0099CB] text-white px-6 py-3 rounded-lg inline-flex items-center gap-2">
                   Devam <ChevronRight className="w-4 h-4" />
                 </button>
               </div>
            </div>
          )}

          {/* 3. ADIM: Kimlik (Kamera + NFC) - TAMAMEN YENİLENDİ */}
          {flowStep === 2 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <Camera className="w-5 h-5 text-[#0099CB]" />
                <h3 className="text-lg font-semibold">Kimlik Doğrulama</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6 items-start">
                {/* Sol Taraf: Kamera ve Çekim Alanı */}
                <div>
                  <p className="text-sm text-gray-600 mb-2 font-medium">
                    {idScanStep === 'front' && 'Kimlik Ön Yüzü'}
                    {idScanStep === 'back' && 'Kimlik Arka Yüzü'}
                    {idScanStep === 'captured' && 'Çekilen Fotoğraflar'}
                  </p>
                  
                  {idScanStep !== 'captured' ? (
                    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                      {stream ? (
                        <>
                          <video ref={videoRef} className="w-full h-full object-cover" />
                          {/* Kimlik Çerçevesi (Overlay) */}
                          <div className="absolute inset-0 flex items-center justify-center p-4">
                            <div className="w-full max-w-xs h-2/3 border-2 border-dashed border-white/70 rounded-lg bg-black/20"></div>
                          </div>
                          <div className="absolute bottom-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
                            {idScanStep === 'front' ? 'Kimliğin ön yüzünü çerçeveye sığdırın' : 'Şimdi arka yüzünü sığdırın'}
                          </div>
                        </>
                      ) : (
                        <div className="text-white/80 text-sm p-6 text-center">
                          Kamera başlatılıyor... İzin vermeniz gerekebilir.
                        </div>
                      )}
                    </div>
                  ) : (
                     <div className="p-4 border rounded-lg bg-gray-50 text-center">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                        <p className="font-semibold text-gray-800">Kimlik fotoğrafları başarıyla çekildi.</p>
                        <p className="text-sm text-gray-600">Devam edebilir veya fotoğrafları yenileyebilirsiniz.</p>
                     </div>
                  )}

                  {/* Fotoğraf Çekme Butonu */}
                  {idScanStep !== 'captured' && (
                     <div className="mt-3">
                        <button 
                           onClick={() => {
                              if (idScanStep === 'front') {
                                 setIdFrontPhoto(`photo_front_${Date.now()}`); // Simülasyon
                                 setIdScanStep('back');
                              } else if (idScanStep === 'back') {
                                 setIdBackPhoto(`photo_back_${Date.now()}`); // Simülasyon
                                 setIdScanStep('captured');
                              }
                           }} 
                           className="w-full px-4 py-3 bg-[#0099CB] text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                        >
                           <Camera className="w-5 h-5"/>
                           <span>{idScanStep === 'front' ? 'Ön Yüzü Çek' : 'Arka Yüzü Çek'}</span>
                        </button>
                     </div>
                  )}
                </div>

                {/* Sağ Taraf: Önizlemeler ve NFC */}
                <div>
                  <div className="flex items-center gap-4 mb-4">
                      {/* Ön Yüz Önizleme */}
                      <div className="flex-1 text-center">
                          <p className="text-sm text-gray-600 mb-1">Ön Yüz</p>
                          <div className={`w-full aspect-video rounded-lg flex items-center justify-center ${idFrontPhoto ? 'border-2 border-green-500' : 'border bg-gray-100'}`}>
                             {idFrontPhoto ? <CheckCircle className="w-8 h-8 text-green-500"/> : <XCircle className="w-8 h-8 text-gray-300"/>}
                          </div>
                      </div>
                      {/* Arka Yüz Önizleme */}
                       <div className="flex-1 text-center">
                          <p className="text-sm text-gray-600 mb-1">Arka Yüz</p>
                          <div className={`w-full aspect-video rounded-lg flex items-center justify-center ${idBackPhoto ? 'border-2 border-green-500' : 'border bg-gray-100'}`}>
                              {idBackPhoto ? <CheckCircle className="w-8 h-8 text-green-500"/> : <XCircle className="w-8 h-8 text-gray-300"/>}
                          </div>
                      </div>
                  </div>

                  {idFrontPhoto && idBackPhoto && (
                     <button 
                        onClick={() => {
                           setIdScanStep('front');
                           setIdFrontPhoto(null);
                           setIdBackPhoto(null);
                        }}
                        className="w-full text-sm px-4 py-2 bg-yellow-500 text-white rounded-lg mb-4 flex items-center justify-center gap-2"
                     >
                        <RefreshCw className="w-4 h-4" />
                        Yeniden Çek
                     </button>
                  )}
                  
                  {/* NFC Bölümü */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Smartphone className="w-4 h-4 text-[#0099CB]" />
                      <span className="text-sm">NFC ile Kimlik Okuma (Opsiyonel)</span>
                    </div>
                    <button
                      onClick={() => setNfcChecked(true)}
                      className={`w-full px-4 py-2 rounded-lg text-sm ${nfcChecked ? 'bg-green-600 text-white' : 'bg-[#F9C800] text-gray-900'}`}
                    >
                      {nfcChecked ? 'NFC Başarılı' : 'NFC Okut'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-between">
                <button onClick={() => setFlowStep(1)} className="px-4 py-2 rounded-lg bg-white border">Geri</button>
                <button 
                  onClick={() => setFlowStep(3)} 
                  // Devam etme koşulu: her iki fotoğraf da çekilmiş olmalı
                  disabled={!idFrontPhoto || !idBackPhoto} 
                  className={`px-6 py-3 rounded-lg font-semibold ${(idFrontPhoto && idBackPhoto) ? 'bg-[#0099CB] text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                >
                  Devam
                </button>
              </div>
            </div>
          )}
          
          {/* ADIM 3: Sözleşme & İmza / SMS (Aynı kalıyor) */}
          {flowStep === 3 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* ... Adım 3 içeriği burada ... */}
               <div className="mt-6 flex justify-between">
                  <button onClick={() => setFlowStep(2)} className="px-4 py-2 rounded-lg bg-white border">Geri</button>
                  <button onClick={() => setFlowStep(4)} disabled={!flowContractAccepted} className={`px-6 py-3 rounded-lg ${flowContractAccepted ? 'bg-[#0099CB] text-white' : 'bg-gray-300 text-gray-600'}`}>
                     Devam
                  </button>
               </div>
            </div>
          )}

          {/* ADIM 4: Tamamla (Aynı kalıyor) */}
          {flowStep === 4 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* ... Adım 4 içeriği burada ... */}
               <div className="mt-6 flex justify-between">
                  <button onClick={() => setFlowStep(3)} className="px-4 py-2 rounded-lg bg-white border">Geri</button>
                  <button onClick={handleCompleteVisit} className="px-6 py-3 rounded-lg bg-green-600 text-white">Satışı Kaydet</button>
               </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ... (Diğer ekranların render blokları aynı kalıyor)

  return null;
}

export default App;