// src/App.tsx
import React, { useState } from "react";
import {
  User, MapPin, List, BarChart3, Home, Map, Clock,
  CheckCircle, XCircle, AlertCircle, Camera, Route, TrendingUp, Search, Mic
} from "lucide-react";
import RouteMap from "./RouteMap";
import type { Customer } from "./types";
import { mockCustomers } from "./data/mockCustomers";

/* Ekranlar */
type Screen = 'login' | 'dashboard' | 'map' | 'visitList' | 'visitDetail' | 'visitResult' | 'reports' | 'routeMap';
type VisitResult = 'Satış Yapıldı' | 'Teklif Verildi' | 'Reddedildi' | 'Evde Yok' | null;

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [visitResult, setVisitResult] = useState<VisitResult>(null);
  const [visitNotes, setVisitNotes] = useState('');
  const [filter, setFilter] = useState('Bugün');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Veriyi tek kaynaktan oku: src/data/mockCustomers.ts
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
    setIsLoggedIn(true);
    setAgentName('Serkan Özkan');
    setCurrentScreen('dashboard');
  };

  const handleStartVisit = (customer: Customer) => {
    const updated = customers.map(c =>
      c.id === customer.id ? { ...c, status: 'Yolda' as const } : c
    );
    setCustomers(updated);
    setSelectedCustomer({ ...customer, status: 'Yolda' });
    setCurrentScreen('visitDetail');
  };

  const handleCompleteVisit = () => {
    if (selectedCustomer && visitResult) {
      const updated = customers.map(c =>
        c.id === selectedCustomer.id ? { ...c, status: 'Tamamlandı' as const } : c
      );
      setCustomers(updated);
      setVisitResult(null);
      setVisitNotes('');
      setCurrentScreen('visitList');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Bekliyor': return 'bg-yellow-100 text-yellow-800';
      case 'Yolda': return 'bg-blue-100 text-blue-800';
      case 'Tamamlandı': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Yüksek': return 'bg-red-100 text-red-800';
      case 'Orta': return 'bg-orange-100 text-orange-800';
      case 'Düşük': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const completedVisits = customers.filter(c => c.status === 'Tamamlandı').length;
  const remainingVisits = customers.filter(c => c.status === 'Bekliyor').length;
  const totalVisits = customers.length;

  /* ---------- LOGIN ---------- */
  if (currentScreen === 'login') {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://media.licdn.com/dms/image/v2/D5616AQHsvGxmt8b1Uw/profile-displaybackgroundimage-shrink_200_800/profile-displaybackgroundimage-shrink_200_800/0/1677791208243?e=2147483647&v=beta&t=qA9Q6QbX_9_4mzs5WWUedPvF6UFm4z_YTSbSLs9RMNM')",
          backgroundSize: "contain",
          backgroundColor: "#f5f5f5",
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
            onClick={handleLogin}
            className="w-full bg-[#0099CB] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#0088B8] transition-colors"
          >
            Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  /* ---------- NAV ---------- */
  const Navigation = () => (
    <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-[#0099CB] rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{agentName || 'Saha Temsilcisi'}</h2>
            <p className="text-sm text-gray-600">Saha Temsilcisi</p>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentScreen('dashboard')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentScreen === 'dashboard' ? 'bg-[#F9C800] text-gray-900' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Home className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentScreen('map')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentScreen === 'map' ? 'bg-[#F9C800] text-gray-900' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Map className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentScreen('routeMap')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentScreen === 'routeMap' ? 'bg-[#F9C800] text-gray-900' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Route className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentScreen('visitList')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentScreen === 'visitList' ? 'bg-[#F9C800] text-gray-900' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentScreen('reports')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentScreen === 'reports' ? 'bg-[#F9C800] text-gray-900' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  /* ---------- DASHBOARD ---------- */
  if (currentScreen === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Ana Sayfa</h1>
            <p className="text-gray-600">Bugünkü satış faaliyetleriniz</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Bugünkü Ziyaret Sayısı</p>
                  <p className="text-3xl font-bold text-[#0099CB]">{totalVisits}</p>
                </div>
                <div className="w-12 h-12 bg-[#F9C800] bg-opacity-20 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-[#0099CB]" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tamamlanan Görevler</p>
                  <p className="text-3xl font-bold text-[#0099CB]">{completedVisits}</p>
                </div>
                <div className="w-12 h-12 bg-[#F9C800] bg-opacity-20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-[#0099CB]" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Kalan Ziyaretler</p>
                  <p className="text-3xl font-bold text-[#0099CB]">{remainingVisits}</p>
                </div>
                <div className="w-12 h-12 bg-[#F9C800] bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-[#0099CB]" />
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => setCurrentScreen('visitList')}
              className="bg-[#0099CB] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#0088B8] transition-colors shadow-lg"
            >
              Ziyaretleri Başlat
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- MAP (eski basit harita sayfası placeholder) ---------- */
  if (currentScreen === 'map') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Harita Görünümü</h1>
            <button
              onClick={() => setCurrentScreen('routeMap')}
              className="bg-[#F9C800] text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-[#E6B500] transition-colors flex items-center space-x-2"
            >
              <Route className="w-5 h-5" />
              <span>Rota Haritasına Git</span>
            </button>
          </div>
          {/* Burada basit bir placeholder bırakıyoruz */}
          <div className="h-96 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-500">
            Basit harita alanı (RouteMap ekranını kullanın)
          </div>
        </div>
      </div>
    );
  }

  /* ---------- VISIT LIST ---------- */
  if (currentScreen === 'visitList') {
    let filteredCustomers = customers.filter(c => {
      if (filter === 'Tamamlandı') return c.status === 'Tamamlandı';
      return true; // 'Bugün' / 'Bu Hafta' için tümünü göster
    });

    if (searchQuery.trim()) {
      filteredCustomers = filteredCustomers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.district.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Ziyaret Listesi</h1>
            <div className="flex space-x-2">
              {['Bugün', 'Bu Hafta', 'Tamamlandı'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === f ? 'bg-[#0099CB] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
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
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-16 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0099CB] focus:border-transparent text-lg"
                placeholder="Müşteri adı, adres veya ilçe ile ara..."
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  onClick={handleSpeechToText}
                  disabled={isListening}
                  className={`p-2 rounded-lg transition-colors ${
                    isListening
                      ? 'bg-red-100 text-red-600 animate-pulse'
                      : 'bg-[#F9C800] bg-opacity-20 text-[#0099CB] hover:bg-[#F9C800] hover:bg-opacity-30'
                  }`}
                  title="Sesli arama"
                >
                  <Mic className="h-5 w-5" />
                </button>
              </div>
            </div>
            {isListening && (
              <p className="text-sm text-[#0099CB] mt-2 flex items-center">
                <span className="animate-pulse mr-2">🎤</span>
                Dinleniyor... Lütfen konuşun
              </p>
            )}
            {searchQuery && (
              <p className="text-sm text-gray-600 mt-2">
                "{searchQuery}" için {filteredCustomers.length} sonuç bulundu
              </p>
            )}
          </div>

          <div className="space-y-4">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-600 mb-2">Sonuç bulunamadı</p>
                <p className="text-gray-500">
                  {searchQuery ? 'Arama kriterlerinizi değiştirip tekrar deneyin' : 'Bu filtre için ziyaret bulunmuyor'}
                </p>
              </div>
            ) : (
              <>
                {filteredCustomers.map((customer) => (
                  <div key={customer.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(customer.status)}`}>
                            {customer.status}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(customer.priority)}`}>
                            {customer.priority}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-1">{customer.address}, {customer.district}</p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{customer.estimatedDuration}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{customer.distance}</span>
                          </span>
                          <span>Saat: {customer.plannedTime}</span>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setCurrentScreen('visitDetail');
                          }}
                          className="bg-[#0099CB] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#0088B8] transition-colors"
                        >
                          Detay
                        </button>
                        {customer.status === 'Bekliyor' && (
                          <button
                            onClick={() => handleStartVisit(customer)}
                            className="bg-[#F9C800] text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-[#E6B500] transition-colors"
                          >
                            Başlat
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ---------- VISIT DETAIL ---------- */
  if (currentScreen === 'visitDetail' && selectedCustomer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Ziyaret Detayı</h1>
            <button
              onClick={() => setCurrentScreen('visitList')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Geri
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Müşteri Bilgileri</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Müşteri Adı</label>
                    <p className="text-gray-900 font-medium">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Adres</label>
                    <p className="text-gray-900">{selectedCustomer.address}, {selectedCustomer.district}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tarife</label>
                    <p className="text-gray-900">{selectedCustomer.tariff}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Sayaç Numarası</label>
                    <p className="text-gray-900">{selectedCustomer.meterNumber}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tüketim & Geçmiş</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Aylık Tüketim</label>
                    <p className="text-gray-900 font-medium">{selectedCustomer.consumption}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Teklif Geçmişi</label>
                    <div className="space-y-1">
                      {selectedCustomer.offerHistory.map((offer, index) => (
                        <p key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{offer}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            {selectedCustomer.status === 'Bekliyor' && (
              <button
                onClick={() => handleStartVisit(selectedCustomer)}
                className="bg-[#0099CB] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0088B8] transition-colors flex items-center space-x-2"
              >
                <MapPin className="w-5 h-5" />
                <span>Ziyarete Başla</span>
              </button>
            )}
            {selectedCustomer.status === 'Yolda' && (
              <button
                onClick={() => setCurrentScreen('visitResult')}
                className="bg-[#F9C800] text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-[#E6B500] transition-colors flex items-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Ziyareti Tamamla</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ---------- VISIT RESULT ---------- */
  if (currentScreen === 'visitResult') {
    const resultOptions: { value: VisitResult; label: string; icon: React.ReactNode; color: string }[] = [
      { value: 'Satış Yapıldı', label: 'Satış Yapıldı', icon: <CheckCircle className="w-5 h-5" />, color: 'bg-green-100 text-green-800 border-green-300' },
      { value: 'Teklif Verildi', label: 'Teklif Verildi', icon: <AlertCircle className="w-5 h-5" />, color: 'bg-[#F9C800] bg-opacity-20 text-[#0099CB] border-[#F9C800]' },
      { value: 'Reddedildi', label: 'Reddedildi', icon: <XCircle className="w-5 h-5" />, color: 'bg-red-100 text-red-800 border-red-300' },
      { value: 'Evde Yok', label: 'Evde Yok', icon: <Home className="w-5 h-5" />, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    ];

    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Ziyaret Sonucu</h1>
            <button
              onClick={() => setCurrentScreen('visitDetail')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Geri
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {selectedCustomer?.name} - Ziyaret Sonucu
              </h3>
              <p className="text-gray-600">{selectedCustomer?.address}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Ziyaret Sonucu</label>
              <div className="grid grid-cols-2 gap-3">
                {resultOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setVisitResult(option.value)}
                    className={`p-4 border-2 rounded-lg flex items-center space-x-3 transition-all ${
                      visitResult === option.value
                        ? option.color
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {option.icon}
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notlar</label>
              <textarea
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0099CB] focus:border-transparent"
                rows={4}
                placeholder="Ziyaret ile ilgili notlarınızı buraya yazın..."
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Sayaç Fotoğrafı</label>
              <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 transition-colors flex items-center justify-center space-x-2">
                <Camera className="w-5 h-5" />
                <span>Fotoğraf Çek / Yükle</span>
              </button>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleCompleteVisit}
                disabled={!visitResult}
                className="flex-1 bg-[#0099CB] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0088B8] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Kaydet ve Sonraki
              </button>
              <button
                onClick={() => setCurrentScreen('visitDetail')}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- REPORTS ---------- */
  if (currentScreen === 'reports') {
    const salesCount = customers.filter(c => c.status === 'Tamamlandı').length;
    const salesRate = totalVisits > 0 ? Math.round((salesCount / totalVisits) * 100) : 0;
    const offersGiven = Math.floor(salesCount * 1.5); // mock

    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Gün Sonu Raporu</h1>
            <div className="text-sm text-gray-600">
              {new Date().toLocaleDateString('tr-TR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Ziyaret</p>
                  <p className="text-2xl font-bold text-[#0099CB]">{totalVisits}</p>
                </div>
                <MapPin className="w-8 h-8 text-[#0099CB]" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Satış Oranı</p>
                  <p className="text-2xl font-bold text-[#F9C800]">%{salesRate}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-[#F9C800]" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Verilen Teklifler</p>
                  <p className="text-2xl font-bold text-[#0099CB]">{offersGiven}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-[#0099CB]" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tamamlanan</p>
                  <p className="text-2xl font-bold text-[#0099CB]">{completedVisits}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-[#0099CB]" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ziyaret Detayları</h3>
              <div className="space-y-3">
                {customers.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{c.name}</p>
                      <p className="text-sm text-gray-600">{c.district}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(c.status)}`}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rota Haritası</h3>
              <div className="h-64 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Route className="w-12 h-12 text-[#0099CB] mx-auto mb-2" />
                  <p className="text-gray-600 font-medium">Günlük Rota Özeti</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Toplam Mesafe: ~8.2 km<br />
                    Ortalama Ziyaret Süresi: 32 dk
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  /* ---------- ROUTE MAP ---------- */
  if (currentScreen === 'routeMap') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="p-6">
          <RouteMap customers={customers} />
        </div>
      </div>
    );
  }

  return null;
}

export default App;
