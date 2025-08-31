import React, { useState } from 'react';
import {
  User, MapPin, List, BarChart3, Home,
  Clock, CheckCircle, XCircle, AlertCircle,
  Camera, Route, TrendingUp, Search, Mic
} from 'lucide-react';
import RouteMap, { SalesRep, Customer } from './RouteMap';

type VisitResult = 'Satış Yapıldı' | 'Teklif Verildi' | 'Reddedildi' | 'Evde Yok' | null;
type Screen = 'login' | 'dashboard' | 'visitList' | 'visitDetail' | 'visitResult' | 'reports' | 'routeMap';

export const mockCustomers: Customer[] = [
  { id: '1',  name: 'Mehmet Yılmaz', address: 'Kadıköy – Bahariye Cd.', district: 'Kadıköy', plannedTime: '09:00', priority: 'Yüksek', tariff: 'Mesken',   meterNumber: '100000001', consumption: '290 kWh/ay', offerHistory: ['Şubat 2025: %12 indirim', 'Ekim 2024: Sadakat teklifi'], status: 'Bekliyor', estimatedDuration: '30 dk', distance: '0.8 km',  lat: 40.9916, lng: 29.0250, phone: '0555 111 22 01' },
  { id: '2',  name: 'Ayşe Demir',    address: 'Üsküdar – Çengelköy',    district: 'Üsküdar', plannedTime: '09:30', priority: 'Orta',   tariff: 'Mesken',   meterNumber: '100000002', consumption: '320 kWh/ay', offerHistory: ['Mart 2025: Yeni müşteri teklifi'], status: 'Bekliyor', estimatedDuration: '25 dk', distance: '1.3 km',  lat: 41.0255, lng: 29.0653, phone: '0555 111 22 02' },
  { id: '3',  name: 'Ali Kaya',      address: 'Beşiktaş – Barbaros Blv.', district: 'Beşiktaş', plannedTime: '10:00', priority: 'Düşük', tariff: 'İş Yeri', meterNumber: '100000003', consumption: '880 kWh/ay', offerHistory: ['Ocak 2025: İş yeri sabit fiyat', 'Kasım 2024: %18 indirim'], status: 'Bekliyor', estimatedDuration: '40 dk', distance: '2.1 km',  lat: 41.0430, lng: 29.0070, phone: '0555 111 22 03' },
  { id: '4',  name: 'Zeynep Koç',    address: 'Levent – Büyükdere Cd.', district: 'Beşiktaş', plannedTime: '10:30', priority: 'Yüksek', tariff: 'İş Yeri', meterNumber: '100000004', consumption: '1250 kWh/ay', offerHistory: ['Aralık 2024: Kurumsal tarife önerisi'], status: 'Bekliyor', estimatedDuration: '45 dk', distance: '3.0 km',  lat: 41.0800, lng: 29.0119, phone: '0555 111 22 04' },
  // ... kalanları aynen koruyup phone eklemeye devam edebilirsin
];

const salesRep: SalesRep = {
  name: 'Satış Uzmanı',
  lat: 40.9360,  // Maltepe civarı merkez örneği
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
    setCurrentScreen('visitDetail');
  };

  const handleCompleteVisit = () => {
    if (selectedCustomer && visitResult) {
      const updated = customers.map(c => c.id === selectedCustomer.id ? { ...c, status: 'Tamamlandı' as const } : c);
      setCustomers(updated);
      setVisitResult(null);
      setVisitNotes('');
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

  // Login
  if (currentScreen === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">EnerjiSaHa</h1>
            <p className="text-gray-600">D2D Satış Uygulaması</p>
          </div>
          <div className="space-y-4 mb-6">
            <input className="w-full px-4 py-3 border rounded-lg" placeholder="Kullanıcı adı" />
            <input type="password" className="w-full px-4 py-3 border rounded-lg" placeholder="Şifre" />
          </div>
          <button onClick={handleLogin} className="w-full bg-[#0099CB] text-white py-3 rounded-lg font-medium">
            Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  // Üst Navigasyon
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

  // Dashboard
  if (currentScreen === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Ana Sayfa</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Bugünkü Ziyaret</p>
                  <p className="text-3xl font-bold text-[#0099CB]">{totalVisits}</p>
                </div>
                <MapPin className="w-6 h-6 text-[#0099CB]" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tamamlanan</p>
                  <p className="text-3xl font-bold text-[#0099CB]">{completedVisits}</p>
                </div>
                <CheckCircle className="w-6 h-6 text-[#0099CB]" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Kalan</p>
                  <p className="text-3xl font-bold text-[#0099CB]">{remainingVisits}</p>
                </div>
                <Clock className="w-6 h-6 text-[#0099CB]" />
              </div>
            </div>
          </div>
          <div className="text-center">
            <button onClick={() => setCurrentScreen('visitList')} className="bg-[#0099CB] text-white px-8 py-4 rounded-xl font-semibold">
              Ziyaretleri Başlat
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ziyaret Listesi
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
                              className="bg-[#F9C800] text-gray-900 px-4 py-2 rounded-lg">Başlat</button>
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

  // Ziyaret Detayı
  if (currentScreen === 'visitDetail' && selectedCustomer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Ziyaret Detayı</h1>
            <button onClick={() => setCurrentScreen('visitList')} className="text-gray-600">← Geri</button>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Müşteri Bilgileri</h3>
              <div className="space-y-3">
                <div><span className="text-sm text-gray-600">Müşteri</span><p className="font-medium">{selectedCustomer.name}</p></div>
                <div><span className="text-sm text-gray-600">Adres</span><p>{selectedCustomer.address}, {selectedCustomer.district}</p></div>
                <div><span className="text-sm text-gray-600">Tarife</span><p>{selectedCustomer.tariff}</p></div>
                <div><span className="text-sm text-gray-600">Sayaç</span><p>{selectedCustomer.meterNumber}</p></div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Tüketim & Geçmiş</h3>
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
            {selectedCustomer.status === 'Bekliyor' && (
              <button onClick={() => handleStartVisit(selectedCustomer)}
                      className="bg-[#0099CB] text-white px-6 py-3 rounded-lg flex items-center gap-2">
                <MapPin className="w-5 h-5" /> Ziyarete Başla
              </button>
            )}
            {selectedCustomer.status === 'Yolda' && (
              <button onClick={() => setCurrentScreen('visitResult')}
                      className="bg-[#F9C800] text-gray-900 px-6 py-3 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> Ziyareti Tamamla
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Gün Sonu Raporu
  if (currentScreen === 'reports') {
    const salesCount = customers.filter(c => c.status === 'Tamamlandı').length;
    const salesRate = totalVisits ? Math.round((salesCount / totalVisits) * 100) : 0;
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
            <div className="bg-white rounded-xl shadow-sm p-6"><div className="flex justify-between"><div><p className="text-sm text-gray-600">Toplam Ziyaret</p><p className="text-2xl font-bold text-[#0099CB]">{totalVisits}</p></div><MapPin className="w-8 h-8 text-[#0099CB]" /></div></div>
            <div className="bg-white rounded-xl shadow-sm p-6"><div className="flex justify-between"><div><p className="text-sm text-gray-600">Satış Oranı</p><p className="text-2xl font-bold text-[#F9C800]">%{salesRate}</p></div><TrendingUp className="w-8 h-8 text-[#F9C800]" /></div></div>
            <div className="bg-white rounded-xl shadow-sm p-6"><div className="flex justify-between"><div><p className="text-sm text-gray-600">Verilen Teklifler</p><p className="text-2xl font-bold text-[#0099CB]">{offersGiven}</p></div><AlertCircle className="w-8 h-8 text-[#0099CB]" /></div></div>
            <div className="bg-white rounded-xl shadow-sm p-6"><div className="flex justify-between"><div><p className="text-sm text-gray-600">Tamamlanan</p><p className="text-2xl font-bold text-[#0099CB]">{completedVisits}</p></div><CheckCircle className="w-8 h-8 text-[#0099CB]" /></div></div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Rota Haritası</h3>
            <div className="h-64 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Route className="w-12 h-12 text-[#0099CB] mx-auto mb-2" />
                <p className="text-gray-600">Günlük Rota Özeti</p>
                <p className="text-sm text-gray-500 mt-2">Toplam Mesafe: ~8.2 km<br />Ortalama Ziyaret Süresi: 32 dk</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rota Haritası (üst menü dahil!)
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
