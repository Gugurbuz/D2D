import React, { useState } from 'react';
import AppLayout from './layouts/AppLayout';
import MessagesScreen from './screens/MessagesScreen';
import { Role, Screen } from './types';
import { Customer } from './RouteMap';

import { mockCustomers } from './data/mockCustomers';
import { allReps, salesRepForMap } from './data/reps';

import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import CompetitorBillScreen from "./screens/CompetitorBillScreen";

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

// Guide sistemi
import { GuideProvider, HelpFAB, AppRole, AppScreen } from "./guide/GuideSystem";
import { GUIDE_VERSION } from "./guide/guideConfig";

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

  // Varsayılan satış temsilcisi olarak mock data dizisindeki ilk kişiyi alıyoruz.
  const salesUser = teamReps[0];

  const currentRepId = role === 'sales' ? salesUser.id : undefined;
  const isVisibleForCurrentRole = (c: Customer) => {
    if (role === 'manager') return true;
    const assigned = assignments[c.id];
    return !assigned || assigned === currentRepId;
  };
  const visibleCustomers = customers.filter(isVisibleForCurrentRole);

  // --- GUIDE eşleştirmeleri ---
  const toAppRole = (r: Role): AppRole =>
    r === 'manager' ? 'sahaYonetici' : 'satisUzmani';

  const toAppScreen = (s: Screen, r: Role): AppScreen => {
    switch (s) {
      case 'dashboard': return 'dashboard';
      case 'routeMap': return 'routeMap';
      case 'visitList': return 'visitList';
      case 'assignmentMap': return 'assignmentMap';
      case 'assignment': return 'assignmentMap';
      case 'visitDetail':
      case 'visitFlow': return 'visitList';
      case 'teamMap':
      case 'messages':
      case 'reports':
      case 'profile':
      default:
        return 'dashboard';
    }
  };

  const handleSpeechToText = () => { /* Fonksiyon içeriği değişmedi */ };
  
  const handleLogin = () => {
    setCurrentScreen('roleSelect');
  };

  const handleStartVisit = (customer: Customer) => {
    const updated = customers.map((c) =>
      c.id === customer.id ? { ...c, status: 'Yolda' as const } : c
    );
    setCustomers(updated);
    setSelectedCustomer({ ...customer, status: 'Yolda' });
    setCurrentScreen('visitFlow');
  };

  const handleCompleteVisit = (cust: Customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === cust.id ? { ...cust } : c)));
    setSelectedCustomer({ ...cust });
  };

  // Login ve rol seçimi ekranları
  if (currentScreen === 'login') {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (currentScreen === 'roleSelect') {
    return (
      <RoleSelectScreen
        onSelect={(selectedRole) => {
          if (selectedRole === 'manager') {
            setRole('manager');
            setAgentName(managerUser.name);
          } else { // 'sales'
            setRole('sales');
            setAgentName(salesUser.name);
          }
          setCurrentScreen('dashboard');
        }}
      />
    );
  }

  // Guide sağlayıcısı ve ana uygulama düzeni
  const guideRole = toAppRole(role);
  const guideScreen = toAppScreen(currentScreen, role);

  return (
    <GuideProvider role={guideRole} screen={guideScreen} autoStart enableLongPress longPressMs={700}>
      <AppLayout
        agentName={agentName}
        role={role}
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
      >
        {/* Ekranların koşullu olarak render edilmesi */}
        {currentScreen === 'profile' && (
          <ProfileScreens role={role} />
        )}

        {currentScreen === 'assignmentMap' && role === 'manager' && (
          <AssignmentMapScreen
            customers={customers}
            assignments={assignments}
            setAssignments={setAssignments}
            allReps={allReps}
            onBack={() => setCurrentScreen('assignment')}
          />
        )}

        {currentScreen === 'assignment' && role === 'manager' && (
          <AssignmentScreen
            customers={customers}
            assignments={assignments}
            setAssignments={setAssignments}
            allReps={allReps}
            setCurrentScreen={setCurrentScreen}
          />
        )}

        {currentScreen === 'teamMap' && role === 'manager' && <TeamMapScreen />}
        
        {currentScreen === 'messages' && <MessagesScreen />}

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
            filter={filter}
            setFilter={setFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isListening={isListening}
            onMicClick={handleSpeechToText}
            assignments={assignments}
            allReps={allReps}
            onDetail={(c) => {
              setSelectedCustomer(c);
              setCurrentScreen('visitDetail');
            }}
            onStart={handleStartVisit}
          />
        )}

        {currentScreen === 'visitDetail' && selectedCustomer && (
          <VisitDetailScreen
            customer={selectedCustomer}
            onBack={() => setCurrentScreen('visitList')}
            onStartVisit={handleStartVisit}
          />
        )}

        {currentScreen === 'visitFlow' && selectedCustomer && (
          <VisitFlowScreen
            customer={selectedCustomer}
            onCloseToList={() => setCurrentScreen('visitList')}
            onCompleteVisit={handleCompleteVisit}
          />
        )}

        {currentScreen === 'reports' && <ReportsScreen customers={visibleCustomers} />}

        {currentScreen === 'routeMap' && (
          <RouteMapScreen customers={visibleCustomers} salesRep={salesRepForMap} />
        )}

        <HelpFAB />
      </AppLayout>
    </GuideProvider>
  );
}

export default App;