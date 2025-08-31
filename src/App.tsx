import React, { useState } from 'react';
import Navigation from './components/Navigation';
import { Role, Screen, VisitResult, Rep } from './types';
import { Customer, SalesRep as MapSalesRep } from './RouteMap';
import { mockCustomers } from './data/mockCustomers';
import { allReps, salesRepForMap } from './data/reps';

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
