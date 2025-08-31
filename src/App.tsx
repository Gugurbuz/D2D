import React, { useRef, useState, useEffect } from 'react';
// 1. ADIM: Yeni ikonlar (Bell ve Trophy) eklendi
import { User, MapPin, List, BarChart3, Home,
  Clock, CheckCircle, XCircle, AlertCircle,
  Camera, Route, TrendingUp, Search, Mic, BadgeCheck, Smartphone, FileText, PenLine, Send, ChevronRight, ShieldCheck, Bell, Trophy
} from 'lucide-react';
import RouteMap, { SalesRep, Customer } from './RouteMap';

type VisitResult = 'Satış Yapıldı' | 'Teklif Verildi' | 'Reddedildi' | 'Evde Yok' | null;
// 2. ADIM: Yeni ekran tipleri eklendi
type Screen = 'login' | 'dashboard' | 'visitList' | 'visitDetail' | 'visitFlow' | 'visitResult' | 'reports' | 'routeMap' | 'notifications' | 'salesLeague';

export const mockCustomers: Customer[] = [
  { id: '1',  name: 'Mehmet Yılmaz', address: 'Kadıköy – Bahariye Cd.',         district: 'Kadıköy',     plannedTime: '09:00', priority: 'Yüksek', tariff: 'Mesken',   meterNumber: '100000001', consumption: '290 kWh/ay',  offerHistory: ['Şubat 2025: %12 indirim', 'Ekim 2024: Sadakat teklifi'], status: 'Bekliyor', estimatedDuration: '30 dk', distance: '0.8 km',  lat: 40.9916, lng: 29.0250, phone: '0555 111 22 01' },
  { id: '2',  name: 'Ayşe Demir',    address: 'Üsküdar – Çengelköy',           district: 'Üsküdar',     plannedTime: '09:30', priority: 'Orta',   tariff: 'Mesken',   meterNumber: '100000002', consumption: '320 kWh/ay',  offerHistory: ['Mart 2025: Yeni müşteri teklifi'], status: 'Bekliyor', estimatedDuration: '25 dk', distance: '1.3 km',  lat: 41.0255, lng: 29.0653, phone: '0555 111 22 02' },
  { id: '3',  name: 'Ali Kaya',      address: 'Beşiktaş – Barbaros Blv.',      district: 'Beşiktaş',    plannedTime: '10:00', priority: 'Düşük',  tariff: 'İş Yeri',  meterNumber: '100000003', consumption: '880 kWh/ay',  offerHistory: ['Ocak 2025: İş yeri sabit fiyat', 'Kasım 2024: %18 indirim'], status: 'Bekliyor', estimatedDuration: '40 dk', distance: '2.1 km',  lat: 41.0430, lng: 29.0070, phone: '0555 111 22 03' },
  { id: '4',  name: 'Zeynep Koç',    address: 'Levent – Büyükdere Cd.',        district: 'Beşiktaş',    plannedTime: '10:30', priority: 'Yüksek', tariff: 'İş Yeri',  meterNumber: '100000004', consumption: '1250 kWh/ay', offerHistory: ['Aralık 2024: Kurumsal tarife önerisi'], status: 'Bekliyor', estimatedDuration: '45 dk', distance: '3.0 km',  lat: 41.0800, lng: 29.0119, phone: '0555 111 22 04' },
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

  // ... (Diğer useEffect ve fonksiyonlar aynı kalacak) ...
  useEffect(() => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let drawing = false;
    const start = (e: MouseEvent | TouchEvent) => {
      drawing = true;
      const { x, y } = getPos(e, canvas);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };
    const move = (e: MouseEvent | TouchEvent) => {
      if (!drawing) return;
      const { x, y } = getPos(e, canvas);
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();
    };
    const end = () => { drawing = false; };
    const getPos = (e: any, c: HTMLCanvasElement) => {
      const rect = c.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };
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

  useEffect(() => {
    const enableCamera = async () => {
      if (currentScreen === 'visitFlow' && flowStep === 2 && !stream) {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ video: true });
          setStream(s);
        } catch {
          // kamera izni verilmemiş olabilir; görsel yerine uyarı göstereceğiz
        }
      }
    };
    enableCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        setStream(null);
      }
    };
  }, [currentScreen, flowStep, stream]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  const handleSpeechToText = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'tr-TR';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } else {
      alert('Tarayıcınız ses tanıma özelliğini desteklemiyor.');
    }
  };

  const handleLogin = () => {
    setAgentName('Serkan Özkan');
    setCurrentScreen('dashboard');
  };

  const handleStartVisit = (customer: Customer) => {
    const updated = customers.map(c => c.id === customer.id ? { ...c, status: 'Yolda' as const } : c);
    setCustomers(updated);
    setSelectedCustomer({ ...customer, status: 'Yolda' });
    setFlowStep(1);
    setFlowSmsPhone(customer.phone || '');
    setFlowSmsSent(false);
    setFlowContractAccepted(false);
    setNfcChecked(false);
    setCurrentScreen('visitFlow');
  };

  const handleCompleteVisit = () => {
    if (selectedCustomer) {
      const updated = customers.map(c => c.id === selectedCustomer.id ? { ...c, status: 'Tamamlandı' as const } : c);
      setCustomers(updated);
      setSelectedCustomer({ ...selectedCustomer, status: 'Tamamlandı' });
      setCurrentScreen('visitList');
    }
  };

  const getStatusColor = (s: string) =>
    s === 'Bekliyor' ? 'bg-yellow-100 text-yellow-800'
      : s === 'Yolda' ? 'bg-blue-100 text-blue-800'
      : s === 'Tamamlandı' ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';

  const getPriorityColor = (p: string) =>
    p === 'Yüksek' ? 'bg-red-100 text-red-800'
      : p === 'Orta' ? 'bg-orange-100 text-orange-800'
      : p === 'Düşük' ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';

  const completedVisits = customers.filter(c => c.status === 'Tamamlandı').length;
  const remainingVisits = customers.filter(c => c.status === 'Bekliyor').length;
  const totalVisits = customers.length;
  
  if (currentScreen === 'login') {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://media.licdn.com/dms/image/v2/D5616AQHsvGxmt8b1Uw/profile-displaybackgroundimage-shrink_200_800/profile-displaybackgroundimage-shrink_200_800/0/1677791208243?e=2147483647&v=beta&t=qA9Q6QbX_9_4mzs5WWUedPvF6UFm4z_YTSbSLs9RMNM')",
          backgroundSize: "contain",
          backgroundColor: "#f5f5f5"
        }}
      >
        <div className="bg-white bg-opacity-90 rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-24 h-16 mx-auto mb-4 flex items-center justify-center">
              <img
                src="https://www.enerjisa.com.tr/assets/sprite/enerjisa.webp"
                alt="Enerjisa Logo"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">EnerjiSaHa</h1>
            <p className="text-gray-600">D2D Satış Uygulaması</p>
          </div>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kullanıcı Adı</label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0099CB] focus:border-transparent"
                placeholder="Kullanıcı adınızı girin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Şifre</label>
              <input
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0099CB] focus:border-transparent"
                placeholder="Şifrenizi girin"
              />
            </div>
          </div>
          <button
            onClick={() => { setAgentName('Serkan Özkan'); setCurrentScreen('dashboard'); }}
            className="w-full bg-[#0099CB] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#0088B8] transition-colors"
          >
            Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  // 3. ADIM: NAVİGASYON GÜNCELLENDİ
  const Navigation = () => (
    <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-[#0099CB] rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{agentName}</h2>
            <p className="text-sm text-gray-600">Saha Temsilcisi</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {/* Mevcut Butonlar */}
          <button onClick={() => setCurrentScreen('dashboard')}
                  className={`px-4 py-2 rounded-lg ${currentScreen === 'dashboard' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}>
            <Home className="w-5 h-5" />
          </button>
          <button onClick={() => setCurrentScreen('routeMap')}
                  className={`px-4 py-2 rounded-lg ${currentScreen === 'routeMap' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}>
            <Route className="w-5 h-5" />
          </button>
          <button onClick={() => setCurrentScreen('visitList')}
                  className={`px-4 py-2 rounded-lg ${currentScreen === 'visitList' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}>
            <List className="w-5 h-5" />
          </button>
          <button onClick={() => setCurrentScreen('reports')}
                  className={`px-4 py-2 rounded-lg ${currentScreen === 'reports' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}>
            <BarChart3 className="w-5 h-5" />
          </button>

          {/* ----- YENİ EKLENEN BUTONLAR ----- */}
          <button onClick={() => setCurrentScreen('notifications')}
                  className={`px-4 py-2 rounded-lg relative ${currentScreen === 'notifications' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}>
            <Bell className="w-5 h-5" />
            {/* Örnek bildirim sayısı */}
            <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
          </button>
          <button onClick={() => setCurrentScreen('salesLeague')}
                  className={`px-4 py-2 rounded-lg ${currentScreen === 'salesLeague' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}>
            <Trophy className="w-5 h-5" />
          </button>
          {/* ----- YENİ EKLENEN BUTONLAR SONU ----- */}

        </div>
      </div>
    </div>
  );

  // ... (Dashboard, Ziyaret Listesi ve diğer ekranlar aynı kalacak) ...
  if (currentScreen === 'dashboard') {
    // ... dashboard kodu ...
    const planned = customers.length;
    const onTheWay = customers.filter(c => c.status === 'Yolda').length;
    const done = customers.filter(c => c.status === 'Tamamlandı').length;
    const waiting = customers.filter(c => c.status === 'Bekliyor').length;
    const conversionRate = planned ? Math.round((done / planned) * 100) : 0;
    const estimatedRevenueTL = done * 19; // örnek

    const byTime = [...customers].sort((a, b) => a.plannedTime.localeCompare(b.plannedTime));
    const timelineItems = byTime.slice(0, 6);
    const todayList = byTime.slice(0, 4);

    const Chip = ({ children, tone = 'gray' as 'green' | 'yellow' | 'red' | 'blue' | 'gray' }) => {
      const tones: Record<string, string> = {
        green: 'bg-green-100 text-green-800 border-green-200',
        yellow:'bg-yellow-100 text-yellow-800 border-yellow-200',
        red:   'bg-red-100 text-red-800 border-red-200',
        blue:  'bg-blue-100 text-blue-800 border-blue-200',
        gray:  'bg-gray-100 text-gray-800 border-gray-200',
      };
      return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${tones[tone]}`}>{children}</span>;
    };

    const statusTone = (s: Customer['status']) =>
      s === 'Tamamlandı' ? 'green' : s === 'Yolda' ? 'blue' : 'yellow';

    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        {/* ... dashboard içeriği ... */}
      </div>
    );
  }

  if (currentScreen === 'visitList') {
    // ... visitList kodu ...
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        {/* ... visitList içeriği ... */}
      </div>
    );
  }

  if (currentScreen === 'visitDetail' && selectedCustomer) {
    // ... visitDetail kodu ...
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        {/* ... visitDetail içeriği ... */}
      </div>
    );
  }

  if (currentScreen === 'visitFlow' && selectedCustomer) {
    // ... visitFlow kodu ...
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        {/* ... visitFlow içeriği ... */}
      </div>
    );
  }

  if (currentScreen === 'reports') {
    // ... reports kodu ...
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        {/* ... reports içeriği ... */}
      </div>
    );
  }

  if (currentScreen === 'routeMap') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="p-6">
          <RouteMap customers={customers} salesRep={salesRep} />
        </div>
      </div>
    );
  }

  // 4. ADIM: YENİ SAYFALAR İÇİN YER TUTUCULAR EKLENDİ
  if (currentScreen === 'notifications') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900">Bildirimler</h1>
          <p className="mt-2 text-gray-600">Bu sayfa yapım aşamasındadır.</p>
          <div className="mt-4 bg-white p-4 rounded-lg shadow-sm border">
            <p>Yeni bir müşteri rotanıza eklendi: Ahmet Vural</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'salesLeague') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900">Satış Ligi</h1>
          <p className="mt-2 text-gray-600">Bu sayfa yapım aşamasındadır.</p>
          <div className="mt-4 bg-white p-4 rounded-lg shadow-sm border">
             <p>Aylık sıralamada 3. sıradasınız!</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default App;