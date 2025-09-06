import React, { useState, useEffect } from 'react';
import LoginScreen from './screens/LoginScreen';
import AppLayout from './layouts/AppLayout';
import DashboardScreen from './screens/DashboardScreen';
import RouteMapScreen from './screens/RouteMapScreen';
import VisitListScreen from './screens/VisitListScreen';
import VisitDetailScreen from './screens/VisitDetailScreen';
import VisitFlowScreen from './screens/VisitFlowScreen';
import ReportsScreen from './screens/ReportsScreen';
import AssignmentScreen from './screens/AssignmentScreen';
import AssignmentMapScreen from './screens/AssignmentMapScreen';
import TeamMapScreen from './screens/TeamMapScreen';
import MessagesScreen from './screens/MessagesScreen';
import ProfileScreens from './screens/ProfileScreens';
import InvoiceOcrPage from './screens/InvoiceOcrPage';
import RoleSelectScreen from './screens/RoleSelectScreen';
import { mockCustomers } from './data/mockCustomers';
import { mockReps } from './data/reps';
import { teamReps } from './data/team';
import type { Customer, SalesRep, Screen, Role } from './types';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [agentName] = useState('Ahmet Yılmaz');
  const [role, setRole] = useState<Role>('sales_rep');
  
  // Data state
  const [customers] = useState<Customer[]>(mockCustomers);
  const [assignments, setAssignments] = useState<Record<string, string | undefined>>({});
  const [allReps] = useState<SalesRep[]>(mockReps);

  const handleLogin = (isDemoMode = false) => {
    if (isDemoMode) {
      setShowRoleSelect(true);
    } else {
      setIsLoggedIn(true);
    }
  };

  const handleRoleSelect = (selectedRole: string) => {
    // Role string'ini Role tipine dönüştür
    const roleMap: Record<string, Role> = {
      'rep-1': 'sales_rep',
      'manager-1': 'manager'
    };
    
    setRole(roleMap[selectedRole] || 'sales_rep');
    setShowRoleSelect(false);
    setIsLoggedIn(true);
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  if (!isLoggedIn) {
    if (showRoleSelect) {
      return <RoleSelectScreen onSelect={handleRoleSelect} />;
    }
    return <LoginScreen onLogin={handleLogin} />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <DashboardScreen 
            customers={customers}
            assignments={assignments}
            allReps={allReps}
            setCurrentScreen={setCurrentScreen}
            onSelectCustomer={handleSelectCustomer}
          />
        );
      case 'route':
        return (
          <RouteMapScreen 
            customers={customers}
            salesRep={{ name: agentName, lat: 40.9368, lng: 29.1553 }}
          />
        );
      case 'visits':
        return (
          <VisitListScreen
            customers={customers}
            assignments={assignments}
            allReps={allReps}
            setCurrentScreen={setCurrentScreen}
            onSelectCustomer={handleSelectCustomer}
          />
        );
      case 'visitDetail':
        return selectedCustomer ? (
          <VisitDetailScreen
            customer={selectedCustomer}
            onBack={() => setCurrentScreen('visits')}
            onStartVisit={(c) => {
              setSelectedCustomer(c);
              setCurrentScreen('visitFlow');
            }}
          />
        ) : null;
      case 'visitFlow':
        return selectedCustomer ? (
          <VisitFlowScreen
            customer={selectedCustomer}
            onCloseToList={() => setCurrentScreen('visits')}
            onCompleteVisit={() => setCurrentScreen('visits')}
          />
        ) : null;
      case 'reports':
        return <ReportsScreen customers={customers} />;
      case 'assignments':
        return (
          <AssignmentScreen
            customers={customers}
            assignments={assignments}
            setAssignments={setAssignments}
            allReps={allReps}
            setCurrentScreen={setCurrentScreen}
          />
        );
      case 'assignmentMap':
        return (
          <AssignmentMapScreen
            customers={customers}
            assignments={assignments}
            setAssignments={setAssignments}
            allReps={teamReps}
            onBack={() => setCurrentScreen('assignments')}
          />
        );
      case 'team':
        return <TeamMapScreen reps={teamReps} />;
      case 'messages':
        return <MessagesScreen />;
      case 'profile':
        return <ProfileScreens role="sales" />;
      case 'invoiceOcr':
        return <InvoiceOcrPage />;
      default:
        return (
          <DashboardScreen 
            customers={customers}
            assignments={assignments}
            allReps={allReps}
          />
        );
    }
  };

  return (
    <AppLayout
      agentName={agentName}
      role={role}
      currentScreen={currentScreen}
      setCurrentScreen={setCurrentScreen}
    >
      {renderScreen()}
    </AppLayout>
  );
}

export default App;