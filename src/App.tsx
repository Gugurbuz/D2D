// src/App.tsx (Performans İçin Named Export'a Uygun Lazy Loading)

import React, { useState, Suspense, lazy } from 'react';
import AppLayout from './layouts/AppLayout';
import { Role, Screen } from './types';
import { Customer } from './RouteMap';

import { mockCustomers } from './data/mockCustomers';
import { allReps, salesRepForMap } from './data/reps';
import { generateInvoiceSummary } from "./utils/gptSummary";

import { teamReps, managerUser } from './data/team';

import { GuideProvider, HelpFAB, AppRole, AppScreen } from "./guide/GuideSystem";

// === 2. TÜM EKRANLAR NAMED EXPORT'A UYGUN ŞEKİLDE LAZY OLARAK YÜKLENDİ ===
// .then(module => ({ default: module.BileşenAdı })) eklemesi yapıldı.
const LoginScreen = lazy(() => import('./screens/LoginScreen').then(module => ({ default: module.LoginScreen })));
const RoleSelectScreen = lazy(() => import('./screens/RoleSelectScreen').then(module => ({ default: module.RoleSelectScreen })));
const AssignmentScreen = lazy(() => import('./screens/AssignmentScreen').then(module => ({ default: module.AssignmentScreen })));
const AssignmentMapScreen = lazy(() => import('./screens/AssignmentMapScreen').then(module => ({ default: module.AssignmentMapScreen })));
const DashboardScreen = lazy(() => import('./screens/DashboardScreen').then(module => ({ default: module.DashboardScreen })));
const VisitListScreen = lazy(() => import('./screens/VisitListScreen').then(module => ({ default: module.VisitListScreen })));
const VisitDetailScreen = lazy(() => import('./screens/VisitDetailScreen').then(module => ({ default: module.VisitDetailScreen })));
const VisitFlowScreen = lazy(() => import('./screens/VisitFlowScreen').then(module => ({ default: module.VisitFlowScreen })));
const ReportsScreen = lazy(() => import('./screens/ReportsScreen').then(module => ({ default: module.ReportsScreen })));
const RouteMapScreen = lazy(() => import('./screens/RouteMapScreen').then(module => ({ default: module.RouteMapScreen })));
const TeamMapScreen = lazy(() => import('./screens/TeamMapScreen').then(module => ({ default: module.TeamMapScreen })));
const ProfileScreens = lazy(() => import('./screens/ProfileScreens').then(module => ({ default: module.ProfileScreens })));
const InvoiceOcrPage = lazy(() => import("./screens/InvoiceOcrPage").then(module => ({ default: module.InvoiceOcrPage })));
const MessagesScreen = lazy(() => import('./screens/MessagesScreen').then(module => ({ default: module.MessagesScreen })));


// === Geçici kapatma bayrağı ===
const GUIDE_ENABLED = false;

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [role, setRole] = useState<Role>('sales');
  const [agentName, setAgentName] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [filter, setFilter] = useState('Bugün');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [assignments, setAssignments] = useState<Record<string, string | undefined>>({});

  // State ve fonksiyonlarınızın geri kalanı olduğu gibi kalıyor...
  const salesUser = teamReps[0];
  const currentRepId = role === 'sales' ? salesUser.id : undefined;
  const isVisibleForCurrentRole = (c: Customer) => {
    if (role === 'manager') return true;
    const assigned = assignments[c.id];
    return !assigned || assigned === currentRepId;
  };
  const visibleCustomers = customers.filter(isVisibleForCurrentRole);
  const [summary, setSummary] = useState("");
  const handleSummary = async () => {};
  const toAppRole = (r: Role): AppRole => r === 'manager' ? 'sahaYonetici' : 'satisUzmani';
  const toAppScreen = (s: Screen, r: Role): AppScreen => {
    switch (s) {
      case 'dashboard': return 'dashboard';
      case 'routeMap': return 'routeMap';
      case 'visitList': return 'visitList';
      default: return 'dashboard';
    }
  };
  const handleSpeechToText = () => {};
  const handleLogin = () => { setCurrentScreen('roleSelect'); };
  const handleSelectCustomer = (customer: Customer) => { setSelectedCustomer(customer); };
  const handleStartVisit = (customer: Customer) => {
    const updated = customers.map((c) => c.id === customer.id ? { ...c, status: 'Yolda' as const } : c);
    setCustomers(updated);
    setSelectedCustomer({ ...customer, status: 'Yolda' });
    setCurrentScreen('visitFlow');
  };
  const handleCompleteVisit = (cust: Customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === cust.id ? { ...cust } : c)));
    setSelectedCustomer({ ...cust });
  };

  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Uygulama Yükleniyor...</div>}>
      {currentScreen === 'login' && <LoginScreen onLogin={handleLogin} />}

      {currentScreen === 'roleSelect' && (
        <RoleSelectScreen
          onSelect={(selectedRole) => {
            if (selectedRole === 'manager') {
              setRole('manager');
              setAgentName(managerUser.name);
            } else {
              setRole('sales');
              setAgentName(salesUser.name);
            }
            setCurrentScreen('dashboard');
          }}
        />
      )}

      {currentScreen !== 'login' && currentScreen !== 'roleSelect' && (() => {
        const guideRole = toAppRole(role);
        const guideScreen = toAppScreen(currentScreen, role);

        const appContent = (
          <AppLayout
            agentName={agentName}
            role={role}
            currentScreen={currentScreen}
            setCurrentScreen={setCurrentScreen}
          >
            {/* Ekranların koşullu olarak render edilmesi */}
            {currentScreen === 'profile' && <ProfileScreens role={role} />}
            {currentScreen === 'assignmentMap' && role === 'manager' && <AssignmentMapScreen customers={customers} assignments={assignments} setAssignments={setAssignments} allReps={allReps} onBack={() => setCurrentScreen('assignment')} />}
            {currentScreen === 'assignment' && role === 'manager' && <AssignmentScreen customers={customers} assignments={assignments} setAssignments={setAssignments} allReps={allReps} setCurrentScreen={setCurrentScreen} />}
            {currentScreen === 'teamMap' && role === 'manager' && <TeamMapScreen />}
            {currentScreen === 'messages' && <MessagesScreen />}
            {currentScreen === 'dashboard' && <DashboardScreen customers={visibleCustomers} assignments={assignments} allReps={allReps} setCurrentScreen={setCurrentScreen} setSelectedCustomer={setSelectedCustomer} />}
            {currentScreen === 'visitList' && <VisitListScreen customers={visibleCustomers} assignments={assignments} allReps={allReps} setCurrentScreen={setCurrentScreen} onSelectCustomer={handleSelectCustomer} filter={filter} setFilter={setFilter} searchQuery={searchQuery} setSearchQuery={setSearchQuery} isListening={isListening} onMicClick={handleSpeechToText} />}
            {currentScreen === 'visitDetail' && selectedCustomer && <VisitDetailScreen customer={selectedCustomer} onBack={() => setCurrentScreen('visitList')} onStartVisit={handleStartVisit} />}
            {currentScreen === 'visitFlow' && selectedCustomer && <VisitFlowScreen customer={selectedCustomer} onCloseToList={() => setCurrentScreen('visitList')} onCompleteVisit={handleCompleteVisit} />}
            {currentScreen === 'reports' && <ReportsScreen customers={visibleCustomers} />}
            {currentScreen === 'routeMap' && <RouteMapScreen customers={visibleCustomers} salesRep={salesRepForMap} />}
            {currentScreen === 'invoiceOcr' && <InvoiceOcrPage />}
          </AppLayout>
        );

        if (!GUIDE_ENABLED) {
          return appContent;
        }

        return (
          <GuideProvider role={guideRole} screen={guideScreen} autoStart enableLongPress longPressMs={700}>
            {appContent}
            <HelpFAB />
          </GuideProvider>
        );
      })()}
    </Suspense>
  );
}

export default App;