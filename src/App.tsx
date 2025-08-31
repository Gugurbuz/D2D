import React, { useState } from 'react';
import Navigation from './components/Navigation';
import { Role, Screen, VisitResult, Rep } from './types';
import { Customer, SalesRep as MapSalesRep } from './RouteMap';

// Screens
import LoginScreen from './screens/LoginScreen';
import RoleSelectScreen from './screens/RoleSelectScreen';
import AssignmentScreen from './screens/AssignmentScreen';
import DashboardScreen from './screens/DashboardScreen';
import VisitListScreen from './screens/VisitListScreen';
import VisitDetailScreen from './screens/VisitDetailScreen';
import VisitFlowScreen from './screens/VisitFlowScreen';
import ReportsScreen from './screens/ReportsScreen';
import RouteMapScreen from './screens/RouteMapScreen';

// Mock data (aynı)
export const mockCustomers: Customer[] = [
  { id: '1',  name: 'Mehmet Yılmaz', address: 'Kadıköy – Bahariye Cd.', district: 'Kadıköy', plannedTime: '09:00', priority: 'Yüksek', tariff: 'Mesken', meterNumber: '100000001', consumption: '290 kWh/ay', offerHistory: ['Şubat 2025: %12 indirim', 'Ekim 2024: Sadakat teklifi'], status: 'Bekliyor', estimatedDuration: '30 dk', distance: '0.8 km',  lat: 40.9916, lng: 29.0250, phone: '0555 111 22 01' },
  { id: '2',  name: 'Ayşe Demir',    address: 'Üsküdar – Çengelköy',    district: 'Üsküdar', plannedTime: '09:30', priority: 'Orta',   tariff: 'Mesken', meterNumber: '100000002', consumption: '320 kWh/ay', offerHistory: ['Mart 2025: Yeni müşteri teklifi'], status: 'Bekliyor', estimatedDuration: '25 dk', distance: '1.3 km',  lat: 41.0255, lng: 29.0653, phone: '0555 111 22 02' },
  { id: '3',  name: 'Ali Kaya',      address: 'Beşiktaş – Barbaros Blv.', district: 'Beşiktaş', plannedTime: '10:00', priority: 'Düşük',  tariff: 'İş Yeri', meterNumber: '100000003', consumption: '880 kWh/ay', offerHistory: ['Ocak 2025: İş yeri sabit fiyat', 'Kasım 2024: %18 indirim'], status: 'Bekliyor', estimatedDuration: '40 dk', distance: '2.1 km',  lat: 41.0430, lng: 29.0070, phone: '0555 111 22 03' },
  { id: '4',  name: 'Zeynep Koç',    address: 'Levent – Büyükdere Cd.', district: 'Beşiktaş', plannedTime: '10:30', priority: 'Yüksek', tariff: 'İş Yeri', meterNumber: '100000004', consumption: '1250 kWh/ay', offerHistory: ['Aralık 2024: Kurumsal tarife önerisi'], status: 'Bekliyor', estimatedDuration: '45 dk', distance: '3.0 km',  lat: 41.0800, lng: 29.0119, phone: '0555 111 22 04' },
];

const salesRepForMap: MapSalesRep = { name: 'Satış Uzmanı', lat: 40.9360, lng: 29.1500 };
const allReps: Rep[] = [
  { id: 'rep-1', name: 'Serkan Özkan' },
  { id: 'rep-2', name: 'Zelal Kaya' },
  { id: 'rep-3', name: 'Şöhret Demir' },
];

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [role, setRole] = useState<Role>('rep');
  const [agentName, setAgentName] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [visitResult, setVisitResult] = useState<VisitResult>(null);
  const [visitNotes, setVisitNotes] = useState('');
  const [filter, setFilter] = useState('Bugün');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);

  const [assignments, setAssignments] = useState<Record<string, string | undefined>>({});

  // Aktif rep görünür set
  const currentRepId = role === 'rep' ? 'rep-1' : undefined;
  const isVisibleForCurrentRole = (c: Customer) => {
    if (role === 'manager') return true;
    const assigned = assignments[c.id];
    return !assigned || assigned === currentRepId;
  };
  const visibleCustomers = customers.filter(isVisibleForCurrentRole);

  // Sesle arama
  const handleSpeechToText = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'tr-TR'; recognition.continuous = false; recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => { const transcript = event.results[0][0].transcript; setSearchQuery(transcript); setIsListening(false); };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } else {
      alert('Tarayıcınız ses tanıma özelliğini desteklemiyor.');
    }
  };

  // Login
  const handleLogin = () => { setAgentName('Serkan Özkan'); setCurrentScreen('roleSelect'); };

  // Ziyaret başlangıcı
  const handleStartVisit = (customer: Customer) => {
    const updated = customers.map(c => c.id === customer.id ? { ...c, status: 'Yolda' as const } : c);
    setCustomers(updated);
    setSelectedCustomer({ ...customer, status: 'Yolda' });
    setCurrentScreen('visitFlow');
  };

  // Ziyareti tamamla
  const handleCompleteVisit = (cust: Customer) => {
    setCustomers(prev => prev.map(c => c.id === cust.id ? { ...cust } : c));
    setSelectedCustomer({ ...cust });
  };

  // Ekran switch
  if (currentScreen === 'login') return <LoginScreen onLogin={handleLogin} />;
  if (currentScreen === 'roleSelect') return <RoleSelectScreen onSelect={(r) => { setRole(r); setCurrentScreen('dashboard'); }} />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation agentName={agentName} role={role} currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />

      {currentScreen === 'assignment' && role === 'manager' && (
        <AssignmentScreen customers={customers} assignments={assignments} setAssignments={setAssignments} allReps={allReps} />
      )}

      {currentScreen === 'dashboard' && (
        <DashboardScreen
          customers={visibleCustomers}
          assignments={assignments}
          allReps={allReps}
          setCurrentScreen={setCurrentScreen}
          setSelectedCustomer={setSelectedCustomer}
        />
      )}

      {currentScreen === 'visitList' && (
        <VisitListScreen
          customers={visibleCustomers}
          filter={filter} setFilter={setFilter}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          isListening={isListening} onMicClick={handleSpeechToText}
          assignments={assignments} allReps={allReps}
          onDetail={(c) => { setSelectedCustomer(c); setCurrentScreen('visitDetail'); }}
          onStart={handleStartVisit}
        />
      )}

      {currentScreen === 'visitDetail' && selectedCustomer && (
        <>
          <div className="min-h-screen">
            <VisitDetailScreen
              customer={selectedCustomer}
              onBack={() => setCurrentScreen('visitList')}
              onStartVisit={handleStartVisit}
            />
          </div>
        </>
      )}

      {currentScreen === 'visitFlow' && selectedCustomer && (
        <VisitFlowScreen
          customer={selectedCustomer}
          onCloseToList={() => setCurrentScreen('visitList')}
          onCompleteVisit={handleCompleteVisit}
        />
      )}

      {currentScreen === 'reports' && (
        <ReportsScreen customers={visibleCustomers} />
      )}

      {currentScreen === 'routeMap' && (
        <RouteMapScreen customers={visibleCustomers} salesRep={salesRepForMap} />
      )}
    </div>
  );
}

export default App;
