// src/App.tsx
import React, { useState } from 'react';
import AppLayout from './layouts/AppLayout';
import MessagesScreen from './screens/MessagesScreen';
import { Role, Screen } from './types';
import { Customer } from './RouteMap';

import { mockCustomers } from './data/mockCustomers';
// import { allReps, salesRepForMap } from './data/reps'; // Bu satır team.ts kullandığı için kapatılabilir
import { generateInvoiceSummary } from "./utils/gptSummary";

// Kullanıcı verilerini team.ts dosyasından import ediyoruz
import { teamReps, managerUser } from './data/team';

// Screens
import LoginScreen from './screens/LoginScreen';
import RoleSelectScreen from './screens/RoleSelectScreen';
import AssignmentScreen from './screens/AssignmentScreen';
import AssignmentMapScreen from './screens/AssignmentMapScreen';
import DashboardScreen from './screens/DashboardScreen';
import VisitListScreen from './screens/VisitListScreen';
import VisitDetailScreen from './screens/VisitDetailScreen';
import VisitFlowScreen from './screens/VisitFlowScreen';
import ReportsScreen from './screens/ReportsScreen';
import RouteMapScreen from './screens/RouteMapScreen';
import TeamMapScreen from './screens/TeamMapScreen';
import ProfileScreens from './screens/ProfileScreens';
import InvoiceOcrPage from "./screens/InvoiceOcrPage";

// Guide sistemi (Değişiklik yok)
import { GuideProvider, HelpFAB, AppRole, AppScreen } from "./guide/GuideSystem";
const GUIDE_ENABLED = false;

// YENİ: Tüm kullanıcıları arama yapmak için tek bir dizide birleştirelim.
const allUsers = [...teamReps, managerUser];

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  
  // DEĞİŞTİRİLDİ: Artık başlangıç değeri null. Login sonrası ayarlanacak.
  const [role, setRole] = useState<Role | null>(null);
  const [agentName, setAgentName] = useState('');
  
  // YENİ: Giriş yapan kullanıcının spesifik ID'sini tutmak için state eklendi.
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [filter, setFilter] = useState('Bugün');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [assignments, setAssignments] = useState<Record<string, string | undefined>>({});

  // KALDIRILDI: Bu satır artık dinamik olarak yönetildiği için kaldırıldı.
  // const salesUser = teamReps[0];

  const isVisibleForCurrentRole = (c: Customer) => {
    if (role === 'manager') return true;
    const assigned = assignments[c.id];
    return !assigned || assigned === currentUserId; // 'currentRepId' yerine 'currentUserId' kullanıldı
  };
  const visibleCustomers = customers.filter(isVisibleForCurrentRole);

  const [summary, setSummary] = useState("");
  const handleSummary = async () => { /* ...içerik aynı... */ };
  const toAppRole = (r: Role | null): AppRole => r === 'manager' ? 'sahaYonetici' : 'satisUzmani';
  const toAppScreen = (s: Screen, r: Role | null): AppScreen => { /* ...içerik aynı... */ return 'dashboard'; };
  const handleSpeechToText = () => { /* ...içerik aynı... */ };
  
  const handleLogin = () => {
    setCurrentScreen('roleSelect');
  };

  const handleStartVisit = (customer: Customer) => { /* ...içerik aynı... */ };
  const handleCompleteVisit = (cust: Customer) => { /* ...içerik aynı... */ };

  // Login ekranı (Değişiklik yok)
  if (currentScreen === 'login') {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // DEĞİŞTİRİLDİ: RoleSelectScreen'den gelen spesifik ID'yi işleyen yeni mantık.
  if (currentScreen === 'roleSelect') {
    return (
      <RoleSelectScreen
        onSelect={(selectedUserId) => { // Gelen değer artık 'rep-1', 'manager-1' gibi bir ID
          const selectedUser = allUsers.find(u => u.id === selectedUserId);

          if (selectedUser) {
            setCurrentUserId(selectedUser.id);
            setRole(selectedUser.role as Role);
            setAgentName(selectedUser.name);
            setCurrentScreen('dashboard');
          } else {
            console.error("Seçilen kullanıcı ID'si veri kaynağında bulunamadı:", selectedUserId);
            // İsteğe bağlı olarak bir hata ekranı gösterebilirsiniz.
          }
        }}
      />
    );
  }

  // Ana uygulama düzeni
  const appContent = (
    <AppLayout
      agentName={agentName}
      role={role}
      currentScreen={currentScreen}
      setCurrentScreen={setCurrentScreen}
    >
      {/* DEĞİŞTİRİLDİ: ProfileScreens bileşenine artık 'role' yerine doğru 'userId' gönderiliyor. */}
      {/* Ayrıca currentUserId'nin null olmadığı kontrol ediliyor. */}
      {currentScreen === 'profile' && currentUserId && (
        <ProfileScreens userId={currentUserId} />
      )}

      {/* Diğer ekranların render edilme mantığı aynı... */}
      {currentScreen === 'assignmentMap' && role === 'manager' && (
        <AssignmentMapScreen customers={customers} assignments={assignments} setAssignments={setAssignments} allReps={teamReps} onBack={() => setCurrentScreen('assignment')} />
      )}
      {currentScreen === 'assignment' && role === 'manager' && (
        <AssignmentScreen customers={customers} assignments={assignments} setAssignments={setAssignments} allReps={teamReps} setCurrentScreen={setCurrentScreen}/>
      )}
      {currentScreen === 'teamMap' && role === 'manager' && <TeamMapScreen />}
      {currentScreen === 'messages' && <MessagesScreen />}
      {currentScreen === 'dashboard' && (
        <DashboardScreen customers={visibleCustomers} assignments={assignments} allReps={teamReps} setCurrentScreen={setCurrentScreen} setSelectedCustomer={setSelectedCustomer}/>
      )}
      {currentScreen === 'visitList' && (
        <VisitListScreen customers={visibleCustomers} filter={filter} setFilter={setFilter} searchQuery={searchQuery} setSearchQuery={setSearchQuery} isListening={isListening} onMicClick={handleSpeechToText} assignments={assignments} allReps={teamReps} onDetail={(c) => {setSelectedCustomer(c); setCurrentScreen('visitDetail'); }} onStart={handleStartVisit} />
      )}
      {currentScreen === 'visitDetail' && selectedCustomer && (
        <VisitDetailScreen customer={selectedCustomer} onBack={() => setCurrentScreen('visitList')} onStartVisit={handleStartVisit} />
      )}
      {currentScreen === 'visitFlow' && selectedCustomer && (
        <VisitFlowScreen customer={selectedCustomer} onCloseToList={() => setCurrentScreen('visitList')} onCompleteVisit={handleCompleteVisit}/>
      )}
      {currentScreen === 'reports' && <ReportsScreen customers={visibleCustomers} />}
      {currentScreen === 'routeMap' && teamReps[0] && (
        <RouteMapScreen customers={visibleCustomers} salesRep={teamReps[0]} />
      )}
      {currentScreen === 'invoiceOcr' && <InvoiceOcrPage />}
    </AppLayout>
  );

  // Guide kapalıyken sadece içerik döner.
  if (!GUIDE_ENABLED) {
    return appContent;
  }
  
  // Guide açıkken GuideProvider ve HelpFAB ile sarmalar.
  const guideRole = toAppRole(role);
  const guideScreen = toAppScreen(currentScreen, role);
  return (
    <GuideProvider role={guideRole} screen={guideScreen} autoStart enableLongPress longPressMs={700}>
      {appContent}
      <HelpFAB />
    </GuideProvider>
  );
}

// HATA: Dosyanın sonundaki bu hatalı kod bloğu temizlendi.

export default App;