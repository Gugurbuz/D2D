import React, { useState } from 'react';
import { Screen, Customer, VisitResult } from './types';
import { mockCustomers } from './data/mockCustomers';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import VisitList from './screens/VisitList';
import VisitDetail from './screens/VisitDetail';
import VisitResultScreen from './screens/VisitResult';
import Reports from './screens/Reports';
import RouteMap from './components/RouteMap';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [agentName, setAgentName] = useState('Serkan Özkan');
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [visitResult, setVisitResult] = useState<VisitResult>(null);
  const [visitNotes, setVisitNotes] = useState('');

  const handleLogin = () => setCurrentScreen('dashboard');

  const startVisit = (customer: Customer) => {
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

  // Basit yardımcılar
  const onOptimizeRoute = (list: Customer[]) => {
    console.log('Optimize route clicked with', list.length, 'müşteri');
  };

  // Routing
  if (currentScreen === 'login') return <Login onLogin={handleLogin} />;

  if (currentScreen === 'dashboard')
    return (
      <Dashboard
        agentName={agentName}
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
        customers={customers}
      />
    );

  if (currentScreen === 'visitList')
    return (
      <VisitList
        customers={customers}
        setCustomers={setCustomers}
        setCurrentScreen={setCurrentScreen}
        agentName={agentName}
        currentScreen={currentScreen}
        setSelectedCustomer={setSelectedCustomer}
      />
    );

  if (currentScreen === 'visitDetail' && selectedCustomer)
    return (
      <VisitDetail
        selectedCustomer={selectedCustomer}
        setCurrentScreen={setCurrentScreen}
        startVisit={startVisit}
        agentName={agentName}
        currentScreen={currentScreen}
      />
    );

  if (currentScreen === 'visitResult')
    return (
      <VisitResultScreen
        selectedCustomer={selectedCustomer}
        visitResult={visitResult}
        setVisitResult={setVisitResult}
        visitNotes={visitNotes}
        setVisitNotes={setVisitNotes}
        handleCompleteVisit={handleCompleteVisit}
        setCurrentScreen={setCurrentScreen}
        agentName={agentName}
        currentScreen={currentScreen}
      />
    );

  if (currentScreen === 'reports')
    return (
      <Reports
        customers={customers}
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
        agentName={agentName}
      />
    );

  if (currentScreen === 'routeMap')
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <button
          onClick={() => setCurrentScreen('dashboard')}
          className="mb-4 px-4 py-2 rounded-lg bg-white border text-gray-700 hover:bg-gray-100"
        >
          ← Dashboard
        </button>
        <RouteMap customers={customers} onOptimizeRoute={onOptimizeRoute} />
      </div>
    );

  // map (yalın rota tuşu olan ekranı ayrı kullanmıyorsan routeMap’i tercih et)
  if (currentScreen === 'map')
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <button
          onClick={() => setCurrentScreen('dashboard')}
          className="mb-4 px-4 py-2 rounded-lg bg-white border text-gray-700 hover:bg-gray-100"
        >
          ← Dashboard
        </button>
        <RouteMap customers={customers} onOptimizeRoute={onOptimizeRoute} />
      </div>
    );

  return null;
}

export default App;
