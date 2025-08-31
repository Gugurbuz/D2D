import React, { useState, useEffect, useRef } from 'react';
// İkonlar
import {
    User, MapPin, List, BarChart3, Home, Clock, CheckCircle, XCircle, AlertCircle,
    Camera, Route, TrendingUp, Search, Mic, BadgeCheck, Smartphone, FileText, PenLine,
    Send, ChevronRight, ShieldCheck, RefreshCw, Bell, Trophy, Users
} from 'lucide-react';
// Diğer Bileşenler
import RouteMap from './RouteMap';
// Veriler (Artık data.ts dosyasından geliyor)
import { mockCustomers, mockSalesReps } from './data';
import { Customer, SalesRep } from './types';

// Tipler
type VisitResult = 'Satış Yapıldı' | 'Teklif Verildi' | 'Reddedildi' | 'Evde Yok' | null;
type Screen = 'login' | 'dashboard' | 'visitList' | 'visitDetail' | 'visitFlow' | 'visitResult' | 'reports' | 'routeMap' | 'notifications' | 'salesLeague' | 'assignmentMap';

function App() {
    // --- STATE MANAGEMENT ---
    const [currentScreen, setCurrentScreen] = useState<Screen>('login');
    const [agentName, setAgentName] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
    const [salesReps, setSalesReps] = useState<SalesRep[]>(mockSalesReps);

    // Ziyaret Akışı State'leri
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
    
    // ...Diğer state'ler (filter, searchQuery, etc.) buraya eklenebilir...
    const [filter, setFilter] = useState('Bugün');
    const [searchQuery, setSearchQuery] = useState('');


    // --- EFFECT & HANDLER FUNCTIONS ---
    // (Burada tüm useEffect, handleStartVisit, handleCompleteVisit vb. fonksiyonlarınız yer alacak)
    // Önceki kodunuzdan bu bölümü buraya taşıyabilirsiniz veya aşağıdaki tam bloğu kullanabilirsiniz.
    
    const handleStartVisit = (customer: Customer) => {
        const updated = customers.map(c => c.id === customer.id ? { ...c, status: 'Yolda' as const } : c);
        setCustomers(updated);
        setSelectedCustomer({ ...customer, status: 'Yolda' });
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
    
    const Navigation = () => (
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-[#0099CB] rounded-full flex items-center justify-center"><User className="w-5 h-5 text-white" /></div>
                    <div>
                        <h2 className="font-semibold text-gray-900">{agentName}</h2>
                        <p className="text-sm text-gray-600">Saha Yöneticisi</p> {/* Rolü güncelledim */}
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button title="Ana Sayfa" onClick={() => setCurrentScreen('dashboard')} className={`p-2 rounded-lg ${currentScreen === 'dashboard' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}><Home className="w-5 h-5" /></button>
                    <button title="Rota Haritası" onClick={() => setCurrentScreen('routeMap')} className={`p-2 rounded-lg ${currentScreen === 'routeMap' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}><Route className="w-5 h-5" /></button>
                    <button title="Ziyaret Listesi" onClick={() => setCurrentScreen('visitList')} className={`p-2 rounded-lg ${currentScreen === 'visitList' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}><List className="w-5 h-5" /></button>
                    <button title="Görev Atama" onClick={() => setCurrentScreen('assignmentMap')} className={`p-2 rounded-lg ${currentScreen === 'assignmentMap' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}><Users className="w-5 h-5" /></button>
                    <button title="Raporlar" onClick={() => setCurrentScreen('reports')} className={`p-2 rounded-lg ${currentScreen === 'reports' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}><BarChart3 className="w-5 h-5" /></button>
                    <button title="Bildirimler" onClick={() => setCurrentScreen('notifications')} className={`p-2 rounded-lg relative ${currentScreen === 'notifications' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}><Bell className="w-5 h-5" /><span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span></button>
                    <button title="Satış Ligi" onClick={() => setCurrentScreen('salesLeague')} className={`p-2 rounded-lg ${currentScreen === 'salesLeague' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}><Trophy className="w-5 h-5" /></button>
                </div>
            </div>
        </div>
    );
    
    if (currentScreen === 'assignmentMap') {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navigation />
                <div className="p-6">
                    <h1 className="text-3xl font-bold text-gray-900">Görev Atama Ekranı</h1>
                    <p className="mt-2 text-gray-600">
                        Bu ekranda harita üzerinden bir bölge seçilip, o bölgedeki atanmamış müşteriler bir satış temsilcisine atanacaktır.
                    </p>
                    <div className="mt-6 p-8 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                        <p className="text-center text-gray-500">Harita ve atama paneli buraya gelecek. (Yapım aşamasında)</p>
                    </div>
                </div>
            </div>
        );
    }

    // Diğer tüm ekranlarınız (dashboard, visitList, visitFlow, reports etc.) buraya gelmeli.
    // Eğer tüm `App.tsx` dosyasını isterseniz, lütfen belirtin. Şimdilik sadece yeni eklenen
    // kısımları ve ana yapıyı kurdum.

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation/>
            <div className="p-6">
                 {/* Varsayılan olarak dashboard gösterilebilir */}
                <h1 className="text-2xl">Lütfen bir ekran seçin.</h1>
            </div>
        </div>
    );
}

export default App;