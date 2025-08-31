import React, { useRef, useState, useEffect } from 'react';
import { User, MapPin, List, BarChart3, Home, Clock, CheckCircle, XCircle, AlertCircle, Camera, Route, TrendingUp, Search, Mic, IdCard, Smartphone, FileText, PenLine, Send, ChevronRight, ShieldCheck } from 'lucide-react';
import RouteMap from './RouteMap'; // Bu bileşenin var olduğunu varsayıyoruz

// Veri ve Türleri yukarıda tanımladığımız yerden import ettiğimizi varsayalım
// import { mockCustomers, salesRep } from './data';
// import type { Customer, SalesRep, Screen, VisitResult } from './types';

// Yardımcı Fonksiyonlar
const getStatusColor = (s: string) => s === 'Bekliyor' ? 'bg-yellow-100 text-yellow-800' : s === 'Yolda' ? 'bg-blue-100 text-blue-800' : s === 'Tamamlandı' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
const getPriorityColor = (p: string) => p === 'Yüksek' ? 'bg-red-100 text-red-800' : p === 'Orta' ? 'bg-orange-100 text-orange-800' : p === 'Düşük' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
// --- components/LoginScreen.tsx ---

const LoginScreen = ({ onLogin }) => {
  // Bu fonksiyon, App bileşeninden bir prop olarak gelecek.
  // Giriş yap butonuna tıklandığında çağrılacak.
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-center bg-no-repeat" style={{ backgroundImage: "url(...)", backgroundSize: "contain", backgroundColor: "#f5f5f5" }}>
      <div className="bg-white bg-opacity-90 rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* ... Giriş ekranının tüm HTML ve CSS kodları ... */}
        <button onClick={onLogin} className="w-full bg-[#0099CB] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#0088B8] transition-colors">
          Giriş Yap
        </button>
      </div>
    </div>
  );
};
// =================================================================
// ANA UYGULAMA BİLEŞENİ (APP) - YÖNETİCİ
// =================================================================
function App() {
  // --- STATE YÖNETİMİ ---
  // Uygulamanın genel durumları burada tutulur.
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [agentName, setAgentName] = useState('');
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // --- ANA FONKSİYONLAR ---
  // State'i değiştiren ana mantıklar burada yer alır.
  
  const handleLogin = () => {
    setAgentName('Serkan Özkan');
    setCurrentScreen('dashboard');
  };

  const handleStartVisit = (customer: Customer) => {
    const updatedCustomers = customers.map(c =>
      c.id === customer.id ? { ...c, status: 'Yolda' as const } : c
    );
    setCustomers(updatedCustomers);
    setSelectedCustomer({ ...customer, status: 'Yolda' });
    setCurrentScreen('visitFlow');
  };

  const handleCompleteVisit = () => {
    if (selectedCustomer) {
      const updatedCustomers = customers.map(c =>
        c.id === selectedCustomer.id ? { ...c, status: 'Tamamlandı' as const } : c
      );
      setCustomers(updatedCustomers);
      setSelectedCustomer({ ...selectedCustomer, status: 'Tamamlandı' });
      setCurrentScreen('visitList');
    }
  };

  // --- EKRAN GÖRÜNTÜLEME MANTIĞI ---
  // Hangi ekranın gösterileceğini belirleyen fonksiyon.
  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <LoginScreen onLogin={handleLogin} />;
      
      case 'dashboard':
        return <DashboardScreen customers={customers} setCurrentScreen={setCurrentScreen} setSelectedCustomer={setSelectedCustomer} setCustomers={setCustomers} />;

      case 'visitList':
        return <VisitListScreen customers={customers} onStartVisit={handleStartVisit} onSelectCustomer={(customer) => { setSelectedCustomer(customer); setCurrentScreen('visitDetail'); }} />;
        
      case 'visitDetail':
        // selectedCustomer null değilse detay ekranını göster.
        if (!selectedCustomer) {
            setCurrentScreen('visitList'); // Müşteri seçili değilse listeye dön.
            return null;
        }
        return <VisitDetailScreen customer={selectedCustomer} onStartVisit={handleStartVisit} onBack={() => setCurrentScreen('visitList')} />;
      
      case 'visitFlow':
        if (!selectedCustomer) {
            setCurrentScreen('visitList'); // Müşteri seçili değilse listeye dön.
            return null;
        }
        return <VisitFlowScreen customer={selectedCustomer} onComplete={handleCompleteVisit} onBack={() => setCurrentScreen('visitList')} />;
      
      case 'reports':
        return <ReportsScreen customers={customers} />;
        
      case 'routeMap':
        return <RouteMapScreen customers={customers} salesRep={salesRep} />;
        
      default:
        // Varsayılan olarak giriş ekranını göster.
        return <LoginScreen onLogin={handleLogin} />;
    }
  };
  
  // --- RENDER ---
  // Login ekranı hariç diğer tüm ekranlarda üst navigasyon barı gösterilir.
  return (
    <>
      {currentScreen !== 'login' && <Navigation currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} agentName={agentName} />}
      <main>
        {renderScreen()}
      </main>
    </>
  );
}

// =================================================================
// PAYLAŞILAN BİLEŞENLER (SHARED COMPONENTS)
// =================================================================

// --- Üst Navigasyon Bileşeni ---
const Navigation = ({ currentScreen, setCurrentScreen, agentName }) => (
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
        {/* Navigasyon Butonları */}
        <button onClick={() => setCurrentScreen('dashboard')} className={`px-4 py-2 rounded-lg ${currentScreen === 'dashboard' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}><Home className="w-5 h-5" /></button>
        <button onClick={() => setCurrentScreen('routeMap')} className={`px-4 py-2 rounded-lg ${currentScreen === 'routeMap' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}><Route className="w-5 h-5" /></button>
        <button onClick={() => setCurrentScreen('visitList')} className={`px-4 py-2 rounded-lg ${currentScreen === 'visitList' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}><List className="w-5 h-5" /></button>
        <button onClick={() => setCurrentScreen('reports')} className={`px-4 py-2 rounded-lg ${currentScreen === 'reports' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}><BarChart3 className="w-5 h-5" /></button>
      </div>
    </div>
  </div>
);


// =================================================================
// EKRAN BİLEŞENLERİ (SCREEN COMPONENTS)
// =================================================================

// --- Giriş Ekranı ---
const LoginScreen = ({ onLogin }) => {
  // ... Orijinal koddaki login ekranının JSX'i buraya gelecek ...
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-center bg-no-repeat" style={{ backgroundImage: "url('https://media.licdn.com/dms/image/v2/D5616AQHsvGxmt8b1Uw/profile-displaybackgroundimage-shrink_200_800/profile-displaybackgroundimage-shrink_200_800/0/1677791208243?e=2147483647&v=beta&t=qA9Q6QbX_9_4mzs5WWUedPvF6UFm4z_YTSbSLs9RMNM')", backgroundSize: "contain", backgroundColor: "#f5f5f5" }} >
      <div className="bg-white bg-opacity-90 rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-24 h-16 mx-auto mb-4 flex items-center justify-center">
            <img src="https://www.enerjisa.com.tr/assets/sprite/enerjisa.webp" alt="Enerjisa Logo" className="max-w-full max-h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">EnerjiSaHa</h1>
          <p className="text-gray-600">D2D Satış Uygulaması</p>
        </div>
        <div className="space-y-4 mb-6">
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Kullanıcı Adı</label><input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0099CB] focus:border-transparent" placeholder="Kullanıcı adınızı girin" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Şifre</label><input type="password" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0099CB] focus:border-transparent" placeholder="Şifrenizi girin" /></div>
        </div>
        <button onClick={onLogin} className="w-full bg-[#0099CB] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#0088B8] transition-colors">Giriş Yap</button>
      </div>
    </div>
  );
};


// Diğer ekran bileşenleri (`DashboardScreen`, `VisitListScreen` vb.) de benzer şekilde
// orijinal koddaki ilgili `if` blokları kesilip buraya yapıştırılarak oluşturulur.
// Her bileşen, ihtiyaç duyduğu verileri ve fonksiyonları App'ten `props` olarak alır.

export default App;