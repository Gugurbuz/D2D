import React, { useRef, useState, useEffect } from 'react';
import { User, MapPin, List, BarChart3, Home,
 Clock, CheckCircle, XCircle, AlertCircle,
 Camera, Route, TrendingUp, Search, Mic, BadgeCheck, Smartphone, FileText, PenLine, Send, ChevronRight, ShieldCheck
} from 'lucide-react';
import RouteMap, { SalesRep, Customer } from './RouteMap';

type VisitResult = 'Satış Yapıldı' | 'Teklif Verildi' | 'Reddedildi' | 'Evde Yok' | null;
type Screen = 'login' | 'dashboard' | 'visitList' | 'visitDetail' | 'visitFlow' | 'visitResult' | 'reports' | 'routeMap';

export const mockCustomers: Customer[] = [
  { id: '1',  name: 'Mehmet Yılmaz', address: 'Kadıköy – Bahariye Cd.',           district: 'Kadıköy',      plannedTime: '09:00', priority: 'Yüksek', tariff: 'Mesken',   meterNumber: '100000001', consumption: '290 kWh/ay',  offerHistory: ['Şubat 2025: %12 indirim', 'Ekim 2024: Sadakat teklifi'], status: 'Bekliyor', estimatedDuration: '30 dk', distance: '0.8 km',  lat: 40.9916, lng: 29.0250, phone: '0555 111 22 01' },
  { id: '2',  name: 'Ayşe Demir',    address: 'Üsküdar – Çengelköy',              district: 'Üsküdar',     plannedTime: '09:30', priority: 'Orta',   tariff: 'Mesken',   meterNumber: '100000002', consumption: '320 kWh/ay',  offerHistory: ['Mart 2025: Yeni müşteri teklifi'], status: 'Bekliyor', estimatedDuration: '25 dk', distance: '1.3 km',  lat: 41.0255, lng: 29.0653, phone: '0555 111 22 02' },
  { id: '3',  name: 'Ali Kaya',      address: 'Beşiktaş – Barbaros Blv.',         district: 'Beşiktaş',    plannedTime: '10:00', priority: 'Düşük',  tariff: 'İş Yeri',  meterNumber: '100000003', consumption: '880 kWh/ay',  offerHistory: ['Ocak 2025: İş yeri sabit fiyat', 'Kasım 2024: %18 indirim'], status: 'Bekliyor', estimatedDuration: '40 dk', distance: '2.1 km',  lat: 41.0430, lng: 29.0070, phone: '0555 111 22 03' },
  { id: '4',  name: 'Zeynep Koç',    address: 'Levent – Büyükdere Cd.',           district: 'Beşiktaş',    plannedTime: '10:30', priority: 'Yüksek', tariff: 'İş Yeri',  meterNumber: '100000004', consumption: '1250 kWh/ay', offerHistory: ['Aralık 2024: Kurumsal tarife önerisi'], status: 'Bekliyor', estimatedDuration: '45 dk', distance: '3.0 km',  lat: 41.0800, lng: 29.0119, phone: '0555 111 22 04' },
  // ... diğerleri aynı kalabilir
];

const salesRep: SalesRep = {
  name: 'Satış Uzmanı',
  lat: 40.9360,  // Maltepe civarı
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
  const [flowStep, setFlowStep] = useState<number>(1); // 1..4
  const [flowSmsPhone, setFlowSmsPhone] = useState<string>('');
  const [flowSmsSent, setFlowSmsSent] = useState<boolean>(false);
  const [flowContractAccepted, setFlowContractAccepted] = useState<boolean>(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [nfcChecked, setNfcChecked] = useState<boolean>(false);

  // Basit imza çizimi
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

  // Kamera aç-kapat (kimlik tarama simülasyonu)
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
      // ekran değişince kamerayı kapat
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        setStream(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScreen, flowStep]);

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

  // === Ziyarete Başla: ARTIK visitFlow'a geçiriyoruz (boş sayfa yok) ===
  const handleStartVisit = (customer: Customer) => {
    const updated = customers.map(c => c.id === customer.id ? { ...c, status: 'Yolda' as const } : c);
    setCustomers(updated);
    setSelectedCustomer({ ...customer, status: 'Yolda' });
    // flow başlangıç değerleri
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
      // akış bitti → listeye
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

  // LOGIN — eski logo ve arka plan URL
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

  // ÜST NAVİGASYON
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
        </div>
      </div>
    </div>
  );

// DASHBOARD (YENİ)
if (currentScreen === 'dashboard') {
  // --- KPI'lar ---
  const planned = customers.length;
  const onTheWay = customers.filter(c => c.status === 'Yolda').length;
  const done = customers.filter(c => c.status === 'Tamamlandı').length;
  const waiting = customers.filter(c => c.status === 'Bekliyor').length;
  const conversionRate = planned ? Math.round((done / planned) * 100) : 0;
  const estimatedRevenueTL = done * 19; // örnek

  // --- Bugün listeleri ---
  const byTime = [...customers].sort((a, b) => a.plannedTime.localeCompare(b.plannedTime));
  const timelineItems = byTime.slice(0, 6); // soldaki zaman çizelgesi
  const todayList = byTime.slice(0, 4);     // sağdaki "Bugünkü Ziyaretler"

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

      {/* Üst şerit: tarih, arama ve aksiyonlar */}
      <div className="px-6 pt-6">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 hidden md:block">
            {new Date().toLocaleDateString('tr-TR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}{' '}
            {new Date().toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' })}
          </div>

          <div className="ml-auto relative w-full max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Müşteri, adres, ID ara"
              className="block w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-[#0099CB] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="text-xs text-gray-500 mb-1">Toplam Ziyaret</div>
          <div className="text-3xl font-bold text-gray-900">{planned}</div>
          <div className="text-xs text-gray-500">Planlanan</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="text-xs text-gray-500 mb-1">Yolda</div>
          <div className="text-3xl font-bold text-gray-900">{onTheWay}</div>
          <div className="text-xs text-gray-500">Anlık</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="text-xs text-gray-500 mb-1">Tamamlandı</div>
          <div className="text-3xl font-bold text-gray-900">{done}</div>
          <div className="text-xs text-gray-500">Bugün</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="text-xs text-gray-500 mb-1">Bekleyen</div>
          <div className="text-3xl font-bold text-gray-900">{waiting}</div>
          <div className="text-xs text-gray-500">Bugün</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="text-xs text-gray-500 mb-1">Dönüşüm</div>
          <div className="text-3xl font-bold text-gray-900">%{conversionRate}</div>
          <div className="text-xs text-gray-500">Oran</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="text-xs text-gray-500 mb-1">Tah. Gelir</div>
          <div className="text-3xl font-bold text-gray-900">{estimatedRevenueTL} ₺</div>
          <div className="text-xs text-gray-500">Bugün</div>
        </div>
      </div>

      {/* Kısayollar kutusu */}
      <div className="px-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-gray-900">Hızlı İşlemler</div>
            <div className="text-xs text-gray-500">Günün planına hızlı başla</div>
          </div>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => setCurrentScreen('visitList')}
              className="rounded-xl border border-gray-200 hover:border-[#0099CB] hover:bg-[#0099CB]/5 p-3 text-left"
            >
              <div className="text-sm font-semibold text-gray-900">Ziyaretleri Başlat</div>
              <div className="text-xs text-gray-600 mt-1">Listeden sırayla ilerle</div>
            </button>
            <button
              onClick={() => setCurrentScreen('routeMap')}
              className="rounded-xl border border-gray-200 hover:border-[#0099CB] hover:bg-[#0099CB]/5 p-3 text-left"
            >
              <div className="text-sm font-semibold text-gray-900">Rotayı Optimize Et</div>
              <div className="text-xs text-gray-600 mt-1">Harita üzerinde en iyi sıra</div>
            </button>
            <button
              onClick={() => alert('Check-in kaydedildi (simülasyon).')}
              className="rounded-xl border border-gray-200 hover:border-[#0099CB] hover:bg-[#0099CB]/5 p-3 text-left"
            >
              <div className="text-sm font-semibold text-gray-900">Konum Check-in</div>
              <div className="text-xs text-gray-600 mt-1">Mevcut konumdan giriş</div>
            </button>
            <button
              onClick={() => alert('Veriler senkronize edildi (simülasyon).')}
              className="rounded-xl border border-gray-200 hover:border-[#0099CB] hover:bg-[#0099CB]/5 p-3 text-left"
            >
              <div className="text-sm font-semibold text-gray-900">Senkronize Et</div>
              <div className="text-xs text-gray-600 mt-1">Bulut ile eşitle</div>
            </button>
          </div>
        </div>
      </div>

      {/* Ana iki kolon: Zaman Çizelgesi + Bugünkü Ziyaretler */}
      <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sol: Günlük Zaman Çizelgesi */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-gray-900">Günlük Zaman Çizelgesi</div>
            <div className="text-xs text-gray-500">Bugün</div>
          </div>

          <div className="relative">
            {/* Dikey çizgi */}
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200 rounded-full" />
            <div className="space-y-6 max-h-[420px] overflow-auto pr-2">
              {timelineItems.map((c, idx) => (
                <div key={c.id} className="relative pl-8">
                  {/* Nokta */}
                  <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full ring-4 ring-white ${c.status === 'Tamamlandı' ? 'bg-green-500' : c.status === 'Yolda' ? 'bg-blue-500' : 'bg-yellow-500'}`} />
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{c.name}</div>
                      <div className="text-sm text-gray-600">{c.address} – {c.district}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Chip tone={statusTone(c.status)}>{c.status}</Chip>
                        <Chip tone={c.priority === 'Yüksek' ? 'red' : c.priority === 'Orta' ? 'yellow' : 'green'}>
                          {c.priority} Öncelik
                        </Chip>
                        <Chip tone="blue">{c.tariff === 'İş Yeri' ? 'B2B' : 'B2C'} – {c.tariff === 'İş Yeri' ? 'Sabit Fiyat' : 'Esnek'}</Chip>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-3">
                      <div className="text-sm text-gray-900">{c.plannedTime}</div>
                      <div className="text-xs text-gray-500">{c.distance}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sağ: Bugünkü Ziyaretler */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-gray-900">Bugünkü Ziyaretler</div>
            <button
              onClick={() => setCurrentScreen('visitList')}
              className="text-xs text-[#0099CB] hover:underline"
            >
              Tamamını Gör
            </button>
          </div>

          <div className="space-y-3">
            {todayList.map((c) => (
              <div key={c.id} className="bg-white border border-gray-200 hover:border-[#0099CB] rounded-xl p-3 flex items-start justify-between">
                <div>
                  <div className="font-medium text-gray-900">{c.name}</div>
                  <div className="text-sm text-gray-600">{c.address} – {c.district}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Chip tone={statusTone(c.status)}>{c.status}</Chip>
                    <Chip tone={c.priority === 'Yüksek' ? 'red' : c.priority === 'Orta' ? 'yellow' : 'green'}>
                      {c.priority} Öncelik
                    </Chip>
                    <Chip tone="blue">{c.tariff === 'İş Yeri' ? 'B2B' : 'B2C'} – {c.tariff === 'İş Yeri' ? 'Sabit Fiyat' : 'Endeks'}</Chip>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-3">
                  <div className="text-sm text-gray-900">{c.plannedTime}</div>
                  <div className="text-xs text-gray-500">{c.distance}</div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => { setSelectedCustomer(c); setCurrentScreen('visitDetail'); }}
                      className="px-3 py-1.5 rounded-lg bg-[#0099CB] text-white text-xs"
                    >
                      Detay
                    </button>
                    {c.status === 'Bekliyor' && (
                      <button
                        onClick={() => {
                          const updated = customers.map(x => x.id === c.id ? { ...x, status: 'Yolda' as const } : x);
                          setCustomers(updated);
                          setSelectedCustomer({ ...c, status: 'Yolda' });
                          setCurrentScreen('visitFlow'); // direkt akışa da alabiliriz
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#F9C800] text-gray-900 text-xs"
                      >
                        Başlat
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}


  // ZİYARET LİSTESİ
  if (currentScreen === 'visitList') {
    let filtered = customers;
    if (filter === 'Tamamlandı') filtered = filtered.filter(c => c.status === 'Tamamlandı');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q)
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Ziyaret Listesi</h1>
            <div className="flex space-x-2">
              {['Bugün', 'Bu Hafta', 'Tamamlandı'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg ${filter === f ? 'bg-[#0099CB] text-white' : 'bg-white hover:bg-gray-100'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-16 py-3 border rounded-lg"
                placeholder="Müşteri adı, adres veya ilçe ile ara..."
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button onClick={handleSpeechToText} disabled={isListening}
                        className={`p-2 rounded-lg ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-[#F9C800] bg-opacity-20 text-[#0099CB]'}`}>
                  <Mic className="h-5 w-5" />
                </button>
              </div>
            </div>
            {searchQuery && <p className="text-sm text-gray-600 mt-2">"{searchQuery}" için {filtered.length} sonuç</p>}
          </div>

          <div className="space-y-4">
            {filtered.map(c => (
              <div key={c.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{c.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(c.status)}`}>{c.status}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(c.priority)}`}>{c.priority}</span>
                    </div>
                    <p className="text-gray-600 mb-1">{c.address}, {c.district}</p>
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <span className="flex items-center space-x-1"><Clock className="w-4 h-4" />{c.estimatedDuration}</span>
                      <span className="flex items-center space-x-1"><MapPin className="w-4 h-4" />{c.distance}</span>
                      <span>Saat: {c.plannedTime}</span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button onClick={() => { setSelectedCustomer(c); setCurrentScreen('visitDetail'); }}
                            className="bg-[#0099CB] text-white px-4 py-2 rounded-lg">Detay</button>
                    {c.status === 'Bekliyor' && (
                      <button onClick={() => handleStartVisit(c)}
                              className="bg-[#F9C800] text-gray-900 px-4 py-2 rounded-lg">Ziyarete Başla</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ZİYARET DETAY — “Ziyarete Başla” artık visitFlow'a geçer
  if (currentScreen === 'visitDetail' && selectedCustomer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Ziyaret Detayı</h1>
            <button onClick={() => setCurrentScreen('visitList')} className="text-gray-600 hover:text-gray-900">← Geri</button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Müşteri Bilgileri</h3>
              <div className="space-y-3">
                <div><span className="text-sm text-gray-600">Müşteri</span><p className="font-medium">{selectedCustomer.name}</p></div>
                <div><span className="text-sm text-gray-600">Adres</span><p>{selectedCustomer.address}, {selectedCustomer.district}</p></div>
                <div><span className="text-sm text-gray-600">Tarife</span><p>{selectedCustomer.tariff}</p></div>
                <div><span className="text-sm text-gray-600">Sayaç</span><p>{selectedCustomer.meterNumber}</p></div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tüketim & Geçmiş</h3>
              <div className="space-y-3">
                <div><span className="text-sm text-gray-600">Aylık Tüketim</span><p className="font-medium">{selectedCustomer.consumption}</p></div>
                <div>
                  <span className="text-sm text-gray-600">Teklif Geçmişi</span>
                  <div className="space-y-1 mt-1">{selectedCustomer.offerHistory.map((o,i)=><p key={i} className="text-sm bg-gray-50 p-2 rounded">{o}</p>)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => handleStartVisit(selectedCustomer)}
                    className="bg-[#0099CB] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0088B8] transition-colors flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span>Ziyarete Başla</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ZİYARET AKIŞI (Wizard) — 4 adım
  if (currentScreen === 'visitFlow' && selectedCustomer) {
    const StepIndicator = () => (
      <div className="flex items-center gap-2 mb-4">
        {[1,2,3,4].map(n => (
          <div key={n} className={`h-2 rounded-full ${flowStep >= n ? 'bg-[#0099CB]' : 'bg-gray-200'}`} style={{width: n === 4 ? 56 : 56}} />
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

          {/* ADIM 1: Bilgiler */}
          {flowStep === 1 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
               <BadgeCheck className="w-5 h-5 text-[#0099CB]" />
                <h3 className="text-lg font-semibold">Müşteri Bilgileri</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-600">Ad Soyad</label><input defaultValue={selectedCustomer.name} className="w-full mt-1 p-2 border rounded-lg" /></div>
                <div><label className="text-sm text-gray-600">Telefon</label><input defaultValue={selectedCustomer.phone} className="w-full mt-1 p-2 border rounded-lg" /></div>
                <div className="md:col-span-2"><label className="text-sm text-gray-600">Adres</label><input defaultValue={`${selectedCustomer.address}, ${selectedCustomer.district}`} className="w-full mt-1 p-2 border rounded-lg" /></div>
                <div><label className="text-sm text-gray-600">Sayaç No</label><input defaultValue={selectedCustomer.meterNumber} className="w-full mt-1 p-2 border rounded-lg" /></div>
                <div><label className="text-sm text-gray-600">Tarife</label><input defaultValue={selectedCustomer.tariff} className="w-full mt-1 p-2 border rounded-lg" /></div>
              </div>
              <div className="mt-6 text-right">
                <button onClick={() => setFlowStep(2)} className="bg-[#0099CB] text-white px-6 py-3 rounded-lg inline-flex items-center gap-2">
                  Devam <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ADIM 2: Kimlik (Kamera + NFC) */}
          {flowStep === 2 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <Camera className="w-5 h-5 text-[#0099CB]" />
                <h3 className="text-lg font-semibold">Kimlik Doğrulama</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6 items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Kamera Önizleme</p>
                  <div className="aspect-video bg-black/5 rounded-lg overflow-hidden flex items-center justify-center">
                    {stream ? (
                      <video ref={videoRef} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-gray-500 text-sm p-6 text-center">
                        Kamera açılamadı. Tarayıcı izinlerini kontrol edin.
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => alert('Fotoğraf çekildi (simülasyon).')} className="px-4 py-2 bg-[#0099CB] text-white rounded-lg">Fotoğraf Çek</button>
                    <button onClick={() => alert('Kimlik OCR işlendi (simülasyon).')} className="px-4 py-2 bg-white border rounded-lg">OCR İşle</button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">NFC Kimlik Okuma</p>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Smartphone className="w-4 h-4 text-[#0099CB]" />
                      <span>Telefonu kimliğe yaklaştırın</span>
                    </div>
                    <button
                      onClick={() => setNfcChecked(true)}
                      className={`px-4 py-2 rounded-lg ${nfcChecked ? 'bg-green-600 text-white' : 'bg-[#F9C800] text-gray-900'}`}
                    >
                      {nfcChecked ? 'NFC Başarılı' : 'NFC Okut'}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">Not: Tarayıcı NFC API desteklemiyorsa bu adım simüle edilir.</p>
                  </div>
                  <div className="mt-4">
                    <label className="text-sm text-gray-600">Doğrulama Notu</label>
                    <textarea className="w-full mt-1 p-2 border rounded-lg" rows={3} placeholder="Kimlik bilgileri kontrol notları..." />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                <button onClick={() => setFlowStep(1)} className="px-4 py-2 rounded-lg bg-white border">Geri</button>
                <button onClick={() => setFlowStep(3)} disabled={!nfcChecked} className={`px-6 py-3 rounded-lg ${nfcChecked ? 'bg-[#0099CB] text-white' : 'bg-gray-300 text-gray-600'}`}>
                  Devam
                </button>
              </div>
            </div>
          )}

          {/* ADIM 3: Sözleşme & İmza / SMS */}
          {flowStep === 3 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-[#0099CB]" />
                <h3 className="text-lg font-semibold">Sözleşme Onayı</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Sözleşme Önizleme</p>
                  <div className="h-64 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                    <div className="text-center text-gray-500 text-sm">
                      Sözleşme PDF önizlemesi (placeholder)<br />
                      (Gerçekte burada bir iframe/PDF viewer kullanılabilir)
                    </div>
                  </div>
                  <label className="mt-4 flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={flowContractAccepted} onChange={(e) => setFlowContractAccepted(e.target.checked)} />
                    Koşulları okudum, onaylıyorum.
                  </label>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2 flex items-center gap-2"><PenLine className="w-4 h-4" /> Islak/Dijital İmza</p>
                  <div className="border rounded-lg p-2">
                    <canvas ref={signatureCanvasRef} width={520} height={180} className="w-full h-[180px] bg-white rounded" />
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => {
                        const c = signatureCanvasRef.current; if (!c) return;
                        const ctx = c.getContext('2d'); if (!ctx) return;
                        ctx.clearRect(0,0,c.width,c.height);
                      }} className="px-3 py-2 bg-white border rounded-lg">Temizle</button>
                      <button onClick={() => alert('İmza kaydedildi (simülasyon).')} className="px-3 py-2 bg-[#0099CB] text-white rounded-lg">İmzayı Kaydet</button>
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-sm text-gray-600 mb-2 flex items-center gap-2"><Send className="w-4 h-4" /> SMS ile Onay</p>
                    <div className="flex gap-2">
                      <input value={flowSmsPhone} onChange={(e)=>setFlowSmsPhone(e.target.value)} className="flex-1 p-2 border rounded-lg" placeholder="5XX XXX XX XX" />
                      <button onClick={() => setFlowSmsSent(true)} className="px-4 py-2 bg-[#F9C800] rounded-lg">SMS Gönder</button>
                    </div>
                    {flowSmsSent && (
                      <div className="mt-2 flex items-center gap-2 text-green-700 text-sm">
                        <ShieldCheck className="w-4 h-4" />
                        Doğrulama SMS’i gönderildi (simülasyon).
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button onClick={() => setFlowStep(2)} className="px-4 py-2 rounded-lg bg-white border">Geri</button>
                <button onClick={() => setFlowStep(4)} disabled={!flowContractAccepted} className={`px-6 py-3 rounded-lg ${flowContractAccepted ? 'bg-[#0099CB] text-white' : 'bg-gray-300 text-gray-600'}`}>
                  Devam
                </button>
              </div>
            </div>
          )}

          {/* ADIM 4: Tamamla */}
          {flowStep === 4 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-5 h-5 text-[#0099CB]" />
                <h3 className="text-lg font-semibold">Satışı Tamamla</h3>
              </div>
              <div className="p-4 border rounded-lg bg-gray-50">
                <p className="text-gray-800"><b>Müşteri:</b> {selectedCustomer.name}</p>
                <p className="text-gray-800"><b>Adres:</b> {selectedCustomer.address}, {selectedCustomer.district}</p>
                <p className="text-gray-800"><b>Tarife:</b> {selectedCustomer.tariff}</p>
                <p className="text-gray-800"><b>Telefon:</b> {selectedCustomer.phone}</p>
              </div>
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

  // RAPORLAR
  if (currentScreen === 'reports') {
    const salesCount = customers.filter(c => c.status === 'Tamamlandı').length;
    const salesRate = customers.length ? Math.round((salesCount / customers.length) * 100) : 0;
    const offersGiven = Math.floor(salesCount * 1.5);
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Gün Sonu Raporu</h1>
            <div className="text-sm text-gray-600">{new Date().toLocaleDateString('tr-TR', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}</div>
          </div>
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6"><div className="flex justify-between"><div><p className="text-sm text-gray-600">Toplam Ziyaret</p><p className="text-2xl font-bold text-[#0099CB]">{customers.length}</p></div><MapPin className="w-8 h-8 text-[#0099CB]" /></div></div>
            <div className="bg-white rounded-xl shadow-sm p-6"><div className="flex justify-between"><div><p className="text-sm text-gray-600">Satış Oranı</p><p className="text-2xl font-bold text-[#F9C800]">%{salesRate}</p></div><TrendingUp className="w-8 h-8 text-[#F9C800]" /></div></div>
            <div className="bg-white rounded-xl shadow-sm p-6"><div className="flex justify-between"><div><p className="text-sm text-gray-600">Verilen Teklifler</p><p className="text-2xl font-bold text-[#0099CB]">{offersGiven}</p></div><AlertCircle className="w-8 h-8 text-[#0099CB]" /></div></div>
            <div className="bg-white rounded-xl shadow-sm p-6"><div className="flex justify-between"><div><p className="text-sm text-gray-600">Tamamlanan</p><p className="text-2xl font-bold text-[#0099CB]">{salesCount}</p></div><CheckCircle className="w-8 h-8 text-[#0099CB]" /></div></div>
          </div>
        </div>
      </div>
    );
  }

  // ROTA HARİTASI
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

  return null;
}

export default App;
