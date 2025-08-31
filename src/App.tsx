// HATA ÇÖZÜMÜ: Eksik olan React ve Hook'ların import'u eklendi.
import React, { useState, useEffect, useRef } from 'react';
// İkonlar
import {
    User, MapPin, List, BarChart3, Home, Clock, CheckCircle, XCircle, AlertCircle,
    Camera, Route, TrendingUp, Search, Mic, BadgeCheck, Smartphone, FileText, PenLine,
    Send, ChevronRight, ShieldCheck, RefreshCw, Bell, Trophy
} from 'lucide-react';
// Diğer Bileşenler
import RouteMap from './RouteMap';
// İYİLEŞTİRME: Veriler artık harici bir dosyadan geliyor.
import { mockCustomers, salesRep } from './data';
import { Customer } from './types';

// Tipler
type VisitResult = 'Satış Yapıldı' | 'Teklif Verildi' | 'Reddedildi' | 'Evde Yok' | null;
type Screen = 'login' | 'dashboard' | 'visitList' | 'visitDetail' | 'visitFlow' | 'visitResult' | 'reports' | 'routeMap' | 'notifications' | 'salesLeague';

function App() {
    // --- STATE MANAGEMENT ---
    const [currentScreen, setCurrentScreen] = useState<Screen>('login');
    const [agentName, setAgentName] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [visitNotes, setVisitNotes] = useState('');
    const [filter, setFilter] = useState('Bugün');
    const [searchQuery, setSearchQuery] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>(mockCustomers);

    // Ziyaret Akışı (Flow) State'leri
    const [flowStep, setFlowStep] = useState<number>(1);
    const [flowSmsPhone, setFlowSmsPhone] = useState<string>('');
    const [flowSmsSent, setFlowSmsSent] = useState<boolean>(false);
    const [flowContractAccepted, setFlowContractAccepted] = useState<boolean>(false);
    const [nfcChecked, setNfcChecked] = useState<boolean>(false);

    // Kimlik Tarama State'leri
    const [idScanStep, setIdScanStep] = useState<'front' | 'back' | 'captured'>('front');
    const [idFrontPhoto, setIdFrontPhoto] = useState<string | null>(null);
    const [idBackPhoto, setIdBackPhoto] = useState<string | null>(null);

    // Ref'ler
    const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    // --- EFFECT HOOKS ---

    // İmza Canvas'ı için
    useEffect(() => {
        const canvas = signatureCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let drawing = false;
        const getPos = (e: any, c: HTMLCanvasElement) => {
            const rect = c.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return { x: clientX - rect.left, y: clientY - rect.top };
        };
        const start = (e: MouseEvent | TouchEvent) => {
            drawing = true;
            const { x, y } = getPos(e, canvas);
            ctx.beginPath(); ctx.moveTo(x, y);
        };
        const move = (e: MouseEvent | TouchEvent) => {
            if (!drawing) return;
            const { x, y } = getPos(e, canvas);
            ctx.lineTo(x, y);
            ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.lineCap = 'round';
            ctx.stroke();
        };
        const end = () => { drawing = false; };

        canvas.addEventListener('mousedown', start);
        canvas.addEventListener('mousemove', move);
        window.addEventListener('mouseup', end);
        canvas.addEventListener('touchstart', start);
        canvas.addEventListener('touchmove', move);
        window.addEventListener('touchend', end);

        return () => {
            canvas.removeEventListener('mousedown', start);
            canvas.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', end);
            canvas.removeEventListener('touchstart', start);
            canvas.removeEventListener('touchmove', move);
            window.removeEventListener('touchend', end);
        };
    }, [currentScreen, flowStep]);

    // Kamera Yönetimi
    useEffect(() => {
        const enableCamera = async () => {
            if (currentScreen === 'visitFlow' && flowStep === 2 && !stream && idScanStep !== 'captured') {
                try {
                    const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                    setStream(s);
                } catch { console.error("Kamera erişimi reddedildi veya bir hata oluştu."); }
            }
        };
        enableCamera();

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

    // Video stream'ini video elementine bağlama
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch((e) => console.error("Video oynatılamadı:", e));
        }
    }, [stream]);

    // --- HANDLER FUNCTIONS ---

    const handleStartVisit = (customer: Customer) => {
        const updated = customers.map(c => c.id === customer.id ? { ...c, status: 'Yolda' as const } : c);
        setCustomers(updated);
        setSelectedCustomer({ ...customer, status: 'Yolda' });
        
        // Ziyaret akışı state'lerini sıfırla
        setFlowStep(1);
        setFlowSmsPhone(customer.phone || '');
        setFlowSmsSent(false);
        setFlowContractAccepted(false);
        setNfcChecked(false);
        setIdScanStep('front');
        setIdFrontPhoto(null);
        setIdBackPhoto(null);
        
        setCurrentScreen('visitFlow');
    };

    const handleCompleteVisit = () => {
        if (selectedCustomer) {
            const updated = customers.map(c => c.id === selectedCustomer.id ? { ...c, status: 'Tamamlandı' as const } : c);
            setCustomers(updated);
            setSelectedCustomer(null);
            setCurrentScreen('visitList');
        }
    };
    
    // --- RENDER BLOCKS ---

    // LOGIN EKRANI
    if (currentScreen === 'login') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
                <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                    <div className="text-center mb-8">
                        <img src="https://www.enerjisa.com.tr/assets/sprite/enerjisa.webp" alt="Enerjisa Logo" className="w-40 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">EnerjiSaHa</h1>
                        <p className="text-gray-600">D2D Satış Uygulaması</p>
                    </div>
                    <div className="space-y-4 mb-6">
                        <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Kullanıcı Adı" defaultValue="serkan.ozkan" />
                        <input type="password" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Şifre" defaultValue="123456" />
                    </div>
                    <button onClick={() => { setAgentName('Serkan Özkan'); setCurrentScreen('dashboard'); }} className="w-full bg-[#0099CB] text-white py-3 px-4 rounded-lg font-medium">
                        Giriş Yap
                    </button>
                </div>
            </div>
        );
    }
    
    // ANA NAVİGASYON BİLEŞENİ
    const Navigation = () => (
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-[#0099CB] rounded-full flex items-center justify-center"><User className="w-5 h-5 text-white" /></div>
                    <div>
                        <h2 className="font-semibold text-gray-900">{agentName}</h2>
                        <p className="text-sm text-gray-600">Saha Temsilcisi</p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button onClick={() => setCurrentScreen('dashboard')} className={`p-2 rounded-lg ${currentScreen === 'dashboard' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}><Home className="w-5 h-5" /></button>
                    <button onClick={() => setCurrentScreen('routeMap')} className={`p-2 rounded-lg ${currentScreen === 'routeMap' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}><Route className="w-5 h-5" /></button>
                    <button onClick={() => setCurrentScreen('visitList')} className={`p-2 rounded-lg ${currentScreen === 'visitList' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}><List className="w-5 h-5" /></button>
                    <button onClick={() => setCurrentScreen('reports')} className={`p-2 rounded-lg ${currentScreen === 'reports' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}><BarChart3 className="w-5 h-5" /></button>
                    <button onClick={() => setCurrentScreen('notifications')} className={`p-2 rounded-lg relative ${currentScreen === 'notifications' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}><Bell className="w-5 h-5" /><span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span></button>
                    <button onClick={() => setCurrentScreen('salesLeague')} className={`p-2 rounded-lg ${currentScreen === 'salesLeague' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}><Trophy className="w-5 h-5" /></button>
                </div>
            </div>
        </div>
    );

    // ZİYARET AKIŞI (WIZARD)
    if (currentScreen === 'visitFlow' && selectedCustomer) {
        const StepIndicator = () => (
            <div className="flex items-center gap-2 mb-4">
                {[1,2,3,4].map(n => (<div key={n} className={`h-2 rounded-full ${flowStep >= n ? 'bg-[#0099CB]' : 'bg-gray-200'}`} style={{width: '25%'}} />))}
            </div>
        );
        return (
            <div className="min-h-screen bg-gray-50">
                <Navigation />
                <div className="p-6 max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-2xl font-bold text-gray-900">Ziyaret Akışı: {selectedCustomer.name}</h1>
                        <button onClick={() => setCurrentScreen('visitList')} className="text-gray-600 hover:text-gray-900">← Listeye Dön</button>
                    </div>
                    <StepIndicator />

                    {/* Adım 1: Bilgiler */}
                    {flowStep === 1 && (
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold mb-4">Müşteri Bilgileri Kontrolü</h3>
                             {/* ... Adım 1 içeriği ... */}
                             <div className="mt-6 text-right">
                                <button onClick={() => setFlowStep(2)} className="bg-[#0099CB] text-white px-6 py-3 rounded-lg">Devam</button>
                             </div>
                        </div>
                    )}
                    
                    {/* Adım 2: Kimlik Doğrulama */}
                    {flowStep === 2 && (
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold mb-4">Kimlik Doğrulama</h3>
                            <div className="grid md:grid-cols-2 gap-6 items-start">
                                <div>
                                    <p className="text-sm text-gray-600 mb-2 font-medium">{idScanStep === 'captured' ? 'Çekilen Fotoğraflar' : idScanStep === 'front' ? 'Kimlik Ön Yüzü' : 'Kimlik Arka Yüzü'}</p>
                                    {idScanStep !== 'captured' ? (
                                        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                                            {stream ? (<><video ref={videoRef} className="w-full h-full object-cover" /><div className="absolute inset-0 flex items-center justify-center p-4"><div className="w-full max-w-xs h-2/3 border-2 border-dashed border-white/70 rounded-lg"></div></div></>) : (<p className="text-white/80">Kamera başlatılıyor...</p>)}
                                        </div>
                                    ) : (
                                        <div className="p-4 border rounded-lg bg-gray-50 text-center"><CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" /><p>Kimlik fotoğrafları çekildi.</p></div>
                                    )}
                                    {idScanStep !== 'captured' && (<button onClick={() => { if (idScanStep === 'front') { setIdFrontPhoto(`photo_front_${Date.now()}`); setIdScanStep('back'); } else { setIdBackPhoto(`photo_back_${Date.now()}`); setIdScanStep('captured'); }}} className="w-full mt-3 px-4 py-3 bg-[#0099CB] text-white rounded-lg font-semibold"><Camera className="w-5 h-5 inline-block mr-2"/>{idScanStep === 'front' ? 'Ön Yüzü Çek' : 'Arka Yüzü Çek'}</button>)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="flex-1 text-center"><p className="text-sm mb-1">Ön Yüz</p><div className={`w-full aspect-video rounded-lg flex items-center justify-center ${idFrontPhoto ? 'border-2 border-green-500' : 'border bg-gray-100'}`}>{idFrontPhoto ? <CheckCircle className="w-8 h-8 text-green-500"/> : <XCircle className="w-8 h-8 text-gray-300"/>}</div></div>
                                        <div className="flex-1 text-center"><p className="text-sm mb-1">Arka Yüz</p><div className={`w-full aspect-video rounded-lg flex items-center justify-center ${idBackPhoto ? 'border-2 border-green-500' : 'border bg-gray-100'}`}>{idBackPhoto ? <CheckCircle className="w-8 h-8 text-green-500"/> : <XCircle className="w-8 h-8 text-gray-300"/>}</div></div>
                                    </div>
                                    {idFrontPhoto && idBackPhoto && (<button onClick={() => { setIdScanStep('front'); setIdFrontPhoto(null); setIdBackPhoto(null); }} className="w-full text-sm px-4 py-2 bg-yellow-500 text-white rounded-lg mb-4"><RefreshCw className="w-4 h-4 inline-block mr-2"/>Yeniden Çek</button>)}
                                </div>
                            </div>
                            <div className="mt-6 flex justify-between">
                                <button onClick={() => setFlowStep(1)} className="px-4 py-2 rounded-lg bg-white border">Geri</button>
                                <button onClick={() => setFlowStep(3)} disabled={!idFrontPhoto || !idBackPhoto} className={`px-6 py-3 rounded-lg font-semibold ${(idFrontPhoto && idBackPhoto) ? 'bg-[#0099CB] text-white' : 'bg-gray-300 text-gray-600'}`}>Devam</button>
                            </div>
                        </div>
                    )}

                    {/* Adım 3: Sözleşme & İmza */}
                    {flowStep === 3 && (
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold mb-4">Sözleşme Onayı</h3>
                            {/* ... Adım 3 içeriği ... */}
                            <div className="mt-6 flex justify-between">
                                <button onClick={() => setFlowStep(2)} className="px-4 py-2 rounded-lg bg-white border">Geri</button>
                                <button onClick={() => setFlowStep(4)} disabled={!flowContractAccepted} className={`px-6 py-3 rounded-lg ${flowContractAccepted ? 'bg-[#0099CB] text-white' : 'bg-gray-300 text-gray-600'}`}>Devam</button>
                            </div>
                        </div>
                    )}
                    
                    {/* Adım 4: Tamamla */}
                    {flowStep === 4 && (
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold mb-4">Satışı Tamamla</h3>
                            {/* ... Adım 4 içeriği ... */}
                            <div className="mt-6 flex justify-between">
                                <button onClick={() => setFlowStep(3)} className="px-4 py-2 rounded-lg bg-white border">Geri</button>
                                <button onClick={handleCompleteVisit} className="px-6 py-3 rounded-lg bg-green-600 text-white">Satışı Kaydet ve Bitir</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    
    // Diğer tüm ekranlar (dashboard, list, reports vb.) için render blokları
    // ...

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation/>
            <div className="p-6">
                <p>Yükleniyor...</p>
            </div>
        </div>
    );
}

export default App;