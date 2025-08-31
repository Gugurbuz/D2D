// src/App.tsx
import React, { useState } from 'react';
import AppLayout from './layouts/AppLayout';
import MessagesScreen from './screens/MessagesScreen';
import { Role, Screen } from './types';
import { Customer } from './RouteMap';

import { mockCustomers } from './data/mockCustomers';
import { allReps, salesRepForMap } from './data/reps';

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

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [role, setRole] = useState<Role>('rep');
  const [agentName, setAgentName] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [filter, setFilter] = useState('Bugün');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);

  // Atamalar: customerId -> repId
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
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
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

  // Login
  const handleLogin = () => {
    setAgentName('Serkan Özkan');
    setCurrentScreen('roleSelect');
  };

  // Ziyareti başlat
  const handleStartVisit = (customer: Customer) => {
    const updated = customers.map((c) =>
      c.id === customer.id ? { ...c, status: 'Yolda' as const } : c
    );
    setCustomers(updated);
    setSelectedCustomer({ ...customer, status: 'Yolda' });
    setCurrentScreen('visitFlow');
  };

  // Ziyareti tamamla (VisitFlowScreen içinde kullanılacak)
  const handleCompleteVisit = (cust: Customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === cust.id ? { ...cust } : c)));
    setSelectedCustomer({ ...cust });
  };

  // Login & Rol seçimi ekranları AppLayout dışında
  if (currentScreen === 'login') return <LoginScreen onLogin={handleLogin} />;

  if (currentScreen === 'roleSelect') {
    return (
      <RoleSelectScreen
        onSelect={(r) => {
          setRole(r);
          setCurrentScreen('dashboard');
        }}
      />
    );
  }

  // Diğer tüm ekranlar AppLayout içinde
  return (
    <AppLayout
      agentName={agentName}
      role={role}
      currentScreen={currentScreen}
      setCurrentScreen={setCurrentScreen}
    >
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
    </AppLayout>
  );
}

export default App;
